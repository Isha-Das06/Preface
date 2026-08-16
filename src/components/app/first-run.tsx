import Link from "next/link";
import { ArrowRight, Check, Send, Sparkles, Workflow } from "lucide-react";
import { Button, Card, CardBody } from "@/components/ui";
import { NewClientButton } from "./new-client";
import { cn } from "@/lib/utils";

/**
 * Day one — the highest-leverage screen in the business app.
 *
 * Research is blunt: users hit empty states more often than any
 * modal or tour, and most SaaS products lose 40–60% of new users in
 * week one inside the gap between signup and first value. So this
 * screen is not a blank slate with an "Add client" button — it is a
 * checklist that names the finish line and shows how close it is.
 *
 * The preview underneath is sample data, clearly labelled. Showing
 * what the screen becomes beats describing it.
 */

const STEPS = [
  {
    id: "account",
    title: "Create your account",
    body: "Done.",
    done: true,
  },
  {
    id: "workflow",
    title: "Build your onboarding",
    body: "Start from a template, turn off anything you don't need.",
    done: true,
    href: "/app/workflow",
    cta: "Review it",
    icon: Workflow,
  },
  {
    id: "client",
    title: "Add your first client",
    body: "Name, company, email. You'll get a link straight away.",
    done: false,
    icon: Send,
  },
];

export function FirstRun() {
  const remaining = STEPS.filter((s) => !s.done).length;

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardBody className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2 text-sm font-medium text-accent-600">
              <Sparkles className="size-4" />
              {remaining === 0
                ? "You're set up"
                : `${remaining} step to your first onboarding link`}
            </span>
            <h2 className="text-xl font-semibold text-ink-900">
              Get your first client onboarded
            </h2>
            <p className="measure text-sm text-ink-500">
              Most people are sending their first link about ten minutes after
              signing up.
            </p>
          </div>

          <ol className="flex flex-col gap-3">
            {STEPS.map((step) => (
              <li
                key={step.id}
                className={cn(
                  "flex items-start gap-3 rounded-md border p-4",
                  step.done
                    ? "border-ink-150 bg-ink-50"
                    : "border-accent-600 bg-accent-50",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                    step.done
                      ? "border-accent-600 bg-accent-600"
                      : "border-accent-600 bg-surface",
                  )}
                >
                  {step.done ? (
                    <Check className="size-3 text-on-accent" strokeWidth={3} />
                  ) : (
                    <span className="size-1.5 rounded-full bg-accent-600" />
                  )}
                </span>

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      step.done ? "text-ink-500" : "text-ink-900",
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="text-sm text-ink-500">{step.body}</span>
                </div>

                {!step.done && <NewClientButton />}
                {step.done && step.href && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={step.href}>
                      {step.cta}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                )}
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      {/* Sample data, unmistakably labelled. Showing what the screen
          becomes is more useful than a sentence describing it — and
          mislabelling it as real would be worse than showing
          nothing. */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="label-caps">Preview</span>
          <span className="h-px flex-1 bg-ink-150" />
          <span className="text-xs text-ink-400">
            Example data — this is how it will look
          </span>
        </div>

        <div
          aria-hidden
          className="pointer-events-none flex select-none flex-col gap-3 opacity-55"
        >
          {[
            ["Northstar Labs", "Service agreement", "6 days", 5],
            ["Vertex Health", "Brand assets", "2 days", 2],
          ].map(([name, on, when, done]) => (
            <Card key={name as string}>
              <CardBody className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-base font-medium text-ink-900">
                    {name}
                  </span>
                  <span className="truncate text-sm text-ink-600">
                    Waiting on{" "}
                    <span className="font-medium text-ink-900">{on}</span>
                    <span className="text-ink-400"> · {when}</span>
                  </span>
                  <div className="mt-1 flex items-center gap-2.5">
                    <span className="h-1.5 w-28 overflow-hidden rounded-full bg-ink-150">
                      <span
                        className="block h-full rounded-full bg-accent-600"
                        style={{ width: `${((done as number) / 7) * 100}%` }}
                      />
                    </span>
                    <span className="text-xs text-ink-500" data-numeric>
                      {done}/7
                    </span>
                  </div>
                </div>
                <span className="shrink-0 rounded-[6px] border border-ink-200 px-3 py-1.5 text-xs text-ink-500">
                  Remind
                </span>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
