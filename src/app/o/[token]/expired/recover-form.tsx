"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { Button, Card, CardBody, Field, Input } from "@/components/ui";
import { useFormStatus } from "react-dom";
import { requestNewLink, type LinkRecoveryResult } from "@/lib/portal-actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      loading={pending}
      className="w-full"
    >
      Send me a new link
    </Button>
  );
}

/**
 * Recovery on the expired-link screen.
 *
 * The confirmation deliberately does not say whether we found
 * anything. This is the one form in the product a stranger can
 * reach without a token, and "no onboarding for that address" would
 * turn it into a way to ask which companies an agency works with.
 * The mail only ever goes to the address already on the record.
 */
export function RecoverForm() {
  const [state, formAction] = useActionState(
    async (prev: LinkRecoveryResult, formData: FormData) =>
      requestNewLink(prev, formData),
    undefined,
  );

  if (state && "sent" in state) {
    return (
      <Card className="border-accent-300 bg-accent-50">
        <CardBody className="flex items-start gap-3">
          <Check className="mt-0.5 size-5 shrink-0 text-accent-600" strokeWidth={3} />
          <div className="flex flex-col gap-1">
            <span className="text-base font-medium text-ink-900">
              Check your inbox
            </span>
            <span className="measure-prose text-sm text-ink-600">
              If that address has an onboarding waiting, the link is on its
              way. It can take a minute — check spam too.
            </span>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="flex flex-col gap-5">
          <Field label="Your email">
            <Input
              name="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </Field>

          {state?.error && (
            <p role="alert" className="text-sm text-danger-600">
              {state.error}
            </p>
          )}

          <Submit />
        </CardBody>
      </Card>
    </form>
  );
}
