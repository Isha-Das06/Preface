"use server";

import { randomInt, randomUUID, createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServiceClient } from "./supabase/server";
import type {
  Onboarding,
  OnboardingStep as OnboardingStepRow,
  Signature,
} from "./supabase/types";
import {
  sendClientCompletion,
  sendHandoff,
  sendInvitation,
  sendVerification,
} from "./emails";
import {
  getPortal,
  getStepFiles,
  nextSlugAfter,
  stepBySlug,
  type PortalData,
  type PortalStep,
} from "./portal";
import { clientSteps } from "./templates";
import { isAllowedFile, rejectionMessage } from "./file-types";

/**
 * Write side of the client portal.
 *
 * Same rule as the read side, and it matters more here: the token is
 * the only credential, so every action resolves it to an onboarding
 * first and derives every id from that row. No action accepts a step
 * id, onboarding id or business id from the caller — a portal that
 * trusts an id in a form field lets anyone write into any tenant.
 */

export type PortalResult = { error: string } | undefined;

const VERIFICATION_TTL_MIN = 15;
const MAX_VERIFICATION_ATTEMPTS = 5;
/**
 * Caps on ASKING for a code, which is what makes the attempt cap
 * above mean anything. Resending resets attempts — correct for a
 * client who mistyped — so without a limit here five guesses and a
 * resend could repeat forever. Bounded now at 5 x 6 = 30 guesses
 * against a six-digit code, and at six emails to a client's inbox.
 */
const MAX_VERIFICATION_RESENDS = 5;
const RESEND_COOLDOWN_SEC = 60;

/** Resolve token + slug, or fail closed. */
async function resolve(token: string, slug: string) {
  const portal = await getPortal(token);
  if (!portal) return null;
  const step = stepBySlug(portal, slug);
  if (!step) return null;
  // A locked step must not be writable just because someone posted
  // to it directly — the lock is a rule, not a UI affordance.
  if (step.lockedReason) return null;
  return { portal, step };
}

/**
 * Mark activity, and finish the onboarding once every required step
 * is done. Called after every successful write.
 */
async function touch(portal: PortalData) {
  const svc = createServiceClient();
  const now = new Date().toISOString();

  const { data: rows } = await svc
    .from("onboarding_steps")
    .select("type, required, completed_at")
    .eq("onboarding_id", portal.onboarding.id);

  /**
   * clientSteps first. A welcome note has no screen, so nothing can
   * ever set its completed_at — leaving one marked required would
   * have held the onboarding at "in progress" forever, with no step
   * the client could open to clear it.
   */
  const outstanding = clientSteps(
    (rows ?? []) as { type: string; required: boolean; completed_at: string | null }[],
  ).filter((r) => r.required && !r.completed_at).length;

  const done = outstanding === 0;

  await svc
    .from("onboardings")
    .update({
      last_activity_at: now,
      started_at: portal.onboarding.started_at ?? now,
      status: done ? "completed" : "in_progress",
      completed_at: done ? (portal.onboarding.completed_at ?? now) : null,
    })
    .eq("id", portal.onboarding.id);

  if (done && !portal.onboarding.completed_at) {
    await svc.from("events").insert({
      onboarding_id: portal.onboarding.id,
      business_id: portal.business.id,
      type: "onboarding_completed",
    });
    await sendCompletionMail(portal);
  }
}

/**
 * The two emails that fire when an onboarding finishes.
 *
 * Guarded by the `completed_at` check in touch(), so this runs once
 * per onboarding rather than on every later write. Failures are
 * logged inside sendMail and deliberately not surfaced: the client
 * has finished either way, and losing that because a mail provider
 * had a bad minute would be the worse bug.
 */
async function sendCompletionMail(portal: PortalData) {
  const svc = createServiceClient();

  const [stepsRes, filesRes] = await Promise.all([
    svc
      .from("onboarding_steps")
      .select("*")
      .eq("onboarding_id", portal.onboarding.id)
      .order("position"),
    svc
      .from("files")
      .select("id, onboarding_step_id")
      .in("onboarding_step_id", portal.steps.map((s) => s.id)),
  ]);

  const steps = (stepsRes.data ?? []) as OnboardingStepRow[];
  const agreementStep = steps.find((s) => s.type === "agreement");

  let signature: Signature | null = null;
  if (agreementStep) {
    const { data } = await svc
      .from("signatures")
      .select("*")
      .eq("onboarding_step_id", agreementStep.id)
      .maybeSingle();
    signature = (data as Signature | null) ?? null;
  }

  const finished = {
    ...portal.onboarding,
    completed_at: portal.onboarding.completed_at ?? new Date().toISOString(),
  };

  await sendClientCompletion(portal.business, portal.client, finished);

  if (portal.business.reply_to_email) {
    await sendHandoff(
      portal.business,
      portal.client,
      finished,
      steps,
      (filesRes.data ?? []).length,
      signature,
    );
  }
}

async function logEvent(
  portal: PortalData,
  type: string,
  meta: Record<string, unknown> = {},
) {
  const svc = createServiceClient();
  await svc.from("events").insert({
    onboarding_id: portal.onboarding.id,
    business_id: portal.business.id,
    type,
    meta,
  });
}

/** Write a step's payload and optionally close it out. */
async function writeStep(
  portal: PortalData,
  step: PortalStep,
  data: Record<string, unknown>,
  complete: boolean,
) {
  const svc = createServiceClient();
  const wasComplete = Boolean(step.completedAt);

  await svc
    .from("onboarding_steps")
    .update({
      data,
      completed_at: complete
        ? (step.completedAt ?? new Date().toISOString())
        : null,
    })
    .eq("id", step.id)
    // Belt and braces: the id came from the token-scoped read above,
    // and this makes a mismatch impossible rather than unlikely.
    .eq("onboarding_id", portal.onboarding.id);

  if (complete && !wasComplete) {
    await logEvent(portal, "step_completed", {
      step: step.title,
      type: step.type,
    });
  }

  await touch(portal);
  revalidatePath(`/o/${portal.onboarding.token}`, "layout");
}

/** Where Continue lands after this step. */
function onward(portal: PortalData, slug: string) {
  const next = nextSlugAfter(portal, slug);
  const token = portal.onboarding.token;
  return next ? `/o/${token}/${next}` : `/o/${token}/done`;
}

/* ── Company information ─────────────────────────────────────── */

interface InfoField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

export async function saveInfo(
  token: string,
  _prev: PortalResult,
  formData: FormData,
): Promise<PortalResult> {
  const found = await resolve(token, "info");
  if (!found) return { error: "This step isn't available." };
  const { portal, step } = found;

  const fields = (step.config.fields ?? []) as InfoField[];
  const values: Record<string, string> = {};
  for (const f of fields) {
    values[f.name] = String(formData.get(f.name) ?? "").trim();
  }

  const missing = fields.find((f) => f.required && !values[f.name]);
  if (missing) return { error: `${missing.label} is needed to continue.` };

  await writeStep(portal, step, { values }, true);
  redirect(onward(portal, "info"));
}

/* ── Questionnaire ───────────────────────────────────────────── */

interface Question {
  prompt: string;
  type: "short" | "long";
}

export async function saveQuestions(
  token: string,
  _prev: PortalResult,
  formData: FormData,
): Promise<PortalResult> {
  const found = await resolve(token, "questions");
  if (!found) return { error: "This step isn't available." };
  const { portal, step } = found;

  const questions = (step.config.questions ?? []) as Question[];
  // Keyed by index: the config is a snapshot and never reorders, so
  // the index is stable for the life of this onboarding.
  const answers: Record<string, string> = {};
  questions.forEach((_, i) => {
    answers[String(i)] = String(formData.get(`q${i}`) ?? "").trim();
  });

  if (step.required && questions.some((_, i) => !answers[String(i)])) {
    return { error: "Please answer every question before continuing." };
  }

  await writeStep(portal, step, { answers }, true);
  redirect(onward(portal, "questions"));
}

/* ── Account access checklist ────────────────────────────────── */

interface ChecklistConfigItem {
  key: string;
  label: string;
  instruction: string;
  required: boolean;
}

/** Ticking one box. Saves immediately — no Continue needed. */
export async function setChecklistItem(
  token: string,
  key: string,
  done: boolean,
): Promise<PortalResult> {
  const found = await resolve(token, "access");
  if (!found) return { error: "This step isn't available." };
  const { portal, step } = found;

  const items = (step.config.items ?? []) as ChecklistConfigItem[];
  // Only keys the snapshot actually contains, so a crafted post
  // cannot stuff arbitrary data into the row.
  if (!items.some((i) => i.key === key)) return { error: "Unknown item." };

  const current = (step.data.done ?? {}) as Record<string, boolean>;
  const next = { ...current, [key]: done };

  const complete = items.filter((i) => i.required).every((i) => next[i.key]);

  await writeStep(portal, step, { done: next }, complete);
}

export async function continueFromChecklist(token: string) {
  const portal = await getPortal(token);
  if (!portal) redirect(`/o/${token}/expired`);
  redirect(onward(portal, "access"));
}

/* ── Agreement ───────────────────────────────────────────────── */

interface AgreementSection {
  heading: string;
  text: string;
}

/** The exact text shown, flattened for the immutable snapshot. */
export async function agreementText(
  config: Record<string, unknown>,
): Promise<string> {
  const body = config.body;
  if (typeof body === "string") return body;
  if (Array.isArray(body)) {
    return (body as AgreementSection[])
      .map((s) => `${s.heading}\n\n${s.text}`)
      .join("\n\n");
  }
  return "";
}

export async function signAgreement(
  token: string,
  _prev: PortalResult,
  formData: FormData,
): Promise<PortalResult> {
  const found = await resolve(token, "agreement");
  if (!found) return { error: "This step isn't available." };
  const { portal, step } = found;

  // The gate, enforced server-side. The UI also redirects, but a
  // signature is exactly the thing not to protect with a redirect.
  if (!portal.verified) redirect(`/o/${token}/verify`);

  const name = String(formData.get("signerName") ?? "").trim();
  const email = String(formData.get("signerEmail") ?? "").trim();
  if (!name) return { error: "Please type your full name to sign." };
  if (!email) return { error: "Please enter your email." };

  const text = await agreementText(step.config);
  if (!text) return { error: "This agreement isn't ready to sign yet." };

  const svc = createServiceClient();
  const { data: existing } = await svc
    .from("signatures")
    .select("id")
    .eq("onboarding_step_id", step.id)
    .maybeSingle();

  // Signing twice must not produce two records of what was agreed.
  if (!existing) {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    await svc.from("signatures").insert({
      onboarding_step_id: step.id,
      signer_name: name,
      signer_email: email,
      // Snapshot, never a reference. A signed agreement must not
      // change when the business edits its workflow afterwards.
      agreement_text: text,
      agreement_hash: createHash("sha256").update(text).digest("hex"),
      ip_address: forwarded ? forwarded.split(",")[0].trim() : null,
      user_agent: h.get("user-agent"),
    });
    await logEvent(portal, "agreement_signed", { signer: name });
  }

  await writeStep(portal, step, { signedBy: name, signedEmail: email }, true);
  redirect(onward(portal, "agreement"));
}

/* ── Scheduling ──────────────────────────────────────────────── */

/**
 * Scheduling is the business's own Cal.com/Calendly link. We record
 * that the client confirmed a booking; we do not model availability,
 * timezones or conflicts. See the note on the scheduling screen.
 */
export async function markScheduled(token: string): Promise<PortalResult> {
  const found = await resolve(token, "schedule");
  if (!found) return { error: "This step isn't available." };
  const { portal, step } = found;

  await writeStep(
    portal,
    step,
    { confirmedAt: new Date().toISOString() },
    true,
  );
  redirect(onward(portal, "schedule"));
}

/* ── Payment ─────────────────────────────────────────────────── */

/**
 * The client says they have paid on the business's own payment link.
 *
 * Deliberately the client's word, like the scheduling confirmation.
 * We are not in the payment path at all — no card, no Connect
 * account, no webhook — so there is nothing here that could verify a
 * charge, and pretending otherwise would be worse than being plain
 * about it. The money landed in the business's own account, which is
 * the record that settles any dispute; this only moves the step on.
 *
 * When real card payments land, this becomes the fallback for
 * businesses that would rather use a link they already have.
 */
export async function markPaid(token: string): Promise<PortalResult> {
  const found = await resolve(token, "payment");
  if (!found) return { error: "This step isn't available." };
  const { portal, step } = found;

  // Same gate the payment screen enforces: a deposit is one of the
  // two steps that sit behind email verification.
  if (!portal.verified) return { error: "Confirm your email first." };

  await writeStep(
    portal,
    step,
    { confirmedAt: new Date().toISOString() },
    true,
  );
  redirect(onward(portal, "payment"));
}

/* ── Email verification ──────────────────────────────────────── */

/**
 * Issue a 6-digit code.
 *
 * Idempotent by default, and that is load-bearing rather than a
 * nicety. The verify screen asks for a code when it renders, and
 * submitting the form re-renders the route — so a function that
 * always minted a fresh code would replace the one sitting in the
 * client's inbox every time they got a digit wrong, and they could
 * never verify at all. Reissue only when there is nothing usable, or
 * when the client explicitly asks.
 *
 * Delivery is Goal 11. Until then the code goes to the server log in
 * development only, so the flow is testable without a mail pipeline
 * and a code can never surface in production.
 */
export async function sendVerificationCode(
  token: string,
  force = false,
): Promise<PortalResult> {
  const portal = await getPortal(token);
  if (!portal) return { error: "This link isn't active." };
  if (portal.verified) return undefined;

  const svc = createServiceClient();

  const { data } = await svc
    .from("onboardings")
    .select(
      "verification_code, verification_expires_at, verification_resends, verification_last_sent_at",
    )
    .eq("id", portal.onboarding.id)
    .maybeSingle();

  const live = data as {
    verification_code: string | null;
    verification_expires_at: string | null;
    verification_resends: number;
    verification_last_sent_at: string | null;
  } | null;

  // An unexpired code already sitting in their inbox is the one they
  // should be typing. Re-rendering the verify screen must not replace
  // it, or a client who mistypes can never catch up with the mail.
  if (
    !force &&
    live?.verification_code &&
    live.verification_expires_at &&
    new Date(live.verification_expires_at) > new Date()
  ) {
    return undefined;
  }

  if (force && live) {
    if (live.verification_resends >= MAX_VERIFICATION_RESENDS) {
      return {
        error: `That's as many codes as we can send. Reply to ${portal.business.name}'s email and they'll help.`,
      };
    }
    const last = live.verification_last_sent_at
      ? new Date(live.verification_last_sent_at).getTime()
      : 0;
    if (Date.now() - last < RESEND_COOLDOWN_SEC * 1000) {
      return { error: "Give it a minute, then ask for another." };
    }
  }

  const code = String(randomInt(0, 1000000)).padStart(6, "0");

  await svc
    .from("onboardings")
    .update({
      verification_code: code,
      verification_expires_at: new Date(
        Date.now() + VERIFICATION_TTL_MIN * 60000,
      ).toISOString(),
      // Reset per code: a fresh code deserves fresh tries. The resend
      // counter is what stops that being a loop, and it only counts
      // codes the client explicitly asked for.
      verification_attempts: 0,
      verification_resends: force
        ? (live?.verification_resends ?? 0) + 1
        : (live?.verification_resends ?? 0),
      verification_last_sent_at: new Date().toISOString(),
    })
    .eq("id", portal.onboarding.id);

  await sendVerification(
    portal.business,
    portal.client,
    code,
    VERIFICATION_TTL_MIN,
  );
}

export async function verifyCode(
  token: string,
  _prev: PortalResult,
  formData: FormData,
): Promise<PortalResult> {
  const portal = await getPortal(token);
  if (!portal) return { error: "This link isn't active." };
  if (portal.verified) redirect(`/o/${token}/agreement`);

  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (code.length !== 6) return { error: "Enter the 6-digit code." };

  const svc = createServiceClient();
  const { data } = await svc
    .from("onboardings")
    .select("verification_code, verification_expires_at, verification_attempts")
    .eq("id", portal.onboarding.id)
    .maybeSingle();

  const row = data as {
    verification_code: string | null;
    verification_expires_at: string | null;
    verification_attempts: number;
  } | null;

  if (!row?.verification_code || !row.verification_expires_at) {
    return { error: "That code has expired. Send a new one." };
  }
  if (new Date(row.verification_expires_at) < new Date()) {
    return { error: "That code has expired. Send a new one." };
  }
  // Rate limit: six digits is guessable given unlimited tries.
  if (row.verification_attempts >= MAX_VERIFICATION_ATTEMPTS) {
    return { error: "Too many attempts. Send a new code." };
  }

  if (row.verification_code !== code) {
    await svc
      .from("onboardings")
      .update({ verification_attempts: row.verification_attempts + 1 })
      .eq("id", portal.onboarding.id);
    return { error: "That code doesn't match. Try again." };
  }

  await svc
    .from("onboardings")
    .update({
      email_verified_at: new Date().toISOString(),
      verification_code: null,
      verification_expires_at: null,
      verification_attempts: 0,
      verification_resends: 0,
    })
    .eq("id", portal.onboarding.id);

  await logEvent(portal, "email_verified");
  revalidatePath(`/o/${token}`, "layout");
  redirect(`/o/${token}/agreement`);
}

/** First open of the link. Recorded once, quietly. */
export async function recordOpen(token: string) {
  const portal = await getPortal(token);
  if (!portal || portal.onboarding.started_at) return;

  const svc = createServiceClient();
  const now = new Date().toISOString();
  await svc
    .from("onboardings")
    .update({
      started_at: now,
      last_activity_at: now,
      status:
        portal.onboarding.status === "not_started"
          ? "in_progress"
          : portal.onboarding.status,
    })
    .eq("id", portal.onboarding.id);

  await logEvent(portal, "link_opened");
}

/* ── File uploads ────────────────────────────────────────────── */

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const BUCKET = "onboarding-files";

interface FileRequestConfig {
  key: string;
  label: string;
  hint: string;
  required: boolean;
  /** Set by the business when one file is never the answer. */
  multiple?: boolean;
  /** Which file types this request takes. See lib/file-types. */
  accept?: string;
}

/**
 * Cap on a single "allow several" request.
 *
 * Not a product opinion so much as a floor under the storage bill:
 * without it one client with a full camera roll can upload without
 * limit, and the business finds out from an invoice.
 */
const MAX_FILES_PER_REQUEST = 25;

/**
 * Everything this onboarding is allowed to write to, derived from the
 * token alone. The client never supplies a path — it gets one back.
 */
function uploadPrefix(onboardingId: string, stepId: string) {
  return `${onboardingId}/${stepId}`;
}

export type UploadTicket =
  | { error: string }
  | { url: string; path: string; uploadToken: string };

/**
 * Step one of an upload: hand back a one-shot signed URL.
 *
 * The file goes from the browser straight to storage rather than
 * through a server action, because actions cap at 1MB and the portal
 * promises 25MB. Raising that cap would mean streaming every brand
 * pack through Next for no benefit.
 *
 * The stored name is a random uuid, never the client's filename. That
 * removes path traversal, unicode and collision handling in one go;
 * the real name is a column.
 */
export async function requestUpload(
  token: string,
  requestKey: string,
  filename: string,
  sizeBytes: number,
): Promise<UploadTicket> {
  const found = await resolve(token, "files");
  if (!found) return { error: "This step isn't available." };
  const { portal, step } = found;

  const requests = (step.config.requests ?? []) as FileRequestConfig[];
  const request = requests.find((r) => r.key === requestKey);
  if (!request) {
    return { error: "Unknown item." };
  }

  /**
   * The browser checks this too, but that check is a courtesy. This
   * one is the rule: nothing hands out an upload URL for a file the
   * business did not ask for, whatever the page was persuaded to do.
   */
  if (!isAllowedFile(request.accept, filename)) {
    return { error: rejectionMessage(request.accept, filename) };
  }

  if (sizeBytes <= 0) return { error: "That file looks empty." };
  if (sizeBytes > MAX_UPLOAD_BYTES) {
    return { error: "That file is over 25 MB. Try a smaller one." };
  }

  const ext = filename.includes(".")
    ? `.${filename.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12)}`
    : "";
  const path = `${uploadPrefix(portal.onboarding.id, step.id)}/${randomUUID()}${ext}`;

  const svc = createServiceClient();
  const { data, error } = await svc.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("requestUpload: signed url failed", error);
    return { error: "Couldn't start that upload. Try again." };
  }

  return { url: data.signedUrl, path: data.path, uploadToken: data.token };
}

/**
 * Step two: record the upload, once storage confirms it exists.
 *
 * Size and type are read back from storage rather than taken from the
 * caller. A browser that has just been handed an upload URL is not a
 * trustworthy source for how big the thing it uploaded was, and the
 * business sees these numbers.
 */
export async function confirmUpload(
  token: string,
  requestKey: string,
  path: string,
  filename: string,
): Promise<PortalResult> {
  const found = await resolve(token, "files");
  if (!found) return { error: "This step isn't available." };
  const { portal, step } = found;

  const requests = (step.config.requests ?? []) as FileRequestConfig[];
  const request = requests.find((r) => r.key === requestKey);
  if (!request) return { error: "Unknown item." };

  // The path came back over the wire, so re-derive what it is allowed
  // to look like instead of trusting it.
  const prefix = uploadPrefix(portal.onboarding.id, step.id);
  if (!path.startsWith(`${prefix}/`) || path.includes("..")) {
    return { error: "That upload didn't look right." };
  }

  // Checked again on the way back in: requestUpload validated the
  // name it was given, and this is a second, separately-supplied name
  // that becomes what the business sees in their file list.
  if (!isAllowedFile(request.accept, filename)) {
    return { error: rejectionMessage(request.accept, filename) };
  }

  const svc = createServiceClient();
  const objectName = path.slice(prefix.length + 1);
  const { data: listed } = await svc.storage
    .from(BUCKET)
    .list(prefix, { search: objectName });

  const object = listed?.find((o) => o.name === objectName);
  if (!object) return { error: "That upload didn't finish. Try again." };

  const size = Number(object.metadata?.size ?? 0);
  const mime = String(object.metadata?.mimetype ?? "") || null;

  const existing = (await getStepFiles(step.id)).filter(
    (f) => f.request_key === requestKey,
  );

  if (request.multiple) {
    // A batch request accumulates. "Send us your product photography"
    // is not answered by one photograph, and silently overwriting the
    // last one is worse than refusing — the client watches the count
    // stay at 1 and cannot tell why.
    if (existing.length >= MAX_FILES_PER_REQUEST) {
      return {
        error: `That's the limit of ${MAX_FILES_PER_REQUEST} files here. Remove one first.`,
      };
    }
  } else if (existing.length) {
    // A single request replaces: they asked for a logo, not a version
    // history.
    await svc.storage.from(BUCKET).remove(existing.map((f) => f.storage_path));
    await svc
      .from("files")
      .delete()
      .in("id", existing.map((f) => f.id));
  }

  const { error: insErr } = await svc.from("files").insert({
    onboarding_step_id: step.id,
    request_key: requestKey,
    filename: filename.slice(0, 200),
    size_bytes: size,
    mime_type: mime,
    storage_path: path,
  });

  if (insErr) {
    console.error("confirmUpload: files insert failed", insErr);
    return { error: "Couldn't save that upload." };
  }

  await settleFilesStep(portal, step, requests);
}

export async function removeUpload(
  token: string,
  fileId: string,
): Promise<PortalResult> {
  const found = await resolve(token, "files");
  if (!found) return { error: "This step isn't available." };
  const { portal, step } = found;

  // Scoped by step id, so an id belonging to another onboarding
  // simply matches nothing.
  const file = (await getStepFiles(step.id)).find((f) => f.id === fileId);
  if (!file) return { error: "That file is already gone." };

  const svc = createServiceClient();
  await svc.storage.from(BUCKET).remove([file.storage_path]);
  await svc.from("files").delete().eq("id", file.id).eq("onboarding_step_id", step.id);

  const requests = (step.config.requests ?? []) as FileRequestConfig[];
  await settleFilesStep(portal, step, requests);
}

/** Complete once every required item has something against it. */
async function settleFilesStep(
  portal: PortalData,
  step: PortalStep,
  requests: FileRequestConfig[],
) {
  const files = await getStepFiles(step.id);
  const have = new Set(files.map((f) => f.request_key));
  const complete = requests
    .filter((r) => r.required)
    .every((r) => have.has(r.key));

  await writeStep(portal, step, { uploaded: files.length }, complete);
}

/**
 * Continue from the files step. Optional-only lists never satisfy the
 * rule above on their own, so pressing Continue is what finishes them.
 */
export async function continueFromFiles(token: string): Promise<PortalResult> {
  const found = await resolve(token, "files");
  if (!found) return { error: "This step isn't available." };
  const { portal, step } = found;

  const requests = (step.config.requests ?? []) as FileRequestConfig[];
  const files = await getStepFiles(step.id);
  const have = new Set(files.map((f) => f.request_key));
  const missing = requests.filter((r) => r.required && !have.has(r.key));

  if (missing.length) {
    return { error: `${missing[0].label} is still needed to continue.` };
  }

  await writeStep(portal, step, { uploaded: files.length }, true);
  redirect(onward(portal, "files"));
}

/* ── Link recovery ───────────────────────────────────────────── */

/** How often one onboarding will re-send its own link. */
const LINK_RESEND_COOLDOWN_MIN = 10;

/**
 * "My link doesn't work — send me a new one."
 *
 * The only action in the app that starts from an email address
 * rather than a token, which makes it the only one a stranger can
 * reach. Three rules follow from that:
 *
 * 1. It NEVER says whether the address is known. Same answer either
 *    way, or this becomes a way to ask which of a agency's clients
 *    exist.
 * 2. Mail only ever goes to the address already on the record, so it
 *    cannot be used to forward somebody else's link anywhere.
 * 3. A per-onboarding cooldown, so it cannot be used to bombard a
 *    client's inbox.
 *
 * The token itself is not reissued: the old link still works if it
 * was merely lost, and rotating it would break the copy someone may
 * have already opened elsewhere. What was actually missing was a way
 * to be sent it again — this screen was a dead end, on the one
 * screen whose entire job is recovery.
 */
export type LinkRecoveryResult = { error: string } | { sent: true } | undefined;

export async function requestNewLink(
  _prev: LinkRecoveryResult,
  formData: FormData,
): Promise<LinkRecoveryResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!/.+@.+\..+/.test(email)) {
    return { error: "That email doesn't look right." };
  }

  const svc = createServiceClient();

  const { data: clients } = await svc
    .from("clients")
    .select("id")
    .ilike("email", email);

  const ids = ((clients ?? []) as { id: string }[]).map((c) => c.id);

  // Deliberately no early return on an empty list: the caller gets
  // the same answer, after the same work, whether or not we found
  // anything.
  if (ids.length) {
    const { data: rows } = await svc
      .from("onboardings")
      .select("*")
      .in("client_id", ids)
      // A finished onboarding has nothing left to do; sending its
      // link back would only confuse.
      .is("completed_at", null);

    const cutoff = Date.now() - LINK_RESEND_COOLDOWN_MIN * 60000;

    for (const row of (rows ?? []) as (Onboarding & {
      link_resent_at: string | null;
    })[]) {
      const last = row.link_resent_at
        ? new Date(row.link_resent_at).getTime()
        : 0;
      if (last > cutoff) continue;

      const portal = await getPortal(row.token);
      if (!portal) continue;

      // sendInvitation names the steps, so it wants the stored rows
      // rather than the portal's mapped view of them.
      const { data: steps } = await svc
        .from("onboarding_steps")
        .select("*")
        .eq("onboarding_id", row.id)
        .order("position");

      await svc
        .from("onboardings")
        .update({ link_resent_at: new Date().toISOString() })
        .eq("id", row.id);

      await sendInvitation(
        portal.business,
        portal.client,
        portal.onboarding,
        (steps ?? []) as OnboardingStepRow[],
      );
    }
  }

  // Always the same answer. Whether that address is one of this
  // agency's clients is not a question a stranger gets to ask.
  return { sent: true };
}
