import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Where emailed auth links land.
 *
 * The link carries a one-time hash, not a session. Exchanging it here
 * — server side — is what sets the cookie, so the token never has to
 * be handled by client JavaScript or left sitting in browser history
 * as something replayable.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") ?? "/app";

  const supabase = await createClient();

  // Two shapes, because which one arrives is not ours to decide.
  // Supabase issues PKCE links (?code=) by default and magic-link
  // style ones (?token_hash=&type=) in other configurations, and a
  // handler that knows only one silently drops half of them.
  let error;
  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }));
  } else {
    redirect("/login?error=link");
  }

  // Expired or already used. Say so where they can do something about
  // it rather than dropping them on a login form with no explanation.
  if (error) redirect("/forgot?expired=1");

  // Only ever an in-app path, so a crafted `next` cannot bounce a
  // freshly authenticated visitor to another origin.
  redirect(next.startsWith("/") ? next : "/app");
}
