import "server-only";
import {
  createClient,
  createServiceClient,
  isSupabaseConfigured,
} from "./supabase/server";
import { clientSteps } from "./templates";
import type {
  Business,
  FileRow,
  Client,
  Onboarding,
  OnboardingStatus,
  StepType,
  WorkflowStep,
} from "./supabase/types";

/**
 * Read side of the business app.
 *
 * Every query here runs under the caller's session, so RLS scopes
 * it to their business automatically — there is deliberately no
 * `where business_id = ...` in this file. If one ever becomes
 * necessary, that means a policy is missing.
 */

export interface ClientRow {
  id: string;
  company: string;
  contactName: string;
  email: string;
  status: OnboardingStatus;
  completed: number;
  total: number;
  waitingOn: string | null;
  waitingHours: number | null;
  lastActivity: string;
  sentAt: string | null;
  remindersSent: number;
  onboardingId: string;
  token: string;
}

function hoursSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 36e5));
}

function relative(iso: string | null, fallback = "Not opened yet"): string {
  const h = hoursSince(iso);
  if (h === null) return fallback;
  if (h < 1) return "just now";
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function getBusiness(): Promise<Business | null> {
  // A clone without env vars should show empty states, not a 500.
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("businesses").select("*").maybeSingle();
  return (data as Business | null) ?? null;
}

/**
 * Clients with their onboarding progress.
 *
 * One round trip rather than N+1: pull the onboardings and their
 * steps together, then fold in memory. At the volumes this product
 * targets (tens of active onboardings) that is far cheaper than a
 * view or an aggregate query, and much easier to read.
 */
export async function getClients(): Promise<ClientRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const [clientsRes, onboardingsRes, stepsRes, remindersRes] =
    await Promise.all([
      supabase.from("clients").select("*"),
      supabase.from("onboardings").select("*"),
      supabase
        .from("onboarding_steps")
        .select("id,onboarding_id,position,title,type,completed_at,required"),
      supabase.from("reminders").select("onboarding_id"),
    ]);

  const clients = (clientsRes.data ?? []) as Client[];
  const onboardings = (onboardingsRes.data ?? []) as Onboarding[];
  // `instructions` steps are excluded, because the portal never shows
  // them as a step — they render as the welcome note on the hub. If
  // the business counts them and the client does not, the two sides
  // disagree about progress: "5 of 8" here against "5 of 7" in the
  // client's own view and in the reminder email they just received.
  const steps = ((stepsRes.data ?? []) as {
    onboarding_id: string;
    position: number;
    title: string;
    type: string;
    completed_at: string | null;
  }[]).filter((s) => s.type !== "instructions");
  const reminders = (remindersRes.data ?? []) as { onboarding_id: string }[];

  const stepsByOnboarding = new Map<string, typeof steps>();
  for (const s of steps) {
    const list = stepsByOnboarding.get(s.onboarding_id) ?? [];
    list.push(s);
    stepsByOnboarding.set(s.onboarding_id, list);
  }

  const reminderCounts = new Map<string, number>();
  for (const r of reminders) {
    reminderCounts.set(
      r.onboarding_id,
      (reminderCounts.get(r.onboarding_id) ?? 0) + 1,
    );
  }

  const rows: ClientRow[] = [];

  for (const o of onboardings) {
    const client = clients.find((c) => c.id === o.client_id);
    if (!client) continue;

    const mine = (stepsByOnboarding.get(o.id) ?? []).sort(
      (a, b) => a.position - b.position,
    );
    const completed = mine.filter((s) => s.completed_at).length;
    const firstOpen = mine.find((s) => !s.completed_at);

    rows.push({
      id: client.id,
      company: client.company,
      contactName: client.name ?? "",
      email: client.email,
      status: o.status,
      completed,
      total: mine.length,
      waitingOn: firstOpen?.title ?? null,
      // Fall back to sent_at: a client who never opened the link has
      // still been waiting since the day it went out, and that is
      // exactly the person most in need of chasing.
      waitingHours: hoursSince(o.last_activity_at ?? o.sent_at),
      lastActivity: relative(o.last_activity_at),
      sentAt: formatDate(o.sent_at),
      remindersSent: reminderCounts.get(o.id) ?? 0,
      onboardingId: o.id,
      token: o.token,
    });
  }

  return rows;
}

/** B1's list — unfinished only, longest wait first. */
export async function getWaitingOn(): Promise<ClientRow[]> {
  const clients = await getClients();
  return clients
    .filter((c) => c.status !== "completed")
    .sort((a, b) => (b.waitingHours ?? 0) - (a.waitingHours ?? 0));
}

export async function getClient(clientId: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();
  if (!client) return null;

  const { data: onboarding } = await supabase
    .from("onboardings")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();
  if (!onboarding) return null;

  const [stepsRes, eventsRes] = await Promise.all([
    supabase
      .from("onboarding_steps")
      .select("*")
      .eq("onboarding_id", (onboarding as Onboarding).id)
      .order("position"),
    supabase
      .from("events")
      .select("*")
      .eq("onboarding_id", (onboarding as Onboarding).id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return {
    client: client as Client,
    onboarding: onboarding as Onboarding,
    steps: (stepsRes.data ?? []) as OnboardingStepRow[],
    events: (eventsRes.data ?? []) as EventItem[],
  };
}

export interface OnboardingStepRow {
  id: string;
  position: number;
  type: string;
  title: string;
  description: string | null;
  required: boolean;
  requires_previous: boolean;
  config: Record<string, unknown>;
  data: Record<string, unknown>;
  completed_at: string | null;
}

export interface EventItem {
  id: string;
  type: string;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  /** Every row in the builder. What "replace these steps" destroys. */
  stepCount: number;
  /**
   * What a client would actually work through: enabled, set up, and
   * not the welcome note. This is the number to show whenever the
   * sentence is about what the CLIENT gets, so it matches the
   * "Step 3 of 7" they see on their own link.
   */
  clientStepCount: number;
  /** Clients already sent this one. Blocks deleting it. */
  sentCount: number;
}

/**
 * Every workflow this business has, oldest first.
 *
 * Plural because agencies genuinely do different kinds of work, and
 * a design project asks for nothing like a consulting retainer. The
 * schema always allowed this — workflows carries a business_id with
 * no uniqueness — it was the app that assumed exactly one.
 */
export async function getWorkflows(): Promise<WorkflowSummary[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const [wfRes, stepRes, onbRes] = await Promise.all([
    supabase.from("workflows").select("id, name").order("created_at"),
    supabase
      .from("workflow_steps")
      .select("workflow_id, type, enabled, configured"),
    supabase.from("onboardings").select("workflow_id"),
  ]);

  const steps = (stepRes.data ?? []) as {
    workflow_id: string;
    type: StepType;
    enabled: boolean;
    configured: boolean;
  }[];
  const onboardings = (onbRes.data ?? []) as { workflow_id: string }[];

  const count = (rows: { workflow_id: string }[], id: string) =>
    rows.filter((r) => r.workflow_id === id).length;

  return ((wfRes.data ?? []) as { id: string; name: string }[]).map((w) => {
    const mine = steps.filter((r) => r.workflow_id === w.id);

    return {
      id: w.id,
      name: w.name,
      stepCount: mine.length,
      // Exactly the filter createClient snapshots by, then the same
      // client-visible rule the portal renders by.
      clientStepCount: clientSteps(
        mine.filter((r) => r.enabled && r.configured),
      ).length,
      sentCount: count(onboardings, w.id),
    };
  });
}

/**
 * Steps for one workflow. Without an id it falls back to the oldest,
 * which is the one a business with a single workflow always means.
 */
export async function getWorkflowSteps(
  workflowId?: string,
): Promise<WorkflowStep[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  let id = workflowId;
  if (!id) {
    const { data } = await supabase
      .from("workflows")
      .select("id")
      .order("created_at")
      .limit(1)
      .maybeSingle();
    id = (data as { id: string } | null)?.id;
  }
  if (!id) return [];

  // RLS scopes this to the caller's business, so an id belonging to
  // another tenant simply returns nothing.
  const { data } = await supabase
    .from("workflow_steps")
    .select("*")
    .eq("workflow_id", id)
    .order("position");

  return (data ?? []) as WorkflowStep[];
}

export { relative as relativeTime, hoursSince };

export interface BusinessFile {
  id: string;
  stepId: string;
  requestKey: string | null;
  filename: string;
  sizeBytes: number;
  uploadedAt: string;
  /** Short-lived, and null if signing failed rather than a dead link. */
  url: string | null;
}

/**
 * Files a client uploaded, with download links.
 *
 * Two clients on purpose. The SELECT runs under the caller's session,
 * so RLS is what proves these rows belong to their business — this
 * function never filters by business_id itself. Only once a row has
 * come back through that gate does the service client sign a URL for
 * it.
 *
 * Signed with `download`, which sets Content-Disposition: attachment.
 * The bucket accepts any file type, so an uploaded .html or .svg must
 * never render inline on a Supabase origin the browser might come to
 * trust.
 */
export async function getOnboardingFiles(
  stepIds: string[],
): Promise<BusinessFile[]> {
  if (!isSupabaseConfigured() || stepIds.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("files")
    .select("*")
    .in("onboarding_step_id", stepIds)
    .order("uploaded_at");

  const rows = (data ?? []) as FileRow[];
  if (rows.length === 0) return [];

  const svc = createServiceClient();

  return Promise.all(
    rows.map(async (r) => {
      const { data: signed } = await svc.storage
        .from("onboarding-files")
        .createSignedUrl(r.storage_path, 60 * 60, { download: r.filename });

      return {
        id: r.id,
        stepId: r.onboarding_step_id,
        requestKey: r.request_key,
        filename: r.filename,
        sizeBytes: r.size_bytes,
        uploadedAt: r.uploaded_at,
        url: signed?.signedUrl ?? null,
      };
    }),
  );
}
