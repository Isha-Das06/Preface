"use client";

import * as RS from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { controlClasses, useField } from "./field";

export const SelectRoot = RS.Root;
export const SelectValue = RS.Value;
export const SelectGroup = RS.Group;

export function SelectTrigger({
  className,
  children,
  id,
  ...props
}: React.ComponentPropsWithoutRef<typeof RS.Trigger>) {
  const field = useField();

  return (
    <RS.Trigger
      id={id ?? field?.id}
      aria-invalid={field?.invalid || undefined}
      aria-describedby={field?.describedBy}
      className={cn(
        controlClasses,
        "flex h-(--control-h) items-center justify-between gap-2 px-3 text-base",
        "text-left data-[placeholder]:text-ink-400",
        className,
      )}
      {...props}
    >
      {children}
      <RS.Icon asChild>
        <ChevronDown className="size-4 shrink-0 text-ink-500" />
      </RS.Icon>
    </RS.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentPropsWithoutRef<typeof RS.Content>) {
  return (
    <RS.Portal>
      <RS.Content
        position={position}
        sideOffset={4}
        className={cn(
          // Dropdowns genuinely float, so they get a shadow.
          "z-50 overflow-hidden rounded-md border border-ink-200 bg-surface shadow-md",
          "min-w-(--radix-select-trigger-width)",
          "max-h-(--radix-select-content-available-height)",
          "data-[state=open]:animate-[pop-in_var(--dur)_var(--ease)]",
          "data-[state=closed]:animate-[fade-out_var(--dur-fast)_var(--ease)]",
          className,
        )}
        {...props}
      >
        <RS.Viewport className="p-1">{children}</RS.Viewport>
      </RS.Content>
    </RS.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof RS.Item>) {
  return (
    <RS.Item
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-[4px] py-1.5 pr-8 pl-2.5",
        "text-base text-ink-900 outline-none select-none",
        "data-[highlighted]:bg-ink-100",
        "data-[disabled]:pointer-events-none data-[disabled]:text-ink-400",
        className,
      )}
      {...props}
    >
      <RS.ItemText>{children}</RS.ItemText>
      <RS.ItemIndicator className="absolute right-2.5">
        <Check className="size-4 text-accent-600" strokeWidth={2.5} />
      </RS.ItemIndicator>
    </RS.Item>
  );
}

export function SelectLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RS.Label>) {
  return <RS.Label className={cn("label-caps px-2.5 py-1.5", className)} {...props} />;
}

export function SelectSeparator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RS.Separator>) {
  return (
    <RS.Separator className={cn("my-1 h-px bg-ink-150", className)} {...props} />
  );
}

/** Convenience wrapper for the common case. */
export function Select({
  options,
  placeholder = "Select…",
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RS.Root> & {
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <SelectRoot {...props}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}
