import { redirect } from "next/navigation";
import { FilesForm } from "@/components/portal/files-form";
import { PortalShell } from "@/components/portal/portal-shell";
import { getPortal, getStepFiles, stepBySlug } from "@/lib/portal";

interface ConfigRequest {
  key: string;
  label: string;
  hint: string;
  required: boolean;
  multiple?: boolean;
}

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** C4 — File upload. */
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

  return (
    <PortalShell business={portal.business} token={token}>
      <FilesForm
        token={token}
        index={step.displayIndex}
        total={portal.steps.length}
        title={step.title}
        description={step.description ?? undefined}
        saved={Boolean(step.completedAt)}
        requests={requests.map((r) => ({
          ...r,
          // Always a list, even for single requests — one shape for
          // the client to render beats two nearly-identical ones.
          uploaded: uploaded
            .filter((f) => f.request_key === r.key)
            .map((f) => ({
              id: f.id,
              name: f.filename,
              size: humanSize(f.size_bytes),
            })),
        }))}
      />
    </PortalShell>
  );
}
