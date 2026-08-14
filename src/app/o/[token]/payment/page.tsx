import Link from "next/link";
import { Lock } from "lucide-react";
import { Button, Card, CardBody, Field, Input } from "@/components/ui";
import { PortalShell } from "@/components/portal/portal-shell";
import { StepFrame } from "@/components/portal/step-frame";
import { business, payment, stepBySlug, steps } from "@/lib/mock";

/**
 * C6 — Payment.
 *
 * The card fields here are visual mocks. Goal 10 replaces them with
 * Stripe Elements, which means card data never touches our origin —
 * that is both the compliance position and the trust story, so the
 * copy already says it.
 */
export default function PaymentStep() {
  const step = stepBySlug("payment")!;
  const index = steps.findIndex((s) => s.slug === "payment") + 1;

  return (
    <PortalShell business={business}>
      <StepFrame
        index={index}
        total={steps.length}
        title={step.title}
        showSaveIndicator={false}
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
                  {payment.amount}
                </span>
                <span className="text-base text-ink-500">
                  {payment.description} · {payment.note}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-ink-150 pt-4 text-sm">
                <span className="text-ink-500">Paid to</span>
                <span className="font-medium text-ink-900">
                  {payment.payTo}
                </span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-col gap-5">
              <Field label="Card number">
                <Input placeholder="1234 1234 1234 1234" inputMode="numeric" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Expiry">
                  <Input placeholder="MM / YY" inputMode="numeric" />
                </Field>
                <Field label="CVC">
                  <Input placeholder="123" inputMode="numeric" />
                </Field>
              </div>
              <Field label="Name on card">
                <Input placeholder="Sarah Chen" autoComplete="cc-name" />
              </Field>

              <Button asChild variant="primary" size="lg" className="w-full">
                <Link href="/o/demo/schedule">
                  <Lock className="size-4" />
                  Pay {payment.amount}
                </Link>
              </Button>

              <p className="flex items-start gap-2 text-sm text-ink-500">
                <Lock className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Card details go directly to Stripe and are never stored by{" "}
                  {business.name}. Payment goes straight to their account.
                </span>
              </p>
            </CardBody>
          </Card>
        </div>
      </StepFrame>
    </PortalShell>
  );
}
