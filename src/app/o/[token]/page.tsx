import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  ProgressBar,
  StepList,
  type Step,
} from "@/components/ui";
import { PortalShell } from "@/components/portal/portal-shell";
import { getPortal } from "@/lib/portal";
import { recordOpen } from "@/lib/portal-actions";
import { fillEmptyOnboarding } from "@/lib/snapshot";

/**
 * C1 — Welcome / progress. The money shot.
 *
 * This screen answers four questions in one glance: where am I,
 * what's left, how much have I done, and what do I do next. It is
 * also the hub the client returns to after every step, so it has to
 * stay calm on the twentieth visit as well as the first.
 *
 * Deliberately absent: a percentage, elapsed time, a due date, any
 * language implying the client is late. They are not behind; they
 * are in progress.
 */

/** Rough remaining time. Honest enough to orient, vague enough not to nag. */
function minutesLeft(remaining: number) {
  return Math.max(2, remaining * 3);
}

export default async function PortalWelcome({
  params,
}: PageProps<"/o/[token]">) {
  const { token } = await params;
  let portal = await getPortal(token);
  if (!portal) redirect(`/o/${token}/expired`);

  /**
   * A custom onboarding is built after its client record exists, so
   * the first arrival may find nothing copied across yet. Filling it
   * here — before anything is read for the render — is what stops the
   * client seeing an empty page once and the real one on refresh.
   *
   * No-op for every onboarding that already has steps, so this costs
   * a second read only in the case that would otherwise be broken.
   */
  if (portal.steps.length === 0) {
    await fillEmptyOnboarding(portal.onboarding.id);
    portal = (await getPortal(token)) ?? portal;
  }

  const { business, client, steps, completedCount, welcomeMessage } = portal;

  // First visit is a real fact now, not a query string: the link has
  // never been opened before.
  const isFirstVisit = !portal.onboarding.started_at;
  await recordOpen(token);

  const listSteps: Step[] = steps.map((s) => ({
    id: s.slug,
    title: s.title,
    meta: stepMeta(s.state, s.completedAt),
    optional: !s.required,
    state: s.state,
    href: `/o/${token}/${s.slug}`,
    lockedReason: s.lockedReason,
  }));

  // Continue must never point at a locked step, or the primary
  // action on the money shot leads to a dead end.
  const next = steps.find((s) => s.state === "current") ?? steps[0];
  const allDone = steps.length > 0 && completedCount === steps.length;

  return (
    <PortalShell business={business} token={token}>
      <div className="flex flex-1 flex-col gap-8 pt-2 animate-step-in">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold text-ink-900">
            {isFirstVisit ? `Welcome, ${client.company}` : "Welcome back"}
          </h1>
          <p className="measure-prose text-base text-ink-500">
            {isFirstVisit
              ? welcomeMessage
              : "Here's where you got to. Pick up any time — everything you've entered is saved."}
          </p>
        </div>

        <Card>
          <CardBody className="flex flex-col gap-6">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-ink-700">
                  <span data-numeric>{completedCount}</span> of{" "}
                  <span data-numeric>{steps.length}</span> complete
                </span>
                {!allDone && (
                  <span className="text-sm text-ink-500">
                    About {minutesLeft(steps.length - completedCount)} minutes
                    left
                  </span>
                )}
              </div>
              <ProgressBar
                value={completedCount}
                total={steps.length}
                label="Onboarding progress"
              />
            </div>

            <StepList steps={listSteps} />
          </CardBody>
        </Card>

        <div className="flex flex-col gap-4">
          {allDone ? (
            <Button asChild variant="primary" size="lg" className="w-full">
              <Link href={`/o/${token}/done`}>See what happens next</Link>
            </Button>
          ) : (
            next && (
              <Button asChild variant="primary" size="lg" className="w-full">
                <Link href={`/o/${token}/${next.slug}`}>
                  {isFirstVisit ? "Get started" : `Continue — ${next.title}`}
                </Link>
              </Button>
            )
          )}

          {/* Reassurance, not a disclaimer. The client is about to
              hand over documents, a signature and a payment. */}
          <p className="flex items-start gap-2 text-sm text-ink-500">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            <span>
              Your answers save as you go. Nothing is shared outside{" "}
              {business.name}.
            </span>
          </p>
        </div>
      </div>
    </PortalShell>
  );
}

function stepMeta(state: string, completedAt: string | null) {
  if (state !== "complete" || !completedAt) return undefined;
  return `Done ${new Date(completedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })}`;
}
