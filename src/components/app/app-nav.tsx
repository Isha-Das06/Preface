"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Settings, SlidersHorizontal, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Four destinations, and "Waiting on" is first because it is the
 * home screen. A client list is a filing cabinet — nobody opens a
 * filing cabinet daily. "What am I waiting on" is the thing that
 * brings a business back, so it gets the default route.
 */
const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/app", label: "Waiting on", icon: Inbox },
  { href: "/app/clients", label: "Clients", icon: Users },
  { href: "/app/workflow", label: "Onboarding", icon: SlidersHorizontal },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

function Monogram() {
  return (
    <span className="flex size-7 items-center justify-center rounded-md bg-accent-600 text-xs font-semibold text-on-accent">
      P
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-6 border-r border-ink-150 px-3 py-5 md:flex">
      <Link
        href="/app"
        className="flex items-center gap-2.5 px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)"
      >
        <Monogram />
        <span className="text-base font-semibold text-ink-900">Preface</span>
      </Link>

      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm",
                "transition-colors duration-(--dur-fast)",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)",
                active
                  ? "bg-ink-100 font-medium text-ink-900"
                  : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  active ? "text-accent-600" : "text-ink-400",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex border-t border-ink-150 bg-surface md:hidden",
        // Keeps the bar clear of the iOS home indicator.
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs",
              active ? "font-medium text-accent-600" : "text-ink-500",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
