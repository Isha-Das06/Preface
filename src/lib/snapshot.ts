import "server-only";
import { createServiceClient } from "./supabase/server";

/**
 * Fill an onboarding that has no steps yet from the workflow it came
 * from.
 *
 * Rule 4 of the product says steps are SNAPSHOTTED onto an onboarding
 * and never mutated afterwards, so that editing a workflow can't
 * rewrite questions a client is halfway through or change the text
 * under a signature. That rule is not weakened here.
 *
 * This only ever touches an onboarding with ZERO steps, never sent,
 * never opened — one that has nothing to protect and, as it stands,
 * shows the client an empty page. That happens when the workflow was
 * empty at the moment the client was added, which is exactly what
 * "build a custom one for this client" does on purpose: the client
 * record has to exist before there is anything to build.
 *
 * The moment it has steps, or has been sent, or has been opened, this
 * does nothing at all and the snapshot is frozen for good.
 */
export async function fillEmptyOnboarding(onboardingId: string) {
  const svc = createServiceClient();

  const { data: row } = await svc
    .from("onboardings")
    .select("id, workflow_id, sent_at, started_at")
    .eq("id", onboardingId)
    .maybeSingle();

  const onboarding = row as {
    id: string;
    workflow_id: string;
    sent_at: string | null;
    started_at: string | null;
  } | null;

  if (!onboarding || onboarding.sent_at || onboarding.started_at) return;

  // Anything already here is the snapshot. Leave it alone.
  const { count } = await svc
    .from("onboarding_steps")
    .select("id", { count: "exact", head: true })
    .eq("onboarding_id", onboarding.id);

  if ((count ?? 0) > 0) return;

  const { data: wfSteps } = await svc
    .from("workflow_steps")
    .select("*")
    .eq("workflow_id", onboarding.workflow_id)
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

  if (steps.length === 0) return;

  await svc.from("onboarding_steps").insert(
    steps.map((s, i) => ({
      onboarding_id: onboarding.id,
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
