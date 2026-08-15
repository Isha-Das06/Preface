import Link from "next/link";
import { Button } from "@/components/ui";

function Monogram() {
  return (
    <span className="flex size-7 items-center justify-center rounded-md bg-accent-600 text-xs font-semibold text-on-accent">
      P
    </span>
  );
}

export default function MarketingLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <div className="marketing flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-ink-150 bg-ink-50/85 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between gap-4 px-5">
          <Link
            href="/"
            // -mx-2/px-2 keeps the logo optically flush while giving
            // the link a full-height touch target.
            className="-mx-2 flex min-h-11 items-center gap-2.5 rounded-md px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)"
          >
            <Monogram />
            <span className="text-lg font-semibold text-ink-900">Preface</span>
          </Link>

          {/* size defaults to md, which is 44px inside .marketing.
              A 28px tap target in a mobile header is a miss. */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild variant="primary">
              <Link href="/signup">Start free</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-ink-150">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Monogram />
            <span className="text-sm text-ink-500">
              Preface — onboard clients without the back-and-forth.
            </span>
          </div>
          <div className="-mx-2 flex items-center gap-2 text-sm text-ink-500">
            <Link
              href="/pricing"
              className="flex min-h-11 items-center rounded-md px-2 hover:text-ink-900"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="flex min-h-11 items-center rounded-md px-2 hover:text-ink-900"
            >
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
