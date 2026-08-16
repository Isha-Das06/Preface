import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { Button, Card, CardBody } from "@/components/ui";

/** M2 — Pricing. Copy verbatim from docs/05-copy.md. */

const PLANS = [
  {
    id: "solo",
    name: "Solo",
    price: "$49",
    active: "5 at a time",
    featured: false,
  },
  {
    id: "studio",
    name: "Studio",
    price: "$99",
    active: "25 at a time",
    featured: true,
  },
  {
    id: "agency",
    name: "Agency",
    price: "$199",
    active: "Unlimited",
    featured: false,
  },
];

const ROWS: [string, boolean[]][] = [
  ["Everything in onboarding", [true, true, true]],
  ["Your logo and colours", [true, true, true]],
  ["Automatic reminders", [true, true, true]],
  ["Payments via your Stripe", [true, true, true]],
  ["Contract signing", [true, true, true]],
  ["Remove our name from emails", [false, true, true]],
  ["Multiple workflows", [false, true, true]],
  ["Send from your own domain", [false, false, true]],
  ["Priority support", [false, false, true]],
];

export default function Pricing() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 py-16 sm:py-20">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-light tracking-[-0.03em] text-ink-900 sm:text-5xl">
          Simple pricing.
        </h1>
        <p className="text-lg text-ink-600">
          Free for 14 days. No card up front. Cancel any time.
        </p>
      </div>

      {/* Plans */}
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {PLANS.map((p, i) => (
          <Card
            key={p.id}
            className={p.featured ? "border-accent-600" : undefined}
          >
            <CardBody className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-semibold text-ink-900">
                  {p.name}
                </span>
                {p.featured && (
                  <span className="rounded-full bg-accent-100 px-2 py-[3px] text-xs font-medium text-accent-fg">
                    Most popular
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-5xl font-light tracking-[-0.03em] text-ink-900"
                  data-numeric
                >
                  {p.price}
                </span>
                <span className="text-base text-ink-500">/month</span>
              </div>

              <p className="text-base text-ink-600">
                <span className="font-medium text-ink-900">{p.active}</span>{" "}
                active onboardings
              </p>

              <Button
                asChild
                variant={p.featured ? "primary" : "secondary"}
                size="lg"
                fullWidth
              >
                <Link href="/signup">Start free trial</Link>
              </Button>

              {/* Per-plan feature list on mobile, where the
                  comparison table below is hidden. */}
              <ul className="flex flex-col gap-2 md:hidden">
                {ROWS.filter(([, v]) => v[i]).map(([label]) => (
                  <li
                    key={label}
                    className="flex items-start gap-2 text-sm text-ink-600"
                  >
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-accent-600"
                      strokeWidth={2.5}
                    />
                    {label}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Comparison — desktop only. On mobile the per-plan lists
          above carry the same information without a sideways scroll. */}
      <Card className="mt-6 hidden md:block">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="label-caps border-b border-ink-150 px-5 py-3 text-left font-medium">
                  Compare
                </th>
                {PLANS.map((p) => (
                  <th
                    key={p.id}
                    className="label-caps border-b border-ink-150 px-5 py-3 text-center font-medium"
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, values]) => (
                <tr key={label} className="border-b border-ink-150 last:border-0">
                  <td className="px-5 py-3 text-ink-700">{label}</td>
                  {values.map((v, i) => (
                    <td key={i} className="px-5 py-3 text-center">
                      {v ? (
                        <Check
                          className="mx-auto size-4 text-accent-600"
                          strokeWidth={2.5}
                        />
                      ) : (
                        <Minus className="mx-auto size-4 text-ink-300" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-6 max-w-[640px] text-base text-ink-600">
        <span className="font-medium text-ink-900">
          "Active" means still being filled in.
        </span>{" "}
        Completed onboardings don't count and stay available forever. A
        5-onboarding plan handles roughly 5–15 new clients a month depending on
        how fast people move. Annual billing saves two months.
      </p>

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-ink-900">Why not free?</h2>
          <p className="text-base text-ink-600">
            Because we'd rather build the product than build a funnel. Fourteen
            days is enough to send real links to real clients and know whether
            this works for you.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-ink-900">
            What you don't pay for
          </h2>
          <p className="text-base text-ink-600">
            No transaction fees. Client payments go straight into your Stripe
            account — we never touch the money and we don't take a cut.
          </p>
        </div>
      </div>

      <div className="mt-14 flex flex-col gap-7">
        <h2 className="text-3xl font-light tracking-[-0.02em] text-ink-900">
          Pricing questions
        </h2>
        <dl className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          {[
            [
              "What if I go over my limit?",
              "We tell you and you upgrade. Nothing breaks, nothing gets locked, no client ever sees an error.",
            ],
            ["Can I change plans?", "Any time, prorated."],
            ["Do you offer annual?", "Yes, two months free."],
            [
              "What happens to my data if I cancel?",
              "Export everything first. We keep it 30 days, then delete it.",
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
