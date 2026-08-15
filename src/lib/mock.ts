/**
 * Mock data for the frontend build (Goals 3–5).
 *
 * Shapes deliberately mirror the schema in docs/03-technical.md so
 * that Goals 7–8 swap the source without touching a single screen.
 *
 * Realistic content throughout — no lorem ipsum. Placeholder text
 * hides the layout problems that real content exposes: long company
 * names, a five-line answer, a filename that wraps.
 */

export type StepType =
  | "instructions"
  | "info"
  | "questionnaire"
  | "files"
  | "checklist"
  | "agreement"
  | "payment"
  | "scheduling";

export type StepStatus = "complete" | "current" | "upcoming";

export interface Business {
  name: string;
  logoUrl: string | null;
  /** Replaces --accent-600 inside the portal only. */
  accentColor: string;
  welcomeMessage: string;
  replyToEmail: string;
}

export interface PortalStep {
  slug: string;
  type: StepType;
  title: string;
  description?: string;
  status: StepStatus;
  meta?: string;
  optional?: boolean;
}

export const business: Business = {
  name: "Acme Agency",
  logoUrl: null, // falls back to a monogram
  accentColor: "#1F6F4A",
  welcomeMessage:
    "Before we start, there are a few things we need from you. It takes about 15 minutes and you can stop and come back any time.",
  replyToEmail: "marcus@acmeagency.co",
};

export const client = {
  company: "Northstar Labs",
  contactName: "Sarah Chen",
  email: "sarah@northstarlabs.co",
};

/** 4 of 6 complete — the state the landing page screenshot shows. */
export const steps: PortalStep[] = [
  {
    slug: "info",
    type: "info",
    title: "Company information",
    description: "So we know who to contact and how to reach you.",
    status: "complete",
  },
  {
    slug: "questions",
    type: "questionnaire",
    title: "Project questionnaire",
    description: "Five questions about the work ahead.",
    status: "complete",
  },
  {
    slug: "files",
    type: "files",
    title: "Brand assets",
    description: "Upload what you have. Anything optional can wait.",
    status: "complete",
    meta: "1 optional item skipped",
  },
  {
    slug: "access",
    type: "checklist",
    title: "Account access",
    description:
      "Add us to the accounts we'll be working in. Each one takes about a minute.",
    status: "complete",
    meta: "3 of 4 granted",
  },
  {
    slug: "agreement",
    type: "agreement",
    title: "Service agreement",
    description: "Please read through, then sign at the bottom.",
    status: "complete",
    meta: "Signed 12 Aug",
  },
  {
    slug: "payment",
    type: "payment",
    title: "Deposit",
    description: "Paid securely to Acme Agency.",
    status: "current",
    meta: "$2,500.00",
  },
  {
    slug: "schedule",
    type: "scheduling",
    title: "Kickoff call",
    description: "Pick a time that works. 45 minutes, video call.",
    status: "upcoming",
  },
];

export const completedCount = steps.filter(
  (s) => s.status === "complete",
).length;

export const currentStep = steps.find((s) => s.status === "current");

export function stepBySlug(slug: string) {
  return steps.find((s) => s.slug === slug);
}

/** The step a "Continue" button should send the client to. */
export function nextStepSlug(after: string) {
  const i = steps.findIndex((s) => s.slug === after);
  return steps[i + 1]?.slug ?? null;
}

/* ------------------------------------------------------------------
   Step payloads
   ------------------------------------------------------------------ */

export const infoFields = [
  { name: "company", label: "Company name", value: "Northstar Labs", required: true, type: "text" },
  { name: "contact", label: "Your name", value: "Sarah Chen", required: true, type: "text" },
  { name: "email", label: "Email", value: "sarah@northstarlabs.co", required: true, type: "email" },
  { name: "phone", label: "Phone", value: "+1 415 555 0142", required: false, type: "tel" },
  { name: "website", label: "Website", value: "northstarlabs.co", required: false, type: "url" },
  { name: "address", label: "Billing address", value: "410 Townsend St, San Francisco, CA 94107", required: false, type: "textarea" },
] as const;

export const questions = [
  {
    id: "q1",
    prompt: "What does your business do, in one or two sentences?",
    answer:
      "We build lab-information software for small diagnostics labs — sample tracking, results, and compliance reporting in one place.",
    type: "long" as const,
  },
  {
    id: "q2",
    prompt: "Who is your ideal customer?",
    answer:
      "Lab directors at independent diagnostics labs running 50–500 samples a day. They usually have no dedicated IT.",
    type: "long" as const,
  },
  {
    id: "q3",
    prompt: "What does success look like 90 days from now?",
    answer: "40 qualified demo bookings a month, up from about 12.",
    type: "long" as const,
  },
  {
    id: "q4",
    prompt: "Which channels are working today? Which aren't?",
    answer:
      "Conference sponsorships convert but cost too much. LinkedIn ads have not worked at all. Referrals are our best source but we can't scale them.",
    type: "long" as const,
  },
  {
    id: "q5",
    prompt: "Who has final approval on creative?",
    answer: "Me, with a sanity check from our CEO on anything public-facing.",
    type: "short" as const,
  },
];

export const fileRequests = [
  {
    key: "logo",
    label: "Logo",
    hint: "SVG or PNG, ideally on a transparent background",
    required: true,
    uploaded: { name: "northstar-logo.svg", size: "24 KB" },
  },
  {
    key: "guidelines",
    label: "Brand guidelines",
    hint: "PDF",
    required: false,
    uploaded: { name: "northstar-brand-guidelines-2025.pdf", size: "4.2 MB" },
  },
  {
    key: "photography",
    label: "Product photography",
    hint: "Anything you have — we can work with rough shots",
    required: false,
    uploaded: null,
  },
  {
    key: "existing",
    label: "Existing ad creative",
    hint: "So we don't repeat what's already been tried",
    required: false,
    uploaded: { name: "q2-campaign-assets.zip", size: "18.6 MB" },
  },
];

/**
 * Checklist items — things the client does in ANOTHER system and
 * confirms here.
 *
 * Note there is no credential field anywhere in this shape, by
 * design: accepting a client's platform password violates Meta's
 * terms and gets accounts locked. We ask them to grant role-based
 * access on their own device and tick the box.
 */
export const checklistItems = [
  {
    key: "google-ads",
    label: "Google Ads",
    instruction:
      "Tools & Settings → Access and security → invite ads@acmeagency.co as Standard.",
    required: true,
    done: true,
  },
  {
    key: "ga4",
    label: "Google Analytics 4",
    instruction:
      "Admin → Property access management → add ads@acmeagency.co as Editor.",
    required: true,
    done: true,
  },
  {
    key: "meta",
    label: "Meta Business Manager",
    instruction:
      "Business Settings → Partners → Add partner → enter our ID 402 998 117 431.",
    required: true,
    done: true,
  },
  {
    key: "shopify",
    label: "Shopify",
    instruction:
      "Settings → Users and permissions → invite ads@acmeagency.co with Reports access.",
    required: false,
    done: false,
  },
];

export const agreement = {
  title: "Services Agreement",
  version: "v2.1",
  effectiveDate: "12 August 2026",
  signedBy: "Sarah Chen",
  signedAt: "12 Aug 2026, 4:22pm",
  body: [
    {
      heading: "1. Scope of work",
      text: "Acme Agency will provide marketing strategy, campaign design, and campaign management services for Northstar Labs as described in the accompanying proposal dated 4 August 2026. Any work beyond that scope will be agreed in writing before it begins.",
    },
    {
      heading: "2. Term",
      text: "This agreement begins on the effective date above and continues for an initial term of six months. Either party may end it with 30 days' written notice.",
    },
    {
      heading: "3. Fees and payment",
      text: "The total engagement fee is $5,000.00 per month. A deposit of $2,500.00 is due before work begins. Invoices are issued monthly in advance and are payable within 14 days.",
    },
    {
      heading: "4. Ownership",
      text: "On full payment, Northstar Labs owns all final deliverables produced under this agreement. Acme Agency retains ownership of its underlying tools, templates and know-how, and may show completed work in its portfolio unless asked not to.",
    },
    {
      heading: "5. Confidentiality",
      text: "Each party will keep the other's non-public information confidential and use it only to perform this agreement. This obligation continues for two years after the agreement ends.",
    },
    {
      heading: "6. Liability",
      text: "Neither party is liable for indirect or consequential loss. Each party's total liability under this agreement is limited to the fees paid in the three months before the claim arose.",
    },
  ],
};

export const payment = {
  amount: "$2,500.00",
  amountCents: 250000,
  currency: "USD",
  description: "Project deposit",
  note: "50% of the first month's fee",
  payTo: "Acme Agency",
};

export const scheduling = {
  duration: "45 minutes",
  format: "Video call",
  provider: "Cal.com",
  booked: {
    date: "Thursday 21 August 2026",
    time: "10:00am",
    timezone: "PDT",
  },
  slots: [
    { day: "Tue 19 Aug", times: ["9:00am", "11:30am", "2:00pm"] },
    { day: "Wed 20 Aug", times: ["10:00am", "1:00pm"] },
    { day: "Thu 21 Aug", times: ["10:00am", "11:00am", "3:30pm"] },
  ],
};
