"use client";

import { useRef, useState } from "react";
import { Check, File, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

export interface FileRequest {
  key: string;
  label: string;
  hint: string;
  required: boolean;
  uploaded: { name: string; size: string } | null;
}

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Requested-item list rather than a bare "drop files here" box.
 *
 * A generic dropzone puts the burden on the client to work out what
 * the agency wants. Naming each item — and marking which are
 * optional — is the difference between a step that stalls and one
 * that completes.
 */
export function FileDropzone({ requests }: { requests: FileRequest[] }) {
  const [files, setFiles] = useState<Record<string, { name: string; size: string } | null>>(
    Object.fromEntries(requests.map((r) => [r.key, r.uploaded])),
  );
  const [dragKey, setDragKey] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  function accept(key: string, list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    setFiles((prev) => ({
      ...prev,
      [key]: { name: f.name, size: humanSize(f.size) },
    }));
  }

  return (
    <ul className="flex flex-col gap-3">
      {requests.map((r) => {
        const file = files[r.key];
        const dragging = dragKey === r.key;

        return (
          <li key={r.key}>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragKey(r.key);
              }}
              onDragLeave={() => setDragKey(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragKey(null);
                accept(r.key, e.dataTransfer.files);
              }}
              className={cn(
                "flex flex-col gap-3 rounded-(--radius-card) border p-4 transition-colors duration-(--dur-fast)",
                file
                  ? "border-ink-200 bg-surface"
                  : "border-dashed border-ink-300 bg-ink-50",
                dragging && "border-accent-600 bg-accent-50",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-base font-medium text-ink-900">
                    {file && (
                      <Check
                        className="size-4 shrink-0 text-accent-600"
                        strokeWidth={3}
                      />
                    )}
                    {r.label}
                  </span>
                  <span className="text-sm text-ink-500">
                    {r.required ? "Required" : "Optional"} · {r.hint}
                  </span>
                </div>
              </div>

              {file ? (
                <div className="flex items-center gap-3 rounded-md bg-ink-100 px-3 py-2.5">
                  <File className="size-4 shrink-0 text-ink-500" />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-900">
                    {file.name}
                  </span>
                  <span className="shrink-0 text-sm text-ink-500" data-numeric>
                    {file.size}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((p) => ({ ...p, [r.key]: null }))
                    }
                    // -my-2 keeps the row visually tight while the hit
                    // area stays a full 44px for thumbs.
                    className="-my-2 flex size-11 shrink-0 items-center justify-center rounded-[4px] text-ink-500 transition-colors hover:bg-ink-150 hover:text-danger-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)"
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Remove {file.name}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={() => inputs.current[r.key]?.click()}
                  >
                    <Upload className="size-4" />
                    Choose file
                  </Button>
                  <span className="hidden text-sm text-ink-500 sm:inline">
                    or drag it here
                  </span>
                </div>
              )}

              <input
                ref={(el) => {
                  inputs.current[r.key] = el;
                }}
                type="file"
                className="sr-only"
                // capture lets a phone offer the camera directly,
                // which is how half these uploads actually happen.
                onChange={(e) => accept(r.key, e.target.files)}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
