import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import { StepFrame } from "@/components/portal/step-frame";
import { AccessChecklist } from "@/components/portal/access-checklist";
import { getPortal, nextSlugAfter, stepBySlug } from "@/lib/portal";

interface ConfigItem {
  key: string;
  label: string;
  instruction: string;
  required: boolean;
  detail?: string;
}

/** C11 — Checklist. Things done elsewhere, confirmed here. */
export default async function AccessStep({
  params,
}: PageProps<"/o/[token]/access">) {
  const { token } = await params;
  const portal = await getPortal(token);
  if (!portal) redirect(`/o/${token}/expired`);

  const step = stepBySlug(portal, "access");
  if (!step) redirect(`/o/${token}`);

  const items = (step.config.items ?? []) as ConfigItem[];
  const done = (step.data.done ?? {}) as Record<string, boolean>;
  const next = nextSlugAfter(portal, "access");

  return (
    <PortalShell business={portal.business} token={token}>
      <StepFrame
        token={token}
        index={step.displayIndex}
        total={portal.steps.length}
        title={step.title}
        description={step.description ?? undefined}
        continueHref={next ? `/o/${token}/${next}` : `/o/${token}/done`}
        footerNote="We never ask for your passwords. You stay in control and can remove our access at any time."
      >
        <AccessChecklist
          token={token}
          items={items.map((i) => ({
            ...i,
            done: Boolean(done[i.key]),
            /**
             * No fallback to the business's reply-to address. Some
             * instructions already name the right one inline ("invite
             * ads@acme.co"), and quietly showing a DIFFERENT address
             * underneath is worse than showing none — the client then
             * has two and no way to tell which is meant.
             */
            detail: (i.detail ?? "").trim(),
          }))}
        />
      </StepFrame>
    </PortalShell>
  );
}
