import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import { StepFrame } from "@/components/portal/step-frame";
import { PaymentPanel } from "@/components/portal/payment-panel";
import { getPortal, getPayment, stepBySlug } from "@/lib/portal";

/**
 * C6 — Payment.
 *
 * The card fields are inert until Goal 10 replaces them with Stripe
 * Elements, which means card data never touches our origin — that is
 * both the compliance position and the trust story, so the copy
 * already says it. The submit control is explicitly pending rather
 * than a button that appears to charge and does not.
 *
 * The screen itself lives in PaymentPanel, shared with the business's
 * step preview so the two can never disagree.
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
        <PaymentPanel
          amount={amount}
          description={description}
          businessName={portal.business.name}
          paidAt={paid?.paid_at}
        />
      </StepFrame>
    </PortalShell>
  );
}
