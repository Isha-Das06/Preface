"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Users, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, Logo } from "@/components/ui";
import { SignOutButton } from "./sign-out";

/**
 * Clients is first and is the app root.
 *
 * There used to be a separate "Waiting on" page above it — the same
 * clients, sorted by who had been stuck longest, with the nudge
 * button on each row. Two entries showing overlapping data, and the
 * word "waiting" appearing three times in the nav, the filters and a
 * column heading. The queue's one real advantage was that the chase
 * lived next to the client; that button now lives in this table, so
 * the page had nothing left of its own.
 */
const NAV: {
  href: string;
  label: string;
  icon: typeof Users;
  exact?: boolean;
}[] = [
  { href: "/app/clients", label: "Clients", icon: Users },
  { href: "/app/workflow", label: "Workflow", icon: Workflow },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);
}

export function Sidebar({
  businessName,
  activeCount,
}: {
  businessName: string;
  activeCount: number;
}) {
  const isActive = useIsActive();

  return (
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-ink-200 bg-surface md:flex">
      {/* The mark goes home, the way every logo in every app does.
          Home for someone signed in is their client list, not the
          marketing page they have already bought. */}
      <Link
        href="/app/clients"
        aria-label="Preface home"
        className="flex items-center gap-2.5 rounded-[6px] px-5 py-5 transition-opacity duration-(--dur-fast) hover:opacity-80 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--focus)"
      >
        <Logo className="size-7" glow title="" />
        <span className="text-base font-semibold text-ink-900">Preface</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-sm",
                "transition-colors duration-(--dur-fast)",
                active
                  ? "bg-ink-100 font-medium text-ink-900"
                  : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)",
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

      <div className="flex items-center gap-2.5 border-t border-ink-150 px-4 py-3.5">
        <Avatar name={businessName} size="sm" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-ink-900">
            {businessName}
          </span>
          <span className="truncate text-xs text-ink-500">
            <span data-numeric>{activeCount}</span> active
          </span>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}

export function MobileNav() {
  const isActive = useIsActive();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex border-t border-ink-200 bg-surface md:hidden",
        // Clears the iOS home indicator.
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact);
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

export function MobileHeader({ title }: { title: string }) {
  return (
    <header className="flex items-center gap-2.5 border-b border-ink-200 bg-surface px-4 py-3 md:hidden">
      <Logo className="size-7" glow title="" />
      <span className="text-base font-semibold text-ink-900">{title}</span>
    </header>
  );
}

export { NAV };
