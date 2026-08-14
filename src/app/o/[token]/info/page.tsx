import { Field, Input, Textarea } from "@/components/ui";
import { PortalShell } from "@/components/portal/portal-shell";
import { StepFrame } from "@/components/portal/step-frame";
import { business, infoFields, stepBySlug, steps } from "@/lib/mock";

/** C2 — Company information. */
export default function InfoStep() {
  const step = stepBySlug("info")!;
  const index = steps.findIndex((s) => s.slug === "info") + 1;

  return (
    <PortalShell business={business}>
      <StepFrame
        index={index}
        total={steps.length}
        title={step.title}
        description={step.description}
        continueHref="/o/demo/questions"
      >
        {/* Single column even on desktop. A 560px measure with two
            columns of short fields reads as a form to get through;
            one column reads as a conversation. */}
        <div className="flex flex-col gap-5">
          {infoFields.map((f) => (
            <Field
              key={f.name}
              label={f.label}
              required={f.required}
              hint={f.required ? undefined : "Optional"}
            >
              {f.type === "textarea" ? (
                <Textarea defaultValue={f.value} rows={3} />
              ) : (
                <Input type={f.type} defaultValue={f.value} />
              )}
            </Field>
          ))}
        </div>
      </StepFrame>
    </PortalShell>
  );
}
