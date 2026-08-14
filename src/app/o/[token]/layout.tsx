import { business } from "@/lib/mock";
import { Toaster } from "@/components/ui";

export const metadata = {
  title: `${business.name} — Getting started`,
  // The client's onboarding page must never be indexed.
  robots: { index: false, follow: false },
};

export default function PortalLayout({
  children,
}: LayoutProps<"/o/[token]">) {
  return (
    /**
     * .portal is applied here, server-side, so it is present at first
     * paint — the density and light-palette pin never flash.
     *
     * The business's accent replaces --accent-600 for this subtree
     * only. It is scoped to the accent alone: a customer picking a
     * near-white brand colour must not be able to make their own
     * client's text unreadable, so neutrals and semantics stay ours.
     */
    <div
      className="portal"
      style={{ "--accent-600": business.accentColor } as React.CSSProperties}
    >
      {children}
      <Toaster portal />
    </div>
  );
}
