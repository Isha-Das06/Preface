"use client";

import { useActionState, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  Input,
} from "@/components/ui";
import { LogoUpload } from "./logo-upload";
import { cn } from "@/lib/utils";
import {
  PORTAL_GROUND_OPTIONS,
  portalGround,
  type PortalGround,
} from "@/lib/portal-theme";
import { updateSettings } from "@/lib/actions";
import type { Business } from "@/lib/supabase/types";
/**
 * There is no Plan card. Preface is free during the beta, so a panel
 * naming a tier, counting down a trial, and offering a "Manage
 * billing" button that opens nothing was three promises the product
 * does not keep. It comes back when there is something to bill.
 */
export function SettingsForm({ business }: { business: Business }) {
  // Controlled so the selected swatch highlights immediately; the
  // value still posts with the rest of the form.
  const [ground, setGround] = useState<PortalGround>(
    portalGround(business.portal_ground),
  );
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
            label="Background"
            help="The page your clients read on. A fixed set rather than any colour — they sign a contract on this page, and every one of these keeps the text readable."
          >
            <div className="flex flex-wrap gap-2">
              {PORTAL_GROUND_OPTIONS.map((g) => (
                <label
                  key={g.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 transition-colors",
                    ground === g.id
                      ? "border-accent-600 bg-accent-50"
                      : "border-ink-200 hover:border-ink-300",
                  )}
                >
                  <input
                    type="radio"
                    name="portalGround"
                    value={g.id}
                    checked={ground === g.id}
                    onChange={() => setGround(g.id)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className="size-6 shrink-0 rounded"
                    style={{
                      background: g.value,
                      border: `1px solid ${g.swatchBorder}`,
                    }}
                  />
                  <span className="text-sm text-ink-900">{g.label}</span>
                </label>
              ))}
            </div>
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
