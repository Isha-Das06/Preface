import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import { StepFrame } from "@/components/portal/step-frame";
import { PaymentPanel } from "@/components/portal/payment-panel";
import { getPortal, stepBySlug } from "@/lib/portal";
import { safeExternalUrl } from "@/lib/utils";

/**
 * C6 — Payment.
 *
 * The client pays on the business's own payment link and confirms
 * here. Card data never touches this origin because there is no card
 * field — that is both the compliance position and the reason the
 * product works for a business in a country Stripe does not serve.
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
  // The line item under the amount, not the step's instructions.
  const lineItem =
    typeof step.config.description === "string"
      ? step.config.description
      : step.title;

  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);

  return (
    <PortalShell business={portal.business} token={token}>
      <StepFrame
        token={token}
        index={step.displayIndex}
        total={portal.steps.length}
        title={step.title}
        description={step.description ?? undefined}
      >
        <PaymentPanel
          token={token}
          amount={amount}
          description={lineItem}
          businessName={portal.business.name}
          payUrl={safeExternalUrl(
            typeof step.config.payUrl === "string" ? step.config.payUrl : null,
          )}
          paid={Boolean(step.completedAt)}
        />
      </StepFrame>
    </PortalShell>
  );
}
