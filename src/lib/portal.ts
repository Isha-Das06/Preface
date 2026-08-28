import "server-only";
import { createServiceClient } from "./supabase/server";
import { SLUG_BY_TYPE } from "./templates";
import type {
  Business,
  Client,
  FileRow,
  Onboarding,
  OnboardingStep,
  Signature,
  StepType,
} from "./supabase/types";

/**
 * Read side of the client portal.
 *
 * The portal has NO authenticated user, so every query here runs as
 * `service_role` and bypasses RLS entirely. That makes the token the
 * only thing standing between a stranger and a client's contract, so
 * the rule in this file is absolute:
 *
 *   resolve token -> onboarding ONCE, then scope every subsequent
 *   query to ids taken from that row.
 *
 * No function here accepts an id from the caller. If one ever does,
 * the portal becomes an open read of every tenant's data at once.
 */

/**
 * `instructions` has no screen of its own: it is a short note, and a
 * whole page the client must click through to read one paragraph is
 * a step that exists to be skipped. It renders as the welcome text
 * on the hub instead, and is excluded from the step list and the
 * progress count.
 *
 * The map now lives in ./templates so the builder can count steps by
 * the same rule the portal renders them by.
 */

export const TYPE_BY_SLUG = Object.fromEntries(
  Object.entries(SLUG_BY_TYPE)
    .filter(([, slug]) => slug)
    .map(([type, slug]) => [slug as string, type as StepType]),
) as Record<string, StepType>;

/** Steps behind email verification: a contract and a payment request. */
const NEEDS_VERIFICATION: ReadonlySet<StepType> = new Set([
  "agreement",
  "payment",
]);

export type StepState = "complete" | "current" | "upcoming";

export interface PortalStep {
  id: string;
  slug: string;
  type: StepType;
  title: string;
  description: string | null;
  required: boolean;
  /** Raw position in the snapshot, including hidden steps. */
  position: number;
  /** "Step N of M" as the client counts them, 1-based. */
  displayIndex: number;
  config: Record<string, unknown>;
  data: Record<string, unknown>;
  completedAt: string | null;
  state: StepState;
  /** Set only while a prerequisite is still outstanding. */
  lockedReason?: string;
  needsVerification: boolean;
}

export interface PortalData {
  onboarding: Onboarding;
  business: Business;
  client: Client;
  /** Client-visible steps in order. Never includes `instructions`. */
  steps: PortalStep[];
  welcomeMessage: string;
  verified: boolean;
  completedCount: number;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v ? v : fallback;
}

/**
 * Resolve a token to everything the portal renders.
 *
 * Returns null for an unknown token — callers send that to the
 * recovery screen rather than a 404, because a dead end here is a
 * lost onboarding.
 */
export async function getPortal(token: string): Promise<PortalData | null> {
  // Tokens are 32 base58 chars. Anything else cannot match, so it is
  // cheaper and quieter to reject it than to query for it.
  if (!/^[1-9A-HJ-NP-Za-km-z]{32}$/.test(token)) return null;

  const svc = createServiceClient();

  const { data: onboarding } = await svc
    .from("onboardings")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (!onboarding) return null;

  const o = onboarding as Onboarding;

  const [bizRes, clientRes, stepsRes] = await Promise.all([
    svc.from("businesses").select("*").eq("id", o.business_id).maybeSingle(),
    svc.from("clients").select("*").eq("id", o.client_id).maybeSingle(),
    svc
      .from("onboarding_steps")
      .select("*")
      .eq("onboarding_id", o.id)
      .order("position"),
  ]);

  const business = bizRes.data as Business | null;
  const client = clientRes.data as Client | null;
  if (!business || !client) return null;

  const rows = (stepsRes.data ?? []) as OnboardingStep[];

  /**
   * The instructions step becomes the hub's welcome copy.
   *
   * There used to be a second source — a welcome message on the
   * business — which this fell back to. It was redundant: every
   * template ships a Welcome step, so it was overridden for almost
   * everyone, and the place to write what a client reads first is
   * the step they read it in. Its Settings field is gone, so this no
   * longer reads a value nobody can edit.
   */
  const intro = rows.find((r) => r.type === "instructions");
  const welcomeMessage =
    str(intro?.config?.body) ||
    "Before we start, there are a few things we need from you. You can stop and come back any time.";

  const visible = rows.filter((r) => SLUG_BY_TYPE[r.type]);

  // A dependency locks only while its prerequisite is outstanding,
  // so the lock lifts the moment the client satisfies it.
  const steps: PortalStep[] = visible.map((r, i) => {
    const blocker = r.requires_previous
      ? visible.find(
          (p) => p.position < r.position && p.required && !p.completed_at,
        )
      : undefined;

    return {
      id: r.id,
      slug: SLUG_BY_TYPE[r.type]!,
      type: r.type,
      title: r.title,
      description: r.description,
      required: r.required,
      position: r.position,
      displayIndex: i + 1,
      config: r.config ?? {},
      data: r.data ?? {},
      completedAt: r.completed_at,
      state: r.completed_at ? "complete" : "upcoming",
      lockedReason: blocker ? `Finish ${blocker.title} first` : undefined,
      needsVerification: NEEDS_VERIFICATION.has(r.type),
    };
  });

  // Exactly one step is "current": the first one the client can
  // actually act on. Marking every incomplete step current makes the
  // hub read as a pile of work rather than a next action.
  const current = steps.find((s) => !s.completedAt && !s.lockedReason);
  if (current) current.state = "current";

  return {
    onboarding: o,
    business,
    client,
    steps,
    welcomeMessage,
    verified: Boolean(o.email_verified_at),
    completedCount: steps.filter((s) => s.completedAt).length,
  };
}

/** The step a slug refers to, or undefined if this onboarding has none. */
export function stepBySlug(
  portal: PortalData,
  slug: string,
): PortalStep | undefined {
  return portal.steps.find((s) => s.slug === slug);
}

/** Where "Continue" goes after a given step. Null means the end. */
export function nextSlugAfter(
  portal: PortalData,
  slug: string,
): string | null {
  const i = portal.steps.findIndex((s) => s.slug === slug);
  if (i === -1) return null;
  return portal.steps[i + 1]?.slug ?? null;
}

/** Uploaded files for a step, keyed by the request they satisfy. */
export async function getStepFiles(stepId: string): Promise<FileRow[]> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("files")
    .select("*")
    .eq("onboarding_step_id", stepId)
    .order("uploaded_at");
  return (data ?? []) as FileRow[];
}

export async function getSignature(stepId: string): Promise<Signature | null> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("signatures")
    .select("*")
    .eq("onboarding_step_id", stepId)
    .maybeSingle();
  return (data as Signature | null) ?? null;
}

/**
 * There is deliberately no getPayment. The payment step records the
 * client's own confirmation on the step itself, like scheduling, so
 * nothing writes to `payments` yet. The table stays for the day card
 * payments land; a read that always returns null would only look
 * like a feature that exists.
 */
