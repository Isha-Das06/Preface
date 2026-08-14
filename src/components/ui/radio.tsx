"use client";

import * as RG from "@radix-ui/react-radio-group";
import { useId } from "react";
import { cn } from "@/lib/utils";

export function RadioGroup({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RG.Root>) {
  return (
    <RG.Root className={cn("flex flex-col gap-3", className)} {...props} />
  );
}

export interface RadioProps
  extends React.ComponentPropsWithoutRef<typeof RG.Item> {
  label?: React.ReactNode;
  description?: string;
}

export function Radio({
  label,
  description,
  className,
  id,
  ...props
}: RadioProps) {
  const auto = useId();
  const controlId = id ?? auto;

  const dot = (
    <RG.Item
      id={controlId}
      className={cn(
        "peer flex size-[18px] shrink-0 items-center justify-center rounded-full",
        "border border-ink-300 bg-surface",
        "transition-colors duration-(--dur-fast) ease-(--ease)",
        "hover:border-ink-400",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)",
        "data-[state=checked]:border-accent-600",
        "disabled:cursor-not-allowed disabled:border-ink-200 disabled:bg-ink-100",
        className,
      )}
      {...props}
    >
      <RG.Indicator className="size-2 rounded-full bg-accent-600" />
    </RG.Item>
  );

  if (!label) return dot;

  return (
    <div className="flex items-start gap-2.5">
      <span className="flex h-(--lh-base) items-center">{dot}</span>
      <div className="flex flex-col gap-0.5">
        <label
          htmlFor={controlId}
          className="cursor-pointer text-base text-ink-900 select-none peer-disabled:cursor-not-allowed peer-disabled:text-ink-400"
        >
          {label}
        </label>
        {description && (
          <span className="text-sm text-ink-500">{description}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Card-style radio for the template picker and first-run screens,
 * where the choice deserves more visual weight than a bare dot.
 */
export function RadioCard({
  label,
  description,
  className,
  id,
  ...props
}: RadioProps) {
  const auto = useId();
  const controlId = id ?? auto;

  return (
    <label
      htmlFor={controlId}
      className={cn(
        "group flex cursor-pointer items-start gap-3 rounded-md border border-ink-200 bg-surface p-4",
        "transition-colors duration-(--dur-fast) ease-(--ease)",
        "hover:border-ink-300",
        "has-[[data-state=checked]]:border-accent-600 has-[[data-state=checked]]:bg-accent-50",
        className,
      )}
    >
      <RG.Item
        id={controlId}
        className={cn(
          "mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full",
          "border border-ink-300 bg-surface",
          "transition-colors duration-(--dur-fast) ease-(--ease)",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)",
          "data-[state=checked]:border-accent-600",
        )}
        {...props}
      >
        <RG.Indicator className="size-2 rounded-full bg-accent-600" />
      </RG.Item>
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-medium text-ink-900">{label}</span>
        {description && (
          <span className="text-sm text-ink-500">{description}</span>
        )}
      </div>
    </label>
  );
}
