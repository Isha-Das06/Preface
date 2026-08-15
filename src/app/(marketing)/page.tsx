import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button, Card, CardBody } from "@/components/ui";

/**
 * M1 — Landing page. Copy verbatim from docs/05-copy.md.
 *
 * The hero shows the real C1 portal screen rather than an
 * illustration, and the message-thread section does the actual
 * selling — the reader recognises their own week in it.
 */

function Section({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`mx-auto w-full max-w-[1100px] px-5 py-16 sm:py-20 ${className ?? ""}`}
    >
      {children}
    </section>
  );
}

/** The real C1 screen, at portal density, in a phone frame. */
function PortalPreview() {
  const steps = [
    { title: "Company information", done: true },
    { title: "Project questionnaire", done: true },
    { title: "Brand assets", done: true },
    { title: "Account access", done: true },
    { title: "Service agreement", done: false, current: true },
    { title: "Deposit", done: false },
  ];

  return (
    <div className="portal mx-auto w-full max-w-[320px] rounded-[28px] border border-ink-200 bg-ink-50 p-3 shadow-md">
      <div className="flex flex-col gap-5 rounded-[18px] bg-surface p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-md bg-accent-600 text-[11px] font-semibold text-on-accent">
            AA
          </span>
          <span className="text-sm font-medium text-ink-900">Acme Agency</span>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xl font-semibold text-ink-900">Welcome back</p>
          <p className="text-xs text-ink-500">
            <span data-numeric>4</span> of <span data-numeric>6</span> complete
          </p>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-150">
          <div className="h-full w-[67%] rounded-full bg-accent-600" />
        </div>

        <ul className="flex flex-col gap-2.5">
          {steps.map((s) => (
            <li key={s.title} className="flex items-center gap-2.5">
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                  s.done
                    ? "border-accent-600 bg-accent-600"
                    : s.current
                      ? "border-accent-600 bg-surface"
                      : "border-ink-200 bg-surface"
                }`}
              >
                {s.done && (
                  <Check className="size-3 text-on-accent" strokeWidth={3} />
                )}
                {s.current && (
                  <span className="size-1.5 rounded-full bg-accent-600" />
                )}
              </span>
              <span
                className={`text-xs ${
                  s.done
                    ? "text-ink-500"
                    : s.current
                      ? "font-medium text-ink-900"
                      : "text-ink-500"
                }`}
              >
                {s.title}
              </span>
            </li>
          ))}
        </ul>

        <span className="flex h-10 items-center justify-center rounded-[6px] bg-accent-600 text-xs font-medium text-on-accent">
          Continue — Service agreement
        </span>
      </div>
    </div>
  );
}

const THREAD = [
  ["Mon", "Here's a form to fill in.", true],
  ["Mon", "And here's a Drive folder for your logo.", true],
  ["Tue", "Sending the contract over now.", true],
  ["Wed", "Did the contract come through?", true],
  ["Thu", "Just need the deposit and we're set.", true],
  ["Fri", "Can you book a time here?", true],
  ["Mon", "Sorry to chase again —", true],
] as const;

export default function Landing() {
  return (
    <>
      {/* ---------------------------------------------- Hero */}
      <Section className="!py-14 sm:!py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex min-w-0 flex-col gap-6">
            <h1 className="max-w-[16ch] text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
              Stop sending new clients five different links.
            </h1>
            <p className="measure text-lg text-ink-600">
              One link collects everything you need before work starts —
              information, files, contract, deposit, kickoff call. You watch it
              fill in.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild variant="primary" size="lg">
                <Link href="/signup">
                  Create your first onboarding
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg">
                <Link href="/o/demo">See a live example</Link>
              </Button>
            </div>
            <p className="text-sm text-ink-500">
              Free for 14 days. No card required.
            </p>
          </div>

          <PortalPreview />
        </div>
      </Section>

      {/* ------------------------------- The recognition moment */}
      <Section className="border-t border-ink-150">
        <div className="flex flex-col gap-8">
          <h2 className="text-3xl font-semibold text-ink-900">
            You already know this week.
          </h2>

          <ol className="flex max-w-[560px] flex-col gap-2.5">
            {THREAD.map(([day, text], i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-9 shrink-0 pt-2 text-xs text-ink-400">
                  {day}
                </span>
                <span className="rounded-[14px] rounded-tl-[4px] border border-ink-200 bg-surface px-4 py-2.5 text-base text-ink-700">
                  {text}
                </span>
              </li>
            ))}
          </ol>

          <p className="text-xl font-medium text-ink-900">
            Nine days. Nothing started.
          </p>
        </div>
      </Section>

      {/* ------------------------------------- Before / after */}
      <Section className="border-t border-ink-150">
        <div className="flex flex-col gap-8">
          <h2 className="text-3xl font-semibold text-ink-900">
            One link instead of six.
          </h2>

          <div className="grid items-start gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <span className="label-caps">Today</span>
              <ul className="flex flex-col gap-2">
                {[
                  "Google Form",
                  "Drive folder",
                  "DocuSign",
                  "Stripe link",
                  "Calendly",
                  "A spreadsheet tracking who did what",
                ].map((t) => (
                  <li
                    key={t}
                    className="rounded-md border border-dashed border-ink-300 px-4 py-2.5 text-base text-ink-600"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <span className="label-caps">With Preface</span>
              <div className="rounded-md border border-accent-600 bg-accent-50 px-4 py-5">
                <p className="text-lg font-medium text-ink-900">One link</p>
                <p className="mt-1 text-base text-ink-600">
                  Your client opens one page and works through a short
                  checklist. You see exactly where they are.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* --------------------------------------- How it works */}
      <Section className="border-t border-ink-150">
        <div className="flex flex-col gap-8">
          <h2 className="text-3xl font-semibold text-ink-900">
            Three steps. About ten minutes.
          </h2>

          <ol className="grid gap-6 md:grid-cols-3">
            {[
              [
                "Pick a starting point",
                "Marketing agency, design studio, consulting — or start from scratch. Real questions already written. Change anything.",
              ],
              [
                "Add a client",
                "Name, company, email. You get a link.",
              ],
              [
                "Send it",
                "They fill it in. You get a message when everything's done — answers, files, signed contract, deposit, kickoff time. All in one place.",
              ],
            ].map(([title, body], i) => (
              <li key={title} className="flex min-w-0 flex-col gap-2">
                {/* Numbered because this genuinely is a sequence. */}
                <span className="flex size-7 items-center justify-center rounded-full bg-ink-100 text-sm font-medium text-ink-700">
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
                <p className="text-base text-ink-600">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* ------------------------------------- Waiting-on view */}
      <Section className="border-t border-ink-150">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-semibold text-ink-900">
              Always know what you're waiting on.
            </h2>
            <p className="text-lg text-ink-600">
              The home screen answers one question: who hasn't finished, and
              what's missing?
            </p>
            <p className="text-lg text-ink-600">
              If someone stalls, we send the reminder. Not you.
            </p>
          </div>

          <Card>
            <CardBody className="flex flex-col gap-4">
              {[
                ["Northstar Labs", "Service agreement", "6 days"],
                ["Vertex Health", "Brand assets", "2 days"],
                ["Atlas Digital", "Deposit", "4 hours"],
              ].map(([name, on, when]) => (
                <div
                  key={name}
                  className="flex items-baseline justify-between gap-3 border-b border-ink-150 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-base font-medium text-ink-900">
                      {name}
                    </span>
                    <span className="truncate text-sm text-ink-500">
                      Waiting on {on}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm text-ink-400">{when}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </Section>

      {/* ------------------------------------- The client side */}
      <Section className="border-t border-ink-150">
        <div className="flex max-w-[640px] flex-col gap-4">
          <h2 className="text-3xl font-semibold text-ink-900">
            Your client never makes an account.
          </h2>
          <p className="text-lg text-ink-600">
            No password. No app. No "verify your email to continue."
          </p>
          <p className="text-lg text-ink-600">
            They tap the link, see what's needed, and work through it — on their
            phone, over a few days if that's how it goes. It saves as they go.
          </p>
          <p className="text-lg text-ink-600">
            It carries your logo and your name. It looks like you.
          </p>
        </div>
      </Section>

      {/* --------------------------------------- Honest scope */}
      <Section className="border-t border-ink-150">
        <div className="flex max-w-[640px] flex-col gap-4">
          <h2 className="text-3xl font-semibold text-ink-900">
            It does one thing.
          </h2>
          <p className="text-lg text-ink-600">
            Preface isn't a CRM. It doesn't invoice, track time, or manage
            projects. If you want software that runs your whole business, buy
            HoneyBook — it's good.
          </p>
          <p className="text-lg text-ink-600">
            This is for the part between "yes, let's do it" and "we've started."
            That part is currently held together with email, and it shouldn't
            be.
          </p>
        </div>
      </Section>

      {/* ----------------------------------------- Objections */}
      <Section className="border-t border-ink-150">
        <div className="flex flex-col gap-8">
          <h2 className="text-3xl font-semibold text-ink-900">
            Questions people ask.
          </h2>
          <dl className="grid gap-x-10 gap-y-7 md:grid-cols-2">
            {[
              [
                "Do I need to move my tools over?",
                "No. Payments run through your own Stripe account. Scheduling uses your existing Calendly or Cal.com link. Nothing moves.",
              ],
              [
                "What if my onboarding is different for every client?",
                "Turn steps on or off per client. Most people find it's more similar than they thought.",
              ],
              [
                "Is a typed signature actually valid?",
                "Yes, for ordinary service agreements — we record the signer, the exact document shown, the time, and the IP. If you need notarization or witnesses, use a dedicated signing tool for that contract.",
              ],
              [
                "What happens when someone doesn't finish?",
                "We remind them at two days and five days, then stop. You can send one manually any time. Nobody gets nagged forever.",
              ],
            ].map(([q, a]) => (
              <div key={q} className="flex min-w-0 flex-col gap-1.5">
                <dt className="text-lg font-medium text-ink-900">{q}</dt>
                <dd className="text-base text-ink-600">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      {/* ------------------------------------------ Final CTA */}
      <Section className="border-t border-ink-150">
        <div className="flex flex-col items-start gap-5">
          <h2 className="text-3xl font-semibold text-ink-900">
            Send your first onboarding link today.
          </h2>
          <p className="text-lg text-ink-600">
            Set it up in ten minutes. Free for 14 days, no card.
          </p>
          <Button asChild variant="primary" size="lg">
            <Link href="/signup">
              Create your first onboarding
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
