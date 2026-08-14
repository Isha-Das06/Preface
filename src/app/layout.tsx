import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/**
 * Plus Jakarta Sans — geometric-humanist, warm, distinctive at UI sizes.
 * JetBrains Mono — only where digits must align (amounts, IDs, dates).
 *
 * next/font self-hosts these at build time and generates size-adjusted
 * fallback metrics, so there is no layout shift and no external request.
 */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
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
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
