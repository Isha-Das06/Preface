"use client";

import { useActionState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  Input,
  Textarea,
} from "@/components/ui";
import { LogoUpload } from "./logo-upload";
import { updateSettings } from "@/lib/actions";
import type { Business } from "@/lib/supabase/types";
/**
 * There is no Plan card. Preface is free during the beta, so a panel
 * naming a tier, counting down a trial, and offering a "Manage
 * billing" button that opens nothing was three promises the product
 * does not keep. It comes back when there is something to bill.
 */
export function SettingsForm({ business }: { business: Business }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; ok?: true } | undefined, fd: FormData) =>
      updateSettings(fd),
    undefined,
  );
  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <span className="text-sm text-ink-500">What your clients see</span>
        </CardHeader>
        <CardBody className="flex flex-col gap-5">
          <Field
            label="Business name"
            help="Shown at the top of every client's onboarding page."
          >
            <Input name="businessName" defaultValue={business.name} />
          </Field>
          <Field label="Logo" help="PNG, JPG, WebP or SVG, up to 2 MB. Falls back to a monogram.">
            {/* Saves on its own rather than with the form: it is an
                upload, not a text field, and pretending otherwise
                means a logo that vanishes if you navigate away. */}
            <LogoUpload
              initialUrl={business.logo_url}
              businessName={business.name}
            />
          </Field>
          <Field
            label="Accent colour"
            help="Used on buttons and progress in your clients' portal."
          >
            <div className="flex items-center gap-3">
              <span
                className="size-9 shrink-0 rounded-md border border-ink-200"
                style={{ background: business.accent_color }}
              />
              <Input
                name="accentColor"
                defaultValue={business.accent_color}
                className="max-w-[140px] font-mono"
                aria-label="Accent colour hex"
              />
            </div>
          </Field>
          <Field
            label="Welcome message"
            help="The first thing a new client reads."
          >
            <Textarea
              name="welcomeMessage"
              rows={3}
              defaultValue={business.welcome_message ?? ""}
            />
          </Field>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-5">
          <Field label="Sender name">
            <Input name="senderName" defaultValue={business.sender_name ?? ""} />
          </Field>
          <Field
            label="Reply-to address"
            help="Client replies go straight here, not to us."
          >
            <Input
              name="replyTo"
              type="email"
              defaultValue={business.reply_to_email ?? ""}
            />
          </Field>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Reminders</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <Checkbox
            name="remindersEnabled"
            defaultChecked={business.reminders_enabled}
            label="Send automatic reminders"
            description="At 2 days and 5 days of inactivity, then once more. Never more than three, ever."
          />
          <Checkbox
            name="digestEnabled"
            defaultChecked={business.digest_enabled}
            label="Email me a Monday summary"
            description="A short list of who you're waiting on."
          />
        </CardBody>
      </Card>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm" role="status">
          {state?.error ? (
            <span className="text-danger-600">{state.error}</span>
          ) : state?.ok ? (
            <span className="text-accent-600">Saved</span>
          ) : null}
        </span>
        <Button type="submit" variant="primary" loading={pending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
