import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Button } from "./button";

/* ------------------------------------------------------------------
   Every data surface needs all four of these. The fourth — partial —
   is the most forgotten and the most common here: a client who did
   three of six steps.
   ------------------------------------------------------------------ */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && <Icon className="size-8 text-ink-300" strokeWidth={1.5} />}
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-ink-900">{title}</p>
        {description && (
          <p className="measure-prose text-sm text-ink-500">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className,
      )}
    >
      <AlertCircle className="size-8 text-danger-600" strokeWidth={1.5} />
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-ink-900">{title}</p>
        {/* Say what broke and what to do. Never a raw error code. */}
        {description && (
          <p className="measure-prose text-sm text-ink-500">{description}</p>
        )}
      </div>
      {onRetry && (
        <Button onClick={onRetry} className="mt-1">
          Try again
        </Button>
      )}
    </div>
  );
}

/**
 * Skeletons match the final layout. A centred spinner on a full page
 * tells the user nothing about what is arriving.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-[4px] bg-ink-100 motion-reduce:animate-none",
        className,
      )}
      style={{ animationDuration: "1.5s" }}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3.5"
          // Ragged last line reads as text rather than a grey block.
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}
