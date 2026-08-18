import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { Card, CardBody } from "@/components/ui";
import { PortalShell } from "@/components/portal/portal-shell";
import { getPortal } from "@/lib/portal";

/**
 * C8 — Complete.
 *
 * One restrained celebration, then immediately: what happens next.
 * The client's real question on finishing is not "did it work" but
 * "so when does something happen" — answering it here is what stops
 * the follow-up email.
 */
export default async function DoneStep({
  params,
}: PageProps<"/o/[token]/done">) {
  const { token } = await params;
  const portal = await getPortal(token);
  if (!portal) redirect(`/o/${token}/expired`);

  const { business, client, steps } = portal;
  const firstName = (client.name ?? client.company).split(" ")[0];
  const completed = steps.filter((s) => s.completedAt);
  const outstanding = steps.filter((s) => s.required && !s.completedAt);

  return (
    <PortalShell business={business} token={token}>
      <div className="flex flex-1 flex-col justify-center gap-8 py-8 animate-step-in">
        <div className="flex flex-col items-center gap-5 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent-100">
            <Check className="size-7 text-accent-600" strokeWidth={2.5} />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-ink-900">All done</h1>
            <p className="measure-prose text-base text-ink-500">
              Thanks, {firstName}. {business.name} has everything they need to
              get started.
            </p>
          </div>
        </div>

        <Card>
          <CardBody className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <span className="label-caps">What happens next</span>
              <p className="text-base text-ink-700">
                {business.name} has been told you&apos;re finished and will be
                in touch shortly.
              </p>
            </div>

            <ul className="flex flex-col gap-2 border-t border-ink-150 pt-4">
              {completed.map((s) => (
                <li
                  key={s.id}
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

        {outstanding.length > 0 && (
          <p className="text-center text-sm text-ink-500">
            Still outstanding: {outstanding.map((s) => s.title).join(", ")}.
          </p>
        )}

        <p className="text-center text-sm text-ink-500">
          Questions? Email {business.reply_to_email ?? business.name} and it
          goes straight to them.
        </p>
      </div>
    </PortalShell>
  );
}
