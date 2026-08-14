"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button, Card, CardBody } from "@/components/ui";
import { PortalShell } from "@/components/portal/portal-shell";
import { business, client } from "@/lib/mock";

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
export default function VerifyStep() {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const complete = digits.every((d) => d !== "");

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
    <PortalShell business={business}>
      <div className="flex flex-1 flex-col justify-center gap-6 py-8 animate-step-in">
        <div className="flex flex-col gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-accent-100">
            <Mail className="size-5 text-accent-600" />
          </span>
          <h1 className="text-2xl font-semibold text-ink-900">
            Check your email
          </h1>
          <p className="measure-prose text-base text-ink-500">
            The next steps involve a contract and a payment, so we need to
            confirm it's you. We sent a 6-digit code to{" "}
            <span className="font-medium text-ink-900">{client.email}</span>.
          </p>
        </div>

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

            <Button
              asChild={complete}
              variant="primary"
              size="lg"
              disabled={!complete}
              className="w-full"
            >
              {complete ? (
                <Link href="/o/demo/agreement">Continue</Link>
              ) : (
                <span>Continue</span>
              )}
            </Button>
          </CardBody>
        </Card>

        <p className="text-sm text-ink-500">
          Didn't get it? Check spam, or{" "}
          <button className="font-medium text-accent-600 underline underline-offset-2 hover:text-accent-700">
            send it again
          </button>
          .
        </p>
      </div>
    </PortalShell>
  );
}
