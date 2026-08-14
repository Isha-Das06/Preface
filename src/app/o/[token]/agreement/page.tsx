import { Card, CardBody } from "@/components/ui";
import { PortalShell } from "@/components/portal/portal-shell";
import { StepFrame } from "@/components/portal/step-frame";
import { SignaturePad } from "@/components/portal/signature-pad";
import { agreement, business, client, stepBySlug, steps } from "@/lib/mock";

/** C5 — Agreement. Wider shell: this one is a document, not a form. */
export default function AgreementStep() {
  const step = stepBySlug("agreement")!;
  const index = steps.findIndex((s) => s.slug === "agreement") + 1;

  return (
    <PortalShell business={business} wide>
      <StepFrame
        index={index}
        total={steps.length}
        title={step.title}
        description="Please read through, then sign at the bottom."
        continueHref="/o/demo/payment"
        showSaveIndicator={false}
      >
        <div className="flex flex-col gap-6">
          <Card>
            <CardBody className="flex flex-col gap-6">
              <div className="flex flex-col gap-1 border-b border-ink-150 pb-4">
                <h2 className="text-xl font-semibold text-ink-900">
                  {agreement.title}
                </h2>
                <p className="text-sm text-ink-500">
                  Between {business.name} and {client.company} ·{" "}
                  {agreement.version} · Effective {agreement.effectiveDate}
                </p>
              </div>

              {/* Flows down the page rather than sitting in a fixed
                  scroll box — a nested scroll area on a phone is how
                  people end up signing without reading. */}
              <div className="flex flex-col gap-5">
                {agreement.body.map((s) => (
                  <section key={s.heading} className="flex flex-col gap-1.5">
                    <h3 className="text-base font-semibold text-ink-900">
                      {s.heading}
                    </h3>
                    <p className="measure-prose text-base text-ink-700">
                      {s.text}
                    </p>
                  </section>
                ))}
              </div>
            </CardBody>
          </Card>

          <SignaturePad
            defaultName={agreement.signedBy}
            defaultEmail={client.email}
            signed
            signedAt={agreement.signedAt}
          />
        </div>
      </StepFrame>
    </PortalShell>
  );
}
