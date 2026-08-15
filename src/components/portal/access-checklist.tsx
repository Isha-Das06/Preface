"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
 */
export function AccessChecklist({ items }: { items: ChecklistItem[] }) {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(items.map((i) => [i.key, i.done])),
  );

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
                onChange={(e) =>
                  setState((p) => ({ ...p, [item.key]: e.target.checked }))
                }
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[4px] border",
                  "transition-colors duration-(--dur-fast)",
                  done
                    ? "border-accent-600 bg-accent-600"
                    : "border-ink-300 bg-surface",
                )}
              >
                {done && (
                  <Check className="size-3.5 text-on-accent" strokeWidth={3} />
                )}
              </span>

              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-base font-medium text-ink-900">
                  {item.label}
                  {!item.required && (
                    <span className="ml-2 text-sm font-normal text-ink-500">
                      Optional
                    </span>
                  )}
                </span>
                <span className="text-sm text-ink-600">{item.instruction}</span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
