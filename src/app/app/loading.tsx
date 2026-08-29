import { Card, CardBody, Skeleton } from "@/components/ui";

/**
 * Shown the instant a link in the app is clicked.
 *
 * Every page here is a server component that waits on the database
 * before it can render anything, and from Dhaka to a database in
 * Virginia that is most of a second before the first pixel changes.
 * Without this file the browser simply sits on the old page, so the
 * click reads as ignored and people click again.
 *
 * It does not make anything faster. It makes the app answer
 * immediately, which is the part that was missing — the sidebar and
 * the chrome stay put, and only the region that is actually changing
 * shows that it is working.
 *
 * Deliberately one file at the /app level rather than one per route:
 * a calm, roughly page-shaped placeholder reads better than four
 * bespoke skeletons pretending to know exactly what is coming.
 */
export default function AppLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>

      <Card>
        <CardBody className="flex flex-col gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-8 w-24 shrink-0" />
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
