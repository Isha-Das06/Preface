import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  EmptyState,
  ProgressBar,
  StatusBadge,
} from "@/components/ui";
import { AppPage } from "@/components/app/page-shell";
import { NewClientButton } from "@/components/app/new-client";
import { RemindButton } from "@/components/app/remind-button";
import { FirstRun } from "@/components/app/first-run";
import { getClients, getWaitingOn, getWorkflows } from "@/lib/queries";

/**
 * B1 — Waiting on. The app root.
 *
 * A client list is a filing cabinet and nobody opens a filing
 * cabinet daily. This screen answers the one question that brings a
 * business back: who is stuck, and on what. Sorted longest-wait
 * first, so the most stuck client is impossible to miss.
 */

function humanWait(hours: number | null) {
  if (hours === null) return "not sent yet";
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const d = Math.floor(hours / 24);
  return `${d} day${d === 1 ? "" : "s"}`;
}

export default async function WaitingOnPage({
  searchParams,
}: PageProps<"/app">) {
  const { empty } = await searchParams;
  const forceEmpty = empty === "1";

  const [all, waiting] = await Promise.all([getClients(), getWaitingOn()]);
  const workflows = await getWorkflows();

  const rows = forceEmpty ? [] : waiting;
  const finished = forceEmpty
    ? 0
    : all.filter((c) => c.status === "completed").length;

  // Day one: no clients at all. Shows the activation checklist
  // rather than a blank slate — this is the screen that decides
  // whether a signup ever becomes a customer.
  if (forceEmpty || all.length === 0) {
    return (
      <AppPage
        title="Welcome to Preface"
        description="One link between a client saying yes and the work starting."
      >
        <FirstRun />
      </AppPage>
    );
  }

  return (
    <AppPage
      title="Waiting on"
      description={
        rows.length > 0
          ? `${rows.length} ${rows.length === 1 ? "client hasn't" : "clients haven't"} finished onboarding.`
          : undefined
      }
      actions={<NewClientButton workflows={workflows} />}
    >
      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={CheckCircle2}
            title="Nothing to chase"
            description="Every client is up to date. You'll see anyone who stalls here."
            action={<NewClientButton workflows={workflows} />}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((c) => (
            <Card key={c.id}>
              <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar name={c.company} />
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <Link
                        href={`/app/clients/${c.id}`}
                        className="truncate text-base font-medium text-ink-900 hover:text-accent-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)"
                      >
                        {c.company}
                      </Link>
                      <StatusBadge status={c.status} />
                    </div>

                    {/* The two facts that matter: what's blocking,
                        and how long it's been blocked. Kept to one
                        line — the step name truncates, the duration
                        never does, so every card stays the same
                        height and the list keeps its rhythm. */}
                    <p className="flex min-w-0 items-baseline gap-1 text-sm text-ink-600">
                      <span className="shrink-0">Waiting on</span>
                      <span className="truncate font-medium text-ink-900">
                        {c.waitingOn ?? "—"}
                      </span>
                      <span className="shrink-0 text-ink-400">
                        · {humanWait(c.waitingHours)}
                      </span>
                    </p>

                    <div className="flex items-center gap-2.5 pt-1">
                      <ProgressBar
                        value={c.completed}
                        total={c.total}
                        className="w-28"
                      />
                      <span className="text-xs text-ink-500" data-numeric>
                        {c.completed}/{c.total}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <RemindButton
                    onboardingId={c.onboardingId}
                    client={c.company}
                    contact={c.contactName || c.company}
                    remaining={c.total - c.completed}
                  />
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/app/clients/${c.id}`}>
                      Open
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {finished > 0 && (
        <p className="text-sm text-ink-500">
          <span data-numeric>{finished}</span>{" "}
          {finished === 1 ? "client has" : "clients have"} finished onboarding.{" "}
          <Link
            href="/app/clients"
            className="font-medium text-accent-600 underline underline-offset-2"
          >
            See all clients
          </Link>
        </p>
      )}
    </AppPage>
  );
}
