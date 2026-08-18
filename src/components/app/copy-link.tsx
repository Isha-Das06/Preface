"use client";

import { Copy } from "lucide-react";
import { Button, toast } from "@/components/ui";

export function CopyLinkButton({ token }: { token: string }) {
  return (
    <Button
      size="sm"
      onClick={() => {
        // Built at click time from the live origin, so the copied
        // link works on localhost, on a LAN IP for phone testing,
        // and in production without any config.
        const url = `${window.location.origin}/o/${token}`;
        navigator.clipboard?.writeText(url).catch(() => {});
        toast.success("Link copied");
      }}
    >
      <Copy className="size-3.5" />
      Copy link
    </Button>
  );
}
