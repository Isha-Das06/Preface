"use client";

import { Copy } from "lucide-react";
import { Button, toast } from "@/components/ui";

export function CopyLinkButton() {
  return (
    <Button
      size="sm"
      onClick={() => {
        navigator.clipboard
          ?.writeText("https://app.preface.co/o/k3Xm9pQr2LwTv8Bn")
          .catch(() => {});
        toast.success("Link copied");
      }}
    >
      <Copy className="size-3.5" />
      Copy link
    </Button>
  );
}
