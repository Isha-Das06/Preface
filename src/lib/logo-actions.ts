"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "./supabase/server";

/**
 * Logo upload, for the first-run screen and for Settings.
 *
 * Keyed by user id rather than business id on purpose: on /welcome
 * the logo is chosen BEFORE the business row exists, so there is no
 * business to key it to yet. completeSetup writes the resulting URL
 * onto the business it creates; Settings writes it straight away.
 *
 * Same two-step shape as client uploads — the server issues a
 * one-shot signed URL, the browser uploads directly, and nothing is
 * recorded until storage confirms the object is really there.
 */

const BUCKET = "business-logos";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export type LogoTicket =
  | { error: string }
  | { url: string; path: string; uploadToken: string };

export async function requestLogoUpload(
  mimeType: string,
  sizeBytes: number,
): Promise<LogoTicket> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const ext = EXTENSIONS[mimeType];
  if (!ext) return { error: "Use a PNG, JPG, WebP or SVG." };
  if (sizeBytes <= 0) return { error: "That file looks empty." };
  if (sizeBytes > MAX_LOGO_BYTES) {
    return { error: "That logo is over 2 MB. Try a smaller one." };
  }

  const path = `${user.id}/${randomUUID()}.${ext}`;
  const svc = createServiceClient();
  const { data, error } = await svc.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("requestLogoUpload: signed url failed", error);
    return { error: "Couldn't start that upload. Try again." };
  }

  return { url: data.signedUrl, path: data.path, uploadToken: data.token };
}

export type LogoResult = { error: string } | { url: string };

/**
 * Confirm the upload landed and hand back the public URL.
 *
 * Also writes it onto the business when there is one. On /welcome
 * there isn't yet, so the URL goes back to the form and completeSetup
 * saves it with everything else.
 */
export async function confirmLogo(path: string): Promise<LogoResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  // The path came back over the wire; re-derive what it may look like
  // rather than trusting it, so nobody can point this at someone
  // else's folder.
  if (!path.startsWith(`${user.id}/`) || path.includes("..")) {
    return { error: "That upload didn't look right." };
  }

  const svc = createServiceClient();
  const objectName = path.slice(user.id.length + 1);
  const { data: listed } = await svc.storage
    .from(BUCKET)
    .list(user.id, { search: objectName });

  if (!listed?.some((o) => o.name === objectName)) {
    return { error: "That upload didn't finish. Try again." };
  }

  const {
    data: { publicUrl },
  } = svc.storage.from(BUCKET).getPublicUrl(path);

  // RLS scopes this to their own business, and matches nothing at all
  // during first run — which is the case where the caller stores the
  // URL in the form instead.
  const { data: business } = await supabase
    .from("businesses")
    .select("id, logo_url")
    .maybeSingle();

  if (business) {
    const previous = (business as { logo_url: string | null }).logo_url;

    await supabase
      .from("businesses")
      .update({ logo_url: publicUrl })
      .eq("id", (business as { id: string }).id);

    await removeStoredLogo(svc, user.id, previous);
    revalidatePath("/app", "layout");
  }

  return { url: publicUrl };
}

export async function removeLogo(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const { data: business } = await supabase
    .from("businesses")
    .select("id, logo_url")
    .maybeSingle();
  if (!business) return { error: "No business to update." };

  const previous = (business as { logo_url: string | null }).logo_url;

  const { error } = await supabase
    .from("businesses")
    .update({ logo_url: null })
    .eq("id", (business as { id: string }).id);
  if (error) return { error: "Couldn't remove that logo." };

  await removeStoredLogo(createServiceClient(), user.id, previous);
  revalidatePath("/app", "layout");
  return {};
}

/**
 * Delete the object a URL points at, but only inside this user's own
 * folder — so a stored URL that was tampered with cannot be used to
 * delete another tenant's logo.
 */
async function removeStoredLogo(
  svc: ReturnType<typeof createServiceClient>,
  userId: string,
  url: string | null,
) {
  if (!url) return;
  const marker = `/${BUCKET}/`;
  const at = url.indexOf(marker);
  if (at === -1) return;

  const path = url.slice(at + marker.length);
  if (!path.startsWith(`${userId}/`) || path.includes("..")) return;

  await svc.storage.from(BUCKET).remove([path]);
}
