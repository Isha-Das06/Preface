"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  CreditCard,
  FileText,
  GripVertical,
  KeyRound,
  ListChecks,
  Paperclip,
  PenLine,
  Plus,
  UserRound,
} from "lucide-react";
import {
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogClose,
  DialogTrigger,
  Field,
  Input,
  SlideOver,
  Textarea,
  toast,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { StepType } from "@/lib/mock";
import type { BuilderStep } from "@/lib/mock-app";

const ICONS: Record<StepType, typeof FileText> = {
  instructions: FileText,
  info: UserRound,
  questionnaire: ListChecks,
  files: Paperclip,
  checklist: KeyRound,
  agreement: PenLine,
  payment: CreditCard,
  scheduling: CalendarDays,
};

function StepRow({
  step,
  onToggle,
  onEdit,
}: {
  step: BuilderStep;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (step: BuilderStep) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id });
  const Icon = ICONS[step.type];

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 border-b border-ink-150 bg-surface px-3 py-3 last:border-0",
        isDragging && "relative z-10 rounded-md shadow-md",
        !step.enabled && "opacity-55",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${step.title}`}
        className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-[4px] text-ink-400 hover:bg-ink-100 hover:text-ink-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus) active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>

      <Checkbox
        checked={step.enabled}
        onCheckedChange={(v) => onToggle(step.id, Boolean(v))}
        aria-label={`Include ${step.title}`}
      />

      <Icon className="size-4 shrink-0 text-ink-400" />

      <button
        onClick={() => onEdit(step)}
        className="flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-[4px] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)"
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ink-900">{step.title}</span>
          {!step.required && (
            <span className="text-xs text-ink-400">Optional</span>
          )}
        </span>
        {/* An unconfigured step is an invitation, never an error.
            No warning icon, no red, no "incomplete" — it just tells
            you what it still needs and stays sendable without it. */}
        <span
          className={cn(
            "truncate text-xs",
            step.configured ? "text-ink-500" : "text-accent-600",
          )}
        >
          {step.configured ? step.summary : step.setupHint}
        </span>
      </button>

      <Button size="sm" variant="ghost" onClick={() => onEdit(step)}>
        Edit
      </Button>
    </li>
  );
}

export function WorkflowBuilder({ initial }: { initial: BuilderStep[] }) {
  const [steps, setSteps] = useState(initial);
  const [editing, setEditing] = useState<BuilderStep | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setSteps((prev) => {
      const from = prev.findIndex((s) => s.id === active.id);
      const to = prev.findIndex((s) => s.id === over.id);
      return arrayMove(prev, from, to);
    });
  }

  const enabled = steps.filter((s) => s.enabled);
  const live = enabled.filter((s) => s.configured);

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
          <SortableContext
            items={steps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col">
              {steps.map((step) => (
                <StepRow
                  key={step.id}
                  step={step}
                  onToggle={(id, v) =>
                    setSteps((prev) =>
                      prev.map((s) => (s.id === id ? { ...s, enabled: v } : s)),
                    )
                  }
                  onEdit={setEditing}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">
          Your client sees <span data-numeric>{live.length}</span> step
          {live.length === 1 ? "" : "s"}.
          {enabled.length > live.length && (
            <>
              {" "}
              <span data-numeric>{enabled.length - live.length}</span> still need
              setup and stay hidden until then.
            </>
          )}
        </p>
        <Button size="sm">
          <Plus className="size-4" />
          Add step
        </Button>
      </div>

      {/* B6 — step editor. A slide-over, not a dialog: editing feels
          lighter in a panel than in something that covers the list
          you're editing. */}
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        {editing && (
          <SlideOver
            title="Edit step"
            description={editing.title}
            footer={
              <>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditing(null);
                    toast.success("Step saved");
                  }}
                >
                  Save step
                </Button>
              </>
            }
          >
            <div className="flex flex-col gap-5">
              <Field label="Step title">
                <Input defaultValue={editing.title} />
              </Field>
              <Field
                label="Instructions for the client"
                help="Shown at the top of this step."
              >
                <Textarea rows={3} defaultValue={editing.summary} />
              </Field>

              {editing.type === "payment" && (
                <Field label="Amount" help="Charged to your Stripe account.">
                  <Input leading="$" defaultValue="2,500.00" inputMode="decimal" />
                </Field>
              )}
              {editing.type === "scheduling" && (
                <Field
                  label="Booking link"
                  help="Your existing Cal.com or Calendly link."
                >
                  <Input defaultValue="cal.com/acme/kickoff" />
                </Field>
              )}
              {editing.type === "agreement" && (
                <Field
                  label="Agreement text"
                  help="Paste your own agreement. We never supply legal wording."
                >
                  <Textarea rows={6} placeholder="Paste your agreement here…" />
                </Field>
              )}

              <Checkbox
                defaultChecked={editing.required}
                label="Required to finish onboarding"
                description="Optional steps can be skipped by the client."
              />
            </div>
          </SlideOver>
        )}
      </Dialog>
    </div>
  );
}
