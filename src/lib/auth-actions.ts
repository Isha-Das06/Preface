"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import { getTemplate } from "./templates";

/**
 * Auth actions.
 *
 * Signup does more than create a user: it provisions the business
 * and a workflow in the same breath. A new account must never land
 * on an empty builder — an empty canvas at first run is the single
 * biggest activation failure available to us.
 */

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "business"
  );
}

export type AuthResult = { error: string } | undefined;

export async function signUp(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter an email and a password." };
  if (password.length < 8)
    return { error: "Passwords need to be at least 8 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    // Confirmations off: Supabase says so outright.
    if (/already registered|already exists/i.test(error.message)) {
      return { error: "There's already an account on that email. Log in instead." };
    }
    return { error: error.message };
  }
  if (!data.user) return { error: "That didn't complete. Try again." };

  /**
   * Confirmations on: Supabase does NOT report a duplicate. It hands
   * back a normal-looking user with an empty `identities` array, so
   * that a signup form cannot be used to discover who has an account.
   *
   * We check it because the alternative is worse for the person who
   * genuinely forgot they had signed up: they are told to confirm an
   * email that never arrives, for an account that was already
   * confirmed months ago. This tells only the person holding that
   * address, at the point they tried to claim it.
   */
  if ((data.user.identities?.length ?? 0) === 0) {
    return { error: "There's already an account on that email. Log in instead." };
  }

  /**
   * No session means the project requires email confirmation, so the
   * account exists but cannot be used yet. Redirecting to /welcome
   * would bounce off the middleware straight back to the login form,
   * where the only thing we could tell them is that their brand new
   * password does not match.
   */
  if (!data.session) {
    return {
      error: `Almost there — confirm your email at ${email}, then log in.`,
    };
  }

  redirect("/welcome");
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/app");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    /**
     * One exception to the vagueness below.
     *
     * An account that exists but has never confirmed its email fails
     * here like any other bad credential, and telling that person
     * their password is wrong sends them to reset a password that
     * was always right. They retype it, get the same answer, and
     * conclude the product is broken — which is exactly what
     * happened the first time this ran against hosted Supabase,
     * where confirmations default to ON.
     *
     * It admits the address has an account, which the vague message
     * exists to avoid. Worth it: someone stuck in that loop has no
     * other way out, and they already know the account exists
     * because they just made it.
     */
    const unconfirmed =
      error.code === "email_not_confirmed" ||
      /not confirmed/i.test(error.message);

    if (unconfirmed) {
      return {
        error:
          "This account still needs its email confirmed. Check your inbox for the confirmation link.",
      };
    }

    // Deliberately vague: a precise message ("no account with that
    // email") turns the login form into an account-enumeration oracle.
    return { error: "That email and password don't match." };
  }

  redirect(next.startsWith("/") ? next : "/app");
}

/**
 * Send a password reset link.
 *
 * Always reports the same thing, whether or not the address has an
 * account. The login form is deliberately vague for the same reason —
 * a precise answer here turns this into an account-enumeration
 * oracle, and it is a nicer oracle than the login form because it
 * needs no password guess at all.
 *
 * Locally the mail lands in Mailpit at http://localhost:54324 rather
 * than a real inbox.
 */
export async function requestPasswordReset(
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };

  const supabase = await createClient();
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/confirm?next=/reset`,
  });

  // Logged, not shown: a transport failure is ours to fix, and
  // telling the sender which addresses error is the same leak.
  if (error) console.error("requestPasswordReset:", error.message);

  redirect("/forgot?sent=1");
}

/**
 * Set a new password.
 *
 * Requires the session the recovery link established, so this cannot
 * be used to change a password without proving control of the inbox.
 */
export async function updatePassword(
  formData: FormData,
): Promise<AuthResult> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8)
    return { error: "Passwords need to be at least 8 characters." };
  if (password !== confirm) return { error: "Those two don't match." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "That reset link has expired. Request a new one." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/app");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Called from the first-run screen. Creates the business, the
 * workflow, and the workflow's steps from the chosen template —
 * so the builder is pre-filled the moment they arrive.
 */
export async function completeSetup(formData: FormData): Promise<AuthResult> {
  const name = String(formData.get("businessName") ?? "").trim();
  const templateId = String(formData.get("template") ?? "scratch");
  const logoUrl = String(formData.get("logoUrl") ?? "").trim() || null;

  if (!name) return { error: "Your business needs a name." };

  const failed = await provision(name, templateId, logoUrl);
  if (failed) return failed;

  revalidatePath("/app", "layout");
  redirect("/app/workflow");
}

/**
 * "Skip for now" on the first-run screen.
 *
 * It still provisions. Previously this was a plain link into the app,
 * which left the account with no business, no workflow and no `users`
 * row — so RLS matched nothing, every screen fell back to an empty
 * state, and applying a template had nothing to attach to. Skipping a
 * question should cost you a placeholder name, not a working account.
 */
export async function skipSetup(): Promise<AuthResult> {
  // Deliberately obviously a stand-in, so it reads as "set this"
  // rather than as a real name. Not exported: a "use server" file may
  // only export async functions, and exporting a constant from one
  // silently breaks every import of the module.
  const failed = await provision("My business", "scratch");
  if (failed) return failed;

  revalidatePath("/app", "layout");
  redirect("/app/workflow?named=0");
}

/** Creates business + membership + workflow + steps, or explains why not. */
async function provision(
  name: string,
  templateId: string,
  logoUrl: string | null = null,
): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // The screen already redirects anyone who has a business, but a
  // second tab or a stale form can still get here. Landing them in
  // the app is the truthful outcome — they ARE set up — where
  // "Couldn't create your business" reads like a failure.
  const { data: already } = await supabase
    .from("businesses")
    .select("id")
    .maybeSingle();
  if (already) redirect("/app");

  const template = getTemplate(templateId);

  // The id is generated here instead of being read back with
  // .select(). At this instant the user has no `users` row, so
  // auth_business_id() is null and the tenant SELECT policy matches
  // nothing — and INSERT ... RETURNING applies SELECT policies to the
  // row it returns. Asking for the row back is what fails, not the
  // insert. Postgres reports both cases with the same message, "new
  // row violates row-level security policy", which points squarely at
  // the wrong clause; don't trust it to mean WITH CHECK.
  const businessId = randomUUID();

  const { error: bizErr } = await supabase.from("businesses").insert({
    id: businessId,
    name,
    logo_url: logoUrl,
    slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`,
    reply_to_email: user.email,
    sender_name: name,
    // No trial_ends_at. Preface is free during the beta, so stamping
    // a deadline on every new account would only put a date in the
    // database that nothing honours and nobody was told about.
  });

  if (bizErr) {
    console.error("provision: business insert failed", bizErr);
    return { error: "Couldn't create your business." };
  }

  const { error: userErr } = await supabase
    .from("users")
    .insert({ id: user.id, business_id: businessId, email: user.email! });
  if (userErr) {
    console.error("provision: users insert failed", userErr);
    return { error: "Couldn't finish setting up your account." };
  }

  // Safe to read back from here on: the `users` row above makes
  // auth_business_id() non-null, so the tenant policy matches.
  const { data: workflow, error: wfErr } = await supabase
    .from("workflows")
    .insert({ business_id: businessId })
    .select()
    .single();
  if (wfErr || !workflow) {
    console.error("provision: workflow insert failed", wfErr);
    return { error: "Couldn't create your onboarding." };
  }

  const { error: stepsErr } = await supabase.from("workflow_steps").insert(
    template.steps.map((s, i) => ({
      workflow_id: workflow.id,
      position: i,
      type: s.type,
      title: s.title,
      description: s.description ?? null,
      required: s.required,
      enabled: true,
      configured: s.configured,
      requires_previous: s.requiresPrevious ?? false,
      config: s.config ?? {},
    })),
  );
  if (stepsErr) {
    console.error("provision: workflow_steps insert failed", stepsErr);
    return { error: "Couldn't set up your steps." };
  }
}
