import { cn } from "@/lib/utils";

/**
 * The Preface mark.
 *
 * One component, used by the app sidebar, the marketing header and
 * the footer. There were two identical `Monogram` definitions before
 * — a green tile with a letter P in it — which is how a logo ends up
 * changed in one place and not the other.
 *
 * Drawn rather than a raster file, for three reasons: it stays crisp
 * at every size, it is under a kilobyte, and it has NO background of
 * its own. That last one is what lets it sit on the dark chrome, on
 * white, and in a browser tab without carrying a coloured square
 * around with it — there is no edge to blend, because there is no
 * tile.
 *
 * `glow` puts a soft wash of the accent behind it, which is what
 * reads as "blended into the background" on the dark sidebar. It is
 * off by default: on a light ground it only muddies the mark.
 */
export function Logo({
  className,
  glow = false,
  title = "Preface",
}: {
  className?: string;
  glow?: boolean;
  /** Empty string when a visible wordmark sits next to it. */
  title?: string;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {glow && (
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full bg-accent-500/25 blur-[6px]"
        />
      )}
      <svg
        viewBox="0 0 64 64"
        className="size-full"
        role={title ? "img" : "presentation"}
        aria-hidden={title ? undefined : true}
      >
        {title && <title>{title}</title>}
        <defs>
          {/*
            A unique id per render would be ideal, but this component
            renders the same gradient every time, so a shared id is
            correct and avoids a hydration mismatch from useId.
          */}
          <linearGradient
            id="preface-mark"
            x1="10"
            y1="58"
            x2="52"
            y2="10"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#34d399" />
            <stop offset="0.55" stopColor="#a7e8c8" />
            <stop offset="1" stopColor="#edfbf3" />
          </linearGradient>
        </defs>
        <g
          fill="none"
          stroke="url(#preface-mark)"
          strokeWidth="8.5"
          strokeLinecap="round"
        >
          <circle cx="39" cy="25" r="14.5" />
          <path d="M28.5 11.5 L14 56" />
        </g>
      </svg>
    </span>
  );
}
