import { PortalShell } from "@/components/portal/portal-shell";
import { StepFrame } from "@/components/portal/step-frame";
import { FileDropzone } from "@/components/portal/file-dropzone";
import { business, fileRequests, stepBySlug, steps } from "@/lib/mock";

/** C4 — File upload. */
export default function FilesStep() {
  const step = stepBySlug("files")!;
  const index = steps.findIndex((s) => s.slug === "files") + 1;

  return (
    <PortalShell business={business}>
      <StepFrame
        index={index}
        total={steps.length}
        title={step.title}
        description={step.description}
        continueHref="/o/demo/access"
        footerNote="Up to 25 MB per file. If something is missing, you can continue and add it later."
      >
        <FileDropzone requests={fileRequests} />
      </StepFrame>
    </PortalShell>
  );
}
