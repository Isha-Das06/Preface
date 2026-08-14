import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Business } from "@/lib/mock";

/**
 * The portal's outer frame.
 *
 * Deliberately absent: navigation, footer links, a "powered by"
 * badge, any Preface branding at all. The client is a guest of the
 * agency, not a user of our product — the moment they notice the
 * SaaS underneath, the illusion that this is "the agency's
 * onboarding page" breaks.
 *
 * The .portal class comes from the route layout, not from here, so
 * it is present at first paint and never causes a flash.
 */

function Monogram({ name }: { name: string }) {
  const letters = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <span className="flex size-9 items-center justify-center rounded-md bg-accent-600 text-sm font-semibold text-on-accent">
      {letters}
    </span>
  );
}

export function PortalHeader({
  business,
  href = "/o/demo",
}: {
  business: Business;
  href?: string;
}) {
  return (
    <header className="flex items-center gap-3 py-6">
      <Link
        href={href}
        // -mx-2/px-2 keeps the logo optically flush with the content
        // edge while giving the link a 44px touch target.
        className="-mx-2 flex min-h-11 items-center gap-3 rounded-md px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)"
      >
        {business.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logoUrl}
            alt={business.name}
            className="h-9 w-auto max-w-[160px] object-contain"
          />
        ) : (
          <Monogram name={business.name} />
        )}
        <span className="text-base font-medium text-ink-900">
          {business.name}
        </span>
      </Link>
    </header>
  );
}

export function PortalShell({
  business,
  children,
  wide = false,
}: {
  business: Business;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-dvh">
      <div
        className={cn(
          "mx-auto flex min-h-dvh flex-col px-4 pb-16 sm:px-6",
          // 560px cap: comfortable reading measure on desktop, and
          // the agreement gets a little more room.
          wide ? "max-w-[680px]" : "max-w-[560px]",
        )}
      >
        <PortalHeader business={business} />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
