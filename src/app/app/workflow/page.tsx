import Link from "next/link";
import { LayoutTemplate } from "lucide-react";
import { Button, Card, EmptyState } from "@/components/ui";
import { Workflow as WorkflowIcon } from "lucide-react";
import { AppPage } from "@/components/app/page-shell";
import { WorkflowBuilder } from "@/components/app/workflow-builder";
import { NewClientButton } from "@/components/app/new-client";
import { getWorkflowSteps } from "@/lib/queries";
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
export default async function WorkflowPage() {
  const steps = await getWorkflowSteps();

  const builderSteps: BuilderStep[] = steps.map((s) => ({
    id: s.id,
    type: s.type,
    title: s.title,
    summary: summarise(s.type, s.config, s.description),
    enabled: s.enabled,
    configured: s.configured,
    required: s.required,
    requiresPrevious: s.requires_previous,
    config: s.config,
    setupHint: SETUP_HINTS[s.type] ?? "Add the details for this step",
  }));

  if (steps.length === 0) {
    return (
      <AppPage title="Your onboarding">
        <Card>
          <EmptyState
            icon={WorkflowIcon}
            title="No onboarding yet"
            description="Pick a starting point and we'll fill it in with questions that suit your work."
            action={
              <Button asChild variant="primary" size="sm">
                <Link href="/app/workflow/templates">Choose a template</Link>
              </Button>
            }
          />
        </Card>
      </AppPage>
    );
  }

  return (
    <AppPage
      title="Your onboarding"
      description="This is what every new client works through. Turn steps off if you don't need them."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/app/workflow/templates">
              <LayoutTemplate className="size-4" />
              Templates
            </Link>
          </Button>
          <NewClientButton />
        </div>
      }
    >
      <WorkflowBuilder initial={builderSteps} />
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
