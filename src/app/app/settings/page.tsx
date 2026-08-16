import { ExternalLink, Upload } from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  Input,
  ProgressBar,
  PendingButton,
  Textarea,
} from "@/components/ui";
import { AppPage } from "@/components/app/page-shell";
import { settings } from "@/lib/mock-app";

/**
 * B9 — Settings. Deliberately short.
 *
 * Branding, email, reminders, plan. No teams, no permissions, no
 * custom domains, no integrations tab. Fifty settings is how a
 * simple product stops feeling simple.
 */
export default function SettingsPage() {
  return (
    <AppPage
      title="Settings"
      description="Branding, email and reminders."
      className="max-w-[720px]"
    >
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <span className="text-sm text-ink-500">
              What your clients see
            </span>
          </CardHeader>
          <CardBody className="flex flex-col gap-5">
            <Field
              label="Business name"
              help="Shown at the top of every client's onboarding page."
            >
              <Input defaultValue={settings.businessName} />
            </Field>

            <Field label="Logo" help="PNG or SVG. Falls back to a monogram.">
              <PendingButton
                size="md"
                className="w-fit"
                reason="Available once file storage is connected"
              >
                <Upload className="size-4" />
                Upload logo
              </PendingButton>
            </Field>

            <Field
              label="Accent colour"
              help="Used on buttons and progress in your clients' portal."
            >
              <div className="flex items-center gap-3">
                <span
                  className="size-9 shrink-0 rounded-md border border-ink-200"
                  style={{ background: settings.accentColor }}
                />
                <Input
                  defaultValue={settings.accentColor}
                  className="max-w-[140px] font-mono"
                />
              </div>
            </Field>

            <Field
              label="Welcome message"
              help="The first thing a new client reads."
            >
              <Textarea rows={3} defaultValue={settings.welcomeMessage} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-5">
            <Field label="Sender name">
              <Input defaultValue={settings.senderName} />
            </Field>
            <Field
              label="Reply-to address"
              help="Client replies go straight here, not to us."
            >
              <Input type="email" defaultValue={settings.replyTo} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reminders</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <Checkbox
              defaultChecked={settings.remindersEnabled}
              label="Send automatic reminders"
              description="At 2 days and 5 days of inactivity, then once more. Never more than three, ever."
            />
            <Checkbox
              defaultChecked={settings.digestEnabled}
              label="Email me a Monday summary"
              description="A short list of who you're waiting on."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-lg font-semibold text-ink-900">
                  {settings.plan}
                </span>
                <span className="text-sm text-ink-500">
                  {settings.planPrice}
                </span>
              </div>
              {/* Billing is Stripe's Customer Portal — a redirect,
                  not a screen we build and keep in sync. */}
              <PendingButton
                size="sm"
                reason="Opens Stripe's billing portal once payments are connected"
              >
                <ExternalLink className="size-3.5" />
                Manage billing
              </PendingButton>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-ink-600">Active onboardings</span>
                <span className="text-ink-900" data-numeric>
                  {settings.activeUsed} of {settings.activeLimit}
                </span>
              </div>
              <ProgressBar
                value={settings.activeUsed}
                total={settings.activeLimit}
              />
              <p className="text-xs text-ink-500">
                Completed onboardings don't count and stay available forever.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppPage>
  );
}
