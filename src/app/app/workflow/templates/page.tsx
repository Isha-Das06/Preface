import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardBody } from "@/components/ui";
import { MobileHeader } from "@/components/app/nav";
import { TemplatePicker } from "@/components/app/template-picker";
import { TEMPLATES } from "@/lib/templates";

/**
 * B7 — Template picker.
 *
 * Three good templates plus scratch, not seven thin ones. A weak
 * template tells a visitor "this product doesn't know my business",
 * which is worse than not offering one. New ones get written
 * alongside the first real customer who asks.
 */
export default function TemplatesPage() {
  return (
    <>
      <MobileHeader title="Preface" />
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <Link
          href="/app/workflow"
          className="-mx-2 flex w-fit min-h-9 items-center gap-1.5 rounded-md px-2 text-sm text-ink-500 transition-colors hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)"
        >
          <ArrowLeft className="size-4" />
          Your onboarding
        </Link>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-ink-900">
            Start from a template
          </h1>
          <p className="measure text-sm text-ink-500">
            Each one arrives with real questions already written. Change
            anything you like afterwards.
          </p>
        </div>

        <TemplatePicker
          templates={TEMPLATES.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            stepCount: t.steps.length,
          }))}
        />

        <Card className="bg-warn-100/50">
          <CardBody>
            <p className="text-sm text-warn-fg">
              Applying a template replaces your current steps. Anything already
              sent to a client keeps the steps it was sent with.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
