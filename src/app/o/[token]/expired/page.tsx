import { LinkIcon } from "lucide-react";
import { Card, CardBody, Field, Input, PendingButton } from "@/components/ui";

/**
 * C10 — Expired or invalid link.
 *
 * A dead end here is a lost onboarding, so the screen's only job is
 * recovery. No apology, no error code, no "contact support".
 *
 * Deliberately renders no business identity: we get here precisely
 * when the token resolved to nothing, so there is no business to
 * name. Guessing one would be worse than saying nothing.
 *
 * Re-issuing the link needs email, which is Goal 11 — so the control
 * says so rather than claiming to have sent something.
 */
export default function ExpiredLink() {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-[560px] flex-col justify-center gap-6 px-4 pb-16 sm:px-6">
        <div className="flex flex-col gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-ink-100">
            <LinkIcon className="size-5 text-ink-500" />
          </span>
          <h1 className="text-2xl font-semibold text-ink-900">
            This link isn&apos;t active
          </h1>
          <p className="measure-prose text-base text-ink-500">
            It may have expired or been replaced. Enter your email and we&apos;ll
            send you a fresh one.
          </p>
        </div>

        <Card>
          <CardBody className="flex flex-col gap-5">
            <Field label="Your email">
              <Input
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                disabled
              />
            </Field>
            <PendingButton
              className="w-full"
              reason="Available once email is connected"
            >
              Send me a new link
            </PendingButton>
          </CardBody>
        </Card>

        <p className="text-sm text-ink-500">
          Still stuck? Reply to the email your onboarding link came in and it
          goes straight to the people expecting you.
        </p>
      </div>
    </div>
  );
}
