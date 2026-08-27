import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

/**
 * Fonts are BUNDLED, not fetched from Google at build time.
 *
 * next/font/google downloads on every cold build, so a flaky
 * connection silently swaps in a fallback face and the design
 * degrades without anyone noticing — which is exactly what happened
 * here once. Local files make the build deterministic and offline-
 * safe, and cost 168 KB in the repo.
 *
 * Latin subset only. Google serves several unicode-range subsets;
 * shipping all of them would triple the weight for glyphs this
 * product never renders.
 */

const jakarta = localFont({
  variable: "--font-jakarta",
  display: "swap",
  // Metrics from the real face, so the fallback occupies near-
  // identical space and there is no layout shift on swap.
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
  src: [
    { path: "./fonts/PlusJakartaSans-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/PlusJakartaSans-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/PlusJakartaSans-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/PlusJakartaSans-600.woff2", weight: "600", style: "normal" },
  ],
});

const jetbrains = localFont({
  variable: "--font-jetbrains",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
  src: [
    { path: "./fonts/JetBrainsMono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/JetBrainsMono-500.woff2", weight: "500", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: {
    default: "Preface — Stop sending new clients five different links",
    template: "%s · Preface",
  },
  description:
    "One link collects everything you need before work starts — information, files, contract, deposit, kickoff call. You watch it fill in.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${jetbrains.variable} h-full antialiased`}
      /**
       * Browser extensions stamp attributes onto <html> and <body>
       * before React hydrates — accessibility tools, password
       * managers, dark-mode helpers all do it. The server never
       * rendered those attributes, so React reports a mismatch it
       * says it will not patch up, and the real console gets buried
       * under a warning about a page that is in fact correct.
       *
       * This suppresses the warning ONE LEVEL DEEP: this element's
       * own attributes, and nothing inside it. A genuine mismatch in
       * any component still reports normally, which is the point —
       * silencing the whole tree would have hidden the dnd-kit id
       * bug that took a session to find.
       */
      suppressHydrationWarning
    >
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
