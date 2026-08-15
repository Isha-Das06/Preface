import { PortalShell } from "@/components/portal/portal-shell";
import { StepFrame } from "@/components/portal/step-frame";
import { AccessChecklist } from "@/components/portal/access-checklist";
import { business, checklistItems, stepBySlug, steps } from "@/lib/mock";

/** C11 — Checklist. Things done elsewhere, confirmed here. */
export default function AccessStep() {
  const step = stepBySlug("access")!;
  const index = steps.findIndex((s) => s.slug === "access") + 1;

  return (
    <PortalShell business={business}>
      <StepFrame
        index={index}
        total={steps.length}
        title={step.title}
        description={step.description}
        continueHref="/o/demo/agreement"
        footerNote="We never ask for your passwords. You stay in control and can remove our access at any time."
      >
        <AccessChecklist items={checklistItems} />
      </StepFrame>
    </PortalShell>
  );
}
