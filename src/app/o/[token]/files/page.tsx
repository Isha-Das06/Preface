import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import { StepFrame } from "@/components/portal/step-frame";
import { FileDropzone } from "@/components/portal/file-dropzone";
import { getPortal, getStepFiles, nextSlugAfter, stepBySlug } from "@/lib/portal";

interface ConfigRequest {
  key: string;
  label: string;
  hint: string;
  required: boolean;
}

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** C4 — File upload. Storage itself lands in Goal 9. */
export default async function FilesStep({
  params,
}: PageProps<"/o/[token]/files">) {
  const { token } = await params;
  const portal = await getPortal(token);
  if (!portal) redirect(`/o/${token}/expired`);

  const step = stepBySlug(portal, "files");
  if (!step) redirect(`/o/${token}`);

  const requests = (step.config.requests ?? []) as ConfigRequest[];
  const uploaded = await getStepFiles(step.id);
  const next = nextSlugAfter(portal, "files");

  return (
    <PortalShell business={portal.business} token={token}>
      <StepFrame
        token={token}
        index={step.displayIndex}
        total={portal.steps.length}
        title={step.title}
        description={step.description ?? undefined}
        continueHref={next ? `/o/${token}/${next}` : `/o/${token}/done`}
        footerNote="Up to 25 MB per file. If something is missing, you can continue and add it later."
      >
        <FileDropzone
          requests={requests.map((r) => {
            const file = uploaded.find((f) => f.request_key === r.key);
            return {
              ...r,
              uploaded: file
                ? { name: file.filename, size: humanSize(file.size_bytes) }
                : null,
            };
          })}
        />
      </StepFrame>
    </PortalShell>
  );
}
