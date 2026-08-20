"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import { sendInvitation, sendReminderEmail } from "./emails";
import { BLANK_STEPS, getTemplate } from "./templates";
import type {
  Business,
  Client,
  Onboarding,
  OnboardingStep,
  StepType,
} from "./supabase/types";

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

/** The oldest workflow — what a business with only one always means. */
async function currentWorkflow() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workflows")
    .select("id")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/**
 * Confirm a workflow id belongs to the caller, and fall back to
 * their oldest when none is given.
 *
 * RLS already scopes the lookup, so an id from another tenant comes
 * back empty rather than being trusted.
 */
async function resolveWorkflow(workflowId?: string) {
  if (!workflowId) return currentWorkflow();
  const supabase = await createClient();
  const { data } = await supabase
    .from("workflows")
    .select("id")
    .eq("id", workflowId)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

export async function createWorkflow(name: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .maybeSingle();
  if (!business) return { error: "Finish setting up your business first." };

  const { data, error } = await supabase
    .from("workflows")
    .insert({
      business_id: (business as { id: string }).id,
      name: name.trim() || "New onboarding",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createWorkflow:", error);
    return { error: "Couldn't create that onboarding." };
  }

  revalidatePath("/app", "layout");
  return { ok: true, workflowId: (data as { id: string }).id };
}

export async function renameWorkflow(
  workflowId: string,
  name: string,
): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Give it a name." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("workflows")
    .update({ name: trimmed })
    .eq("id", workflowId);
  if (error) return { error: "Couldn't rename that." };

  revalidatePath("/app", "layout");
  return { ok: true };
}

/**
 * Delete a workflow, unless something depends on it.
 *
 * Refused once any client has been sent it: onboardings reference the
 * workflow they came from, and losing that link would break the
 * record of what each client was actually asked for. Their steps are
 * snapshots and survive regardless, but the history should not go
 * quiet just because a template was tidied up.
 */
export async function deleteWorkflow(workflowId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: all } = await supabase.from("workflows").select("id");
  if ((all ?? []).length <= 1) {
    return { error: "This is your only onboarding, so it can't be deleted." };
  }

  const { data: used } = await supabase
    .from("onboardings")
    .select("id")
    .eq("workflow_id", workflowId)
    .limit(1);
  if ((used ?? []).length) {
    return { error: "Clients have already been sent this one, so it stays." };
  }

  const { error } = await supabase
    .from("workflows")
    .delete()
    .eq("id", workflowId);
  if (error) return { error: "Couldn't delete that." };

  revalidatePath("/app", "layout");
  return { ok: true };
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

  const workflowId = await resolveWorkflow(
    String(formData.get("workflowId") ?? "") || undefined,
  );
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
    onboardingId: (onboarding as { id: string }).id,
    token: (onboarding as { token: string }).token,
    stepCount: steps.length,
  };
}

/**
 * Sends the client their link.
 *
 * Everything is read back through the caller's session first, so RLS
 * is what proves this onboarding belongs to them — there is no
 * business_id filter here on purpose, same rule as the rest of this
 * file.
 */
export async function sendOnboarding(
  onboardingId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const context = await loadMailContext(supabase, onboardingId);
  if (!context) return { error: "That onboarding no longer exists." };

  const { error } = await supabase
    .from("onboardings")
    .update({ sent_at: now, last_activity_at: now })
    .eq("id", onboardingId);
  if (error) return { error: "Couldn't mark that as sent." };

  // business_id is required, not decorative: the RLS check on events
  // is `business_id = auth_business_id()`, so a row without it fails
  // the policy and is silently dropped. Every link_sent and
  // reminder_sent event was lost this way until it was noticed.
  await supabase.from("events").insert({
    onboarding_id: onboardingId,
    business_id: context.business.id,
    type: "link_sent",
  });

  const sent = await sendInvitation(
    context.business,
    context.client,
    context.onboarding,
    context.steps,
  );

  revalidatePath("/app", "layout");

  // The link IS sent — it is a URL, and it is now marked as such. Say
  // so plainly rather than pretending the email went out.
  if ("error" in sent) {
    return { error: "Marked as sent, but the email didn't go out." };
  }
  return { ok: true };
}

interface MailContext {
  business: Business;
  client: Client;
  onboarding: Onboarding;
  steps: OnboardingStep[];
}

async function loadMailContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  onboardingId: string,
): Promise<MailContext | null> {
  const { data: onboarding } = await supabase
    .from("onboardings")
    .select("*")
    .eq("id", onboardingId)
    .maybeSingle();
  if (!onboarding) return null;

  const o = onboarding as Onboarding;

  const [bizRes, clientRes, stepsRes] = await Promise.all([
    supabase.from("businesses").select("*").eq("id", o.business_id).maybeSingle(),
    supabase.from("clients").select("*").eq("id", o.client_id).maybeSingle(),
    supabase
      .from("onboarding_steps")
      .select("*")
      .eq("onboarding_id", o.id)
      .order("position"),
  ]);

  const business = bizRes.data as Business | null;
  const client = clientRes.data as Client | null;
  if (!business || !client) return null;

  return {
    business,
    client,
    onboarding: o,
    steps: (stepsRes.data ?? []) as OnboardingStep[],
  };
}

export async function sendReminder(
  onboardingId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const context = await loadMailContext(supabase, onboardingId);
  if (!context) return { error: "That onboarding no longer exists." };

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

  await supabase.from("events").insert({
    onboarding_id: onboardingId,
    business_id: context.business.id,
    type: "reminder_sent",
    meta: { kind: "manual" },
  });

  const sent = await sendReminderEmail(
    context.business,
    context.client,
    context.onboarding,
    context.steps,
  );

  revalidatePath("/app", "layout");

  if ("error" in sent) {
    return { error: "Logged the reminder, but the email didn't go out." };
  }
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

  const name = String(formData.get("businessName") ?? "").trim();
  const accent = String(formData.get("accentColor") ?? "").trim();
  const replyTo = String(formData.get("replyTo") ?? "").trim();

  // The name sits at the top of every client's onboarding page and
  // drives the monogram when there is no logo. Saving an empty one
  // left clients looking at a blank header, and the form said
  // "Saved" while it happened.
  if (!name) return { error: "Your business needs a name." };

  // A customer picking an unreadable colour must not be able to
  // break their own client's portal. Rejecting it out loud beats
  // dropping it silently and reporting success.
  if (accent && !/^#[0-9a-fA-F]{6}$/.test(accent)) {
    return { error: "Use a colour like #1F6F4A." };
  }

  // Clients reply to this address. A typo here is a conversation
  // that never reaches anyone.
  if (replyTo && !/.+@.+\..+/.test(replyTo)) {
    return { error: "That reply-to address doesn't look right." };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .maybeSingle();
  if (!business) return { error: "No business to update." };

  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      welcome_message: String(formData.get("welcomeMessage") ?? "").trim(),
      sender_name: String(formData.get("senderName") ?? "").trim(),
      reply_to_email: replyTo,
      ...(accent ? { accent_color: accent } : {}),
      reminders_enabled: formData.get("remindersEnabled") === "on",
      digest_enabled: formData.get("digestEnabled") === "on",
    })
    .eq("id", (business as { id: string }).id);

  if (error) return { error: "Couldn't save your settings." };

  revalidatePath("/app", "layout");
  return { ok: true };
}

/**
 * Replace the workflow's steps with a template's.
 *
 * This used to be a toast and a redirect with no write behind it —
 * the picker reported "Template applied" and did nothing at all.
 *
 * Only workflow_steps are touched. Steps already snapshotted onto a
 * sent onboarding are left exactly as they were, which is the whole
 * point of snapshotting: changing your template must never rewrite a
 * questionnaire a client is halfway through.
 */
export async function applyTemplate(
  templateId: string,
  targetWorkflowId?: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  // Only ever the workflow being edited. Replacing every one of them
  // because a template was applied to a single onboarding would be a
  // very expensive misunderstanding.
  const workflowId = await resolveWorkflow(targetWorkflowId);
  if (!workflowId) {
    return { error: "Finish setting up your business first." };
  }

  const template = getTemplate(templateId);

  const { error: delErr } = await supabase
    .from("workflow_steps")
    .delete()
    .eq("workflow_id", workflowId);
  if (delErr) {
    console.error("applyTemplate: clearing steps failed", delErr);
    return { error: "Couldn't replace your steps." };
  }

  const { error: insErr } = await supabase.from("workflow_steps").insert(
    template.steps.map((s, i) => ({
      workflow_id: workflowId,
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
  if (insErr) {
    console.error("applyTemplate: inserting steps failed", insErr);
    return { error: "Couldn't add the template's steps." };
  }

  revalidatePath("/app", "layout");
  return { ok: true, stepCount: template.steps.length };
}

/**
 * Append a step to the workflow.
 *
 * One step per type, deliberately. The client portal routes by type —
 * /o/<token>/questions is the questionnaire — so a second step of the
 * same type would have no URL of its own and the client would never
 * reach it. Rather than build a step nobody can open, the menu only
 * offers types the workflow does not already have.
 */
export async function addStep(
  type: StepType,
  targetWorkflowId?: string,
): Promise<ActionResult> {
  const blank = BLANK_STEPS[type];
  if (!blank) return { error: "That isn't a kind of step." };

  const supabase = await createClient();

  const workflowId = await resolveWorkflow(targetWorkflowId);
  if (!workflowId) return { error: "Finish setting up your business first." };

  const { data: existing } = await supabase
    .from("workflow_steps")
    .select("type, position")
    .eq("workflow_id", workflowId);

  const rows = (existing ?? []) as { type: StepType; position: number }[];
  if (rows.some((r) => r.type === type)) {
    return { error: "Your onboarding already has one of those." };
  }

  const nextPosition = rows.reduce((max, r) => Math.max(max, r.position), -1) + 1;

  const { error } = await supabase.from("workflow_steps").insert({
    workflow_id: workflowId,
    position: nextPosition,
    type: blank.type,
    title: blank.title,
    description: blank.description ?? null,
    required: blank.required,
    enabled: true,
    configured: blank.configured,
    requires_previous: blank.requiresPrevious ?? false,
    config: blank.config ?? {},
  });

  if (error) {
    console.error("addStep: insert failed", error);
    return { error: "Couldn't add that step." };
  }

  revalidatePath("/app", "layout");
  return { ok: true, title: blank.title };
}
