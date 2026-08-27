import Link from "next/link";
import { Check } from "lucide-react";
import { Button, Card, CardBody } from "@/components/ui";

/**
 * M2 — Pricing.
 *
 * There are no plans yet, so this page does not describe any. It said
 * $49/$99/$199 with a fourteen-day trial and a "Cancel any time" —
 * three commitments nothing in the product could keep, on the page a
 * visitor reads specifically to find out what they are agreeing to.
 *
 * The tiers are in docs/05-copy.md when there is billing to attach
 * them to. Until then the honest page is a short one.
 */

const INCLUDED = [
  "The whole onboarding flow, every step type",
  "Your logo, your colours, your name on the emails",
  "Unlimited clients and unlimited onboardings",
  "Automatic reminders and the weekly summary",
  "Contract signing with a full audit trail",
  "Deposits through your own payment link",
];

export default function Pricing() {
  return (
    <div className="mx-auto w-full max-w-[720px] px-5 py-16 sm:py-20">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-light tracking-[-0.03em] text-ink-900 sm:text-5xl">
          Free while we&apos;re in beta.
        </h1>
        <p className="text-lg text-ink-600">
          No card, no trial clock, no plan to pick. You get all of it while we
          get this right.
        </p>
      </div>

      <Card className="mt-10 border-accent-600">
        <CardBody className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <span className="label-caps">What it costs today</span>
            <span className="text-4xl font-semibold tracking-tight text-ink-900">
              Nothing
            </span>
          </div>

          <ul className="flex flex-col gap-2.5">
            {INCLUDED.map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <Check
                  className="mt-1 size-4 shrink-0 text-accent-600"
                  strokeWidth={2.5}
                />
                <span className="text-base text-ink-700">{line}</span>
              </li>
            ))}
          </ul>

          <Button asChild variant="primary" size="lg" className="w-full sm:w-fit">
            <Link href="/signup">Create your account</Link>
          </Button>
        </CardBody>
      </Card>

      <div className="mt-14 flex flex-col gap-7">
        <h2 className="text-3xl font-light tracking-[-0.02em] text-ink-900">
          The obvious questions
        </h2>
        <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {[
            [
              "What happens when the beta ends?",
              "We'll tell you well before it does, and you'll choose whether to carry on. Nobody gets charged for something they didn't opt into.",
            ],
            [
              "Do I lose what I built?",
              "No. Your onboardings, clients and their answers are yours either way.",
            ],
            [
              "What does it cost after?",
              "We haven't set that yet — we'd rather learn what this is worth to you first than guess now.",
            ],
            [
              "Do you take a cut of my deposits?",
              "No, and we never will. Your client pays on your own payment link, so the money never passes through us.",
            ],
          ].map(([q, a]) => (
            <div key={q} className="flex min-w-0 flex-col gap-1">
              <dt className="text-base font-medium text-ink-900">{q}</dt>
              <dd className="text-base text-ink-600">{a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
