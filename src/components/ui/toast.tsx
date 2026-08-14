"use client";

import { Toaster as Sonner, toast } from "sonner";

export { toast };

/**
 * Bottom-right in the app, bottom-centre in the portal.
 * Max 3 stacked. Errors persist until dismissed; everything else
 * clears itself after 4s.
 */
export function Toaster({ portal = false }: { portal?: boolean }) {
  return (
    <Sonner
      position={portal ? "bottom-center" : "bottom-right"}
      visibleToasts={3}
      duration={4000}
      gap={8}
      offset={portal ? 16 : 24}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: [
            "group flex w-full items-start gap-3 overflow-hidden",
            "rounded-md border border-ink-200 bg-surface shadow-md",
            "py-3 pr-3 pl-4",
            // 4px semantic edge, coloured per type below.
            "border-l-4 border-l-ink-300",
          ].join(" "),
          title: "text-sm font-medium text-ink-900",
          description: "text-sm text-ink-500 mt-0.5",
          success: "border-l-accent-600",
          error: "border-l-danger-600",
          warning: "border-l-warn-600",
          info: "border-l-info-600",
          actionButton:
            "ml-auto shrink-0 rounded-[6px] bg-accent-600 px-2.5 py-1 text-xs font-medium text-on-accent",
          cancelButton:
            "ml-auto shrink-0 rounded-[6px] border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-700",
          closeButton:
            "border border-ink-200 bg-surface text-ink-500 hover:text-ink-900",
        },
      }}
    />
  );
}
