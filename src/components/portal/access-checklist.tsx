"use client";

import { useState, useTransition } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui";
import { setChecklistItem } from "@/lib/portal-actions";

export interface ChecklistItem {
  key: string;
  label: string;
  instruction: string;
  required: boolean;
  done: boolean;
  /**
   * The exact string to paste into the other system. "Invite your
   * agency email" is unanswerable to the person reading it unless
   * the address is on the screen too.
   */
  detail?: string;
}

/**
 * Things the client does in ANOTHER system, then confirms here.
 *
 * There is deliberately no field to type a password into. Accepting
 * a client's platform credentials violates Meta's terms and triggers
 * account lockouts; the correct pattern is role-based access granted
 * on the client's own device. So this step carries instructions and
 * a confirmation, nothing else.
 *
 * Each item tracks its own state so the business's waiting-on view
 * can say "waiting on: Meta access" rather than just "waiting on:
 * account access".
 *
 * Ticks write immediately and optimistically, and roll back if the
 * write fails — a checkbox that stays ticked after a failed save is
 * how a client believes they are done when the business sees nothing.
 */
function DetailChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <span
      className="mt-1 flex w-fit max-w-full items-center gap-2 rounded-md border border-ink-200 bg-ink-50 py-1.5 pr-1.5 pl-2.5"
      // The label wrapping this list is a <label>, so a click here
      // would otherwise tick the box as well as copy.
      onClick={(e) => e.preventDefault()}
    >
      <span className="min-w-0 flex-1 truncate font-mono text-sm text-ink-900">
        {value}
      </span>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
        className="flex shrink-0 items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)"
      >
        {copied ? (
          <>
            <Check className="size-3.5 text-accent-600" strokeWidth={3} />
            Copied
          </>
        ) : (
          <>
            <Copy className="size-3.5" />
            Copy
          </>
        )}
      </button>
    </span>
  );
}

export function AccessChecklist({
  token,
  items,
}: {
  token: string;
  items: ChecklistItem[];
}) {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(items.map((i) => [i.key, i.done])),
  );
  const [, startTransition] = useTransition();

  function toggle(key: string, next: boolean) {
    setState((prev) => ({ ...prev, [key]: next }));

    startTransition(async () => {
      const result = await setChecklistItem(token, key, next);
      if (result?.error) {
        setState((prev) => ({ ...prev, [key]: !next }));
        toast.error("That didn't save", { description: result.error });
      }
    });
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const done = state[item.key];

        return (
          <li key={item.key}>
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-(--radius-card) border p-4",
                "transition-colors duration-(--dur-fast)",
                done
                  ? "border-accent-300 bg-accent-50"
                  : "border-ink-200 bg-surface hover:border-ink-300",
              )}
            >
              <input
                type="checkbox"
                checked={done}
                onChange={(e) => toggle(item.key, e.target.checked)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border",
                  "transition-colors duration-(--dur-fast)",
                  done
                    ? "border-accent-600 bg-accent-600 text-on-accent"
                    : "border-ink-300 bg-surface",
                )}
              >
                {done && <Check className="size-3.5" strokeWidth={3} />}
              </span>

              <span className="flex flex-col gap-1">
                <span className="text-base font-medium text-ink-900">
                  {item.label}
                  {!item.required && (
                    <span className="ml-2 text-sm font-normal text-ink-500">
                      Optional
                    </span>
                  )}
                </span>
                <span className="measure-prose text-sm text-ink-600">
                  {item.instruction}
                </span>
                {item.detail && <DetailChip value={item.detail} />}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
