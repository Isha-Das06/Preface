"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type State = "idle" | "saving" | "saved";

/**
 * Onboarding spans days and devices. The client needs constant,
 * quiet proof that leaving the page won't lose their answers —
 * without a banner shouting about it.
 *
 * Watches its subtree for input rather than requiring every field
 * to wire up a callback, so a screen author cannot forget it.
 */
export function SaveIndicator({ className }: { className?: string }) {
  const [state, setState] = useState<State>("idle");
  const timers = useRef<{ save?: number; idle?: number }>({});

  useEffect(() => {
    const onInput = () => {
      window.clearTimeout(timers.current.save);
      window.clearTimeout(timers.current.idle);
      setState("saving");
      // Debounced write, then a lingering "Saved" so the client
      // actually catches it before it fades.
      timers.current.save = window.setTimeout(() => {
        setState("saved");
        timers.current.idle = window.setTimeout(() => setState("idle"), 2500);
      }, 600);
    };

    document.addEventListener("input", onInput);
    return () => {
      document.removeEventListener("input", onInput);
      window.clearTimeout(timers.current.save);
      window.clearTimeout(timers.current.idle);
    };
  }, []);

  return (
    <span
      aria-live="polite"
      className={cn(
        "flex items-center gap-1.5 text-sm text-ink-500 transition-opacity duration-(--dur)",
        state === "idle" ? "opacity-0" : "opacity-100",
        className,
      )}
    >
      {state === "saving" ? (
        <>
          <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />
          Saving
        </>
      ) : (
        <>
          <Check className="size-3.5 text-accent-600" strokeWidth={3} />
          Saved
        </>
      )}
    </span>
  );
}
