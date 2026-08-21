import { Check, Lock } from "lucide-react";
import { Card, CardBody, Field, Input, PendingButton } from "@/components/ui";

/**
 * The body of C6 — Payment.
 *
 * Lifted out of the payment page so the business's own preview of
 * this step renders the very same markup the client gets. Two hand-
 * copied versions of a screen drift within a week, and a preview
 * that has drifted is worse than no preview: it is confidently
 * wrong about the one thing it exists to tell you.
 *
 * Presentational only. Everything it needs is a prop, which is what
 * lets the preview feed it unsaved editor state.
 */
export function PaymentPanel({
  amount,
  description,
  businessName,
  paidAt,
}: {
  /** Already formatted for display — the page owns the currency. */
  amount: string;
  description: string;
  businessName: string;
  paidAt?: string | null;
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

      {paidAt ? (
        <Card className="border-accent-300 bg-accent-50">
          <CardBody className="flex items-center gap-3">
            <Check className="size-5 shrink-0 text-accent-600" strokeWidth={3} />
            <span className="text-base text-ink-900">
              Paid on{" "}
              {new Date(paidAt).toLocaleDateString("en-GB", {
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
                {businessName}. Payment goes straight to their account.
              </span>
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
