import { MobileNav, Sidebar } from "@/components/app/nav";
import { Toaster, TooltipProvider } from "@/components/ui";
import { getBusiness, getClients } from "@/lib/queries";

const PLAN_LIMITS: Record<string, number | null> = {
  trial: 5,
  solo: 5,
  studio: 25,
  agency: null, // unlimited
};

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const [business, clients] = await Promise.all([getBusiness(), getClients()]);
  const active = clients.filter((c) => c.status !== "completed").length;

  return (
    <TooltipProvider>
      <div className="flex min-h-dvh">
        <Sidebar
          businessName={business?.name ?? "Your business"}
          plan={business?.plan ?? "trial"}
          activeCount={active}
          activeLimit={PLAN_LIMITS[business?.plan ?? "trial"] ?? null}
        />
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
