import Link from "next/link";
import { ExternalLink, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui";
import { AppPage } from "@/components/app/page-shell";
import { WorkflowBuilder } from "@/components/app/workflow-builder";
import { NewClientButton } from "@/components/app/new-client";
import { workflowSteps } from "@/lib/mock-app";

/**
 * B5 — Workflow builder.
 *
 * Reorder, toggle, rename, edit fields, mark required. That's all.
 * No branching, no conditions, no dependencies between steps — the
 * moment this needs a tooltip to explain, it has become the
 * workflow-automation platform we exist not to be.
 */
export default function WorkflowPage() {
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
          <Button asChild size="sm">
            <Link href="/o/demo?first=1" target="_blank">
              <ExternalLink className="size-4" />
              Preview
            </Link>
          </Button>
          <NewClientButton />
        </div>
      }
    >
      <WorkflowBuilder initial={workflowSteps} />
    </AppPage>
  );
}
