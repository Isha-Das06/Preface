import { MobileHeader } from "./nav";
import { PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Consistent page chrome for every business-app screen. */
export function AppPage({
  title,
  titleSlot,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  /** Replaces the heading when the page owns something richer. */
  titleSlot?: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      <MobileHeader title="Preface" />
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-8 px-4 py-6 md:px-6 md:py-8",
          className,
        )}
      >
        <PageHeader
          title={title}
          titleSlot={titleSlot}
          description={description}
          actions={actions}
        />
        {children}
      </div>
    </>
  );
}
