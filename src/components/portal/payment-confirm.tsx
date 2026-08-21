"use client";

import { useTransition } from "react";
import { Check, CreditCard, ExternalLink } from "lucide-react";
import { Button, Card, CardBody, toast } from "@/components/ui";
import { markPaid } from "@/lib/portal-actions";

/**
 * C6 — Payment.
 *
 * The client pays on the BUSINESS'S own link — a Stripe payment link,
 * PayPal, bKash, an invoice page — and confirms here. We deliberately
 * do not take the card ourselves.
 *
 * That is the same trade the scheduling step makes, for the same
 * reasons. Taking the card would mean being a payments platform:
 * a Connect account, PCI scope, payouts, refunds, disputes, and a
 * supported-country list that decides who is allowed to use the
 * product at all. Every agency that takes deposits already has a way
 * to be paid; pointing at it is worth more than rebuilding it.
 *
 * The confirmation is the client's word, deliberately. The money
 * itself landed in the business's own account, which is the record
 * that matters — this only tells the progress view the step is done.
 */
export function PaymentConfirm({
  token,
  url,
  amount,
  paid,
}: {
  token: string;
  /** Already safety-checked by the caller; null means none was set. */
  url: string | null;
  amount: string;
  paid: boolean;
}) {
  const [pending, start] = useTransition();

  if (paid) {
    return (
      <Card className="border-accent-300 bg-accent-50">
        <CardBody className="flex items-center gap-3">
          <Check className="size-5 shrink-0 text-accent-600" strokeWidth={3} />
          <span className="text-base text-ink-900">
            Thanks — you&apos;ve marked this as paid.
          </span>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {url ? (
        <Button asChild variant="primary" size="lg" className="w-full">
          <a href={url} target="_blank" rel="noreferrer noopener">
            <CreditCard className="size-4" />
            Pay {amount}
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
      ) : (
        <Card>
          <CardBody className="text-base text-ink-600">
            Payment details are coming separately. Once you&apos;ve paid, mark
            it done here so the rest of your onboarding unlocks.
          </CardBody>
        </Card>
      )}

      <Button
        variant="secondary"
        size="lg"
        loading={pending}
        className="w-full"
        onClick={() =>
          start(async () => {
            const result = await markPaid(token);
            if (result?.error) {
              toast.error("That didn't save", { description: result.error });
            }
          })
        }
      >
        I&apos;ve paid
      </Button>
    </div>
  );
}
