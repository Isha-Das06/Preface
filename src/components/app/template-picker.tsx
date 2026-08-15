"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, RadioCard, RadioGroup, toast } from "@/components/ui";

export function TemplatePicker({
  templates,
}: {
  templates: { id: string; name: string; description: string; stepCount: number }[];
}) {
  const [choice, setChoice] = useState("marketing");
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
        onClick={() => {
          toast.success("Template applied");
          router.push("/app/workflow");
        }}
      >
        Use this template
      </Button>
    </div>
  );
}
