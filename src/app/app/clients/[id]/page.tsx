import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import {
  Button,
  Avatar,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Divider,
  ProgressBar,
  StatusBadge,
  StepList,
  ToastButton,
  type Step,
} from "@/components/ui";
import { MobileHeader } from "@/components/app/nav";
import { RemindButton } from "@/components/app/remind-button";
import { CopyLinkButton } from "@/components/app/copy-link";
import { getClient, getOnboardingFiles, relativeTime } from "@/lib/queries";

/**
 * B3 — Client detail.
 *
 * This is where the customer decides whether to renew: it has to
 * feel like a delivered package, not a database view. Everything
 * the client submitted is readable on one page without clicking
 * into six sub-screens.
 */

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const EVENT_LABELS: Record<string, string> = {
  client_created: "Client added",
  link_sent: "Onboarding link sent",
  reminder_sent: "Reminder sent",
  link_opened: "Opened the link",
  step_completed: "Completed a step",
  email_verified: "Verified their email",
  agreement_signed: "Signed the agreement",
  onboarding_completed: "Finished onboarding",
  opened: "Opened the onboarding link",
  completed: "Finished onboarding",
};

export default async function ClientDetail({
  params,
}: PageProps<"/app/clients/[id]">) {
  const { id } = await params;
  const record = await getClient(id);
  if (!record) notFound();

  const { client, onboarding, steps, events } = record;

  const completed = steps.filter((s) => s.completed_at).length;
  const firstOpen = steps.find((s) => !s.completed_at);

  const listSteps: Step[] = steps.map((s) => ({
    id: s.id,
    title: s.title,
    state: s.completed_at
      ? "complete"
      : s.id === firstOpen?.id
        ? "current"
        : "upcoming",
    optional: !s.required,
  }));

  // Only render sections the client actually has. A "Files" heading
  // above nothing reads as broken.
  // Prompts and labels live in the step's snapshotted CONFIG; what the
  // client typed lives in DATA, keyed by field name or question index.
  // Pairing them here rather than storing the prompt alongside every
  // answer is what keeps a signed-off questionnaire matching the
  // wording that was actually put in front of them.
  const questionnaire = steps.find((s) => s.type === "questionnaire");
  const prompts =
    (questionnaire?.config?.questions as { prompt: string }[] | undefined) ??
    [];
  const rawAnswers = (questionnaire?.data?.answers ?? {}) as Record<
    string,
    string
  >;
  const answers = prompts
    .map((q, i) => ({ prompt: q.prompt, answer: rawAnswers[String(i)] ?? "" }))
    .filter((a) => a.answer);

  const infoStep = steps.find((s) => s.type === "info");
  const infoFields =
    (infoStep?.config?.fields as { name: string; label: string }[] | undefined) ??
    [];
  const infoValues = (infoStep?.data?.values ?? {}) as Record<string, string>;
  const info = infoFields
    .map((f) => ({ label: f.label, value: infoValues[f.name] ?? "" }))
    .filter((f) => f.value);

  const fileStepIds = steps.filter((s) => s.type === "files").map((s) => s.id);
  const files = await getOnboardingFiles(fileStepIds);

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
                <StatusBadge status={onboarding.status} />
              </div>
              <p className="text-sm text-ink-500">
                {client.name ? `${client.name} · ` : ""}
                {client.email}
              </p>
              <p className="text-sm text-ink-500">
                {onboarding.sent_at
                  ? `Sent ${relativeTime(onboarding.sent_at)}`
                  : "Not sent yet"}
                {onboarding.last_activity_at &&
                  ` · Last activity ${relativeTime(onboarding.last_activity_at)}`}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <CopyLinkButton token={onboarding.token} />
            {onboarding.status !== "completed" && (
              <RemindButton
                onboardingId={onboarding.id}
                client={client.company}
                contact={client.name ?? client.company}
                remaining={steps.length - completed}
                variant="primary"
              />
            )}
          </div>
        </header>

        {/* min-w-0 on both columns is load-bearing. Grid items default
            to min-width:auto and refuse to shrink below their content's
            intrinsic minimum, so without it a long filename pushes the
            column past the viewport and the page scrolls sideways on
            mobile. minmax(0,1fr) only covers the lg case. */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
                <span className="text-sm text-ink-500" data-numeric>
                  {completed} of {steps.length}
                </span>
              </CardHeader>
              <CardBody className="flex flex-col gap-5">
                <ProgressBar value={completed} total={steps.length} />
                {steps.length === 0 ? (
                  <p className="text-sm text-ink-500">
                    This onboarding has no steps yet — none of your workflow
                    steps were set up when it was created.
                  </p>
                ) : (
                  <StepList steps={listSteps} />
                )}
                {firstOpen && (
                  <div className="rounded-md bg-warn-100 px-3 py-2.5 text-sm text-warn-fg">
                    Waiting on {firstOpen.title}
                  </div>
                )}
              </CardBody>
            </Card>

            {(info.length > 0 || answers.length > 0 || files.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>What they submitted</CardTitle>
                  <ToastButton
                    size="sm"
                    message="Everything copied"
                    description="Ready to paste wherever you keep client records."
                  >
                    <FileText className="size-3.5" />
                    Copy all
                  </ToastButton>
                </CardHeader>
                <CardBody className="flex flex-col gap-6">
                  {info.length > 0 && (
                    <section className="flex flex-col gap-3">
                      <h3 className="label-caps">Company information</h3>
                      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                        {info.map((f) => (
                          <div key={f.label} className="flex flex-col">
                            <dt className="text-xs text-ink-500">{f.label}</dt>
                            <dd className="text-sm text-ink-900">{f.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  )}

                  {info.length > 0 && answers.length > 0 && <Divider />}

                  {answers.length > 0 && (
                    <section className="flex flex-col gap-4">
                      <h3 className="label-caps">Questionnaire</h3>
                      {answers.map((a, i) => (
                        <div key={i} className="flex flex-col gap-1">
                          <p className="text-sm font-medium text-ink-700">
                            {a.prompt}
                          </p>
                          <p className="measure text-sm text-ink-600">
                            {a.answer}
                          </p>
                        </div>
                      ))}
                    </section>
                  )}

                  {files.length > 0 && (
                    <>
                      {(info.length > 0 || answers.length > 0) && <Divider />}
                      <section className="flex flex-col gap-3">
                        <h3 className="label-caps">Files</h3>
                        <ul className="flex flex-col gap-2">
                          {files.map((f) => (
                            <li key={f.id} className="flex items-center gap-2">
                              <FileText className="size-4 shrink-0 text-ink-400" />
                              {f.url ? (
                                <a
                                  href={f.url}
                                  className="min-w-0 flex-1 truncate text-sm text-accent-600 underline underline-offset-2 hover:text-accent-700"
                                >
                                  {f.filename}
                                </a>
                              ) : (
                                <span className="min-w-0 flex-1 truncate text-sm text-ink-900">
                                  {f.filename}
                                </span>
                              )}
                              <span
                                className="shrink-0 text-xs text-ink-500"
                                data-numeric
                              >
                                {humanSize(f.sizeBytes)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    </>
                  )}
                </CardBody>
              </Card>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardBody>
                {events.length === 0 ? (
                  <p className="text-sm text-ink-500">
                    Nothing yet. Activity appears as they work through it.
                  </p>
                ) : (
                  <ol className="flex flex-col gap-3.5">
                    {events.map((e) => (
                      <li key={e.id} className="flex flex-col gap-0.5">
                        <span className="text-sm text-ink-900">
                          {EVENT_LABELS[e.type] ?? e.type}
                        </span>
                        <span className="text-xs text-ink-500">
                          {relativeTime(e.created_at)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody className="flex flex-col gap-3">
                <span className="label-caps">Their link</span>
                <span className="font-mono text-xs break-all text-ink-600">
                  /o/{onboarding.token}
                </span>
                <div className="flex flex-wrap gap-2">
                  <CopyLinkButton token={onboarding.token} />
                  <Button asChild size="sm" variant="ghost">
                    <a
                      href={`/o/${onboarding.token}`}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <ExternalLink className="size-3.5" />
                      Preview
                    </a>
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
