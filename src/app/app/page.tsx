import Link from "next/link";
import { ArrowRight, CheckCircle2, Plus } from "lucide-react";
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
import { clients, humanWait, waitingOn } from "@/lib/mock-app";

/**
 * B1 — Waiting on. The app root.
 *
 * A client list is a filing cabinet and nobody opens a filing
 * cabinet daily. This screen answers the one question that brings a
 * business back: who is stuck, and on what. Sorted longest-wait
 * first, so the most stuck client is impossible to miss.
 */
export default function WaitingOnPage() {
  const finishedThisWeek = clients.filter(
    (c) => c.status === "completed",
  ).length;

  return (
    <AppPage
      title="Waiting on"
      description={
        waitingOn.length > 0
          ? `${waitingOn.length} clients haven't finished onboarding.`
          : undefined
      }
      actions={<NewClientButton />}
    >
      {waitingOn.length === 0 ? (
        <Card>
          <EmptyState
            icon={CheckCircle2}
            title="Nothing to chase"
            description="Every client is up to date."
            action={<NewClientButton />}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {waitingOn.map((c) => (
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
                        and how long it's been blocked.

                        Kept to a single line — the step name truncates
                        while the duration never does. A wrapping line
                        here made one card taller than its neighbours
                        and broke the rhythm of the list. */}
                    <p className="flex min-w-0 items-baseline gap-1 text-sm text-ink-600">
                      <span className="shrink-0">Waiting on</span>
                      <span className="truncate font-medium text-ink-900">
                        {c.waitingOn}
                      </span>
                      <span className="shrink-0 text-ink-400">
                        · {humanWait(c.waitingHours ?? 0)}
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
                    client={c.company}
                    contact={c.contactName}
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

      {finishedThisWeek > 0 && (
        <p className="text-sm text-ink-500">
          <span data-numeric>{finishedThisWeek}</span> clients finished
          onboarding recently.{" "}
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
