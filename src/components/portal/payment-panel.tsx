import { Card, CardBody } from "@/components/ui";
import { PaymentConfirm } from "./payment-confirm";

/**
 * The body of C6 — Payment.
 *
 * Lifted out of the payment page so the business's own preview of
 * this step renders the very same markup the client gets. Two hand-
 * copied versions of a screen drift within a week, and a preview
 * that has drifted is worse than no preview: it is confidently
 * wrong about the one thing it exists to tell you.
 *
 * Everything it needs is a prop, which is what lets the preview feed
 * it unsaved editor state.
 */
export function PaymentPanel({
  token,
  amount,
  description,
  businessName,
  payUrl,
  paid,
}: {
  token: string;
  /** Already formatted for display — the page owns the currency. */
  amount: string;
  description: string;
  businessName: string;
  /** Safety-checked link, or null when the business set none. */
  payUrl: string | null;
  paid: boolean;
}) {
  return (
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
            <span className="font-medium text-ink-900">{businessName}</span>
          </div>
        </CardBody>
      </Card>

      <PaymentConfirm token={token} url={payUrl} amount={amount} paid={paid} />

      <p className="measure-prose text-sm text-ink-500">
        {payUrl
          ? `Payment is taken by ${businessName} on their own payment page — this site never sees your card details.`
          : `${businessName} will send you payment details directly.`}
      </p>
    </div>
  );
}
