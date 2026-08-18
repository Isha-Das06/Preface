"use client";

import { useState, useTransition } from "react";
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
  PendingButton,
  SlideOver,
  Textarea,
  toast,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { reorderSteps, toggleStep, updateStep } from "@/lib/actions";
import type { StepType } from "@/lib/supabase/types";

export interface BuilderStep {
  id: string;
  type: StepType;
  title: string;
  summary: string;
  enabled: boolean;
  configured: boolean;
  required: boolean;
  requiresPrevious?: boolean;
  setupHint?: string;
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

export function WorkflowBuilder({ initial }: { initial: BuilderStep[] }) {
  const [steps, setSteps] = useState(initial);
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
              <span data-numeric>{enabled.length - live.length}</span> still need
              setup and stay hidden until then.
            </>
          )}
        </p>
        <PendingButton size="sm" reason="Adding steps arrives with the saved workflow">
          <Plus className="size-4" />
          Add step
        </PendingButton>
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
  const [description, setDescription] = useState(step.summary);
  const [required, setRequired] = useState(step.required);
  const [locked, setLocked] = useState(Boolean(step.requiresPrevious));
  const [amount, setAmount] = useState("");
  const [bookingUrl, setBookingUrl] = useState("");
  const [agreement, setAgreement] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      // Only send config when this step type has some, so saving a
      // title never silently marks an empty step as configured.
      let config: Record<string, unknown> | undefined;
      if (step.type === "payment" && amount.trim()) {
        const cents = Math.round(Number(amount.replace(/[^0-9.]/g, "")) * 100);
        if (Number.isFinite(cents) && cents > 0) {
          config = { amountCents: cents, currency: "usd", description: title };
        }
      }
      if (step.type === "scheduling" && bookingUrl.trim()) {
        config = { url: bookingUrl.trim() };
      }
      if (step.type === "agreement" && agreement.trim()) {
        config = { body: agreement.trim() };
      }

      const result = await updateStep(step.id, {
        title: title.trim() || step.title,
        description,
        required,
        requiresPrevious: locked,
        ...(config ? { config } : {}),
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }
      onSaved({
        title: title.trim() || step.title,
        required,
        requiresPrevious: locked,
        ...(config ? { configured: true } : {}),
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

        {step.type === "payment" && (
          <Field label="Amount" help="Collected into your own Stripe account.">
            <Input
              leading="$"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="2,500.00"
              inputMode="decimal"
            />
          </Field>
        )}
        {step.type === "scheduling" && (
          <Field
            label="Booking link"
            help="Your existing Cal.com or Calendly link."
          >
            <Input
              value={bookingUrl}
              onChange={(e) => setBookingUrl(e.target.value)}
              placeholder="cal.com/you/kickoff"
            />
          </Field>
        )}
        {step.type === "agreement" && (
          <Field
            label="Agreement text"
            help="Paste your own agreement. We never supply legal wording."
          >
            <Textarea
              rows={6}
              value={agreement}
              onChange={(e) => setAgreement(e.target.value)}
              placeholder="Paste your agreement here…"
            />
          </Field>
        )}

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
