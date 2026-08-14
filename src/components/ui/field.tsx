"use client";

import { createContext, useContext, useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Field owns label / help / error layout so no form ever has to
 * reinvent it. Wiring aria-describedby by hand in each form is
 * exactly how accessibility quietly rots, so it happens here once.
 */
type FieldCtx = {
  id: string;
  helpId: string;
  errorId: string;
  invalid: boolean;
  describedBy?: string;
};

const Ctx = createContext<FieldCtx | null>(null);

export function useField() {
  return useContext(Ctx);
}

export interface FieldProps {
  label?: string;
  help?: string;
  error?: string;
  required?: boolean;
  /** Right-aligned hint on the label row, e.g. "Optional". */
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  help,
  error,
  required,
  hint,
  className,
  children,
}: FieldProps) {
  const base = useId();
  const id = `${base}-control`;
  const helpId = `${base}-help`;
  const errorId = `${base}-error`;
  const invalid = Boolean(error);

  const describedBy =
    [error ? errorId : null, help ? helpId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <Ctx.Provider value={{ id, helpId, errorId, invalid, describedBy }}>
      <div className={cn("flex flex-col gap-1.5", className)}>
        {(label || hint) && (
          <div className="flex items-baseline justify-between gap-3">
            {label && (
              <label
                htmlFor={id}
                className="text-sm font-medium text-ink-700"
              >
                {label}
                {required && (
                  <span aria-hidden className="ml-0.5 text-danger-600">
                    *
                  </span>
                )}
              </label>
            )}
            {hint && <span className="text-xs text-ink-500">{hint}</span>}
          </div>
        )}

        {children}

        {/* Error replaces help rather than stacking — two lines of
            secondary text under one input is noise. */}
        {error ? (
          <p id={errorId} role="alert" className="text-xs text-danger-600">
            {error}
          </p>
        ) : help ? (
          <p id={helpId} className="text-xs text-ink-500">
            {help}
          </p>
        ) : null}
      </div>
    </Ctx.Provider>
  );
}

/** Shared surface for every text-entry control. */
export const controlClasses = cn(
  "w-full rounded-[6px] border bg-surface text-ink-900",
  "border-ink-200 placeholder:text-ink-400",
  "transition-[color,box-shadow,border-color] duration-(--dur-fast) ease-(--ease)",
  "focus:outline-none focus:border-accent-600 focus:shadow-(--focus-ring)",
  "disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-400",
  "aria-[invalid=true]:border-danger-600",
  "aria-[invalid=true]:focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--danger-600)_22%,transparent)]",
);

/** Standalone label for controls that sit outside a Field. */
export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-sm font-medium text-ink-700", className)}
      {...props}
    />
  );
}
