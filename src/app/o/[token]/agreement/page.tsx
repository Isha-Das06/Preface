import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import {
  AgreementForm,
  type AgreementSection,
} from "@/components/portal/agreement-form";
import { getPortal, getSignature, stepBySlug } from "@/lib/portal";

/** C5 — Agreement. Gated behind email verification. */
export default async function AgreementStep({
  params,
}: PageProps<"/o/[token]/agreement">) {
  const { token } = await params;
  const portal = await getPortal(token);
  if (!portal) redirect(`/o/${token}/expired`);

  const step = stepBySlug(portal, "agreement");
  if (!step) redirect(`/o/${token}`);
  if (step.lockedReason) redirect(`/o/${token}`);

  // A forwarded link must not reach a contract.
  if (!portal.verified) redirect(`/o/${token}/verify`);

  const body = step.config.body;
  const sections = Array.isArray(body) ? (body as AgreementSection[]) : [];
  const signature = await getSignature(step.id);

  return (
    <PortalShell business={portal.business} token={token} wide>
      <AgreementForm
        token={token}
        index={step.displayIndex}
        total={portal.steps.length}
        title={step.title}
        description={step.description ?? undefined}
        businessName={portal.business.name}
        clientCompany={portal.client.company}
        sections={sections}
        body={typeof body === "string" ? body : ""}
        signed={Boolean(signature)}
        signedName={signature?.signer_name}
        signedEmail={signature?.signer_email}
        signedAt={
          signature
            ? new Date(signature.signed_at).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : undefined
        }
        defaultName={portal.client.name ?? ""}
        defaultEmail={portal.client.email}
      />
    </PortalShell>
  );
}
