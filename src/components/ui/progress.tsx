import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------
   ProgressBar
   ------------------------------------------------------------------ */

export function ProgressBar({
  value,
  total,
  className,
  label,
}: {
  value: number;
  total: number;
  className?: string;
  /** Accessible name, e.g. "Onboarding progress". */
  label?: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={label ?? `${value} of ${total} complete`}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-ink-150",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-accent-600 transition-[width] duration-[400ms] ease-(--ease) motion-reduce:transition-none"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------
   StepList — the portal's spine.

   "4 of 6" rather than "67%". A percentage is a file-transfer
   readout; a count is how a person thinks about a checklist.
   ------------------------------------------------------------------ */

export type StepState = "complete" | "current" | "upcoming";

export interface Step {
  id: string;
  title: string;
  /** e.g. "signed 12 Aug", "1 optional item skipped", "$2,500" */
  meta?: string;
  state: StepState;
  href?: string;
  optional?: boolean;
  /**
   * Why this step can't be started yet, e.g. "Sign the agreement
   * first". Dependencies, not strict sequencing: onboarding spans
   * days on a phone, and a client who only has ten minutes tonight
   * should still be able to do something. Only steps with a real
   * commercial dependency lock — chiefly payment, which must not be
   * payable before the agreement is signed.
   */
  lockedReason?: string;
}

function StepMarker({ state, locked }: { state: StepState; locked?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full border",
        "transition-colors duration-(--dur-slow) ease-(--ease) motion-reduce:transition-none",
        locked && "border-ink-200 bg-ink-100",
        !locked && state === "complete" && "border-accent-600 bg-accent-600",
        !locked && state === "current" && "border-accent-600 bg-surface",
        !locked && state === "upcoming" && "border-ink-200 bg-surface",
      )}
    >
      {locked && <Lock className="size-3 text-ink-400" strokeWidth={2.5} />}
      {!locked && state === "complete" && (
        <Check className="size-3.5 text-on-accent" strokeWidth={3} />
      )}
      {!locked && state === "current" && (
        <span className="size-2 rounded-full bg-accent-600" />
      )}
    </span>
  );
}

function StepRow({ step }: { step: Step }) {
  const { state, title, meta, optional, lockedReason } = step;
  const locked = Boolean(lockedReason);

  return (
    <>
      <StepMarker state={state} locked={locked} />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            "text-base",
            // Completed steps recede. The current step is the only
            // one carrying weight, so the eye lands on what's next.
            locked && "text-ink-400",
            !locked && state === "complete" && "text-ink-500",
            !locked && state === "current" && "font-medium text-ink-900",
            // ink-500, not ink-400: an upcoming step title is content
            // the client needs to read, not a placeholder. ink-400
            // measures 2.9:1 and fails AA.
            !locked && state === "upcoming" && "text-ink-500",
          )}
        >
          {title}
          {optional && !locked && (
            <span className="ml-2 text-sm font-normal text-ink-400">
              Optional
            </span>
          )}
        </span>
        {/* A locked step always says WHY, never just "locked". An
            unexplained lock reads as a bug or a paywall, and this
            one exists to protect the client as much as the agency. */}
        {locked ? (
          <span className="text-sm text-ink-500">{lockedReason}</span>
        ) : (
          meta && <span className="text-sm text-ink-500">{meta}</span>
        )}
      </span>
    </>
  );
}

export function StepList({
  steps,
  className,
}: {
  steps: Step[];
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {steps.map((step) => {
        // A locked step is never a link — the lock has to be real,
        // not a visual hint you can click straight past.
        const interactive = Boolean(step.href) && !step.lockedReason;

        return (
          <li key={step.id}>
            {interactive ? (
              <Link
                href={step.href!}
                className={cn(
                  "-mx-2 flex items-start gap-3 rounded-md px-2 py-2.5",
                  "transition-colors duration-(--dur-fast) ease-(--ease)",
                  "hover:bg-ink-100",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)",
                )}
              >
                <StepRow step={step} />
              </Link>
            ) : (
              <div className="flex items-start gap-3 py-2.5">
                <StepRow step={step} />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Compact "4 of 6 complete" + bar, used at the top of the portal
 * welcome screen and in the business-side client detail.
 */
export function ProgressSummary({
  value,
  total,
  className,
}: {
  value: number;
  total: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink-700">
          <span data-numeric>{value}</span> of{" "}
          <span data-numeric>{total}</span> complete
        </span>
        {value === total && (
          <span className="text-sm font-medium text-accent-600">All done</span>
        )}
      </div>
      <ProgressBar value={value} total={total} />
    </div>
  );
}
