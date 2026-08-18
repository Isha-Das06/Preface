"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui";
import { setChecklistItem } from "@/lib/portal-actions";

export interface ChecklistItem {
  key: string;
  label: string;
  instruction: string;
  required: boolean;
  done: boolean;
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
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
