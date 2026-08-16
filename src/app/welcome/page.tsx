"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import {
  Button,
  Field,
  Input,
  PendingButton,
  RadioCard,
  RadioGroup,
} from "@/components/ui";

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
  const [name, setName] = useState("");
  const [kind, setKind] = useState("marketing");

  return (
    <div className="marketing min-h-dvh">
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-8 px-5 py-14 sm:py-20">
        <div className="flex flex-col gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-accent-600 text-sm font-semibold text-on-accent">
            P
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">
            Let's set you up.
          </h1>
          <p className="text-lg text-ink-500">Takes about two minutes.</p>
        </div>

        <div className="flex flex-col gap-7">
          <Field
            label="What's your business called?"
            help="Shown to clients at the top of their onboarding page."
            required
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Agency"
              autoFocus
            />
          </Field>

          <div className="flex flex-col gap-3">
            <span className="text-base font-medium text-ink-700">
              What kind of work do you do?
            </span>
            <p className="-mt-2 text-sm text-ink-500">
              We'll start you off with questions that suit it. Change anything
              afterwards.
            </p>
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
            help="Optional — we'll use your initials until you do."
          >
            <PendingButton
              className="w-fit"
              reason="Available once file storage is connected"
            >
              <Upload className="size-4" />
              Upload logo
            </PendingButton>
          </Field>
        </div>

        <div className="flex flex-col gap-3 border-t border-ink-150 pt-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Skipping must always be possible. A first-run screen
              that blocks is an activation failure. */}
          <Button asChild variant="ghost">
            <Link href="/app/workflow">Skip for now</Link>
          </Button>
          <Button
            asChild
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
          >
            <Link href="/app/workflow">Continue</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
