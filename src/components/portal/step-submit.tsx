"use client";

import { useFormStatus } from "react-dom";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Continue button plus the save state beside it.
 *
 * Both are driven by the real form status. The earlier SaveIndicator
 * watched for keystrokes and announced "Saved" on a timer, which was
 * honest while the screens ran on mock data and becomes a lie the
 * moment a database is behind them — the client would read "Saved"
 * for answers that never left the browser.
 */
export function StepSubmit({
  label = "Continue",
  saved = false,
}: {
  label?: string;
  /** True once this step has been stored, on a fresh page load. */
  saved?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <span
        aria-live="polite"
        className={cn(
          "hidden items-center gap-1.5 text-sm text-ink-500 sm:flex",
          !pending && !saved && "invisible",
        )}
      >
        {pending ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            Saving
          </>
        ) : (
          <>
            <Check className="size-3.5 text-accent-600" />
            Saved
          </>
        )}
      </span>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={pending}
        className="w-full sm:w-auto"
      >
        {label}
      </Button>
    </>
  );
}
