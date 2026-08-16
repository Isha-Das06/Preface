import { Card, CardBody, Skeleton } from "@/components/ui";
import { MobileHeader } from "@/components/app/nav";

/**
 * Dimensions deliberately mirror the real waiting-on card (110px
 * tall, same internal rhythm) so nothing jumps when data lands.
 * A skeleton that doesn't match its content trades one bad
 * experience for another.
 */
export default function Loading() {
  return (
    <>
      <MobileHeader title="Preface" />
      <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-28 rounded-[6px]" />
        </div>

        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardBody className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3.5 w-52" />
                    <Skeleton className="mt-1 h-1.5 w-28 rounded-full" />
                  </div>
                </div>
                <div className="hidden gap-2 sm:flex">
                  <Skeleton className="h-7 w-20 rounded-[6px]" />
                  <Skeleton className="h-7 w-16 rounded-[6px]" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
