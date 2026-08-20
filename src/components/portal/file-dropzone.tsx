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
  /** When true the client can send a batch, not just one file. */
  multiple?: boolean;
  uploaded: UploadedFile[];
}

/**
 * Requested-item list rather than a bare "drop files here" box.
 *
 * A generic dropzone puts the burden on the client to work out what
 * the agency wants. Naming each item — and marking which are
 * optional — is the difference between a step that stalls and one
 * that completes.
 *
 * Items marked "allow several" accumulate. That distinction matters:
 * a logo is one file and a second upload should replace it, while
 * "product photography" is never one file, and quietly overwriting
 * each shot as it arrives is the worst of both worlds.
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

  async function uploadOne(key: string, file: File) {
    const ticket = await requestUpload(token, key, file.name, file.size);
    if ("error" in ticket) {
      toast.error("That didn't upload", { description: ticket.error });
      return false;
    }

    const supabase = createStorageClient();
    const { error } = await supabase.storage
      .from(UPLOAD_BUCKET)
      .uploadToSignedUrl(ticket.path, ticket.uploadToken, file);

    if (error) {
      toast.error("That didn't upload", {
        description: `${file.name} didn't finish. Try again.`,
      });
      return false;
    }

    const result = await confirmUpload(token, key, ticket.path, file.name);
    if (result?.error) {
      toast.error("That didn't save", { description: result.error });
      return false;
    }
    return true;
  }

  async function upload(key: string, list: FileList | null) {
    const files = list ? Array.from(list) : [];
    if (files.length === 0 || busy) return;

    setBusy(key);
    try {
      // Sequential on purpose. Each upload needs its own signed URL
      // and the server counts what is already there to enforce the
      // limit; firing them in parallel races that check.
      for (const file of files) {
        const ok = await uploadOne(key, file);
        if (!ok) break;
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
        const has = r.uploaded.length > 0;

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
              has
                ? "border-accent-300 bg-accent-50"
                : dragKey === r.key
                  ? "border-accent-600 bg-accent-50"
                  : "border-ink-200 bg-surface",
            )}
          >
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-2 text-base font-medium text-ink-900">
                {has && (
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
                {r.multiple && " You can send as many as you like."}
              </span>
            </div>

            <input
              ref={(el) => {
                inputs.current[r.key] = el;
              }}
              type="file"
              multiple={r.multiple}
              className="sr-only"
              onChange={(e) => void upload(r.key, e.target.files)}
            />

            {has && (
              <ul className="flex flex-col gap-1.5">
                {r.uploaded.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-2 text-sm text-ink-700"
                  >
                    <File className="size-4 shrink-0 text-ink-400" />
                    <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    <span className="shrink-0 text-ink-500" data-numeric>
                      {f.size}
                    </span>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => remove(r.key, f.id)}
                      aria-label={`Remove ${f.name}`}
                      className="-m-1 shrink-0 rounded p-1 text-ink-400 transition-colors duration-(--dur-fast) hover:text-danger-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus) disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* A batch request keeps its button so more can follow;
                a single one hides it once answered, because the way
                to change that file is to remove it. */}
            {(!has || r.multiple) && (
              <Button
                type="button"
                size="md"
                className="w-fit"
                loading={loading}
                disabled={Boolean(busy)}
                onClick={() => inputs.current[r.key]?.click()}
              >
                <Upload className="size-4" />
                {loading
                  ? "Uploading"
                  : has
                    ? "Add another"
                    : r.multiple
                      ? "Choose files"
                      : "Choose file"}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
