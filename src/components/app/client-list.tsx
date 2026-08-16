"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SearchX } from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Input,
  ProgressBar,
  StatusBadge,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
} from "@/components/ui";
import { humanWait, type ClientRow, type OnboardingStatus } from "@/lib/mock-app";
import { cn } from "@/lib/utils";

const FILTERS: { id: "all" | OnboardingStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "waiting", label: "Waiting" },
  { id: "in_progress", label: "In progress" },
  { id: "not_started", label: "Not started" },
  { id: "completed", label: "Completed" },
];

export function ClientList({ clients }: { clients: ClientRow[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | OnboardingStatus>("all");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return clients.filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (!needle) return true;
      // Search across everything a person would actually type:
      // the company, the person, or their email.
      return (
        c.company.toLowerCase().includes(needle) ||
        c.contactName.toLowerCase().includes(needle) ||
        c.email.toLowerCase().includes(needle)
      );
    });
  }, [clients, q, filter]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: clients.length };
    for (const c of clients) m[c.status] = (m[c.status] ?? 0) + 1;
    return m;
  }, [clients]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-[280px]">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search clients"
            aria-label="Search clients"
            leading={<Search className="size-4" />}
          />
        </div>

        {/* Counts on the filters so the shape of the list is legible
            before you click anything. */}
        <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1 sm:pb-0">
          {FILTERS.map((f) => {
            const n = counts[f.id] ?? 0;
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                aria-pressed={active}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm",
                  "transition-colors duration-(--dur-fast)",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)",
                  active
                    ? "bg-ink-900 text-ink-50"
                    : "text-ink-600 hover:bg-ink-100",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "text-xs",
                    active ? "text-ink-300" : "text-ink-400",
                  )}
                  data-numeric
                >
                  {n}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchX}
            title="No clients match that"
            description={
              q
                ? `Nothing for "${q}". Try a company name, a person, or an email.`
                : "No clients with that status yet."
            }
            action={
              <Button
                size="sm"
                onClick={() => {
                  setQ("");
                  setFilter("all");
                }}
              >
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : (
        <>
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
                {rows.map((c) => (
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

          {/* Mobile — same data, stacked. Never a sideways table. */}
          <div className="flex flex-col gap-3 md:hidden">
            {rows.map((c) => (
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
                    <p className="flex min-w-0 items-baseline gap-1 text-sm text-ink-600">
                      <span className="shrink-0">Waiting on</span>
                      <span className="truncate">{c.waitingOn}</span>
                      <span className="shrink-0 text-ink-400">
                        · {humanWait(c.waitingHours ?? 0)}
                      </span>
                    </p>
                  )}
                </Link>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
