"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Button, Card, CardBody } from "@/components/ui";
import {
  sendVerificationCode,
  verifyCode,
  type PortalResult,
} from "@/lib/portal-actions";

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      disabled={disabled || pending}
      loading={pending}
      className="w-full"
    >
      Continue
    </Button>
  );
}

/**
 * C9 — Email verification.
 *
 * Sits in front of the agreement and payment steps only. The link
 * alone is enough for information, questionnaires and files; it is
 * not enough to reach a contract or a payment request, because the
 * link will get forwarded and pasted into Slack.
 *
 * The client still never sets a password or picks a username, so the
 * "no account" promise holds.
 */
export function VerifyForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [resending, startResend] = useTransition();
  const [resent, setResent] = useState(false);
  const complete = digits.every((d) => d !== "");

  const [state, formAction] = useActionState(
    async (prev: PortalResult, formData: FormData) =>
      verifyCode(token, prev, formData),
    undefined,
  );

  function set(i: number, v: string) {
    const clean = v.replace(/\D/g, "");
    if (!clean && v !== "") return;

    setDigits((prev) => {
      const next = [...prev];
      // Pasting the whole code into any box should just work.
      if (clean.length > 1) {
        clean.split("").forEach((c, k) => {
          if (i + k < 6) next[i + k] = c;
        });
        inputs.current[Math.min(i + clean.length, 5)]?.focus();
      } else {
        next[i] = clean;
        if (clean) inputs.current[i + 1]?.focus();
      }
      return next;
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="code" value={digits.join("")} />

      <Card>
        <CardBody className="flex flex-col gap-5">
          <div className="flex justify-between gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                value={d}
                onChange={(e) => set(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digits[i] && i > 0) {
                    inputs.current[i - 1]?.focus();
                  }
                }}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={6}
                aria-label={`Digit ${i + 1}`}
                className="h-14 w-full min-w-0 rounded-md border border-ink-200 bg-surface text-center text-2xl font-medium text-ink-900 tabular-nums transition-[border-color,box-shadow] duration-(--dur-fast) focus:border-accent-600 focus:shadow-(--focus-ring) focus:outline-none"
              />
            ))}
          </div>

          {state?.error && (
            <p role="alert" className="text-sm text-danger-600">
              {state.error}
            </p>
          )}

          <Submit disabled={!complete} />
        </CardBody>
      </Card>

      <p className="text-sm text-ink-500">
        {resent ? (
          <>A new code is on its way to {email}.</>
        ) : (
          <>
            Didn&apos;t get it? Check spam, or{" "}
            <button
              type="button"
              disabled={resending}
              onClick={() =>
                startResend(async () => {
                  // force: the client is telling us the one they have is no good.
                  await sendVerificationCode(token, true);
                  setResent(true);
                })
              }
              className="font-medium text-accent-600 underline underline-offset-2 hover:text-accent-700 disabled:opacity-60"
            >
              send it again
            </button>
            .
          </>
        )}
      </p>
    </form>
  );
}
