"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";

/**
 * Write side of the business app.
 *
 * Every action runs under the caller's session, so RLS rejects
 * anything touching another business. No action takes a business_id
 * from the client — it is always derived server-side.
 */

export type ActionResult = { error?: string; ok?: true; [k: string]: unknown };

/**
 * 32 chars of base58 from a CSPRNG.
 *
 * This token IS the credential for the whole onboarding — it reaches
 * a contract and a payment request. Base58 drops 0/O/I/l so a
 * link read aloud or retyped can't land on someone else's
 * onboarding.
 */
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function generateToken(length = 32): string {
  const bytes = randomBytes(length * 2);
  let out = "";
  for (let i = 0; out.length < length && i < bytes.length; i++) {
    // Reject bytes past the largest clean multiple of 58 — modulo on
    // the full range would bias the early characters.
    if (bytes[i] < 256 - (256 % B58.length)) {
      out += B58[bytes[i] % B58.length];
    }
  }
  return out.length === length ? out : generateToken(length);
}

async function currentWorkflow() {
  const supabase = await createClient();
  const { data } = await supabase.from("workflows").select("id").maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/* ------------------------------------------------------------------
   Clients
   ------------------------------------------------------------------ */

export async function createClientAction(
  formData: FormData,
): Promise<ActionResult> {
  const company = String(formData.get("company") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!company) return { error: "A company name is needed." };
  if (!/.+@.+\..+/.test(email)) return { error: "That email doesn't look right." };

  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .maybeSingle();
  if (!business) return { error: "Finish setting up your business first." };

  const workflowId = await currentWorkflow();
  if (!workflowId) return { error: "Build your onboarding before adding a client." };

  const businessId = (business as { id: string }).id;

  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .insert({ business_id: businessId, company, name: contact || null, email })
    .select()
    .single();
  if (clientErr || !client) return { error: "Couldn't save that client." };

  const { data: onboarding, error: onbErr } = await supabase
    .from("onboardings")
    .insert({
      business_id: businessId,
      client_id: (client as { id: string }).id,
      workflow_id: workflowId,
      token: generateToken(),
      status: "not_started",
    })
    .select()
    .single();
  if (onbErr || !onboarding) return { error: "Couldn't create their onboarding." };

  /**
   * SNAPSHOT. The workflow's steps are COPIED onto this onboarding
   * rather than referenced.
   *
   * This is the load-bearing decision in the whole schema. Without
   * it, editing the workflow later rewrites questions a client is
   * halfway through answering, and a signed agreement stops matching
   * the text that was actually shown — a legal problem, not a bug.
   *
   * Unconfigured steps are skipped entirely: they never reach the
   * client, which is what keeps a half-set-up workflow sendable.
   */
  const { data: wfSteps } = await supabase
    .from("workflow_steps")
    .select("*")
    .eq("workflow_id", workflowId)
    .eq("enabled", true)
    .eq("configured", true)
    .order("position");

  const steps = (wfSteps ?? []) as {
    type: string;
    title: string;
    description: string | null;
    required: boolean;
    requires_previous: boolean;
    config: Record<string, unknown>;
  }[];

  if (steps.length > 0) {
    await supabase.from("onboarding_steps").insert(
      steps.map((s, i) => ({
        onboarding_id: (onboarding as { id: string }).id,
        position: i,
        type: s.type,
        title: s.title,
        description: s.description,
        required: s.required,
        requires_previous: s.requires_previous,
        config: s.config,
        data: {},
      })),
    );
  }

  await supabase.from("events").insert({
    business_id: businessId,
    onboarding_id: (onboarding as { id: string }).id,
    type: "client_created",
    meta: { company },
  });

  revalidatePath("/app", "layout");

  return {
    ok: true,
    company,
    token: (onboarding as { token: string }).token,
    stepCount: steps.length,
  };
}

/** Marks the link as sent. Actual email delivery arrives in Goal 9. */
export async function sendOnboarding(
  onboardingId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("onboardings")
    .update({ sent_at: now, last_activity_at: now })
    .eq("id", onboardingId);
  if (error) return { error: "Couldn't mark that as sent." };

  await supabase
    .from("events")
    .insert({ onboarding_id: onboardingId, type: "link_sent" });

  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function sendReminder(
  onboardingId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: onboarding } = await supabase
    .from("onboardings")
    .select("reminder_count")
    .eq("id", onboardingId)
    .maybeSingle();
  if (!onboarding) return { error: "That onboarding no longer exists." };

  await supabase.from("reminders").insert({
    onboarding_id: onboardingId,
    kind: "manual",
  });

  // A manual nudge pauses the automatic ones, so nobody gets chased
  // twice in a day by two different mechanisms.
  await supabase
    .from("onboardings")
    .update({
      reminders_paused_until: new Date(Date.now() + 48 * 36e5).toISOString(),
    })
    .eq("id", onboardingId);

  await supabase
    .from("events")
    .insert({ onboarding_id: onboardingId, type: "reminder_sent", meta: { kind: "manual" } });

  revalidatePath("/app", "layout");
  return { ok: true };
}

/* ------------------------------------------------------------------
   Workflow builder
   ------------------------------------------------------------------ */

export async function toggleStep(
  stepId: string,
  enabled: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("workflow_steps")
    .update({ enabled })
    .eq("id", stepId);
  if (error) return { error: "Couldn't save that." };

  revalidatePath("/app/workflow");
  return { ok: true };
}

/**
 * Reorder is a single UPDATE per step inside one request. The
 * (workflow_id, position) unique constraint is DEFERRABLE precisely
 * so intermediate collisions during a shuffle don't abort it.
 */
export async function reorderSteps(
  orderedIds: string[],
): Promise<ActionResult> {
  const supabase = await createClient();

  const results = await Promise.all(
    orderedIds.map((id, i) =>
      supabase.from("workflow_steps").update({ position: i }).eq("id", id),
    ),
  );
  if (results.some((r) => r.error)) return { error: "Couldn't save the new order." };

  revalidatePath("/app/workflow");
  return { ok: true };
}

export async function updateStep(
  stepId: string,
  patch: {
    title?: string;
    description?: string;
    required?: boolean;
    requiresPrevious?: boolean;
    config?: Record<string, unknown>;
  },
): Promise<ActionResult> {
  const supabase = await createClient();

  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.required !== undefined) update.required = patch.required;
  if (patch.requiresPrevious !== undefined)
    update.requires_previous = patch.requiresPrevious;
  if (patch.config !== undefined) {
    update.config = patch.config;
    // Saving real content is what makes a step live. Nothing else
    // flips this, so a step can never appear to clients half-set-up.
    update.configured = true;
  }

  const { error } = await supabase
    .from("workflow_steps")
    .update(update)
    .eq("id", stepId);
  if (error) return { error: "Couldn't save that step." };

  revalidatePath("/app/workflow");
  return { ok: true };
}

/* ------------------------------------------------------------------
   Settings
   ------------------------------------------------------------------ */

export async function updateSettings(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();

  const accent = String(formData.get("accentColor") ?? "").trim();
  // A customer picking an unreadable colour must not be able to
  // break their own client's portal.
  const validAccent = /^#[0-9a-fA-F]{6}$/.test(accent);

  const { error } = await supabase
    .from("businesses")
    .update({
      name: String(formData.get("businessName") ?? "").trim(),
      welcome_message: String(formData.get("welcomeMessage") ?? "").trim(),
      sender_name: String(formData.get("senderName") ?? "").trim(),
      reply_to_email: String(formData.get("replyTo") ?? "").trim(),
      ...(validAccent ? { accent_color: accent } : {}),
      reminders_enabled: formData.get("remindersEnabled") === "on",
      digest_enabled: formData.get("digestEnabled") === "on",
    })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) return { error: "Couldn't save your settings." };

  revalidatePath("/app", "layout");
  return { ok: true };
}
