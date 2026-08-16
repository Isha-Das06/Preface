import Link from "next/link";
import { ArrowRight, Check, Clock, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui";
import { Reveal } from "@/components/marketing/reveal";
import { HeroDemo } from "@/components/marketing/hero-demo";
import { cn } from "@/lib/utils";

/**
 * M1 — Landing page.
 *
 * Structure follows the six-section skeleton that maps to how a
 * skeptical buyer evaluates software: hero → proof → problem →
 * product → evidence → close. See docs/08-visual-plan.md.
 */

function Section({
  children,
  className,
  bleed = false,
}: {
  children: React.ReactNode;
  className?: string;
  bleed?: boolean;
}) {
  return (
    <section
      className={cn(
        "mx-auto w-full max-w-[1100px] px-5",
        bleed ? "py-0" : "py-16 sm:py-24",
        className,
      )}
    >
      {children}
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="label-caps">{children}</span>;
}

/* ------------------------------------------------------------------ */

const THREAD = [
  ["Mon", "Here's a form to fill in."],
  ["Mon", "And here's a Drive folder for your logo."],
  ["Tue", "Sending the contract over now."],
  ["Wed", "Did the contract come through?"],
  ["Thu", "Just need the deposit and we're set."],
  ["Fri", "Can you book a time here?"],
  ["Mon", "Sorry to chase again —"],
] as const;

const REPLACES = [
  "Google Forms",
  "Drive folder",
  "DocuSign",
  "Stripe link",
  "Calendly",
  "A tracking spreadsheet",
];

export default function Landing() {
  return (
    <>
      {/* ============================================ HERO */}
      <Section className="!pt-12 !pb-16 sm:!pt-16">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-6">
            <Reveal>
              <h1 className="max-w-[15ch] text-4xl font-semibold tracking-[-0.02em] text-ink-900 sm:text-5xl">
                Stop sending new clients five different links.
              </h1>
            </Reveal>

            <Reveal delay={80}>
              <p className="measure text-lg text-ink-600">
                One link collects everything you need before work starts —
                information, files, contract, deposit, kickoff call. You watch
                it fill in.
              </p>
            </Reveal>

            <Reveal delay={160}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* One decision above the fold. The secondary is a
                    link, not a competing button. */}
                <Button asChild variant="primary" size="lg">
                  <Link href="/signup">
                    Create your first onboarding
                    <ArrowRight className="size-4 transition-transform duration-(--dur-fast) group-hover:translate-x-0.5 motion-reduce:transition-none" />
                  </Link>
                </Button>
                <Link
                  href="/o/demo"
                  className="flex min-h-11 items-center gap-1.5 rounded-md px-1 text-base font-medium text-ink-700 underline decoration-ink-300 underline-offset-4 transition-colors hover:text-accent-600 hover:decoration-accent-600"
                >
                  See what your client sees
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </Reveal>

            <Reveal delay={220}>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-500">
                <span className="flex items-center gap-1.5">
                  <Check className="size-4 text-accent-600" strokeWidth={2.5} />
                  Free for 14 days
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="size-4 text-accent-600" strokeWidth={2.5} />
                  No card required
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="size-4 text-accent-600" strokeWidth={2.5} />
                  Live in 10 minutes
                </span>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <HeroDemo />
          </Reveal>
        </div>
      </Section>

      {/* ==================================== PROOF STRIP
          Deliberately NOT a fabricated customer count or fake
          logos. Everything here is literally true today. Replace
          with a real number and real names the moment you have
          them — that is where the conversion lift actually is. */}
      <div className="border-y border-ink-150 bg-ink-100/40">
        <Section className="!py-7">
          <Reveal>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8">
              <span className="label-caps shrink-0">Replaces</span>
              <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {REPLACES.map((t) => (
                  <li
                    key={t}
                    className="text-base text-ink-500 line-through decoration-ink-300"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ========================================= PROBLEM */}
      <Section>
        <div className="flex flex-col gap-10">
          <Reveal className="flex flex-col gap-3">
            <Eyebrow>The week after they say yes</Eyebrow>
            <h2 className="text-3xl font-semibold tracking-[-0.01em] text-ink-900">
              You already know this week.
            </h2>
          </Reveal>

          <ol className="flex max-w-[540px] flex-col gap-2.5">
            {THREAD.map(([day, text], i) => (
              // Staggered so the reader feels the drag of the chase
              // rather than just reading about it.
              <Reveal as="li" key={i} delay={i * 90}>
                <div className="flex items-start gap-3">
                  <span className="w-9 shrink-0 pt-2.5 text-xs text-ink-400">
                    {day}
                  </span>
                  <span
                    className={cn(
                      "rounded-[16px] rounded-tl-[5px] border px-4 py-2.5 text-base",
                      i === THREAD.length - 1
                        ? "border-warn-600/30 bg-warn-100 text-warn-fg"
                        : "border-ink-200 bg-surface text-ink-700",
                    )}
                  >
                    {text}
                  </span>
                </div>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={THREAD.length * 90}>
            <p className="text-2xl font-medium tracking-[-0.01em] text-ink-900">
              Nine days. Nothing started.
            </p>
          </Reveal>

          {/* The stakes, not the annoyance. Link-counting gets
              attention; this is what actually makes someone switch —
              the moment a new client's first impression is a Google
              Form and a payment link. */}
          <Reveal delay={THREAD.length * 90 + 120}>
            <div className="flex max-w-[560px] flex-col gap-5 border-t border-ink-150 pt-8">
              <p className="text-base text-ink-500">
                And that's only your side of it. Here's theirs.
              </p>

              <div className="flex justify-end">
                <span className="rounded-[16px] rounded-tr-[5px] border border-ink-200 bg-ink-100 px-4 py-2.5 text-base text-ink-700">
                  Sorry — which link was the payment one again?
                </span>
              </div>

              <p className="text-lg text-ink-900">
                You just signed a client at{" "}
                <span className="font-medium">$5,000 a month</span>. This is
                their first week of actually working with you — and so far it
                looks like a Google Form and a payment link from a stranger.
              </p>

              <p className="measure-prose text-base text-ink-600">
                The work hasn't started and you're already explaining yourself.
                That's the part that costs you the next referral.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* =========================== SETUP — THE BUSINESS SIDE
          Restored after the redesign dropped it. The hero claims
          "live in 10 minutes" and nothing on the page supported
          that claim, which is exactly the objection a Dubsado
          refugee arrives with. */}
      <div className="border-t border-ink-150">
        <Section>
          <div className="flex flex-col gap-10">
            <Reveal className="flex flex-col gap-3">
              <Eyebrow>Your side</Eyebrow>
              <h2 className="max-w-[22ch] text-3xl font-semibold tracking-[-0.01em] text-ink-900">
                Set it up once. Ten minutes, not an afternoon.
              </h2>
              <p className="measure text-lg text-ink-600">
                Built for agencies, studios and consultants who onboard clients
                often enough that the chasing adds up.
              </p>
            </Reveal>

            <ol className="grid gap-8 md:grid-cols-3">
              {[
                [
                  "Pick a starting point",
                  "Marketing agency, design studio, consulting — or start from scratch. The questions are already written.",
                ],
                [
                  "Turn off what you don't need",
                  "No deposit? Turn payment off. Contracts handled elsewhere? Turn signing off. Drag to reorder.",
                ],
                [
                  "Add a client and send",
                  "Name, company, email. You get a link. That's the whole onboarding.",
                ],
              ].map(([title, body], i) => (
                <Reveal as="li" key={title} delay={i * 80}>
                  <div className="flex min-w-0 flex-col gap-2">
                    {/* Numbered because this is genuinely a sequence,
                        not decoration. */}
                    <span className="flex size-7 items-center justify-center rounded-full border border-ink-200 bg-surface text-sm font-medium text-ink-700">
                      {i + 1}
                    </span>
                    <h3 className="mt-1 text-lg font-semibold text-ink-900">
                      {title}
                    </h3>
                    <p className="text-base text-ink-600">{body}</p>
                  </div>
                </Reveal>
              ))}
            </ol>

            <Reveal delay={240}>
              <div className="flex flex-col gap-4 rounded-lg border border-ink-200 bg-surface p-5">
                <span className="label-caps">Your onboarding</span>
                <ul className="flex flex-col gap-1.5">
                  {[
                    ["Welcome", true],
                    ["Company information", true],
                    ["Project questionnaire", true],
                    ["Brand assets", true],
                    ["Account access", true],
                    ["Service agreement", true],
                    ["Deposit", false],
                    ["Kickoff call", true],
                  ].map(([label, on]) => (
                    <li
                      key={label as string}
                      className="flex items-center gap-2.5 text-sm"
                    >
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                          on
                            ? "border-accent-600 bg-accent-600"
                            : "border-ink-300 bg-surface",
                        )}
                      >
                        {on && (
                          <Check
                            className="size-2.5 text-on-accent"
                            strokeWidth={3.5}
                          />
                        )}
                      </span>
                      <span className={on ? "text-ink-900" : "text-ink-400"}>
                        {label}
                      </span>
                      {!on && (
                        <span className="text-xs text-ink-400">
                          — off for this client
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-ink-500">
                  Reorder, rename, turn off. No branching, no conditions,
                  nothing to learn.
                </p>
              </div>
            </Reveal>
          </div>
        </Section>
      </div>

      {/* ================================= PRODUCT — BENTO */}
      <div className="border-t border-ink-150 bg-ink-100/30">
        <Section>
          <div className="flex flex-col gap-10">
            <Reveal className="flex flex-col gap-3">
              <Eyebrow>What you get</Eyebrow>
              <h2 className="max-w-[20ch] text-3xl font-semibold tracking-[-0.01em] text-ink-900">
                One link out. Everything back.
              </h2>
            </Reveal>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Wide tile — the business side finally appears. */}
              <Reveal className="md:col-span-2">
                <BentoTile
                  title="Always know what you're waiting on"
                  body="The home screen answers one question: who hasn't finished, and what's missing."
                  className="h-full"
                >
                  <div className="flex flex-col gap-2.5">
                    {[
                      ["Northstar Labs", "Service agreement", "6 days"],
                      ["Vertex Health", "Brand assets", "2 days"],
                      ["Atlas Digital", "Deposit", "4 hours"],
                    ].map(([name, on, when]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between gap-3 rounded-md border border-ink-200 bg-surface px-3.5 py-2.5"
                      >
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-medium text-ink-900">
                            {name}
                          </span>
                          <span className="truncate text-xs text-ink-500">
                            Waiting on {on}
                          </span>
                        </div>
                        <span className="shrink-0 text-xs text-ink-400">
                          {when}
                        </span>
                      </div>
                    ))}
                  </div>
                </BentoTile>
              </Reveal>

              <Reveal delay={80}>
                <BentoTile
                  title="Reminders send themselves"
                  body="Two days, five days, then it stops. Nobody gets nagged forever."
                  className="h-full"
                >
                  <div className="flex flex-col gap-2 rounded-md border border-ink-200 bg-surface p-3.5">
                    <div className="flex items-center gap-2">
                      <Send className="size-3.5 text-accent-600" />
                      <span className="text-xs font-medium text-ink-900">
                        Two things left for your project
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-ink-500">
                      You're most of the way there — four of six done. Still to
                      go: the service agreement and the deposit.
                    </p>
                  </div>
                </BentoTile>
              </Reveal>

              <Reveal delay={40}>
                <BentoTile
                  title="No account for your client"
                  body="No password, no app, no verify-your-email wall. They tap the link and start."
                  className="h-full"
                  icon={ShieldCheck}
                />
              </Reveal>

              <Reveal delay={80}>
                <BentoTile
                  title="Ready-made questions"
                  body="Marketing, design, consulting. Real questions already written — change anything."
                  className="h-full"
                >
                  <div className="flex flex-col gap-1.5">
                    {[
                      "What does success look like in 90 days?",
                      "Who has final approval on creative?",
                    ].map((q) => (
                      <span
                        key={q}
                        className="rounded-md border border-ink-200 bg-surface px-3 py-2 text-xs text-ink-600"
                      >
                        {q}
                      </span>
                    ))}
                  </div>
                </BentoTile>
              </Reveal>

              <Reveal delay={120}>
                <BentoTile
                  title="One email when it's done"
                  body="Every answer, the files zipped, the signed contract, the receipt, the kickoff time."
                  className="h-full"
                  icon={Clock}
                />
              </Reveal>
            </div>
          </div>
        </Section>
      </div>

      {/* ================================== MID-PAGE CTA
          The page previously asked once at the top and once at the
          bottom, and never at the point where conviction peaks. */}
      <div className="border-y border-ink-150">
        <Section className="!py-12">
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <p className="text-xl font-medium tracking-[-0.01em] text-ink-900">
                How many links do you send a new client?
              </p>
              <Button asChild variant="primary" size="lg">
                <Link href="/signup">
                  Replace them with one
                  <ArrowRight className="size-4 transition-transform duration-(--dur-fast) group-hover:translate-x-0.5 motion-reduce:transition-none" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ================================= CLIENT EXPERIENCE */}
      <Section>
        <div className="grid items-center gap-12 md:grid-cols-2">
          <Reveal className="flex flex-col gap-4">
            <Eyebrow>Their side</Eyebrow>
            <h2 className="text-3xl font-semibold tracking-[-0.01em] text-ink-900">
              It looks like you, not like software.
            </h2>
            <p className="text-lg text-ink-600">
              Your logo, your colour, your name. They tap the link, see what's
              needed, and work through it — on their phone, over a few days if
              that's how it goes.
            </p>
            <p className="text-lg text-ink-600">
              It saves as they type. They never make an account.
            </p>
            <Link
              href="/o/demo"
              className="flex w-fit min-h-11 items-center gap-1.5 rounded-md text-base font-medium text-accent-600 underline decoration-accent-300 underline-offset-4 hover:decoration-accent-600"
            >
              Open a live example
              <ArrowRight className="size-3.5" />
            </Link>
          </Reveal>

          <Reveal delay={80}>
            <div className="portal mx-auto w-full max-w-[300px] rounded-[22px] border border-ink-200 bg-surface p-6">
              <div className="flex flex-col gap-4">
                <span className="text-xs text-ink-500">Step 5 of 6</span>
                <p className="text-xl font-semibold text-ink-900">Deposit</p>
                <div className="flex flex-col gap-1 rounded-md border border-ink-200 p-4">
                  <span className="label-caps">Amount due</span>
                  <span
                    className="text-3xl font-semibold tracking-tight text-ink-900"
                    data-numeric
                  >
                    $2,500.00
                  </span>
                  <span className="text-xs text-ink-500">
                    Project deposit · 50% of the first month
                  </span>
                </div>
                <span className="flex h-11 items-center justify-center rounded-[6px] bg-accent-600 text-sm font-medium text-on-accent">
                  Pay $2,500.00
                </span>
                <p className="text-xs text-ink-500">
                  Paid straight to Acme Agency. We never touch the money.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ======================================== SECURITY
          The product sits in the contract-and-deposit path for an
          unknown vendor, which is the loudest unvoiced objection on
          the page. Every claim here is literally true by design —
          no SOC 2 or GDPR badge, because neither is earned yet, and
          a fake compliance badge is worse than none. */}
      <div className="border-t border-ink-150">
        <Section>
          <div className="flex flex-col gap-10">
            <Reveal className="flex flex-col gap-3">
              <Eyebrow>Where the money and the documents go</Eyebrow>
              <h2 className="max-w-[22ch] text-3xl font-semibold tracking-[-0.01em] text-ink-900">
                We never hold your money or your client's card.
              </h2>
            </Reveal>

            <div className="grid gap-x-12 gap-y-7 md:grid-cols-2">
              {[
                [
                  "Payments go straight to your Stripe",
                  "Your account, your payout schedule. We never take a cut and never hold funds.",
                ],
                [
                  "Card details never touch us",
                  "They go directly to Stripe from your client's browser. We couldn't store them if we wanted to.",
                ],
                [
                  "No client accounts means no client passwords",
                  "There is no login to breach. Sensitive steps are gated behind a one-time code sent to their email.",
                ],
                [
                  "Uploads are private by default",
                  "Files are never publicly readable. Download links are signed and expire.",
                ],
                [
                  "Signatures carry an audit trail",
                  "Signer, email, timestamp, IP, and an immutable snapshot of the exact document shown.",
                ],
                [
                  "Your data leaves when you do",
                  "Export everything on cancellation. We keep it 30 days, then delete it.",
                ],
              ].map(([title, body], i) => (
                <Reveal key={title} delay={i * 50}>
                  <div className="flex min-w-0 items-start gap-3">
                    <ShieldCheck
                      className="mt-0.5 size-4 shrink-0 text-accent-600"
                      strokeWidth={2}
                    />
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-medium text-ink-900">
                        {title}
                      </h3>
                      <p className="text-sm text-ink-600">{body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* ==================================== HONEST SCOPE */}
      <div className="border-t border-ink-150 bg-ink-100/30">
        <Section>
          <Reveal className="flex max-w-[640px] flex-col gap-4">
            <Eyebrow>What it isn't</Eyebrow>
            <h2 className="text-3xl font-semibold tracking-[-0.01em] text-ink-900">
              It does one thing.
            </h2>
            <p className="text-lg text-ink-600">
              Preface isn't a CRM. It doesn't invoice, track time, or manage
              projects. If you want software that runs your whole business, buy
              HoneyBook — it's good.
            </p>
            <p className="text-lg text-ink-600">
              This is for the part between "yes, let's do it" and "we've
              started." That part is currently held together with email, and it
              shouldn't be.
            </p>
          </Reveal>
        </Section>
      </div>

      {/* ================================= PRICING PREVIEW
          Publishing the actual number on the landing page shortens
          the sales cycle and filters out unqualified traffic. A
          "contact us for pricing" gap is friction, not mystery. */}
      <Section>
        <div className="flex flex-col gap-10">
          <Reveal className="flex flex-col gap-3">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="text-3xl font-semibold tracking-[-0.01em] text-ink-900">
              From $49 a month.
            </h2>
            <p className="measure text-lg text-ink-600">
              Priced on how many onboardings are running at once. Completed ones
              don't count and stay available forever.
            </p>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Solo", "$49", "5 at a time"],
              ["Studio", "$99", "25 at a time"],
              ["Agency", "$199", "Unlimited"],
            ].map(([name, price, active], i) => (
              <Reveal key={name} delay={i * 60}>
                <div
                  className={cn(
                    "flex h-full flex-col gap-1 rounded-lg border bg-surface p-5",
                    "transition-colors duration-(--dur) hover:border-accent-300",
                    name === "Studio" ? "border-accent-600" : "border-ink-200",
                  )}
                >
                  <span className="text-sm font-medium text-ink-700">
                    {name}
                  </span>
                  <span
                    className="text-3xl font-semibold tracking-tight text-ink-900"
                    data-numeric
                  >
                    {price}
                    <span className="text-base font-normal text-ink-500">
                      /mo
                    </span>
                  </span>
                  <span className="text-sm text-ink-500">{active}</span>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200}>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base text-ink-600">
              <span>No transaction fees, ever.</span>
              <Link
                href="/pricing"
                className="flex min-h-11 items-center gap-1.5 font-medium text-accent-600 underline decoration-accent-300 underline-offset-4 hover:decoration-accent-600"
              >
                Compare plans
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* =========================================== FAQ */}
      <Section>
        <div className="flex flex-col gap-10">
          <Reveal className="flex flex-col gap-3">
            <Eyebrow>Before you ask</Eyebrow>
            <h2 className="text-3xl font-semibold tracking-[-0.01em] text-ink-900">
              Questions people ask.
            </h2>
          </Reveal>

          <dl className="grid gap-x-12 gap-y-8 md:grid-cols-2">
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
            ].map(([q, a], i) => (
              <Reveal key={q} delay={i * 60}>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <dt className="text-lg font-medium text-ink-900">{q}</dt>
                  <dd className="text-base text-ink-600">{a}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </Section>

      {/* ========================================== CLOSE */}
      <div className="border-t border-ink-150">
        <Section>
          <Reveal className="flex flex-col items-start gap-6">
            <h2 className="max-w-[18ch] text-4xl font-semibold tracking-[-0.02em] text-ink-900">
              Send your first onboarding link today.
            </h2>
            <p className="text-lg text-ink-600">
              Set it up in ten minutes. Free for 14 days, no card.
            </p>
            <Button asChild variant="primary" size="lg">
              <Link href="/signup">
                Create your first onboarding
                <ArrowRight className="size-4 transition-transform duration-(--dur-fast) group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </Link>
            </Button>
          </Reveal>
        </Section>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function BentoTile({
  title,
  body,
  children,
  icon: Icon,
  className,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
  icon?: typeof ShieldCheck;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group flex flex-col gap-4 rounded-lg border border-ink-200 bg-ink-50 p-5",
        // Moment 5 — the border warms on hover. Signals the tile is
        // a thing, without a shadow or a lift.
        "transition-colors duration-(--dur) hover:border-accent-300",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        {Icon && (
          <Icon
            className="mb-1 size-5 text-accent-600"
            strokeWidth={1.75}
          />
        )}
        <h3 className="text-base font-semibold text-ink-900">{title}</h3>
        <p className="text-sm text-ink-600">{body}</p>
      </div>
      {children}
    </div>
  );
}
