"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  Field,
  Input,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuTrigger,
  SlideOver,
  Textarea,
  Tooltip,
  toast,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { addStep, reorderSteps, toggleStep, updateStep } from "@/lib/actions";
import { STEP_TYPE_LABELS } from "@/lib/templates";
import {
  StepConfigEditor,
  readConfig,
  writeConfig,
} from "./step-config";
import type { StepType } from "@/lib/supabase/types";

export interface BuilderStep {
  id: string;
  type: StepType;
  title: string;
  /** Derived one-liner for the row: "6 fields". Display only. */
  summary: string;
  /** What the business actually wrote. What the editor must load. */
  description: string;
  enabled: boolean;
  configured: boolean;
  required: boolean;
  requiresPrevious?: boolean;
  setupHint?: string;
  /** What the step is actually made of. The editor needs it to show
      what is already there instead of a blank form. */
  config?: Record<string, unknown>;
}

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

/**
 * A fingerprint of what the server last sent.
 *
 * Compared instead of the array itself, which is a fresh object on
 * every render and would clobber optimistic state constantly.
 */
function signature(steps: BuilderStep[]) {
  return steps
    .map(
      (s) =>
        `${s.id}:${s.enabled}:${s.configured}:${s.required}:${s.requiresPrevious ?? false}:${s.title}:${s.summary}`,
    )
    .join("|");
}

export function WorkflowBuilder({
  initial,
  workflowId,
}: {
  initial: BuilderStep[];
  workflowId?: string;
}) {
  const [steps, setSteps] = useState(initial);

  // Local state is the source of truth WHILE dragging or toggling, so
  // that reorders feel instant. But it was seeded from props once and
  // never looked at them again, so anything the server added later —
  // a new step, a whole template — wrote to the database and never
  // appeared. You could add three steps in a row and watch the list
  // sit there.
  //
  // Adjusting state during render is React's documented answer to
  // "props changed"; an effect would paint the stale list first.
  const [seen, setSeen] = useState(() => signature(initial));
  const current = signature(initial);
  if (seen !== current) {
    setSeen(current);
    setSteps(initial);
  }
  const [editing, setEditing] = useState<BuilderStep | null>(null);
  const [, startTransition] = useTransition();

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
      const next = arrayMove(prev, from, to);
      // Fire after the state update so the list never jumps back
      // while the write is in flight.
      startTransition(async () => {
        const r = await reorderSteps(next.map((s) => s.id));
        if (r.error) toast.error(r.error);
      });
      return next;
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
                  onToggle={(id, v) => {
                    // Optimistic: the checkbox responds instantly and
                    // reverts if the write fails. A toggle that waits
                    // on a round trip feels broken.
                    setSteps((prev) =>
                      prev.map((s) => (s.id === id ? { ...s, enabled: v } : s)),
                    );
                    startTransition(async () => {
                      const r = await toggleStep(id, v);
                      if (r.error) {
                        setSteps((prev) =>
                          prev.map((s) =>
                            s.id === id ? { ...s, enabled: !v } : s,
                          ),
                        );
                        toast.error(r.error);
                      }
                    });
                  }}
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
              <span data-numeric>{enabled.length - live.length}</span>{" "}
              {enabled.length - live.length === 1
                ? "still needs setup and stays"
                : "still need setup and stay"}{" "}
              hidden until then.
            </>
          )}
        </p>
        <AddStepMenu existing={steps.map((s) => s.type)} workflowId={workflowId} />
      </div>

      {/* B6 — step editor. A slide-over, not a dialog: editing feels
          lighter in a panel than in something that covers the list
          you're editing. */}
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        {editing && (
          <StepEditor
            step={editing}
            onSaved={(patch) => {
              setSteps((prev) =>
                prev.map((s) =>
                  s.id === editing.id ? { ...s, ...patch } : s,
                ),
              );
              setEditing(null);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

/**
 * B6 — step editor. A slide-over, not a dialog: editing feels
 * lighter in a panel than in something that covers the list you're
 * editing.
 *
 * Controlled inputs rather than defaultValue, because the values
 * have to reach the server. defaultValue looks identical and saves
 * nothing — the exact class of bug that makes an app feel broken.
 */
function StepEditor({
  step,
  onSaved,
}: {
  step: BuilderStep;
  onSaved: (patch: Partial<BuilderStep>) => void;
}) {
  const [title, setTitle] = useState(step.title);
  // step.summary is a derived label like "6 fields". Seeding the
  // editor from it meant opening a step and saving replaced the real
  // instructions with that label — silent data loss on every save.
  const [description, setDescription] = useState(step.description);
  const [required, setRequired] = useState(step.required);
  const [locked, setLocked] = useState(Boolean(step.requiresPrevious));
  // Seeded from what is stored, so opening a configured step shows
  // the agreement you wrote rather than an empty box.
  const [config, setConfig] = useState(() => readConfig(step.type, step.config));
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      // Null when there is nothing real yet, so saving a title never
      // marks an empty step as ready and shows it to clients.
      const nextConfig = writeConfig(step.type, config, title.trim() || step.title);

      const result = await updateStep(step.id, {
        title: title.trim() || step.title,
        description,
        required,
        requiresPrevious: locked,
        ...(nextConfig ? { config: nextConfig } : {}),
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }
      onSaved({
        title: title.trim() || step.title,
        description,
        required,
        requiresPrevious: locked,
        config: nextConfig ?? step.config,
        ...(nextConfig ? { configured: true } : {}),
      });
      toast.success("Step saved");
    });
  }

  return (
    <SlideOver
      title="Edit step"
      description={step.title}
      footer={
        <>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button variant="primary" loading={pending} onClick={save}>
            Save step
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Step title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field
          label="Instructions for the client"
          help="Shown at the top of this step."
        >
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <StepConfigEditor
          type={step.type}
          state={config}
          setState={setConfig}
        />

        <Checkbox
          checked={required}
          onCheckedChange={(v) => setRequired(Boolean(v))}
          label="Required to finish onboarding"
          description="Optional steps can be skipped by the client."
        />

        {/* Dependencies, not sequencing. One checkbox — the moment
            this becomes a rules builder we've become the thing we
            exist not to be. */}
        <Checkbox
          checked={locked}
          onCheckedChange={(v) => setLocked(Boolean(v))}
          label="Locked until earlier steps are done"
          description={
            step.type === "payment"
              ? "Recommended. Stops a client paying a deposit before the agreement is signed."
              : "Most steps are better left open — a client with ten minutes should be able to do whatever they can."
          }
        />
      </div>
    </SlideOver>
  );
}


/**
 * Only offers step types the workflow does not already have.
 *
 * The portal routes by type, so a second questionnaire would have no
 * URL of its own and the client could never open it. Hiding those
 * options is kinder than adding a step that silently does nothing.
 */
function AddStepMenu({
  existing,
  workflowId,
}: {
  existing: StepType[];
  workflowId?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const available = (Object.keys(STEP_TYPE_LABELS) as StepType[]).filter(
    (t) => !existing.includes(t),
  );

  if (available.length === 0) {
    return (
      <Tooltip content="Your onboarding already has one of every kind of step.">
        <span>
          <Button size="sm" disabled>
            <Plus className="size-4" />
            Add step
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <Menu>
      <MenuTrigger asChild>
        <Button size="sm" loading={pending}>
          <Plus className="size-4" />
          Add step
        </Button>
      </MenuTrigger>
      <MenuContent>
        <MenuLabel>Add a step</MenuLabel>
        {available.map((type) => {
          const Icon = ICONS[type];
          return (
            <MenuItem
              key={type}
              onSelect={() =>
                start(async () => {
                  const result = await addStep(type, workflowId);
                  if (result.error) {
                    toast.error("Couldn't add that step", {
                      description: result.error,
                    });
                    return;
                  }
                  toast.success(`${result.title} added`, {
                    description: "Open it to fill in the details.",
                  });
                  router.refresh();
                })
              }
            >
              <Icon className="size-4 text-ink-400" />
              {STEP_TYPE_LABELS[type]}
            </MenuItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
}
