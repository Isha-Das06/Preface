import "server-only";
import { createServiceClient } from "./supabase/server";
import { sendDigest, sendReminderEmail, type DigestRow } from "./emails";
import type {
  Business,
  Client,
  Onboarding,
  OnboardingStep,
} from "./supabase/types";

/**
 * The jobs that run on a clock rather than on a click.
 *
 * These run as service_role across every tenant, which is exactly
 * what RLS exists to prevent everywhere else — so this file is the
 * one place a business_id filter is written by hand, and every query
 * here is scoped explicitly.
 *
 * Invoked by /api/cron/*, which is what a scheduler calls.
 */

/**
 * Days after the link was sent that we nudge, and never more than
 * this many times.
 *
 * The spacing widens on purpose. Three chases over twelve days is a
 * product being helpful; the same three over three days is a product
 * being a nuisance, and the agency wears the blame either way because
 * the mail arrives with their name on it.
 */
const SCHEDULE = [2, 5, 12] as const;
export const MAX_REMINDERS = SCHEDULE.length;

/** Someone who did something today does not need chasing today. */
const QUIET_HOURS_AFTER_ACTIVITY = 24;

const DAY = 86400000;

function daysSince(iso: string | null): number {
  if (!iso) return 0;
  return (Date.now() - new Date(iso).getTime()) / DAY;
}

function hoursSince(iso: string | null): number {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 3600000;
}

export interface ReminderRun {
  considered: number;
  sent: { company: string; kind: string }[];
  skipped: { company: string; why: string }[];
}

/**
 * Send whichever automatic reminders are due.
 *
 * Deliberately idempotent-ish rather than time-window based: what
 * decides the next nudge is `reminder_count`, not "did this run
 * already today". A scheduler that fires twice, or a run that dies
 * halfway, cannot produce two reminders on the same step — the count
 * has already moved.
 */
export async function runReminders(): Promise<ReminderRun> {
  const svc = createServiceClient();
  const run: ReminderRun = { considered: 0, sent: [], skipped: [] };

  const { data: onboardingRows } = await svc
    .from("onboardings")
    .select("*")
    .neq("status", "completed")
    .not("sent_at", "is", null);

  const onboardings = (onboardingRows ?? []) as Onboarding[];
  run.considered = onboardings.length;
  if (onboardings.length === 0) return run;

  const [bizRes, clientRes, stepRes] = await Promise.all([
    svc
      .from("businesses")
      .select("*")
      .in("id", [...new Set(onboardings.map((o) => o.business_id))]),
    svc
      .from("clients")
      .select("*")
      .in("id", [...new Set(onboardings.map((o) => o.client_id))]),
    svc
      .from("onboarding_steps")
      .select("*")
      .in("onboarding_id", onboardings.map((o) => o.id))
      .order("position"),
  ]);

  const businesses = new Map(
    ((bizRes.data ?? []) as Business[]).map((b) => [b.id, b]),
  );
  const clients = new Map(
    ((clientRes.data ?? []) as Client[]).map((c) => [c.id, c]),
  );
  const stepsByOnboarding = new Map<string, OnboardingStep[]>();
  for (const s of (stepRes.data ?? []) as OnboardingStep[]) {
    const list = stepsByOnboarding.get(s.onboarding_id) ?? [];
    list.push(s);
    stepsByOnboarding.set(s.onboarding_id, list);
  }

  for (const o of onboardings) {
    const business = businesses.get(o.business_id);
    const client = clients.get(o.client_id);
    const steps = stepsByOnboarding.get(o.id) ?? [];
    const label = client?.company ?? o.id;

    if (!business || !client) {
      run.skipped.push({ company: label, why: "missing business or client" });
      continue;
    }
    if (!business.reminders_enabled) {
      run.skipped.push({ company: label, why: "reminders off for business" });
      continue;
    }
    if (o.reminder_count >= MAX_REMINDERS) {
      run.skipped.push({ company: label, why: "already chased three times" });
      continue;
    }
    if (
      o.reminders_paused_until &&
      new Date(o.reminders_paused_until) > new Date()
    ) {
      run.skipped.push({ company: label, why: "paused after a manual nudge" });
      continue;
    }
    if (hoursSince(o.last_activity_at) < QUIET_HOURS_AFTER_ACTIVITY) {
      run.skipped.push({ company: label, why: "active in the last day" });
      continue;
    }

    // Nothing outstanding means nothing to chase, even if the
    // onboarding has not been marked completed for some other reason.
    const outstanding = steps.filter(
      (s) => s.type !== "instructions" && s.required && !s.completed_at,
    );
    if (outstanding.length === 0) {
      run.skipped.push({ company: label, why: "nothing outstanding" });
      continue;
    }

    const dueAfter = SCHEDULE[o.reminder_count];
    if (daysSince(o.sent_at) < dueAfter) {
      run.skipped.push({
        company: label,
        why: `next nudge at ${dueAfter} days`,
      });
      continue;
    }

    const kind = `auto_${dueAfter}d`;
    const result = await sendReminderEmail(business, client, o, steps);
    if ("error" in result) {
      run.skipped.push({ company: label, why: "email failed" });
      continue;
    }

    // Only counted once the mail is actually away, so a provider
    // outage retries next run instead of silently burning a nudge.
    await svc
      .from("onboardings")
      .update({ reminder_count: o.reminder_count + 1, status: "waiting" })
      .eq("id", o.id);

    await svc
      .from("reminders")
      .insert({ onboarding_id: o.id, kind });

    await svc.from("events").insert({
      onboarding_id: o.id,
      business_id: business.id,
      type: "reminder_sent",
      meta: { kind },
    });

    run.sent.push({ company: label, kind });
  }

  return run;
}

export interface DigestRun {
  businesses: number;
  sent: { business: string; waiting: number }[];
}

/** One summary per business of who they are waiting on. */
export async function runDigest(): Promise<DigestRun> {
  const svc = createServiceClient();
  const out: DigestRun = { businesses: 0, sent: [] };

  const { data: bizRows } = await svc
    .from("businesses")
    .select("*")
    .eq("digest_enabled", true);

  const businesses = (bizRows ?? []) as Business[];
  out.businesses = businesses.length;
  if (businesses.length === 0) return out;

  const { data: onboardingRows } = await svc
    .from("onboardings")
    .select("*")
    .in("business_id", businesses.map((b) => b.id))
    .not("sent_at", "is", null);

  const onboardings = (onboardingRows ?? []) as Onboarding[];

  // Counted separately, and deliberately NOT filtered by sent_at.
  // That filter belongs to the waiting list; reusing it here silently
  // dropped anything finished that was never formally marked as sent,
  // which is exactly the good news this email exists to deliver.
  const weekAgo = new Date(Date.now() - 7 * DAY).toISOString();
  const { data: finishedRows } = await svc
    .from("onboardings")
    .select("business_id")
    .in("business_id", businesses.map((b) => b.id))
    .eq("status", "completed")
    .gte("completed_at", weekAgo);

  const finishedByBusiness = new Map<string, number>();
  for (const r of (finishedRows ?? []) as { business_id: string }[]) {
    finishedByBusiness.set(
      r.business_id,
      (finishedByBusiness.get(r.business_id) ?? 0) + 1,
    );
  }

  if (onboardings.length === 0) return out;

  const [clientRes, stepRes] = await Promise.all([
    svc
      .from("clients")
      .select("*")
      .in("id", [...new Set(onboardings.map((o) => o.client_id))]),
    svc
      .from("onboarding_steps")
      .select("*")
      .in("onboarding_id", onboardings.map((o) => o.id))
      .order("position"),
  ]);

  const clients = new Map(
    ((clientRes.data ?? []) as Client[]).map((c) => [c.id, c]),
  );
  const stepsByOnboarding = new Map<string, OnboardingStep[]>();
  for (const s of (stepRes.data ?? []) as OnboardingStep[]) {
    const list = stepsByOnboarding.get(s.onboarding_id) ?? [];
    list.push(s);
    stepsByOnboarding.set(s.onboarding_id, list);
  }

  for (const business of businesses) {
    const mine = onboardings.filter((o) => o.business_id === business.id);

    const waiting: DigestRow[] = [];
    const finished = finishedByBusiness.get(business.id) ?? 0;

    for (const o of mine) {
      if (o.status === "completed") continue;

      const client = clients.get(o.client_id);
      if (!client) continue;

      const steps = stepsByOnboarding.get(o.id) ?? [];
      const next = steps.find(
        (s) => s.type !== "instructions" && !s.completed_at,
      );

      waiting.push({
        company: client.company,
        waitingOn: next?.title.toLowerCase() ?? null,
        days: Math.max(1, Math.round(daysSince(o.last_activity_at ?? o.sent_at))),
      });
    }

    // No outstanding clients means no email. A digest that arrives to
    // say nothing is happening is how a weekly email gets filtered.
    if (waiting.length === 0) continue;

    waiting.sort((a, b) => b.days - a.days);

    const result = await sendDigest(business, waiting, finished);
    if (!("error" in result)) {
      out.sent.push({ business: business.name, waiting: waiting.length });
    }
  }

  return out;
}
