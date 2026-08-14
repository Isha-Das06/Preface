import { Field, Input, Textarea } from "@/components/ui";
import { PortalShell } from "@/components/portal/portal-shell";
import { StepFrame } from "@/components/portal/step-frame";
import { business, questions, stepBySlug, steps } from "@/lib/mock";

/**
 * C3 — Questionnaire.
 *
 * All questions on one scrollable page rather than a wizard. Five
 * screens with one question each feels longer than one screen with
 * five, and hides how much is left — which is the thing that makes
 * people abandon halfway.
 */
export default function QuestionsStep() {
  const step = stepBySlug("questions")!;
  const index = steps.findIndex((s) => s.slug === "questions") + 1;

  return (
    <PortalShell business={business}>
      <StepFrame
        index={index}
        total={steps.length}
        title="About the project"
        description={`There are ${questions.length} questions. Answers save as you type — you can leave and come back.`}
        continueHref="/o/demo/files"
      >
        <ol className="flex flex-col gap-8">
          {questions.map((q, i) => (
            <li key={q.id} className="flex flex-col gap-2.5">
              <Field
                label={q.prompt}
                hint={
                  <span data-numeric>
                    {i + 1}/{questions.length}
                  </span>
                }
              >
                {q.type === "long" ? (
                  <Textarea defaultValue={q.answer} rows={4} />
                ) : (
                  <Input defaultValue={q.answer} />
                )}
              </Field>
            </li>
          ))}
        </ol>
      </StepFrame>
    </PortalShell>
  );
}
