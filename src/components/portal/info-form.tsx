"use client";

import { useActionState } from "react";
import { Field, Input, Textarea } from "@/components/ui";
import { StepFrame } from "./step-frame";
import { saveInfo, type PortalResult } from "@/lib/portal-actions";

export interface InfoField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

/**
 * C2 — Company information.
 *
 * Controlled by nothing: these are uncontrolled inputs with
 * defaultValue, which is correct here because the form posts on
 * submit rather than on keystroke. The trap Goal 7 hit was
 * defaultValue on inputs whose values were read from React state and
 * therefore never updated — not the case on a plain form post.
 */
export function InfoForm({
  token,
  fields,
  values,
  index,
  total,
  title,
  description,
  saved,
}: {
  token: string;
  fields: InfoField[];
  values: Record<string, string>;
  index: number;
  total: number;
  title: string;
  description?: string;
  saved: boolean;
}) {
  const [state, formAction] = useActionState(
    async (prev: PortalResult, formData: FormData) =>
      saveInfo(token, prev, formData),
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <StepFrame
        token={token}
        index={index}
        total={total}
        title={title}
        description={description}
        continueSubmit
        saved={saved}
        error={state?.error}
      >
        {/* Single column even on desktop. A 560px measure with two
            columns of short fields reads as a form to get through;
            one column reads as a conversation. */}
        <div className="flex flex-col gap-5">
          {fields.map((f) => (
            <Field
              key={f.name}
              label={f.label}
              required={f.required}
              hint={f.required ? undefined : "Optional"}
            >
              {f.type === "textarea" ? (
                <Textarea
                  name={f.name}
                  defaultValue={values[f.name] ?? ""}
                  rows={3}
                />
              ) : (
                <Input
                  name={f.name}
                  type={f.type}
                  defaultValue={values[f.name] ?? ""}
                />
              )}
            </Field>
          ))}
        </div>
      </StepFrame>
    </form>
  );
}
