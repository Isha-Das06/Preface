import Link from "next/link";
import { Users } from "lucide-react";
import {
  Avatar,
  Card,
  EmptyState,
  ProgressBar,
  StatusBadge,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
} from "@/components/ui";
import { AppPage } from "@/components/app/page-shell";
import { NewClientButton } from "@/components/app/new-client";
import { clients, humanWait } from "@/lib/mock-app";

/**
 * B2 — Clients.
 *
 * Below 768px the table becomes stacked cards rather than scrolling
 * sideways. A data table you have to drag horizontally on a phone is
 * a table nobody reads.
 */
export default function ClientsPage() {
  if (clients.length === 0) {
    return (
      <AppPage title="Clients">
        <Card>
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Add your first one and we'll generate their onboarding link."
            action={<NewClientButton />}
          />
        </Card>
      </AppPage>
    );
  }

  return (
    <AppPage
      title="Clients"
      description={`${clients.length} clients`}
      actions={<NewClientButton />}
    >
      {/* Desktop */}
      <Card className="hidden md:block">
        <Table>
          <THead>
            <TR>
              <TH>Client</TH>
              <TH>Status</TH>
              <TH>Progress</TH>
              <TH>Waiting on</TH>
              <TH numeric>Value</TH>
            </TR>
          </THead>
          <TBody>
            {clients.map((c) => (
              <TR key={c.id} interactive>
                <TD>
                  <Link
                    href={`/app/clients/${c.id}`}
                    className="flex items-center gap-2.5"
                  >
                    <Avatar name={c.company} size="sm" />
                    <span className="flex flex-col">
                      <span className="font-medium">{c.company}</span>
                      <span className="text-xs text-ink-500">
                        {c.contactName}
                      </span>
                    </span>
                  </Link>
                </TD>
                <TD>
                  <StatusBadge status={c.status} />
                </TD>
                <TD>
                  <span className="flex items-center gap-2">
                    <ProgressBar
                      value={c.completed}
                      total={c.total}
                      className="w-20"
                    />
                    <span className="text-xs text-ink-500" data-numeric>
                      {c.completed}/{c.total}
                    </span>
                  </span>
                </TD>
                <TD>
                  {c.waitingOn ? (
                    <span className="text-ink-600">
                      {c.waitingOn}
                      <span className="text-ink-400">
                        {" "}
                        · {humanWait(c.waitingHours ?? 0)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-ink-400">—</span>
                  )}
                </TD>
                <TD numeric className="font-mono">
                  {c.value}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {/* Mobile — same data, stacked */}
      <div className="flex flex-col gap-3 md:hidden">
        {clients.map((c) => (
          <Card key={c.id}>
            <Link
              href={`/app/clients/${c.id}`}
              className="flex flex-col gap-3 p-(--card-pad)"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar name={c.company} size="sm" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-ink-900">
                      {c.company}
                    </span>
                    <span className="truncate text-xs text-ink-500">
                      {c.contactName}
                    </span>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>

              <div className="flex items-center gap-2.5">
                <ProgressBar
                  value={c.completed}
                  total={c.total}
                  className="flex-1"
                />
                <span className="text-xs text-ink-500" data-numeric>
                  {c.completed}/{c.total}
                </span>
              </div>

              {c.waitingOn && (
                <p className="text-sm text-ink-600">
                  Waiting on {c.waitingOn}
                  <span className="text-ink-400">
                    {" "}
                    · {humanWait(c.waitingHours ?? 0)}
                  </span>
                </p>
              )}
            </Link>
          </Card>
        ))}
      </div>
    </AppPage>
  );
}
