"use client";

import * as DM from "@radix-ui/react-dropdown-menu";
import * as TP from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

/* ------------------------------ Dropdown ------------------------------ */

export const Menu = DM.Root;
export const MenuTrigger = DM.Trigger;

export function MenuContent({
  className,
  align = "end",
  sideOffset = 6,
  ...props
}: React.ComponentPropsWithoutRef<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[180px] overflow-hidden rounded-md border border-ink-200 bg-surface p-1 shadow-md",
          "data-[state=open]:animate-[pop-in_var(--dur)_var(--ease)]",
          "data-[state=closed]:animate-[fade-out_var(--dur-fast)_var(--ease)]",
          className,
        )}
        {...props}
      />
    </DM.Portal>
  );
}

export function MenuItem({
  className,
  destructive,
  ...props
}: React.ComponentPropsWithoutRef<typeof DM.Item> & {
  destructive?: boolean;
}) {
  return (
    <DM.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-[4px] px-2.5 py-1.5",
        "text-sm text-ink-900 outline-none select-none",
        "data-[highlighted]:bg-ink-100",
        "data-[disabled]:pointer-events-none data-[disabled]:text-ink-400",
        destructive &&
          "text-danger-600 data-[highlighted]:bg-danger-100 data-[highlighted]:text-danger-600",
        className,
      )}
      {...props}
    />
  );
}

export function MenuSeparator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DM.Separator>) {
  return (
    <DM.Separator className={cn("my-1 h-px bg-ink-150", className)} {...props} />
  );
}

export function MenuLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DM.Label>) {
  return <DM.Label className={cn("label-caps px-2.5 py-1.5", className)} {...props} />;
}

/* ------------------------------ Tooltip ------------------------------ */

/** Wrap the app once. Radix requires a provider above any Tooltip. */
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <TP.Provider delayDuration={300} skipDelayDuration={150}>
      {children}
    </TP.Provider>
  );
}

export function Tooltip({
  content,
  children,
  side = "top",
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <TP.Root>
      <TP.Trigger asChild>{children}</TP.Trigger>
      <TP.Portal>
        <TP.Content
          side={side}
          sideOffset={6}
          className={cn(
            // Inverted surface: a tooltip should read as an overlay,
            // not as another card.
            "z-50 rounded-[6px] bg-ink-900 px-2 py-1 text-xs font-medium text-ink-50 shadow-md",
            "data-[state=delayed-open]:animate-[pop-in_var(--dur-fast)_var(--ease)]",
          )}
        >
          {content}
        </TP.Content>
      </TP.Portal>
    </TP.Root>
  );
}
