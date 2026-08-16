"use client";

import {
  Button,
  Tooltip,
  TooltipProvider,
  toast,
  type ButtonProps,
} from "./index";

/**
 * A control that isn't wired up yet must SAY so.
 *
 * A button that renders live and does nothing when clicked is the
 * single sharpest tell of a vibe-coded app — it reads as broken
 * rather than merely unfinished, and it costs exactly the trust
 * this product needs from someone routing a client deposit through
 * it. Until the backend exists, these are visibly disabled with a
 * tooltip that explains why.
 */
export function PendingButton({
  reason = "Connected once your account is set up",
  children,
  ...props
}: ButtonProps & { reason?: string }) {
  return (
    /**
     * Brings its own provider. Radix nests them safely, and a
     * component that silently crashes the page unless an ancestor
     * happens to have set something up is a trap — this one is used
     * on first-run and in the portal, neither of which had one.
     */
    <TooltipProvider>
      <Tooltip content={reason}>
        {/* span wrapper: a disabled button emits no pointer events,
            so the tooltip would never fire without something to
            hover. */}
        <span className="inline-flex">
          <Button {...props} disabled>
            {children}
          </Button>
        </span>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * For actions that genuinely complete client-side today. Gives real
 * feedback rather than a silent click.
 */
export function ToastButton({
  message,
  description,
  children,
  ...props
}: ButtonProps & { message: string; description?: string }) {
  return (
    <Button {...props} onClick={() => toast.success(message, { description })}>
      {children}
    </Button>
  );
}
