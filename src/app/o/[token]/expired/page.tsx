import { LinkIcon } from "lucide-react";
import { Card, CardBody, Field, Input, ToastButton } from "@/components/ui";
import { PortalShell } from "@/components/portal/portal-shell";
import { business } from "@/lib/mock";

/**
 * C10 — Expired or invalid link.
 *
 * A dead end here is a lost onboarding, so the screen's only job is
 * recovery. No apology, no error code, no "contact support" —
 * one field and one button that puts a working link back in their
 * inbox.
 */
export default function ExpiredLink() {
  return (
    <PortalShell business={business}>
      <div className="flex flex-1 flex-col justify-center gap-6 py-8">
        <div className="flex flex-col gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-ink-100">
            <LinkIcon className="size-5 text-ink-500" />
          </span>
          <h1 className="text-2xl font-semibold text-ink-900">
            This link isn't active
          </h1>
          <p className="measure-prose text-base text-ink-500">
            It may have expired or been replaced. Enter your email and we'll
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
              />
            </Field>
            <ToastButton
              variant="primary"
              size="lg"
              className="w-full"
              message="Check your inbox"
              description="If that address has an onboarding with us, a fresh link is on its way."
            >
              Send me a new link
            </ToastButton>
          </CardBody>
        </Card>

        <p className="text-sm text-ink-500">
          Still stuck? Email {business.replyToEmail} and they'll sort it out.
        </p>
      </div>
    </PortalShell>
  );
}
