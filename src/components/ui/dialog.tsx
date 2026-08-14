"use client";

import * as RD from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Radix Dialog supplies focus trap, Esc-to-close, focus return to
 * trigger, and body scroll lock. Those are genuinely hard to get
 * right by hand, so the behaviour is borrowed and every pixel of
 * the visual is ours.
 */
export const Dialog = RD.Root;
export const DialogTrigger = RD.Trigger;
export const DialogClose = RD.Close;

function Overlay({ className }: { className?: string }) {
  return (
    <RD.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-(--backdrop)",
        "data-[state=open]:animate-[fade-in_var(--dur)_var(--ease)]",
        "data-[state=closed]:animate-[fade-out_var(--dur-fast)_var(--ease)]",
        className,
      )}
    />
  );
}

function CloseButton() {
  return (
    <RD.Close
      className={cn(
        "absolute top-4 right-4 flex size-8 items-center justify-center rounded-[6px]",
        "text-ink-500 transition-colors duration-(--dur-fast)",
        "hover:bg-ink-100 hover:text-ink-900",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)",
      )}
    >
      <X className="size-4" />
      <span className="sr-only">Close</span>
    </RD.Close>
  );
}

/* ------------------------------------------------------------------
   Modal — centred, max 480px. For a short decision or a small form.
   ------------------------------------------------------------------ */

export function Modal({
  title,
  description,
  children,
  footer,
  className,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <RD.Portal>
      <Overlay />
      <RD.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-[480px]",
          "-translate-x-1/2 -translate-y-1/2",
          "rounded-lg border border-ink-200 bg-surface shadow-lg",
          "focus:outline-none",
          "data-[state=open]:animate-[modal-in_var(--dur-slow)_var(--ease)]",
          "data-[state=closed]:animate-[modal-out_var(--dur)_var(--ease)]",
          className,
        )}
      >
        <div className="flex flex-col gap-1.5 px-6 pt-6 pr-14">
          <RD.Title className="text-lg font-semibold text-ink-900">
            {title}
          </RD.Title>
          {description && (
            <RD.Description className="text-sm text-ink-500">
              {description}
            </RD.Description>
          )}
        </div>
        <CloseButton />
        {children && <div className="px-6 py-5">{children}</div>}
        {footer && (
          <div
            className={cn(
              "flex items-center justify-end gap-2 border-t border-ink-150 px-6 py-4",
              !children && "mt-5",
            )}
          >
            {footer}
          </div>
        )}
      </RD.Content>
    </RD.Portal>
  );
}

/* ------------------------------------------------------------------
   SlideOver — 420px, right, full height. Used for the step editor:
   editing feels lighter in a panel than in a dialog that blocks
   the thing you are editing.
   ------------------------------------------------------------------ */

export function SlideOver({
  title,
  description,
  children,
  footer,
  className,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <RD.Portal>
      <Overlay />
      <RD.Content
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col",
          "border-l border-ink-200 bg-surface shadow-lg",
          "focus:outline-none",
          "data-[state=open]:animate-[slide-in-right_var(--dur-slow)_var(--ease)]",
          "data-[state=closed]:animate-[slide-out-right_var(--dur)_var(--ease)]",
          className,
        )}
      >
        <div className="flex flex-col gap-1.5 border-b border-ink-150 px-6 py-5 pr-14">
          <RD.Title className="text-lg font-semibold text-ink-900">
            {title}
          </RD.Title>
          {description && (
            <RD.Description className="text-sm text-ink-500">
              {description}
            </RD.Description>
          )}
        </div>
        <CloseButton />
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-ink-150 px-6 py-4">
            {footer}
          </div>
        )}
      </RD.Content>
    </RD.Portal>
  );
}
