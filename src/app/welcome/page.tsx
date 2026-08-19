"use client";

import { useActionState, useState, useTransition } from "react";
import { LogoUpload } from "@/components/app/logo-upload";
import {
  Button,
  Field,
  Input,
  RadioCard,
  RadioGroup,
} from "@/components/ui";
import { completeSetup, skipSetup } from "@/lib/auth-actions";

/**
 * M5 — First run. Not in the original spec, and the single most
 * important business-side screen.
 *
 * Three questions on ONE screen, never a multi-step wizard, and the
 * logo is skippable. The goal is signup → pre-filled builder in
 * under three minutes; anything that adds a gate here costs
 * activation directly.
 */

const KINDS = [
  {
    id: "marketing",
    name: "Marketing agency",
    description: "Questionnaire, brand assets, account access, agreement, deposit, kickoff.",
  },
  {
    id: "design",
    name: "Design studio",
    description: "Creative brief, reference material, agreement, deposit, kickoff.",
  },
  {
    id: "consulting",
    name: "Consultant",
    description: "Engagement scope, background documents, agreement, first invoice, kickoff.",
  },
  {
    id: "scratch",
    name: "Something else",
    description: "Start from a blank two-step onboarding and build it up.",
  },
];

export default function Welcome() {
  const [kind, setKind] = useState("marketing");
  const [name, setName] = useState("");
  const [skipping, startSkip] = useTransition();
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string } | undefined, formData: FormData) =>
      completeSetup(formData),
    undefined,
  );

  return (
    <div className="marketing min-h-dvh">
      <form
        action={formAction}
        className="mx-auto flex w-full max-w-[560px] flex-col gap-8 px-5 py-14 sm:py-20"
      >
        <div className="flex flex-col gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-accent-600 text-sm font-semibold text-on-accent">
            P
          </span>
          <h1 className="mt-3 text-4xl font-light tracking-[-0.03em] text-ink-900">
            Let&apos;s set you up.
          </h1>
          <p className="text-lg text-ink-500">Takes about two minutes.</p>
        </div>

        <div className="flex flex-col gap-7">
          <Field
            label="What&apos;s your business called?"
            help="Shown to clients at the top of their onboarding page."
            required
          >
            <Input
              name="businessName"
              placeholder="Acme Agency"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </Field>

          <div className="flex flex-col gap-3">
            <span className="text-base font-medium text-ink-700">
              What kind of work do you do?
            </span>
            <p className="-mt-2 text-sm text-ink-500">
              We&apos;ll start you off with questions that suit it. Change anything
              afterwards.
            </p>
            {/* The one routing question. It reshapes the whole builder,
                which is why it earns its place on this screen. */}
            <input type="hidden" name="template" value={kind} />
            <RadioGroup value={kind} onValueChange={setKind} className="gap-3">
              {KINDS.map((k) => (
                <RadioCard
                  key={k.id}
                  value={k.id}
                  label={k.name}
                  description={k.description}
                />
              ))}
            </RadioGroup>
          </div>

          <Field
            label="Add your logo"
            help="Optional — we&apos;ll use your initials until you do."
          >
            {/* No business row exists yet, so the uploaded URL rides
                along in a hidden field and completeSetup saves it. */}
            <LogoUpload fieldName="logoUrl" businessName={name || "Your business"} />
          </Field>
        </div>

        {state?.error && (
          <p role="alert" className="text-sm text-danger-600">
            {state.error}
          </p>
        )}

        <div className="flex flex-col gap-3 border-t border-ink-150 pt-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Skipping must always be possible. A first-run screen
              that blocks is an activation failure — but it still has
              to provision, or "skip" quietly means "start with a
              broken account". */}
          <Button
            variant="ghost"
            type="button"
            onClick={() => startSkip(async () => void (await skipSetup()))}
            loading={skipping}
          >
            Skip for now
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={pending}
            className="w-full sm:w-auto"
          >
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
