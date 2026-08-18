import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";
import { StepSubmit } from "./step-submit";
import { cn } from "@/lib/utils";

/**
 * Shared wrapper for every step screen (C2–C7).
 *
 * C1 is the spine; steps are leaves. Every step offers exactly one
 * way forward and one way back, so the client is never lost and
 * never has to decide what to do next.
 *
 * Two forward modes. `continueHref` is a plain link, for screens
 * that only navigate. `continueSubmit` renders a submit button and
 * expects the caller to have wrapped this frame in a <form> — that
 * is the mode for anything that actually saves.
 */
export function StepFrame({
  token,
  index,
  total,
  title,
  description,
  children,
  continueLabel = "Continue",
  continueHref,
  continueSubmit = false,
  saved = false,
  error,
  footerNote,
  className,
}: {
  /** Needed for the way back — every portal link carries the token. */
  token: string;
  index: number;
  total: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  continueLabel?: string;
  /**
   * Omit both when the screen owns its own primary action — payment
   * and scheduling do. Two primary buttons on one screen means the
   * screen hasn't decided what the client should do.
   */
  continueHref?: string;
  continueSubmit?: boolean;
  saved?: boolean;
  error?: string;
  footerNote?: React.ReactNode;
  className?: string;
}) {
  const hasFooter = Boolean(footerNote || continueHref || continueSubmit);

  return (
    <div className={cn("flex flex-1 flex-col gap-8 animate-step-in", className)}>
      <div className="flex flex-col gap-3">
        <Link
          href={`/o/${token}`}
          className="-mx-2 -my-1 inline-flex w-fit min-h-11 items-center gap-1.5 rounded-md px-2 text-sm text-ink-500 transition-colors duration-(--dur-fast) hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)"
        >
          <ArrowLeft className="size-4" />
          All steps
        </Link>

        <div className="flex flex-col gap-2">
          {/* Orientation without nagging: a count, never a percentage,
              never elapsed time, never "you're behind". */}
          <span className="label-caps">
            Step <span data-numeric>{index}</span> of{" "}
            <span data-numeric>{total}</span>
          </span>
          <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
          {description && (
            <p className="measure-prose text-base text-ink-500">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col">{children}</div>

      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}

      {hasFooter && (
        <div className="flex flex-col gap-4 border-t border-ink-150 pt-6">
          {footerNote && (
            <p className="measure-prose text-sm text-ink-500">{footerNote}</p>
          )}
          <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            {continueSubmit ? (
              <StepSubmit label={continueLabel} saved={saved} />
            ) : (
              <>
                <span />
                {continueHref && (
                  <Button
                    asChild
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <Link href={continueHref}>{continueLabel}</Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
