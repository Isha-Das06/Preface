"use client";

import { useActionState } from "react";
import { StepFrame } from "./step-frame";
import { FileDropzone, type FileRequest } from "./file-dropzone";
import { continueFromFiles, type PortalResult } from "@/lib/portal-actions";

/** C4 — File upload. */
export function FilesForm({
  token,
  requests,
  index,
  total,
  title,
  description,
  saved,
}: {
  token: string;
  requests: FileRequest[];
  index: number;
  total: number;
  title: string;
  description?: string;
  saved: boolean;
}) {
  const [state, formAction] = useActionState(
    async () => continueFromFiles(token),
    undefined as PortalResult,
  );

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <StepFrame
        token={token}
        index={index}
        total={total}
        title={title}
        description={description}
        continueSubmit
        saved={saved}
        error={state?.error}
        footerNote="Up to 25 MB per file. Anything optional can wait — you can come back and add it later."
      >
        <FileDropzone token={token} requests={requests} />
      </StepFrame>
    </form>
  );
}
