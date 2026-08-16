import Link from "next/link";
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
import {
  business,
  client,
  completedCount,
  currentStep,
  steps,
} from "@/lib/mock";

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

export default async function PortalWelcome({
  searchParams,
}: {
  searchParams: Promise<{ first?: string }>;
}) {
  const { first } = await searchParams;
  const isFirstVisit = first === "1";

  // A dependency only locks while its prerequisite is unfinished.
  // Resolved here rather than baked into the data so the lock
  // disappears the moment the client satisfies it.
  const isDone = (slug: string) =>
    steps.find((s) => s.slug === slug)?.status === "complete";

  const listSteps: Step[] = steps.map((s) => {
    const blocked =
      Boolean(s.dependsOn) && (isFirstVisit || !isDone(s.dependsOn!));

    return {
      id: s.slug,
      title: s.title,
      meta: isFirstVisit ? undefined : s.meta,
      optional: s.optional,
      state: isFirstVisit ? "upcoming" : s.status,
      href: `/o/demo/${s.slug}`,
      lockedReason: blocked ? s.lockedReason : undefined,
    };
  });

  const done = isFirstVisit ? 0 : completedCount;
  // Continue must never point at a locked step, or the primary
  // action on the money shot leads to a dead end.
  const firstOpen = listSteps.find(
    (s) => s.state !== "complete" && !s.lockedReason,
  );
  const next =
    steps.find((s) => s.slug === firstOpen?.id) ??
    (isFirstVisit ? steps[0] : (currentStep ?? steps[0]));

  return (
    <PortalShell business={business}>
      <div className="flex flex-1 flex-col gap-8 pt-2 animate-step-in">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold text-ink-900">
            {isFirstVisit ? `Welcome, ${client.company}` : "Welcome back"}
          </h1>
          <p className="measure-prose text-base text-ink-500">
            {isFirstVisit
              ? business.welcomeMessage
              : "Here's where you got to. Pick up any time — everything you've entered is saved."}
          </p>
        </div>

        <Card>
          <CardBody className="flex flex-col gap-6">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-ink-700">
                  <span data-numeric>{done}</span> of{" "}
                  <span data-numeric>{steps.length}</span> complete
                </span>
                <span className="text-sm text-ink-500">
                  About {isFirstVisit ? 15 : 5} minutes left
                </span>
              </div>
              <ProgressBar
                value={done}
                total={steps.length}
                label="Onboarding progress"
              />
            </div>

            <StepList steps={listSteps} />
          </CardBody>
        </Card>

        <div className="flex flex-col gap-4">
          <Button asChild variant="primary" size="lg" className="w-full">
            <Link href={`/o/demo/${next.slug}`}>
              {isFirstVisit ? "Get started" : `Continue — ${next.title}`}
            </Link>
          </Button>

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
