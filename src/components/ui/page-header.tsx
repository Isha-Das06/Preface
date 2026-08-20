import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  titleSlot,
  description,
  actions,
  className,
}: {
  title: string;
  /** Rendered in place of the heading, for pages that own it. */
  titleSlot?: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        {titleSlot ?? (
          <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
        )}
        {description && (
          <p className="measure text-sm text-ink-500">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
