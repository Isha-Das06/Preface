"use client";

import { useActionState } from "react";
import { Card, CardBody } from "@/components/ui";
import { StepFrame } from "./step-frame";
import { SignaturePad } from "./signature-pad";
import { signAgreement, type PortalResult } from "@/lib/portal-actions";

export interface AgreementSection {
  heading: string;
  text: string;
}

/** C5 — Agreement. A document, not a form, so the shell runs wider. */
export function AgreementForm({
  token,
  index,
  total,
  title,
  description,
  businessName,
  clientCompany,
  sections,
  body,
  signed,
  signedName,
  signedEmail,
  signedAt,
  defaultName,
  defaultEmail,
}: {
  token: string;
  index: number;
  total: number;
  title: string;
  /** The owner's own words for this step, when they wrote any. */
  description?: string;
  businessName: string;
  clientCompany: string;
  sections: AgreementSection[];
  body: string;
  signed: boolean;
  signedName?: string;
  signedEmail?: string;
  signedAt?: string;
  defaultName: string;
  defaultEmail: string;
}) {
  const [state, formAction] = useActionState(
    async (prev: PortalResult, formData: FormData) =>
      signAgreement(token, prev, formData),
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <StepFrame
        token={token}
        index={index}
        total={total}
        title={title}
        description={
          description || "Please read through, then sign at the bottom."
        }
        error={state?.error}
      >
        <div className="flex flex-col gap-6">
          <Card>
            <CardBody className="flex flex-col gap-6">
              <div className="flex flex-col gap-1 border-b border-ink-150 pb-4">
                <h2 className="text-xl font-semibold text-ink-900">{title}</h2>
                <p className="text-sm text-ink-500">
                  Between {businessName} and {clientCompany}
                </p>
              </div>

              {/* Flows down the page rather than sitting in a fixed
                  scroll box — a nested scroll area on a phone is how
                  people end up signing without reading. */}
              <div className="flex flex-col gap-5">
                {sections.length > 0 ? (
                  sections.map((s) => (
                    <section key={s.heading} className="flex flex-col gap-1.5">
                      <h3 className="text-base font-semibold text-ink-900">
                        {s.heading}
                      </h3>
                      <p className="measure-prose text-base text-ink-700">
                        {s.text}
                      </p>
                    </section>
                  ))
                ) : (
                  <p className="measure-prose whitespace-pre-wrap text-base text-ink-700">
                    {body}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>

          <SignaturePad
            defaultName={defaultName}
            defaultEmail={defaultEmail}
            signed={signed}
            signedName={signedName}
            signedEmail={signedEmail}
            signedAt={signedAt}
          />
        </div>
      </StepFrame>
    </form>
  );
}
