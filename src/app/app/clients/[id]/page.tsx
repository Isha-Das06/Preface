import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Copy, ExternalLink, FileText } from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Divider,
  ProgressBar,
  StatusBadge,
  StepList,
  type Step,
} from "@/components/ui";
import { MobileHeader } from "@/components/app/nav";
import { RemindButton } from "@/components/app/remind-button";
import { CopyLinkButton } from "@/components/app/copy-link";
import { activity, clientById, clientSteps, humanWait } from "@/lib/mock-app";
import { questions } from "@/lib/mock";

/**
 * B3 — Client detail.
 *
 * This is where the customer decides whether to renew: it has to
 * feel like a delivered package, not a database view. Everything
 * the client submitted is readable on one page without clicking
 * into six sub-screens.
 */
export default async function ClientDetail({
  params,
}: PageProps<"/app/clients/[id]">) {
  const { id } = await params;
  const client = clientById(id);
  if (!client) notFound();

  const steps: Step[] = clientSteps.map((s, i) => ({
    id: String(i),
    title: s.title,
    meta: s.meta,
    state: s.status as Step["state"],
  }));

  return (
    <>
      <MobileHeader title="Preface" />
      <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <Link
          href="/app"
          className="-mx-2 flex w-fit min-h-9 items-center gap-1.5 rounded-md px-2 text-sm text-ink-500 transition-colors hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)"
        >
          <ArrowLeft className="size-4" />
          Waiting on
        </Link>

        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Avatar name={client.company} size="lg" />
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-semibold text-ink-900">
                  {client.company}
                </h1>
                <StatusBadge status={client.status} />
              </div>
              <p className="text-sm text-ink-500">
                {client.contactName} · {client.email}
              </p>
              <p className="text-sm text-ink-500">
                Sent {client.sentAt} · Last activity {client.lastActivity}
                {client.remindersSent > 0 && (
                  <> · {client.remindersSent} reminders sent</>
                )}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <CopyLinkButton />
            {client.status !== "completed" && (
              <RemindButton
                client={client.company}
                contact={client.contactName}
                remaining={client.total - client.completed}
                variant="primary"
              />
            )}
          </div>
        </header>

        {/* min-w-0 on both columns is load-bearing. Grid items default
            to min-width:auto and refuse to shrink below their content's
            intrinsic minimum, so without it a long filename pushes the
            column past the viewport and the whole page scrolls
            sideways on mobile. minmax(0,1fr) only covers the lg case. */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
                <span className="text-sm text-ink-500" data-numeric>
                  {client.completed} of {client.total}
                </span>
              </CardHeader>
              <CardBody className="flex flex-col gap-5">
                <ProgressBar
                  value={client.completed}
                  total={client.total}
                />
                <StepList steps={steps} />
                {client.waitingOn && (
                  <div className="flex items-center gap-2 rounded-md bg-warn-100 px-3 py-2.5 text-sm text-warn-fg">
                    Waiting on {client.waitingOn} for{" "}
                    {humanWait(client.waitingHours ?? 0)}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What they submitted</CardTitle>
                <Button size="sm">
                  <FileText className="size-3.5" />
                  Copy all
                </Button>
              </CardHeader>
              <CardBody className="flex flex-col gap-6">
                <section className="flex flex-col gap-3">
                  <h3 className="label-caps">Company information</h3>
                  <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                    {[
                      ["Company", client.company],
                      ["Contact", client.contactName],
                      ["Email", client.email],
                      ["Phone", "+1 415 555 0142"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex flex-col">
                        <dt className="text-xs text-ink-500">{k}</dt>
                        <dd className="text-sm text-ink-900">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <Divider />

                <section className="flex flex-col gap-4">
                  <h3 className="label-caps">Project questionnaire</h3>
                  {questions.map((q) => (
                    <div key={q.id} className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-ink-700">
                        {q.prompt}
                      </p>
                      <p className="measure text-sm text-ink-600">{q.answer}</p>
                    </div>
                  ))}
                </section>

                <Divider />

                <section className="flex flex-col gap-3">
                  <h3 className="label-caps">Files</h3>
                  <ul className="flex flex-col gap-2">
                    {[
                      ["northstar-logo.svg", "24 KB"],
                      ["northstar-brand-guidelines-2025.pdf", "4.2 MB"],
                      ["q2-campaign-assets.zip", "18.6 MB"],
                    ].map(([name, size]) => (
                      <li
                        key={name}
                        className="flex items-center gap-3 rounded-md border border-ink-150 px-3 py-2"
                      >
                        <FileText className="size-4 shrink-0 text-ink-400" />
                        <span className="min-w-0 flex-1 truncate text-sm text-ink-900">
                          {name}
                        </span>
                        <span
                          className="shrink-0 text-xs text-ink-500"
                          data-numeric
                        >
                          {size}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button size="sm" className="w-fit">
                    Download all as zip
                  </Button>
                </section>
              </CardBody>
            </Card>
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardBody>
                <ol className="flex flex-col gap-3.5">
                  {activity.map((a, i) => (
                    <li key={i} className="flex flex-col gap-0.5">
                      <span className="text-sm text-ink-900">{a.text}</span>
                      <span className="text-xs text-ink-500">{a.at}</span>
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="flex flex-col gap-3">
                <span className="label-caps">Their link</span>
                <span className="font-mono text-xs break-all text-ink-600">
                  app.preface.co/o/k3Xm9pQr2LwTv8Bn
                </span>
                <div className="flex gap-2">
                  <CopyLinkButton />
                  <Button asChild size="sm" variant="ghost">
                    <Link href="/o/demo" target="_blank">
                      <ExternalLink className="size-3.5" />
                      Preview
                    </Link>
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
