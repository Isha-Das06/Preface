"use client";

import * as RC from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof RC.Root> {
  label?: React.ReactNode;
  description?: string;
}

export function Checkbox({
  label,
  description,
  className,
  id,
  ...props
}: CheckboxProps) {
  const auto = useId();
  const controlId = id ?? auto;

  const box = (
    <RC.Root
      id={controlId}
      className={cn(
        "peer flex size-[18px] shrink-0 items-center justify-center rounded-[4px]",
        "border border-ink-300 bg-surface",
        "transition-colors duration-(--dur-fast) ease-(--ease)",
        "hover:border-ink-400",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)",
        "data-[state=checked]:border-accent-600 data-[state=checked]:bg-accent-600",
        "data-[state=indeterminate]:border-accent-600 data-[state=indeterminate]:bg-accent-600",
        "disabled:cursor-not-allowed disabled:border-ink-200 disabled:bg-ink-100",
        className,
      )}
      {...props}
    >
      <RC.Indicator className="text-on-accent">
        {props.checked === "indeterminate" ? (
          <Minus className="size-3" strokeWidth={3} />
        ) : (
          <Check className="size-3" strokeWidth={3} />
        )}
      </RC.Indicator>
    </RC.Root>
  );

  if (!label) return box;

  return (
    <div className="flex items-start gap-2.5">
      {/* Nudged down so the box aligns to the cap-height of the
          first line rather than floating above it. */}
      <span className="flex h-(--lh-base) items-center">{box}</span>
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
