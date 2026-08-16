"use client";

import { AlertCircle, AlertTriangle, Check, Info } from "lucide-react";
import { Toaster as Sonner, toast } from "sonner";

export { toast };

/**
 * Bottom-right in the app, bottom-centre in the portal.
 * Max 3 stacked. Errors persist until dismissed; everything else
 * clears itself after 4s.
 *
 * Meaning is carried by an ICON, not a coloured left edge. Two
 * reasons: a colour-only signal fails for colourblind users, and a
 * 4px accent bar down the side of a card is one of the most
 * reliable tells of AI-generated design there is.
 */
export function Toaster({ portal = false }: { portal?: boolean }) {
  return (
    <Sonner
      position={portal ? "bottom-center" : "bottom-right"}
      visibleToasts={3}
      duration={4000}
      gap={8}
      offset={portal ? 16 : 24}
      icons={{
        success: <Check className="size-4 text-accent-600" strokeWidth={2.5} />,
        error: <AlertCircle className="size-4 text-danger-600" />,
        warning: <AlertTriangle className="size-4 text-warn-600" />,
        info: <Info className="size-4 text-info-600" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: [
            "group flex w-full items-start gap-3 overflow-hidden",
            "rounded-md border border-ink-200 bg-surface shadow-md",
            "px-4 py-3",
          ].join(" "),
          icon: "mt-0.5 shrink-0",
          content: "flex min-w-0 flex-col",
          title: "text-sm font-medium text-ink-900",
          description: "text-sm text-ink-500 mt-0.5",
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
