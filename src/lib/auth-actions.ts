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

  if (error) return { error: error.message };
  if (!data.user) return { error: "That didn't complete. Try again." };

  redirect("/welcome");
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/app");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // Deliberately vague: a precise message ("no account with that
  // email") turns the login form into an account-enumeration oracle.
  if (error) return { error: "That email and password don't match." };

  redirect(next.startsWith("/") ? next : "/app");
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

  if (!name) return { error: "Your business needs a name." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
    slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`,
    reply_to_email: user.email,
    sender_name: name,
    trial_ends_at: new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000,
    ).toISOString(),
  });

  if (bizErr) {
    console.error("completeSetup: business insert failed", bizErr);
    return { error: "Couldn't create your business." };
  }

  const { error: userErr } = await supabase
    .from("users")
    .insert({ id: user.id, business_id: businessId, email: user.email! });
  if (userErr) {
    console.error("completeSetup: users insert failed", userErr);
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
    console.error("completeSetup: workflow insert failed", wfErr);
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
    console.error("completeSetup: workflow_steps insert failed", stepsErr);
    return { error: "Couldn't set up your steps." };
  }

  revalidatePath("/app", "layout");
  redirect("/app/workflow");
}
