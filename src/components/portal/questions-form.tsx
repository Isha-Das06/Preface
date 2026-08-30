"use client";

import { useActionState } from "react";
import { Field, Input, Textarea } from "@/components/ui";
import { StepFrame } from "./step-frame";
import { saveQuestions, type PortalResult } from "@/lib/portal-actions";

export interface Question {
  prompt: string;
  type: "short" | "long";
  /** Undefined means "inherit the step", for older snapshots. */
  required?: boolean;
}

/**
 * C3 — Questionnaire.
 *
 * All questions on one scrollable page rather than a wizard. Five
 * screens with one question each feels longer than one screen with
 * five, and hides how much is left — which is the thing that makes
 * people abandon halfway.
 */
export function QuestionsForm({
  token,
  questions,
  answers,
  index,
  total,
  title,
  description,
  saved,
  stepRequired = true,
}: {
  token: string;
  questions: Question[];
  answers: Record<string, string>;
  index: number;
  total: number;
  title: string;
  /** The owner's own words for this step, when they wrote any. */
  description?: string;
  saved: boolean;
  /**
   * What an older snapshot's questions inherit when they carry no
   * `required` of their own. Must match what saveQuestions enforces,
   * or the asterisk is telling the client something untrue.
   */
  stepRequired?: boolean;
}) {
  const [state, formAction] = useActionState(
    async (prev: PortalResult, formData: FormData) =>
      saveQuestions(token, prev, formData),
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <StepFrame
        token={token}
        index={index}
        total={total}
        title={title}
        description={
          description ||
          `There ${questions.length === 1 ? "is 1 question" : `are ${questions.length} questions`}. Everything is saved when you continue — you can come back and change an answer.`
        }
        continueSubmit
        saved={saved}
        error={state?.error}
      >
        <ol className="flex flex-col gap-8">
          {questions.map((q, i) => (
            <li key={i} className="flex flex-col gap-2.5">
              <Field
                label={q.prompt}
                required={q.required ?? stepRequired}
                hint={
                  (q.required ?? stepRequired) === false ? (
                    "Optional"
                  ) : (
                    <span data-numeric>
                      {i + 1}/{questions.length}
                    </span>
                  )
                }
              >
                {q.type === "long" ? (
                  <Textarea
                    name={`q${i}`}
                    defaultValue={answers[String(i)] ?? ""}
                    rows={4}
                  />
                ) : (
                  <Input
                    name={`q${i}`}
                    defaultValue={answers[String(i)] ?? ""}
                  />
                )}
              </Field>
            </li>
          ))}
        </ol>
      </StepFrame>
    </form>
  );
}
