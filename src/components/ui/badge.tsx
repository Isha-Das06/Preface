import { cn } from "@/lib/utils";

export type OnboardingStatus =
  | "not_started"
  | "in_progress"
  | "waiting"
  | "completed";

type Tone = "neutral" | "info" | "warn" | "success" | "danger";

// Text on a tint uses the -fg tokens, not -600/-700. The dark ramp
// runs dark-to-light, so reusing -700 on a dark tint inverts the
// relationship and drops to ~3.2:1.
const TONES: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-600",
  info: "bg-info-100 text-info-fg",
  warn: "bg-warn-100 text-warn-fg",
  success: "bg-accent-100 text-accent-fg",
  danger: "bg-danger-100 text-danger-fg",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-[3px]",
        "text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

const STATUS: Record<OnboardingStatus, { label: string; tone: Tone }> = {
  not_started: { label: "Not started", tone: "neutral" },
  in_progress: { label: "In progress", tone: "info" },
  waiting: { label: "Waiting", tone: "warn" },
  completed: { label: "Completed", tone: "success" },
};

/** The four onboarding states, so no screen invents a fifth. */
export function StatusBadge({
  status,
  className,
}: {
  status: OnboardingStatus;
  className?: string;
}) {
  const { label, tone } = STATUS[status];
  return (
    <Badge tone={tone} className={className}>
      {label}
    </Badge>
  );
}

export function StatusDot({
  status,
  className,
}: {
  status: OnboardingStatus;
  className?: string;
}) {
  const color: Record<OnboardingStatus, string> = {
    not_started: "bg-ink-300",
    in_progress: "bg-info-600",
    waiting: "bg-warn-600",
    completed: "bg-accent-600",
  };
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-full", color[status], className)}
    />
  );
}
