/**
 * Business-side mock data (Goals 4–5).
 * Shapes mirror docs/03-technical.md so Goal 7 swaps the source
 * without touching a screen.
 */

import type { StepType } from "./mock";

export type OnboardingStatus =
  | "not_started"
  | "in_progress"
  | "waiting"
  | "completed";

export interface ClientRow {
  id: string;
  company: string;
  contactName: string;
  email: string;
  status: OnboardingStatus;
  completed: number;
  total: number;
  /** Title of the first incomplete step. Null when finished. */
  waitingOn: string | null;
  /** Hours since last client activity — drives the waiting-on sort. */
  waitingHours: number | null;
  lastActivity: string;
  value: string;
  sentAt: string;
  remindersSent: number;
}

export const clients: ClientRow[] = [
  {
    id: "northstar",
    company: "Northstar Labs",
    contactName: "Sarah Chen",
    email: "sarah@northstarlabs.co",
    status: "waiting",
    completed: 5,
    total: 7,
    waitingOn: "Deposit",
    waitingHours: 146,
    lastActivity: "6 days ago",
    value: "$2,500.00",
    sentAt: "8 Aug 2026",
    remindersSent: 2,
  },
  {
    id: "vertex",
    company: "Vertex Health",
    contactName: "Marcus Webb",
    email: "marcus@vertexhealth.com",
    status: "waiting",
    completed: 2,
    total: 7,
    waitingOn: "Brand assets",
    waitingHours: 51,
    lastActivity: "2 days ago",
    value: "$7,400.00",
    sentAt: "11 Aug 2026",
    remindersSent: 1,
  },
  {
    id: "atlas",
    company: "Atlas Digital",
    contactName: "Priya Raman",
    email: "priya@atlasdigital.io",
    status: "in_progress",
    completed: 4,
    total: 7,
    waitingOn: "Account access",
    waitingHours: 4,
    lastActivity: "4 hours ago",
    value: "$12,000.00",
    sentAt: "13 Aug 2026",
    remindersSent: 0,
  },
  {
    id: "harbor",
    company: "Harbor & Finch",
    contactName: "Dan Okoro",
    email: "dan@harborfinch.co.uk",
    status: "not_started",
    completed: 0,
    total: 7,
    waitingOn: "Company information",
    waitingHours: 19,
    lastActivity: "Not opened yet",
    value: "$4,800.00",
    sentAt: "13 Aug 2026",
    remindersSent: 0,
  },
  {
    id: "acmefoods",
    company: "Acme Foods",
    contactName: "Tom Alvarez",
    email: "tom@acmefoods.com",
    status: "completed",
    completed: 7,
    total: 7,
    waitingOn: null,
    waitingHours: null,
    lastActivity: "Finished 5 Aug",
    value: "$9,000.00",
    sentAt: "1 Aug 2026",
    remindersSent: 1,
  },
  {
    id: "juniper",
    company: "Juniper Studio",
    contactName: "Elena Vasquez",
    email: "elena@juniperstudio.design",
    status: "completed",
    completed: 7,
    total: 7,
    waitingOn: null,
    waitingHours: null,
    lastActivity: "Finished 29 Jul",
    value: "$3,200.00",
    sentAt: "24 Jul 2026",
    remindersSent: 0,
  },
];

/**
 * B1's query. Longest wait first — the home screen exists to answer
 * "who is stuck and on what", so the most stuck client is at the top.
 */
export const waitingOn = clients
  .filter((c) => c.status !== "completed")
  .sort((a, b) => (b.waitingHours ?? 0) - (a.waitingHours ?? 0));

export function clientById(id: string) {
  return clients.find((c) => c.id === id);
}

export function humanWait(hours: number) {
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const d = Math.floor(hours / 24);
  return `${d} day${d === 1 ? "" : "s"}`;
}

/* ------------------------------------------------------------------
   Workflow builder
   ------------------------------------------------------------------ */

export interface BuilderStep {
  id: string;
  type: StepType;
  title: string;
  summary: string;
  enabled: boolean;
  /** false ⇒ omitted from the client's view, shown as "Add later". */
  configured: boolean;
  required: boolean;
  /** Shown in place of the summary when unconfigured. */
  setupHint?: string;
  /**
   * "Requires earlier steps first." One checkbox, not a workflow
   * engine. Off by default — a client with ten minutes should be
   * able to do whatever they can. On for payment, so a deposit
   * can't be taken against an unsigned agreement.
   */
  requiresPrevious?: boolean;
}

export const workflowSteps: BuilderStep[] = [
  {
    id: "s1",
    type: "instructions",
    title: "Welcome",
    summary: "A short note before they start",
    enabled: true,
    configured: true,
    required: false,
  },
  {
    id: "s2",
    type: "info",
    title: "Company information",
    summary: "Name, company, email, phone, address",
    enabled: true,
    configured: true,
    required: true,
  },
  {
    id: "s3",
    type: "questionnaire",
    title: "Project questionnaire",
    summary: "5 questions",
    enabled: true,
    configured: true,
    required: true,
  },
  {
    id: "s4",
    type: "files",
    title: "Brand assets",
    summary: "4 files requested",
    enabled: true,
    configured: true,
    required: true,
  },
  {
    id: "s5",
    type: "checklist",
    title: "Account access",
    summary: "4 accounts",
    enabled: true,
    configured: true,
    required: true,
  },
  {
    id: "s6",
    type: "agreement",
    title: "Service agreement",
    summary: "Your standard services agreement",
    enabled: true,
    configured: false,
    required: true,
    setupHint: "Add your agreement text",
  },
  {
    id: "s7",
    type: "payment",
    title: "Deposit",
    summary: "$2,500.00 one-off · after the agreement",
    enabled: true,
    configured: false,
    required: true,
    setupHint: "Connect Stripe to collect payment",
    requiresPrevious: true,
  },
  {
    id: "s8",
    type: "scheduling",
    title: "Kickoff call",
    summary: "cal.com/acme/kickoff",
    enabled: true,
    configured: true,
    required: false,
  },
];

export const templates = [
  {
    id: "marketing",
    name: "Marketing agency",
    description:
      "Questionnaire, brand assets, account access, agreement, deposit, kickoff.",
    stepCount: 8,
  },
  {
    id: "design",
    name: "Design studio",
    description:
      "Creative brief, reference material, agreement, deposit, kickoff.",
    stepCount: 7,
  },
  {
    id: "consulting",
    name: "Consultant",
    description:
      "Engagement scope, background documents, agreement, first invoice, kickoff.",
    stepCount: 7,
  },
  {
    id: "scratch",
    name: "Start from scratch",
    description: "Welcome and company information only. Add the rest yourself.",
    stepCount: 2,
  },
];

/* ------------------------------------------------------------------
   Client detail — submissions and activity
   ------------------------------------------------------------------ */

export const clientSteps = [
  { title: "Welcome", type: "instructions" as StepType, status: "complete", meta: "Read 8 Aug" },
  { title: "Company information", type: "info" as StepType, status: "complete", meta: "8 Aug" },
  { title: "Project questionnaire", type: "questionnaire" as StepType, status: "complete", meta: "5 of 5 answered" },
  { title: "Brand assets", type: "files" as StepType, status: "complete", meta: "3 files · 1 optional skipped" },
  { title: "Account access", type: "checklist" as StepType, status: "complete", meta: "3 of 4 granted" },
  { title: "Service agreement", type: "agreement" as StepType, status: "complete", meta: "Signed 12 Aug" },
  { title: "Deposit", type: "payment" as StepType, status: "current", meta: "$2,500.00 outstanding" },
  { title: "Kickoff call", type: "scheduling" as StepType, status: "upcoming", meta: "Not booked" },
];

export const activity = [
  { at: "6 days ago", text: "Reminder sent — second automatic reminder" },
  { at: "6 days ago", text: "Signed the service agreement" },
  { at: "7 days ago", text: "Granted Meta Business Manager access" },
  { at: "7 days ago", text: "Uploaded q2-campaign-assets.zip" },
  { at: "7 days ago", text: "Completed the project questionnaire" },
  { at: "8 days ago", text: "Opened the onboarding link for the first time" },
  { at: "8 days ago", text: "Onboarding link sent to sarah@northstarlabs.co" },
];

export const settings = {
  businessName: "Acme Agency",
  accentColor: "#1F6F4A",
  replyTo: "marcus@acmeagency.co",
  senderName: "Marcus at Acme Agency",
  welcomeMessage:
    "Before we start, there are a few things we need from you. It takes about 15 minutes and you can stop and come back any time.",
  remindersEnabled: true,
  digestEnabled: true,
  plan: "Studio",
  planPrice: "$99/mo",
  activeUsed: 4,
  activeLimit: 25,
};
