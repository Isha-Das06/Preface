"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { FILE_KIND_OPTIONS, fileKind, type FileKind } from "@/lib/file-types";
import type { StepType } from "@/lib/supabase/types";

/**
 * The per-type content of a step.
 *
 * This is the half of the builder that was missing: title and
 * description existed, but the things a step is actually made of —
 * the questions, the files you want, the accounts you need adding to
 * — had no editor at all. Every one of those steps sat on "needs
 * setup" with nothing that could ever set them up, which meant a
 * customer could never change a template into their own onboarding.
 *
 * Deliberately plain repeating rows rather than a form builder. The
 * moment this grows conditional logic and field validation rules we
 * have become the thing this product exists not to be.
 */

export interface Question {
  prompt: string;
  type: "short" | "long";
}
export interface FileRequest {
  key: string;
  label: string;
  hint: string;
  required: boolean;
  /** Let the client send a batch against this one item. */
  multiple?: boolean;
  /** Which file types this request will take. See lib/file-types. */
  accept?: FileKind;
}
export interface ChecklistItem {
  key: string;
  label: string;
  instruction: string;
  required: boolean;
  /**
   * The exact thing the client has to paste into the other system —
   * an email to invite, a Business ID to enter. Without it the
   * instruction says "invite your agency email" to somebody who has
   * no idea what that address is.
   */
  detail?: string;
}
export interface InfoField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

export interface StepConfigState {
  body: string;
  questions: Question[];
  requests: FileRequest[];
  items: ChecklistItem[];
  fields: InfoField[];
  amount: string;
  bookingUrl: string;
  /** Where the client actually pays. The business's own link. */
  paymentUrl: string;
}

/** Stable-ish key from a label, so config keys stay readable. */
export function slugKey(label: string, fallback: string) {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30) || fallback
  );
}

/** Pull the editor's starting state out of whatever the step stores. */
export function readConfig(
  type: StepType,
  config: Record<string, unknown> | undefined,
): StepConfigState {
  const c = config ?? {};

  const amountCents = typeof c.amountCents === "number" ? c.amountCents : null;

  return {
    body:
      typeof c.body === "string"
        ? c.body
        : Array.isArray(c.body)
          ? // Templates ship the agreement as sections; editing it as
            // one block is honest about what we can round-trip.
            (c.body as { heading: string; text: string }[])
              .map((s) => `${s.heading}\n${s.text}`)
              .join("\n\n")
          : "",
    questions: Array.isArray(c.questions) ? (c.questions as Question[]) : [],
    requests: Array.isArray(c.requests) ? (c.requests as FileRequest[]) : [],
    items: Array.isArray(c.items) ? (c.items as ChecklistItem[]) : [],
    fields: Array.isArray(c.fields) ? (c.fields as InfoField[]) : [],
    amount: amountCents !== null ? (amountCents / 100).toFixed(2) : "",
    bookingUrl: typeof c.url === "string" ? c.url : "",
    paymentUrl: typeof c.payUrl === "string" ? c.payUrl : "",
  };
}

/**
 * Turn editor state back into what the step stores, or null when
 * there is nothing real yet — which is what stops a step being
 * marked ready and shown to clients while still empty.
 */
export function writeConfig(
  type: StepType,
  s: StepConfigState,
  title: string,
): Record<string, unknown> | null {
  switch (type) {
    case "instructions":
      return s.body.trim() ? { body: s.body.trim() } : null;

    case "agreement":
      return s.body.trim() ? { body: s.body.trim() } : null;

    case "questionnaire": {
      const questions = s.questions.filter((q) => q.prompt.trim());
      return questions.length ? { questions } : null;
    }

    case "files": {
      const requests = s.requests
        .filter((r) => r.label.trim())
        .map((r, i) => ({
          ...r,
          key: r.key || slugKey(r.label, `file-${i}`),
          accept: fileKind(r.accept),
        }));
      return requests.length ? { requests } : null;
    }

    case "checklist": {
      const items = s.items
        .filter((i) => i.label.trim())
        .map((i, n) => ({
          ...i,
          key: i.key || slugKey(i.label, `item-${n}`),
          detail: (i.detail ?? "").trim(),
        }));
      return items.length ? { items } : null;
    }

    case "info": {
      const fields = s.fields
        .filter((f) => f.label.trim())
        .map((f, i) => ({ ...f, name: f.name || slugKey(f.label, `field-${i}`) }));
      return fields.length ? { fields } : null;
    }

    case "payment": {
      const cents = Math.round(Number(s.amount.replace(/[^0-9.]/g, "")) * 100);
      // The amount is what makes the step real; the link is strongly
      // encouraged but optional, exactly like scheduling's, so an
      // agency that invoices by hand is not locked out of the step.
      return Number.isFinite(cents) && cents > 0
        ? {
            amountCents: cents,
            currency: "usd",
            description: title,
            payUrl: s.paymentUrl.trim(),
          }
        : null;
    }

    case "scheduling":
      return s.bookingUrl.trim() ? { url: s.bookingUrl.trim() } : null;

    default:
      return null;
  }
}

function Row({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    // No drag handle: these rows cannot be reordered yet, and a grip
    // that does nothing when you pull it is worse than no grip.
    <li className="flex items-start gap-2 rounded-(--radius-card) border border-ink-200 bg-surface p-3">
      <div className="flex min-w-0 flex-1 flex-col gap-2">{children}</div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove"
        className="-m-1 mt-1 shrink-0 rounded p-1 text-ink-400 transition-colors hover:text-danger-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)"
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}

function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" size="sm" className="w-fit" onClick={onClick}>
      <Plus className="size-4" />
      {label}
    </Button>
  );
}

export function StepConfigEditor({
  type,
  state,
  setState,
}: {
  type: StepType;
  state: StepConfigState;
  setState: (next: StepConfigState) => void;
}) {
  const set = <K extends keyof StepConfigState>(
    key: K,
    value: StepConfigState[K],
  ) => setState({ ...state, [key]: value });

  if (type === "instructions") {
    return (
      <Field
        label="Your note"
        help="The first thing the client reads. A sentence or two is plenty."
      >
        <Textarea
          rows={4}
          value={state.body}
          onChange={(e) => set("body", e.target.value)}
          placeholder="We're glad to have you on board…"
        />
      </Field>
    );
  }

  if (type === "agreement") {
    return (
      <Field
        label="Agreement text"
        help="Paste your own agreement. We never supply legal wording."
      >
        <Textarea
          rows={10}
          value={state.body}
          onChange={(e) => set("body", e.target.value)}
          placeholder="Paste your agreement here…"
        />
      </Field>
    );
  }

  if (type === "payment") {
    return (
      <div className="flex flex-col gap-5">
        <Field label="Amount" help="What the client owes at this step.">
          <Input
            leading="$"
            value={state.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="2,500.00"
            inputMode="decimal"
          />
        </Field>

        {/* Bring your own link, exactly like scheduling. We are a
            signpost, not a cashier: the money goes straight from the
            client to whatever the business already uses, so nothing
            here ever touches a card number. */}
        <Field
          label="Payment link"
          help="Where they pay — your Stripe payment link, PayPal, bKash, or an invoice page. Leave blank to send payment details yourself."
        >
          <Input
            value={state.paymentUrl}
            onChange={(e) => set("paymentUrl", e.target.value)}
            placeholder="buy.stripe.com/your-link"
          />
        </Field>
      </div>
    );
  }

  if (type === "scheduling") {
    return (
      <Field
        label="Booking link"
        help="Your existing Cal.com or Calendly link."
      >
        <Input
          value={state.bookingUrl}
          onChange={(e) => set("bookingUrl", e.target.value)}
          placeholder="cal.com/you/kickoff"
        />
      </Field>
    );
  }

  if (type === "questionnaire") {
    return (
      <div className="flex flex-col gap-3">
        <span className="text-base font-medium text-ink-700">Questions</span>
        <ul className="flex flex-col gap-2">
          {state.questions.map((q, i) => (
            <Row
              key={i}
              onRemove={() =>
                set(
                  "questions",
                  state.questions.filter((_, n) => n !== i),
                )
              }
            >
              <Textarea
                rows={2}
                value={q.prompt}
                placeholder="What does your business do?"
                onChange={(e) =>
                  set(
                    "questions",
                    state.questions.map((x, n) =>
                      n === i ? { ...x, prompt: e.target.value } : x,
                    ),
                  )
                }
              />
              <Select
                className="w-40"
                value={q.type}
                onValueChange={(v) =>
                  set(
                    "questions",
                    state.questions.map((x, n) =>
                      n === i ? { ...x, type: v as Question["type"] } : x,
                    ),
                  )
                }
                options={[
                  { value: "long", label: "Long answer" },
                  { value: "short", label: "Short answer" },
                ]}
              />
            </Row>
          ))}
        </ul>
        <AddRow
          label="Add question"
          onClick={() =>
            set("questions", [...state.questions, { prompt: "", type: "long" }])
          }
        />
      </div>
    );
  }

  if (type === "files") {
    return (
      <div className="flex flex-col gap-3">
        <span className="text-base font-medium text-ink-700">
          What you need from them
        </span>
        <ul className="flex flex-col gap-2">
          {state.requests.map((r, i) => (
            <Row
              key={i}
              onRemove={() =>
                set(
                  "requests",
                  state.requests.filter((_, n) => n !== i),
                )
              }
            >
              <Input
                value={r.label}
                placeholder="Logo"
                onChange={(e) =>
                  set(
                    "requests",
                    state.requests.map((x, n) =>
                      n === i ? { ...x, label: e.target.value } : x,
                    ),
                  )
                }
              />
              <Input
                value={r.hint}
                placeholder="SVG or PNG, ideally on a transparent background"
                onChange={(e) =>
                  set(
                    "requests",
                    state.requests.map((x, n) =>
                      n === i ? { ...x, hint: e.target.value } : x,
                    ),
                  )
                }
              />
              <Select
                className="w-full sm:w-56"
                value={fileKind(r.accept)}
                onValueChange={(v) =>
                  set(
                    "requests",
                    state.requests.map((x, n) =>
                      n === i ? { ...x, accept: v as FileKind } : x,
                    ),
                  )
                }
                options={FILE_KIND_OPTIONS}
              />

              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <Checkbox
                  checked={r.required}
                  onCheckedChange={(v) =>
                    set(
                      "requests",
                      state.requests.map((x, n) =>
                        n === i ? { ...x, required: Boolean(v) } : x,
                      ),
                    )
                  }
                  label="Required"
                />
                <Checkbox
                  checked={Boolean(r.multiple)}
                  onCheckedChange={(v) =>
                    set(
                      "requests",
                      state.requests.map((x, n) =>
                        n === i ? { ...x, multiple: Boolean(v) } : x,
                      ),
                    )
                  }
                  label="Allow several"
                  description="For things like photography, where one file is never the answer."
                />
              </div>
            </Row>
          ))}
        </ul>
        <AddRow
          label="Add file request"
          onClick={() =>
            set("requests", [
              ...state.requests,
              {
                key: "",
                label: "",
                hint: "",
                required: false,
                multiple: false,
                accept: "any",
              },
            ])
          }
        />
      </div>
    );
  }

  if (type === "checklist") {
    return (
      <div className="flex flex-col gap-3">
        <span className="text-base font-medium text-ink-700">
          Accounts to grant access to
        </span>
        <p className="measure-prose text-sm text-ink-500">
          Never ask for passwords here. Tell them where to click in their own
          account — accepting a client&apos;s credentials breaks most platforms&apos;
          terms and gets accounts locked.
        </p>
        <ul className="flex flex-col gap-2">
          {state.items.map((it, i) => (
            <Row
              key={i}
              onRemove={() =>
                set(
                  "items",
                  state.items.filter((_, n) => n !== i),
                )
              }
            >
              <Input
                value={it.label}
                placeholder="Google Ads"
                onChange={(e) =>
                  set(
                    "items",
                    state.items.map((x, n) =>
                      n === i ? { ...x, label: e.target.value } : x,
                    ),
                  )
                }
              />
              <Textarea
                rows={2}
                value={it.instruction}
                placeholder="Tools & Settings → Access and security → invite you@agency.com as Standard."
                onChange={(e) =>
                  set(
                    "items",
                    state.items.map((x, n) =>
                      n === i ? { ...x, instruction: e.target.value } : x,
                    ),
                  )
                }
              />
              <Field
                label="What they need to enter"
                help="The email or ID they have to paste. Shown with a copy button, so nobody retypes it wrong."
              >
                <Input
                  value={it.detail ?? ""}
                  placeholder="you@youragency.com"
                  onChange={(e) =>
                    set(
                      "items",
                      state.items.map((x, n) =>
                        n === i ? { ...x, detail: e.target.value } : x,
                      ),
                    )
                  }
                />
              </Field>

              <Checkbox
                checked={it.required}
                onCheckedChange={(v) =>
                  set(
                    "items",
                    state.items.map((x, n) =>
                      n === i ? { ...x, required: Boolean(v) } : x,
                    ),
                  )
                }
                label="Required"
              />
            </Row>
          ))}
        </ul>
        <AddRow
          label="Add account"
          onClick={() =>
            set("items", [
              ...state.items,
              { key: "", label: "", instruction: "", required: true, detail: "" },
            ])
          }
        />
      </div>
    );
  }

  if (type === "info") {
    return (
      <div className="flex flex-col gap-3">
        <span className="text-base font-medium text-ink-700">
          Fields to collect
        </span>
        <ul className="flex flex-col gap-2">
          {state.fields.map((f, i) => (
            <Row
              key={i}
              onRemove={() =>
                set(
                  "fields",
                  state.fields.filter((_, n) => n !== i),
                )
              }
            >
              <div className="grid grid-cols-[1fr_9rem] gap-2">
                <Input
                  value={f.label}
                  placeholder="Billing address"
                  onChange={(e) =>
                    set(
                      "fields",
                      state.fields.map((x, n) =>
                        n === i ? { ...x, label: e.target.value } : x,
                      ),
                    )
                  }
                />
                <Select
                  value={f.type}
                  onValueChange={(v) =>
                    set(
                      "fields",
                      state.fields.map((x, n) =>
                        n === i ? { ...x, type: v } : x,
                      ),
                    )
                  }
                  options={[
                    { value: "text", label: "Text" },
                    { value: "email", label: "Email" },
                    { value: "tel", label: "Phone" },
                    { value: "url", label: "Website" },
                    { value: "textarea", label: "Long text" },
                  ]}
                />
              </div>
              <Checkbox
                checked={f.required}
                onCheckedChange={(v) =>
                  set(
                    "fields",
                    state.fields.map((x, n) =>
                      n === i ? { ...x, required: Boolean(v) } : x,
                    ),
                  )
                }
                label="Required"
              />
            </Row>
          ))}
        </ul>
        <AddRow
          label="Add field"
          onClick={() =>
            set("fields", [
              ...state.fields,
              { name: "", label: "", type: "text", required: false },
            ])
          }
        />
      </div>
    );
  }

  return null;
}
