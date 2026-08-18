"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, File, Loader2, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, toast } from "@/components/ui";
import { createStorageClient, UPLOAD_BUCKET } from "@/lib/supabase/browser";
import { confirmUpload, removeUpload, requestUpload } from "@/lib/portal-actions";

export interface UploadedFile {
  id: string;
  name: string;
  size: string;
}

export interface FileRequest {
  key: string;
  label: string;
  hint: string;
  required: boolean;
  uploaded: UploadedFile | null;
}

/**
 * Requested-item list rather than a bare "drop files here" box.
 *
 * A generic dropzone puts the burden on the client to work out what
 * the agency wants. Naming each item — and marking which are
 * optional — is the difference between a step that stalls and one
 * that completes.
 *
 * The file goes browser → storage directly, using a one-shot URL the
 * server hands back. Nothing is recorded until storage confirms the
 * object exists, so a dropped connection leaves no phantom file the
 * business will go looking for.
 */
export function FileDropzone({
  token,
  requests,
}: {
  token: string;
  requests: FileRequest[];
}) {
  const router = useRouter();
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function upload(key: string, list: FileList | null) {
    const file = list?.[0];
    if (!file || busy) return;

    setBusy(key);
    try {
      const ticket = await requestUpload(token, key, file.name, file.size);
      if ("error" in ticket) {
        toast.error("That didn't upload", { description: ticket.error });
        return;
      }

      const supabase = createStorageClient();
      const { error } = await supabase.storage
        .from(UPLOAD_BUCKET)
        .uploadToSignedUrl(ticket.path, ticket.uploadToken, file);

      if (error) {
        toast.error("That didn't upload", {
          description: "The transfer didn't finish. Try again.",
        });
        return;
      }

      const result = await confirmUpload(token, key, ticket.path, file.name);
      if (result?.error) {
        toast.error("That didn't save", { description: result.error });
        return;
      }

      startTransition(() => router.refresh());
    } finally {
      setBusy(null);
      if (inputs.current[key]) inputs.current[key]!.value = "";
    }
  }

  function remove(key: string, fileId: string) {
    setBusy(key);
    startTransition(async () => {
      const result = await removeUpload(token, fileId);
      setBusy(null);
      if (result?.error) {
        toast.error("Couldn't remove that", { description: result.error });
        return;
      }
      router.refresh();
    });
  }

  return (
    <ul className="flex flex-col gap-3">
      {requests.map((r) => {
        const loading = busy === r.key;

        return (
          <li
            key={r.key}
            onDragOver={(e) => {
              e.preventDefault();
              setDragKey(r.key);
            }}
            onDragLeave={() => setDragKey(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragKey(null);
              void upload(r.key, e.dataTransfer.files);
            }}
            className={cn(
              "flex flex-col gap-3 rounded-(--radius-card) border p-4",
              "transition-colors duration-(--dur-fast)",
              r.uploaded
                ? "border-accent-300 bg-accent-50"
                : dragKey === r.key
                  ? "border-accent-600 bg-accent-50"
                  : "border-ink-200 bg-surface",
            )}
          >
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-2 text-base font-medium text-ink-900">
                {r.uploaded && (
                  <Check className="size-4 text-accent-600" strokeWidth={3} />
                )}
                {r.label}
                {!r.required && (
                  <span className="text-sm font-normal text-ink-500">
                    Optional
                  </span>
                )}
              </span>
              <span className="measure-prose text-sm text-ink-600">
                {r.hint}
              </span>
            </div>

            <input
              ref={(el) => {
                inputs.current[r.key] = el;
              }}
              type="file"
              className="sr-only"
              onChange={(e) => void upload(r.key, e.target.files)}
            />

            {r.uploaded ? (
              <div className="flex items-center gap-2 text-sm text-ink-700">
                <File className="size-4 shrink-0 text-ink-400" />
                <span className="min-w-0 flex-1 truncate">
                  {r.uploaded.name}
                </span>
                <span className="shrink-0 text-ink-500" data-numeric>
                  {r.uploaded.size}
                </span>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => remove(r.key, r.uploaded!.id)}
                  aria-label={`Remove ${r.uploaded.name}`}
                  className="-m-1 shrink-0 rounded p-1 text-ink-400 transition-colors duration-(--dur-fast) hover:text-danger-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus) disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              </div>
            ) : (
              <Button
                type="button"
                size="md"
                className="w-fit"
                loading={loading}
                disabled={Boolean(busy)}
                onClick={() => inputs.current[r.key]?.click()}
              >
                <Upload className="size-4" />
                {loading ? "Uploading" : `Choose file`}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
