import { redirect } from "next/navigation";
import { Check, Lock } from "lucide-react";
import { Card, CardBody, Field, Input, PendingButton } from "@/components/ui";
import { PortalShell } from "@/components/portal/portal-shell";
import { StepFrame } from "@/components/portal/step-frame";
import { getPortal, getPayment, stepBySlug } from "@/lib/portal";

/**
 * C6 — Payment.
 *
 * The card fields are inert until Goal 10 replaces them with Stripe
 * Elements, which means card data never touches our origin — that is
 * both the compliance position and the trust story, so the copy
 * already says it. The submit control is explicitly pending rather
 * than a button that appears to charge and does not.
 */
export default async function PaymentStep({
  params,
}: PageProps<"/o/[token]/payment">) {
  const { token } = await params;
  const portal = await getPortal(token);
  if (!portal) redirect(`/o/${token}/expired`);

  const step = stepBySlug(portal, "payment");
  if (!step) redirect(`/o/${token}`);
  // Nobody pays a deposit against an unsigned agreement.
  if (step.lockedReason) redirect(`/o/${token}`);
  if (!portal.verified) redirect(`/o/${token}/verify`);

  const cents =
    typeof step.config.amountCents === "number" ? step.config.amountCents : 0;
  const currency =
    typeof step.config.currency === "string" ? step.config.currency : "usd";
  const description =
    typeof step.config.description === "string"
      ? step.config.description
      : step.title;

  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);

  const paid = await getPayment(step.id);

  return (
    <PortalShell business={portal.business} token={token}>
      <StepFrame
        token={token}
        index={step.displayIndex}
        total={portal.steps.length}
        title={step.title}
      >
        <div className="flex flex-col gap-6">
          {/* The amount is the single loudest thing on the screen.
              A client deciding whether to pay should never have to
              hunt for what they are paying. */}
          <Card>
            <CardBody className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <span className="label-caps">Amount due</span>
                <span
                  className="text-4xl font-semibold tracking-tight text-ink-900"
                  data-numeric
                >
                  {amount}
                </span>
                <span className="text-base text-ink-500">{description}</span>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-ink-150 pt-4 text-sm">
                <span className="text-ink-500">Paid to</span>
                <span className="font-medium text-ink-900">
                  {portal.business.name}
                </span>
              </div>
            </CardBody>
          </Card>

          {paid?.paid_at ? (
            <Card className="border-accent-300 bg-accent-50">
              <CardBody className="flex items-center gap-3">
                <Check
                  className="size-5 shrink-0 text-accent-600"
                  strokeWidth={3}
                />
                <span className="text-base text-ink-900">
                  Paid on{" "}
                  {new Date(paid.paid_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  .
                </span>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody className="flex flex-col gap-5">
                <Field label="Card number">
                  <Input
                    placeholder="1234 1234 1234 1234"
                    inputMode="numeric"
                    disabled
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Expiry">
                    <Input placeholder="MM / YY" inputMode="numeric" disabled />
                  </Field>
                  <Field label="CVC">
                    <Input placeholder="123" inputMode="numeric" disabled />
                  </Field>
                </div>
                <Field label="Name on card">
                  <Input autoComplete="cc-name" disabled />
                </Field>

                <PendingButton
                  className="w-full"
                  reason="Available once card payments are connected"
                >
                  <Lock className="size-4" />
                  Pay {amount}
                </PendingButton>

                <p className="flex items-start gap-2 text-sm text-ink-500">
                  <Lock className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    Card details go directly to Stripe and are never stored by{" "}
                    {portal.business.name}. Payment goes straight to their
                    account.
                  </span>
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </StepFrame>
    </PortalShell>
  );
}
