import { getPortal } from "@/lib/portal";
import { Toaster } from "@/components/ui";

/**
 * The portal is a bearer-token surface: every render is one specific
 * client's data, and none of it may ever be served from a cache to
 * anyone else. Rendering at request time, always, is the cheap way to
 * make that structural rather than a thing to remember.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const portal = await getPortal(token);

  return {
    title: portal
      ? `${portal.business.name} — Getting started`
      : "Getting started",
    // The client's onboarding page must never be indexed.
    robots: { index: false, follow: false },
  };
}

export default async function PortalLayout({
  children,
  params,
}: LayoutProps<"/o/[token]">) {
  const { token } = await params;
  const portal = await getPortal(token);

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
      style={
        portal
          ? ({ "--accent-600": portal.business.accent_color } as React.CSSProperties)
          : undefined
      }
    >
      {children}
      <Toaster portal />
    </div>
  );
}
