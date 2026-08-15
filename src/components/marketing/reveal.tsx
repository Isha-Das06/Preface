"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Moment 1 of 5 — section reveal.
 *
 * IntersectionObserver rather than a scroll-linked timeline: a
 * scroll-driven animation fights the user's scrolling and feels
 * sticky. This fires once, then gets out of the way.
 *
 * Only opacity and transform move, so it never triggers layout.
 * prefers-reduced-motion collapses it to an instant show — handled
 * in CSS so there is no flash of hidden content.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  /** ms — used to stagger siblings. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If the browser can't observe, or the user opted out of motion,
    // show immediately rather than risk content never appearing.
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      // Fire slightly before it reaches the viewport so the motion
      // is already settling by the time the reader looks at it.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    io.observe(el);

    /**
     * Failsafe. Content must never depend on an observer firing to
     * become visible — a zero-size container, a background tab or a
     * quirky browser would otherwise leave the page blank forever.
     * Long enough that it never pre-empts a real scroll reveal.
     */
    const failsafe = window.setTimeout(() => setShown(true), 2500);

    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      /**
       * Opacity and transform are driven by inline style rather than
       * class variants. The component already owns this state, and
       * inline styles sit above the cascade entirely — no chance of a
       * utility, a layer or a specificity collision silently pinning
       * the page at opacity 0, which is a blank-page failure mode.
       */
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(16px)",
        transition:
          "opacity 500ms var(--ease), transform 500ms var(--ease)",
        transitionDelay: `${delay}ms`,
        willChange: shown ? undefined : "opacity, transform",
      }}
      className={cn("motion-reduce:!transform-none", className)}
    >
      {children}
    </Tag>
  );
}
