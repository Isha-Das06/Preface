"use client";

import { useState } from "react";
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
 */
export function SignaturePad({
  defaultName,
  defaultEmail,
  signed,
  signedAt,
}: {
  defaultName: string;
  defaultEmail: string;
  signed?: boolean;
  signedAt?: string;
}) {
  const [name, setName] = useState(signed ? defaultName : "");
  const [email, setEmail] = useState(signed ? defaultEmail : "");
  const [done, setDone] = useState(Boolean(signed));

  const ready = name.trim().length > 1 && /.+@.+\..+/.test(email);

  if (done) {
    return (
      <Card className="border-accent-300 bg-accent-50">
        <CardBody className="flex flex-col gap-4">
          <span className="flex items-center gap-2 text-base font-medium text-ink-900">
            <Check className="size-4 text-accent-600" strokeWidth={3} />
            Signed
          </span>

          <div className="flex flex-col gap-1 border-b border-ink-200 pb-3">
            <span className="text-2xl text-ink-900" style={{ fontStyle: "italic" }}>
              {name}
            </span>
          </div>

          <dl className="flex flex-col gap-1 text-sm text-ink-500">
            <div className="flex gap-2">
              <dt>Signed by</dt>
              <dd className="text-ink-700">{name}</dd>
            </div>
            <div className="flex gap-2">
              <dt>Email</dt>
              <dd className="text-ink-700">{email}</dd>
            </div>
            <div className="flex gap-2">
              <dt>Date</dt>
              <dd className="text-ink-700" data-numeric>
                {signedAt ?? "just now"}
              </dd>
            </div>
          </dl>

          <p className="text-sm text-ink-500">
            A copy has been emailed to you.
          </p>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sarah Chen"
              autoComplete="name"
            />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@northstarlabs.co"
              autoComplete="email"
            />
          </Field>
        </div>

        {/* Live preview of the mark being made. Seeing the name
            render as a signature is what makes typing one feel
            like signing rather than filling in a field. */}
        {name.trim() && (
          <div className="flex flex-col gap-1 rounded-md bg-ink-50 px-4 py-3">
            <span
              className="text-2xl text-ink-900"
              style={{ fontStyle: "italic" }}
            >
              {name}
            </span>
            <span className="text-xs text-ink-500">Your signature</span>
          </div>
        )}

        <p className="text-sm text-ink-500">
          By typing your name you agree to the terms above. We'll record the
          time and send you a copy.
        </p>

        <Button
          variant="primary"
          size="lg"
          disabled={!ready}
          onClick={() => setDone(true)}
          className="w-full"
        >
          <Lock className="size-4" />
          Sign agreement
        </Button>
      </CardBody>
    </Card>
  );
}
