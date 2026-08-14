"use client";

import { cn } from "@/lib/utils";
import { controlClasses, useField } from "./field";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  /** Leading glyph or icon — e.g. "$" on an amount, a search icon. */
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export function Input({
  className,
  leading,
  trailing,
  id,
  ...props
}: InputProps) {
  const field = useField();

  const input = (
    <input
      id={id ?? field?.id}
      aria-invalid={field?.invalid || undefined}
      aria-describedby={field?.describedBy}
      className={cn(
        controlClasses,
        "h-(--control-h) px-3 text-base",
        leading && "pl-8",
        trailing && "pr-10",
        className,
      )}
      {...props}
    />
  );

  if (!leading && !trailing) return input;

  return (
    <div className="relative flex items-center">
      {leading && (
        <span className="pointer-events-none absolute left-3 text-base text-ink-500">
          {leading}
        </span>
      )}
      {input}
      {trailing && (
        <span className="pointer-events-none absolute right-3 text-sm text-ink-500">
          {trailing}
        </span>
      )}
    </div>
  );
}

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className, id, rows = 4, ...props }: TextareaProps) {
  const field = useField();

  return (
    <textarea
      id={id ?? field?.id}
      rows={rows}
      aria-invalid={field?.invalid || undefined}
      aria-describedby={field?.describedBy}
      className={cn(
        controlClasses,
        "resize-y px-3 py-2.5 text-base leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}
