"use client";

import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

/**
 * Hover/active states are derived with color-mix rather than
 * hard-coded darker hexes. That matters: a business sets its own
 * accent colour on the portal, and this way their custom colour
 * gets correct hover states for free.
 */
const VARIANTS: Record<Variant, string> = {
  primary: cn(
    "bg-accent-600 text-on-accent border border-transparent",
    "hover:bg-[color-mix(in_oklab,var(--accent-600)_94%,black)]",
    "active:bg-[color-mix(in_oklab,var(--accent-600)_90%,black)]",
  ),
  secondary: cn(
    "bg-surface text-ink-900 border border-ink-200",
    "hover:bg-ink-100 active:bg-ink-150",
  ),
  ghost: cn(
    "bg-transparent text-ink-600 border border-transparent",
    "hover:bg-ink-100 hover:text-ink-900 active:bg-ink-150",
  ),
  danger: cn(
    "bg-surface text-danger-600 border border-danger-600",
    "hover:bg-danger-100 active:bg-[color-mix(in_oklab,var(--danger-100)_92%,black)]",
  ),
};

const SIZES: Record<Size, string> = {
  sm: "h-7 px-3 text-xs gap-1.5",
  // md tracks --control-h, so the same <Button> is 36px in the app
  // and 44px in the portal without anyone passing a prop.
  md: "h-(--control-h) px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  asChild?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  asChild = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const classes = cn(
    "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-[6px]",
    "font-medium whitespace-nowrap select-none",
    "transition-colors duration-(--dur-fast) ease-(--ease)",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)",
    // Disabled is a flat, unmistakably inert surface. aria-disabled
    // covers the asChild case, where <a> has no disabled attribute.
    "disabled:pointer-events-none disabled:border-transparent",
    "disabled:bg-ink-100 disabled:text-ink-400",
    "aria-disabled:pointer-events-none aria-disabled:border-transparent",
    "aria-disabled:bg-ink-100 aria-disabled:text-ink-400",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    className,
  );

  // Slot merges props onto a SINGLE element child, so the loading
  // wrapper cannot be used here. Links don't have a pending state
  // anyway — that belongs to buttons that fire a request.
  if (asChild) {
    return (
      <Slot
        className={classes}
        aria-disabled={disabled || loading || undefined}
        {...props}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      // Never let a loading button be clicked twice.
      disabled={disabled || loading}
      data-loading={loading || undefined}
      className={classes}
      {...props}
    >
      {/* The label stays in flow while loading so the button cannot
          change width mid-request and shift the layout around it. */}
      <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>
        {children}
      </span>
      {loading && (
        <Loader2
          aria-hidden
          className="absolute size-4 animate-spin motion-reduce:animate-none"
        />
      )}
    </button>
  );
}
