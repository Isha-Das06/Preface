import { MobileNav, Sidebar } from "@/components/app/nav";
import { Toaster, TooltipProvider } from "@/components/ui";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <TooltipProvider>
      <div className="flex min-h-dvh">
        <Sidebar />
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
