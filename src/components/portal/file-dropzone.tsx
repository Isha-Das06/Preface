import { Check, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { PendingButton } from "@/components/ui";

export interface FileRequest {
  key: string;
  label: string;
  hint: string;
  required: boolean;
  uploaded: { name: string; size: string } | null;
}

/**
 * Requested-item list rather than a bare "drop files here" box.
 *
 * A generic dropzone puts the burden on the client to work out what
 * the agency wants. Naming each item — and marking which are
 * optional — is the difference between a step that stalls and one
 * that completes.
 *
 * Uploading is Goal 9. Until storage is connected the control is
 * explicitly pending rather than a dropzone that accepts a file into
 * React state and loses it on navigate: a client who believes they
 * have sent their logo and a business who never receives it is worse
 * than a button that says "not yet".
 */
export function FileDropzone({ requests }: { requests: FileRequest[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {requests.map((r) => (
        <li
          key={r.key}
          className={cn(
            "flex flex-col gap-3 rounded-(--radius-card) border p-4",
            r.uploaded
              ? "border-accent-300 bg-accent-50"
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
            <span className="measure-prose text-sm text-ink-600">{r.hint}</span>
          </div>

          {r.uploaded ? (
            <span className="flex items-center gap-2 text-sm text-ink-700">
              <File className="size-4 shrink-0 text-ink-400" />
              <span className="truncate">{r.uploaded.name}</span>
              <span className="shrink-0 text-ink-500" data-numeric>
                {r.uploaded.size}
              </span>
            </span>
          ) : (
            <PendingButton
              className="w-fit"
              reason="Available once file storage is connected"
            >
              Upload {r.label.toLowerCase()}
            </PendingButton>
          )}
        </li>
      ))}
    </ul>
  );
}
