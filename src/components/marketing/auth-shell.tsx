import Link from "next/link";

/**
 * Shared frame for login and signup. Deliberately narrow and quiet —
 * these screens exist to be got through, not read.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[400px] flex-col gap-7 px-5 py-16 sm:py-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
        {subtitle && <p className="text-base text-ink-500">{subtitle}</p>}
      </div>

      {children}

      <p className="text-sm text-ink-500">{footer}</p>
    </div>
  );
}

export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="font-medium text-accent-600 underline underline-offset-2 hover:text-accent-700"
    >
      {children}
    </Link>
  );
}
