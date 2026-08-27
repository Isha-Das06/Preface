"use client";

import { PortalHeader } from "@/components/portal/portal-shell";
import { StepFrame } from "@/components/portal/step-frame";
import { AccessChecklist } from "@/components/portal/access-checklist";
import { AgreementForm } from "@/components/portal/agreement-form";
import { FilesForm } from "@/components/portal/files-form";
import { InfoForm } from "@/components/portal/info-form";
import { PaymentPanel } from "@/components/portal/payment-panel";
import { QuestionsForm } from "@/components/portal/questions-form";
import { ScheduleConfirm } from "@/components/portal/schedule-confirm";
import { safeExternalUrl } from "@/lib/utils";
import type { StepType } from "@/lib/supabase/types";

/**
 * The client's view of one step, live, beside the editor.
 *
 * The point is that this is not a mock-up. It renders the very
 * components the portal renders — same frame, same fields, same copy
 * — inside `inert`, which makes every control in the subtree
 * unclickable, unfocusable and invisible to assistive tech in one
 * attribute. Nothing here has an "if preview" branch, so there is no
 * second version of a screen to keep in step with the first.
 *
 * Two consequences worth knowing:
 *
 * - The forms still call `useActionState` with their real server
 *   actions. That only wires the action up; it runs on submit, and
 *   nothing in here can submit. The sample token is never read.
 * - What it draws is the *saved* shape, not raw editor state, so a
 *   half-typed question does not flicker into the client's view. The
 *   caller passes the output of `writeConfig` — the same value the
 *   save button sends — which is what keeps the preview honest about
 *   what the client would actually get.
 */

/**
 * A stand-in client, so the preview reads as a real page rather than
 * a form full of holes. The portal seeds the first few fields from
 * the client record it already has; this stands in for that.
 */
const SAMPLE = {
  company: "Acme Ltd",
  name: "Jordan Lee",
  email: "jordan@acme.example",
};

/** Not a real token. Nothing in an inert subtree can use it. */
const SAMPLE_TOKEN = "preview";

export interface PreviewBusiness {
  name: string;
  logo_url: string | null;
  accent_color: string;
  /** The hub falls back to this when there is no welcome note. */
  welcome_message: string | null;
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v ? v : fallback;
}

function Body({
  type,
  title,
  description,
  config,
  business,
  index,
  total,
}: {
  type: StepType;
  title: string;
  description: string;
  config: Record<string, unknown>;
  business: PreviewBusiness;
  index: number;
  total: number;
}) {
  const frame = { token: SAMPLE_TOKEN, index, total, title };

  switch (type) {
    /**
     * Instructions has no screen of its own — it becomes the welcome
     * copy on the hub. Showing it inside a step frame would be a
     * confident lie about where the client reads it.
     */
    case "instructions":
      return (
        <div className="flex flex-col gap-3 pt-2">
          <h1 className="text-3xl font-semibold text-ink-900">
            Welcome, {SAMPLE.company}
          </h1>
          {/* Same fallback chain as getPortal: the note, then the
              business's standing welcome message, then ours. */}
          <p className="measure-prose text-base text-ink-500">
            {str(config.body) ||
              str(business.welcome_message) ||
              "Before we start, there are a few things we need from you. You can stop and come back any time."}
          </p>
        </div>
      );

    case "info":
      return (
        <InfoForm
          {...frame}
          fields={arr(config.fields)}
          values={{
            company: SAMPLE.company,
            contact: SAMPLE.name,
            email: SAMPLE.email,
          }}
          description={description || undefined}
          saved={false}
        />
      );

    case "questionnaire":
      return (
        <QuestionsForm
          {...frame}
          questions={arr(config.questions)}
          answers={{}}
          saved={false}
        />
      );

    case "files":
      return (
        <FilesForm
          {...frame}
          requests={arr<Record<string, unknown>>(config.requests).map((r) => ({
            key: str(r.key),
            label: str(r.label),
            hint: str(r.hint),
            required: Boolean(r.required),
            multiple: Boolean(r.multiple),
            accept: str(r.accept, "any"),
            uploaded: [],
          }))}
          description={description || undefined}
          saved={false}
        />
      );

    case "checklist":
      return (
        <StepFrame
          {...frame}
          description={description || undefined}
          continueHref="#"
          footerNote="We never ask for your passwords. You stay in control and can remove our access at any time."
        >
          <AccessChecklist
            token={SAMPLE_TOKEN}
            items={arr<Record<string, unknown>>(config.items).map((i) => ({
              key: str(i.key),
              label: str(i.label),
              instruction: str(i.instruction),
              required: Boolean(i.required),
              detail: str(i.detail),
              done: false,
            }))}
          />
        </StepFrame>
      );

    case "agreement":
      return (
        <AgreementForm
          {...frame}
          businessName={business.name}
          clientCompany={SAMPLE.company}
          sections={[]}
          body={str(config.body)}
          signed={false}
          defaultName={SAMPLE.name}
          defaultEmail={SAMPLE.email}
        />
      );

    case "payment": {
      const cents =
        typeof config.amountCents === "number" ? config.amountCents : 0;
      const currency = str(config.currency, "usd");

      return (
        <StepFrame {...frame}>
          <PaymentPanel
            token={SAMPLE_TOKEN}
            amount={new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: currency.toUpperCase(),
            }).format(cents / 100)}
            description={str(config.description, title)}
            businessName={business.name}
            payUrl={safeExternalUrl(str(config.payUrl))}
            paid={false}
          />
        </StepFrame>
      );
    }

    case "scheduling":
      return (
        <StepFrame
          {...frame}
          description={description || undefined}
          footerNote={`Booking runs through ${business.name}'s own calendar, so it lands directly in their diary.`}
        >
          <ScheduleConfirm
            token={SAMPLE_TOKEN}
            url={safeExternalUrl(str(config.url)) ?? ""}
            booked={false}
          />
        </StepFrame>
      );

    default:
      return null;
  }
}

export function StepPreview({
  type,
  title,
  description,
  config,
  business,
  index,
  total,
  note,
}: {
  type: StepType;
  title: string;
  description: string;
  /** What `writeConfig` would save, or null while the step is empty. */
  config: Record<string, unknown> | null;
  business: PreviewBusiness;
  index: number;
  total: number;
  /** Why the client is not seeing this yet, when they are not. */
  note?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="label-caps">What your client sees</span>
        {note && <span className="text-xs text-accent-600">{note}</span>}
      </div>

      <div className="overflow-hidden rounded-(--radius-card) border border-ink-200 shadow-(--shadow-sm)">
        <div
          /**
           * `.portal` carries the portal's own type scale, spacing
           * and pinned light palette, exactly as the route layout
           * applies it — so this looks like their page, not ours,
           * even when the business is using dark mode.
           *
           * `inert` is what makes it a preview: no click, no focus,
           * no tab stop, nothing announced to a screen reader as
           * something to do. It is a picture of a page.
           *
           * Deliberately NOT its own scroll area. It had a capped
           * height and an overflow of its own, which put a second
           * scrollbar inside the panel's — so the wheel moved
           * whichever container the pointer happened to be over and
           * neither went where you meant. The panel scrolls; this
           * just flows.
           */
          className="portal px-5 pb-10"
          style={
            { "--accent-600": business.accent_color } as React.CSSProperties
          }
          inert
        >
          <PortalHeader business={business} href="#" />
          {config || type === "instructions" ? (
            <Body
              type={type}
              title={title}
              description={description}
              config={config ?? {}}
              business={business}
              index={index}
              total={total}
            />
          ) : (
            <p className="measure-prose py-8 text-base text-ink-500">
              Nothing to show yet. Fill this step in and your client&apos;s
              version of it appears here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
