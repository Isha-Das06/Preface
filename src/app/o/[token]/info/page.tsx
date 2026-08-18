import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import { InfoForm, type InfoField } from "@/components/portal/info-form";
import { getPortal, stepBySlug } from "@/lib/portal";

/** C2 — Company information. */
export default async function InfoStep({ params }: PageProps<"/o/[token]/info">) {
  const { token } = await params;
  const portal = await getPortal(token);
  if (!portal) redirect(`/o/${token}/expired`);

  const step = stepBySlug(portal, "info");
  if (!step) redirect(`/o/${token}`);

  const fields = (step.config.fields ?? []) as InfoField[];
  const values = (step.data.values ?? {}) as Record<string, string>;

  // Pre-fill from the client record the business already has, so the
  // first two fields are usually already right.
  const seeded: Record<string, string> = {
    company: portal.client.company,
    contact: portal.client.name ?? "",
    email: portal.client.email,
    ...values,
  };

  return (
    <PortalShell business={portal.business} token={token}>
      <InfoForm
        token={token}
        fields={fields}
        values={seeded}
        index={step.displayIndex}
        total={portal.steps.length}
        title={step.title}
        description={step.description ?? undefined}
        saved={Boolean(step.completedAt)}
      />
    </PortalShell>
  );
}
