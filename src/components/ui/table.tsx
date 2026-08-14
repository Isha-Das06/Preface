import { cn } from "@/lib/utils";

/**
 * No zebra striping, no vertical rules. Horizontal hairlines and
 * alignment do the work — vertical rules on a data table are almost
 * always compensating for bad column spacing.
 *
 * Below 768px these become stacked cards at the usage site rather
 * than scrolling sideways; a data table you have to drag horizontally
 * on a phone is a table nobody reads.
 */
export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn("w-full border-collapse text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function THead({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("", className)} {...props} />;
}

export function TH({
  className,
  numeric,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        "label-caps border-b border-ink-150 px-4 py-2.5 text-left font-medium",
        numeric && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export function TBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("", className)} {...props} />;
}

export function TR({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean }) {
  return (
    <tr
      className={cn(
        "border-b border-ink-150 last:border-0",
        interactive &&
          "cursor-pointer transition-colors duration-(--dur-fast) hover:bg-ink-50",
        className,
      )}
      {...props}
    />
  );
}

export function TD({
  className,
  numeric,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={cn(
        "h-12 px-4 align-middle text-ink-900",
        numeric && "text-right tabular-nums",
        className,
      )}
      {...props}
    />
  );
}
