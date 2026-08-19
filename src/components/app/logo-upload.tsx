"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Upload } from "lucide-react";
import { Button, toast } from "@/components/ui";
import { createStorageClient } from "@/lib/supabase/browser";
import {
  confirmLogo,
  removeLogo,
  requestLogoUpload,
} from "@/lib/logo-actions";

const BUCKET = "business-logos";
const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";

/**
 * Logo picker, shared by first-run and Settings.
 *
 * On /welcome there is no business yet, so the uploaded URL is held
 * in a hidden field and saved with the rest of the form. In Settings
 * a business exists, so confirmLogo writes it immediately and this
 * just reflects what happened.
 */
export function LogoUpload({
  initialUrl = null,
  businessName,
  /** Set on /welcome, where the URL rides along with the form. */
  fieldName,
}: {
  initialUrl?: string | null;
  businessName: string;
  fieldName?: string;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const monogram = businessName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  function choose(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    start(async () => {
      const ticket = await requestLogoUpload(file.type, file.size);
      if ("error" in ticket) {
        toast.error("Couldn't upload that", { description: ticket.error });
        return;
      }

      const supabase = createStorageClient();
      const { error } = await supabase.storage
        .from(BUCKET)
        .uploadToSignedUrl(ticket.path, ticket.uploadToken, file);

      if (error) {
        toast.error("Couldn't upload that", {
          description: "The transfer didn't finish. Try again.",
        });
        return;
      }

      const saved = await confirmLogo(ticket.path);
      if ("error" in saved) {
        toast.error("Couldn't save that", { description: saved.error });
        return;
      }

      setUrl(saved.url);
      if (input.current) input.current.value = "";
      router.refresh();
    });
  }

  function clear() {
    start(async () => {
      // During first run there is nothing stored yet, so dropping the
      // local value is the whole job.
      if (fieldName && !initialUrl) {
        setUrl(null);
        return;
      }
      const result = await removeLogo();
      if (result.error) {
        toast.error("Couldn't remove that", { description: result.error });
        return;
      }
      setUrl(null);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-4">
      {fieldName && <input type="hidden" name={fieldName} value={url ?? ""} />}

      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-ink-200 bg-surface">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="size-full object-contain p-1"
          />
        ) : (
          <span className="text-sm font-semibold text-ink-500">
            {monogram || "?"}
          </span>
        )}
      </span>

      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => choose(e.target.files)}
      />

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="md"
          loading={pending}
          onClick={() => input.current?.click()}
        >
          <Upload className="size-4" />
          {url ? "Replace" : "Upload logo"}
        </Button>

        {url && (
          <Button
            type="button"
            size="md"
            variant="ghost"
            disabled={pending}
            onClick={clear}
          >
            <Trash2 className="size-4" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
