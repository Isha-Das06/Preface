import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import { QuestionsForm, type Question } from "@/components/portal/questions-form";
import { getPortal, stepBySlug } from "@/lib/portal";

/** C3 — Questionnaire. */
export default async function QuestionsStep({
  params,
}: PageProps<"/o/[token]/questions">) {
  const { token } = await params;
  const portal = await getPortal(token);
  if (!portal) redirect(`/o/${token}/expired`);

  const step = stepBySlug(portal, "questions");
  if (!step) redirect(`/o/${token}`);

  const questions = (step.config.questions ?? []) as Question[];
  const answers = (step.data.answers ?? {}) as Record<string, string>;

  return (
    <PortalShell business={portal.business} token={token}>
      <QuestionsForm
        token={token}
        questions={questions}
        answers={answers}
        index={step.displayIndex}
        total={portal.steps.length}
        title={step.title}
        saved={Boolean(step.completedAt)}
        stepRequired={step.required}
      />
    </PortalShell>
  );
}
