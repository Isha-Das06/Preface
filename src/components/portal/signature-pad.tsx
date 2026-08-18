"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Lock } from "lucide-react";
import { Button, Card, CardBody, Field, Input } from "@/components/ui";

/**
 * Typed-name signature with an audit trail.
 *
 * Deliberately not a drawn-squiggle canvas: a typed name plus
 * captured signer, timestamp, IP and an immutable snapshot of the
 * exact document shown is what actually satisfies ESIGN/UETA and
 * eIDAS for ordinary commercial agreements. A finger-drawn scrawl
 * on a phone looks more official and proves less.
 *
 * The fields post with the surrounding form. Local state exists only
 * for the live preview and the enable rule — the values that count
 * are read from the FormData server-side.
 */
export function SignaturePad({
  defaultName,
  defaultEmail,
  signed,
  signedAt,
  signedName,
  signedEmail,
}: {
  defaultName: string;
  defaultEmail: string;
  signed?: boolean;
  signedAt?: string;
  signedName?: string;
  signedEmail?: string;
}) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const { pending } = useFormStatus();

  const ready = name.trim().length > 1 && /.+@.+\..+/.test(email);

  if (signed) {
    return (
      <Card className="border-accent-300 bg-accent-50">
        <CardBody className="flex flex-col gap-4">
          <span className="flex items-center gap-2 text-base font-medium text-ink-900">
            <Check className="size-4 text-accent-600" strokeWidth={3} />
            Signed
          </span>

          {/* A ruled signature block, not a faked handwriting effect.
              Serif-italic-as-accent is a named AI-design tell, and a
              typed name pretending to be handwritten is less credible
              than one presented honestly on a signature rule. */}
          <div className="flex flex-col gap-1.5 border-b border-ink-300 pb-2">
            <span className="text-2xl text-ink-900">{signedName}</span>
          </div>

          <dl className="flex flex-col gap-1 text-sm text-ink-500">
            <div className="flex gap-2">
              <dt>Signed by</dt>
              <dd className="text-ink-700">{signedName}</dd>
            </div>
            <div className="flex gap-2">
              <dt>Email</dt>
              <dd className="text-ink-700">{signedEmail}</dd>
            </div>
            <div className="flex gap-2">
              <dt>Date</dt>
              <dd className="text-ink-700" data-numeric>
                {signedAt}
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-ink-900">Sign here</h2>
          <p className="text-sm text-ink-500">
            Type your full name to sign. This is legally binding.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Field label="Full name" required>
            <Input
              name="signerName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </Field>
          <Field label="Email" required>
            <Input
              name="signerEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>
        </div>

        {/* Live preview of the mark being made. Seeing the name
            render as a signature is what makes typing one feel
            like signing rather than filling in a field. */}
        {name.trim() && (
          <div className="flex flex-col gap-2 rounded-md bg-ink-50 px-4 py-3">
            <span className="border-b border-ink-300 pb-1.5 text-2xl text-ink-900">
              {name}
            </span>
            <span className="text-xs text-ink-500">Your signature</span>
          </div>
        )}

        <p className="text-sm text-ink-500">
          By typing your name you agree to the terms above. We record the time
          and keep a copy of exactly what you signed.
        </p>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!ready}
          loading={pending}
          className="w-full"
        >
          <Lock className="size-4" />
          Sign agreement
        </Button>
      </CardBody>
    </Card>
  );
}
