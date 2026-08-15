"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Moment 2 of 5 — the hero demo plays itself.
 *
 * This is deliberately the demo, not a screenshot and not a video.
 * Interactive/moving product UI outperforms video above the fold,
 * it costs nothing to load, there is no third-party embed, and it
 * shows the one thing the whole pitch rests on: a checklist
 * completing itself while the business does nothing.
 *
 * Pauses when scrolled out of view so it isn't burning frames off
 * screen, and freezes on a static 4-of-6 for reduced-motion users.
 */

const STEPS = [
  "Company information",
  "Project questionnaire",
  "Brand assets",
  "Account access",
  "Service agreement",
  "Deposit",
];

const TICK = 1250;
/**
 * A long rest on the completed state before restarting. Without it
 * the loop snaps back every ~9s, and a perpetually twitching element
 * in the hero competes with the CTA for attention — the eye is drawn
 * to motion whether or not you want it there.
 */
const HOLD = 4200;

export function HeroDemo() {
  const [done, setDone] = useState(0);
  const [reduced, setReduced] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      setDone(4);
      return;
    }

    let timer: number | undefined;
    let visible = true;

    let atEnd = false;
    const run = () => {
      timer = window.setTimeout(
        () => {
          if (visible) {
            setDone((d) => {
              const next = d >= STEPS.length ? 0 : d + 1;
              atEnd = next >= STEPS.length;
              return next;
            });
          }
          run();
        },
        atEnd ? HOLD : TICK,
      );
    };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
      },
      { threshold: 0.2 },
    );
    if (ref.current) io.observe(ref.current);

    run();
    return () => {
      window.clearTimeout(timer);
      io.disconnect();
    };
  }, []);

  const complete = done >= STEPS.length;
  const pct = Math.round((done / STEPS.length) * 100);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[300px]">
      {/* Phone frame. A single soft shadow — this genuinely floats
          above the page, which is the one case the design system
          allows elevation. */}
      <div className="portal rounded-[30px] border border-ink-200 bg-ink-100 p-2.5 shadow-lg">
        <div className="flex flex-col gap-5 rounded-[22px] bg-surface p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-md bg-accent-600 text-[11px] font-semibold text-on-accent">
              AA
            </span>
            <span className="text-sm font-medium text-ink-900">
              Acme Agency
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-xl font-semibold text-ink-900">
              {complete ? "All done" : "Welcome back"}
            </p>
            <p className="text-xs text-ink-500">
              <span data-numeric>{done}</span> of{" "}
              <span data-numeric>{STEPS.length}</span> complete
            </p>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-150">
            <div
              className={cn(
                "h-full rounded-full bg-accent-600",
                !reduced && "transition-[width] duration-700 ease-(--ease)",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>

          <ul className="flex flex-col gap-2.5">
            {STEPS.map((title, i) => {
              const isDone = i < done;
              const isCurrent = i === done && !complete;

              return (
                <li key={title} className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border",
                      !reduced &&
                        "transition-colors duration-300 ease-(--ease)",
                      isDone
                        ? "border-accent-600 bg-accent-600"
                        : isCurrent
                          ? "border-accent-600 bg-surface"
                          : "border-ink-200 bg-surface",
                    )}
                  >
                    {isDone && (
                      <Check
                        className={cn(
                          "size-3 text-on-accent",
                          !reduced && "animate-[pop-in_260ms_var(--ease)]",
                        )}
                        strokeWidth={3}
                      />
                    )}
                    {isCurrent && (
                      <span className="size-1.5 rounded-full bg-accent-600" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-xs",
                      !reduced && "transition-colors duration-300",
                      isDone
                        ? "text-ink-500"
                        : isCurrent
                          ? "font-medium text-ink-900"
                          : "text-ink-400",
                    )}
                  >
                    {title}
                  </span>
                </li>
              );
            })}
          </ul>

          <span
            className={cn(
              "flex h-10 items-center justify-center rounded-[6px] text-xs font-medium",
              complete
                ? "bg-accent-100 text-accent-fg"
                : "bg-accent-600 text-on-accent",
            )}
          >
            {complete
              ? "Everything's in"
              : `Continue — ${STEPS[done] ?? STEPS[0]}`}
          </span>
        </div>
      </div>
    </div>
  );
}
