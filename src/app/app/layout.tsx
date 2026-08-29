import { redirect } from "next/navigation";
import { MobileNav, Sidebar } from "@/components/app/nav";
import { Toaster, TooltipProvider } from "@/components/ui";
import { getActiveCount, getBusiness } from "@/lib/queries";

/**
 * No plan, no seat limit, nothing to pay. Preface is free while it is
 * in beta, and a product that shows you a quota it never enforces is
 * just an advert for a bill that does not exist yet. The `plan` and
 * `trial_ends_at` columns stay on the row for the day billing lands.
 */

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const business = await getBusiness();

  // No business means first run never finished — there is no tenant,
  // so RLS matches nothing and every screen renders an empty state
  // that no button can fix. Send them back to finish rather than
  // showing a shell captioned "Your business" that does not work.
  if (!business) redirect("/welcome");

  const active = await getActiveCount();

  return (
    <TooltipProvider>
      <div className="flex min-h-dvh">
        <Sidebar businessName={business.name} activeCount={active} />
        {/* pb-20 on mobile clears the fixed bottom nav. */}
        <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
          {children}
        </div>
        <MobileNav />
      </div>
      <Toaster />
    </TooltipProvider>
  );
}
