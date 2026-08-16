import { Card, Skeleton } from "@/components/ui";
import { MobileHeader } from "@/components/app/nav";

export default function Loading() {
  return (
    <>
      <MobileHeader title="Preface" />
      <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-9 w-28 rounded-[6px]" />
        </div>

        <Card className="overflow-hidden">
          {/* 48px rows match the real table exactly. */}
          <div className="flex h-10 items-center gap-4 border-b border-ink-150 px-4">
            <Skeleton className="h-3 w-16" />
          </div>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex h-12 items-center gap-4 border-b border-ink-150 px-4 last:border-0"
            >
              <Skeleton className="size-6 shrink-0 rounded-full" />
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="ml-auto h-3.5 w-16" />
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
