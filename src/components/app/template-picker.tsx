"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, RadioCard, RadioGroup, toast } from "@/components/ui";
import { applyTemplate } from "@/lib/actions";

export function TemplatePicker({
  templates,
}: {
  templates: {
    id: string;
    name: string;
    description: string;
    stepCount: number;
  }[];
}) {
  const [choice, setChoice] = useState("marketing");
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-5">
      <RadioGroup value={choice} onValueChange={setChoice} className="gap-3">
        {templates.map((t) => (
          <RadioCard
            key={t.id}
            value={t.id}
            label={t.name}
            description={`${t.description} · ${t.stepCount} steps`}
          />
        ))}
      </RadioGroup>

      <Button
        variant="primary"
        className="w-full sm:w-fit"
        loading={pending}
        onClick={() =>
          start(async () => {
            const result = await applyTemplate(choice);

            // Only claim it worked once it has. This button used to
            // toast "Template applied" and navigate without writing
            // anything at all.
            if (result.error) {
              toast.error("Couldn't apply that template", {
                description: result.error,
              });
              return;
            }

            toast.success("Template applied", {
              description: `${result.stepCount} steps are ready to edit.`,
            });
            router.push("/app/workflow");
            router.refresh();
          })
        }
      >
        Use this template
      </Button>
    </div>
  );
}
