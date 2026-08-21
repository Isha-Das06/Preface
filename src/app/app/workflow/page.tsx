import Link from "next/link";
import { LayoutTemplate } from "lucide-react";
import { Button, Card, EmptyState } from "@/components/ui";
import { Workflow as WorkflowIcon } from "lucide-react";
import { AppPage } from "@/components/app/page-shell";
import { WorkflowBuilder } from "@/components/app/workflow-builder";
import { NewClientButton } from "@/components/app/new-client";
import { getBusiness, getWorkflows, getWorkflowSteps } from "@/lib/queries";
import { WorkflowSwitcher } from "@/components/app/workflow-switcher";
import type { BuilderStep } from "@/components/app/workflow-builder";

/**
 * B5 — Workflow builder.
 *
 * Reorder, toggle, rename, edit fields, mark required. That's all.
 * No branching, no conditions, no dependencies between steps beyond
 * a single "needs earlier steps" checkbox — the moment this needs a
 * tooltip to explain, it has become the workflow-automation platform
 * we exist not to be.
 */
export default async function WorkflowPage({
  searchParams,
}: PageProps<"/app/workflow">) {
  const { w } = await searchParams;
  const [business, workflows] = await Promise.all([
    getBusiness(),
    getWorkflows(),
  ]);

  // An unknown or missing id falls back to the oldest rather than
  // erroring — a stale bookmark should land somewhere sensible.
  const selected =
    workflows.find((x) => x.id === w) ?? workflows[0] ?? null;

  const steps = await getWorkflowSteps(selected?.id);

  // Built once and used by both the header button and the empty
  // state. The empty state used to link without it, which sent
  // "Choose a template" at whichever workflow happened to be oldest
  // — so applying one from an empty second onboarding replaced the
  // steps of the first.
  const templatesHref = selected
    ? `/app/workflow/templates?w=${selected.id}`
    : "/app/workflow/templates";

  const builderSteps: BuilderStep[] = steps.map((s) => ({
    id: s.id,
    type: s.type,
    title: s.title,
    summary: summarise(s.type, s.config, s.description),
    description: s.description ?? "",
    enabled: s.enabled,
    configured: s.configured,
    required: s.required,
    requiresPrevious: s.requires_previous,
    config: s.config,
    setupHint: SETUP_HINTS[s.type] ?? "Add the details for this step",
  }));

  return (
    <AppPage
      title={selected?.name ?? "Your onboarding"}
      titleSlot={
        selected ? (
          <WorkflowSwitcher workflows={workflows} selected={selected} />
        ) : undefined
      }
      description={
        workflows.length > 1
          ? "Clients get whichever of these you pick when you add them."
          : "This is what every new client works through. Turn steps off if you don't need them."
      }
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link
              href={templatesHref}
            >
              <LayoutTemplate className="size-4" />
              Templates
            </Link>
          </Button>
          <NewClientButton
            workflows={workflows}
            defaultWorkflowId={selected?.id}
          />
        </div>
      }
    >
      {steps.length === 0 ? (
        <Card>
          <EmptyState
            icon={WorkflowIcon}
            title="Nothing in this one yet"
            description="Start from a template, or add steps one at a time."
            action={
              <Button asChild variant="primary" size="sm">
                <Link href={templatesHref}>Choose a template</Link>
              </Button>
            }
          />
        </Card>
      ) : (
        <WorkflowBuilder
          initial={builderSteps}
          workflowId={selected?.id}
          // Only the four fields the client's view actually paints.
          // Handing the whole row to a client component would ship
          // Stripe ids and plan details into the browser for nothing.
          business={{
            name: business?.name ?? "Your business",
            logo_url: business?.logo_url ?? null,
            accent_color: business?.accent_color ?? "#1f6f4a",
            welcome_message: business?.welcome_message ?? null,
          }}
        />
      )}
    </AppPage>
  );
}

const SETUP_HINTS: Record<string, string> = {
  agreement: "Add your agreement text",
  payment: "Set an amount to collect",
  scheduling: "Add your booking link",
  checklist: "List the accounts you need access to",
  questionnaire: "Add your questions",
  files: "List the files you need",
  instructions: "Write what they should read",
  info: "Choose which details to collect",
};

/** Turns a step's config into the one line shown under its title. */
function summarise(
  type: string,
  config: Record<string, unknown>,
  description: string | null,
): string {
  const count = (key: string) =>
    Array.isArray(config[key]) ? (config[key] as unknown[]).length : 0;

  switch (type) {
    case "questionnaire": {
      const n = count("questions");
      return n ? `${n} question${n === 1 ? "" : "s"}` : "No questions yet";
    }
    case "files": {
      const n = count("requests");
      return n ? `${n} file${n === 1 ? "" : "s"} requested` : "Nothing requested yet";
    }
    case "checklist": {
      const n = count("items");
      return n ? `${n} account${n === 1 ? "" : "s"}` : "No accounts listed yet";
    }
    case "info": {
      const n = count("fields");
      return n ? `${n} field${n === 1 ? "" : "s"}` : "No fields yet";
    }
    case "payment": {
      const cents = config.amountCents as number | null;
      return cents
        ? `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
        : "No amount set";
    }
    case "scheduling":
      return (config.url as string) || "No booking link yet";
    default:
      return description ?? "";
  }
}
