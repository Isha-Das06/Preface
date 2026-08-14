import { Check } from "lucide-react";
import { Card, CardBody } from "@/components/ui";
import { PortalShell } from "@/components/portal/portal-shell";
import { business, client, scheduling, steps } from "@/lib/mock";

/**
 * C8 — Complete.
 *
 * One restrained celebration, then immediately: what happens next.
 * The client's real question on finishing is not "did it work" but
 * "so when does something happen" — answering it here is what stops
 * the follow-up email.
 */
export default function DoneStep() {
  return (
    <PortalShell business={business}>
      <div className="flex flex-1 flex-col justify-center gap-8 py-8 animate-step-in">
        <div className="flex flex-col items-center gap-5 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent-100">
            <Check className="size-7 text-accent-600" strokeWidth={2.5} />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-ink-900">All done</h1>
            <p className="measure-prose text-base text-ink-500">
              Thanks, {client.contactName.split(" ")[0]}. {business.name} has
              everything they need to get started.
            </p>
          </div>
        </div>

        <Card>
          <CardBody className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <span className="label-caps">What happens next</span>
              <p className="text-base text-ink-700">
                Your team will be in touch before your kickoff call on{" "}
                <strong className="font-medium text-ink-900">
                  {scheduling.booked.date} at {scheduling.booked.time}
                </strong>
                .
              </p>
            </div>

            <ul className="flex flex-col gap-2 border-t border-ink-150 pt-4">
              {steps.map((s) => (
                <li
                  key={s.slug}
                  className="flex items-center gap-2.5 text-base text-ink-600"
                >
                  <Check
                    className="size-4 shrink-0 text-accent-600"
                    strokeWidth={3}
                  />
                  {s.title}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <p className="text-center text-sm text-ink-500">
          A copy of your signed agreement and receipt is in your email. Questions?
          Just reply to it — it goes straight to {business.name}.
        </p>
      </div>
    </PortalShell>
  );
}
