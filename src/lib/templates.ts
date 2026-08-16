/**
 * Onboarding templates.
 *
 * Deliberately CODE CONSTANTS, not database rows. They are
 * version-controlled, editing one needs no migration, and there is
 * no admin UI to build. They only become database rows the day a
 * business can save its own — which is v2.
 *
 * A template's value is its QUESTIONS, not its structure. Three
 * excellent ones beat seven thin ones: a weak template tells a
 * visitor "this product doesn't know my business", which is worse
 * than offering none. New ones get written WITH the first real
 * customer in that field who asks.
 */

import type { StepType } from "./supabase/types";

export type { StepType };

export interface TemplateStep {
  type: StepType;
  title: string;
  description?: string;
  required: boolean;
  /** false ⇒ needs setup before clients see it; still sendable. */
  configured: boolean;
  requiresPrevious?: boolean;
  config?: Record<string, unknown>;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  /** Matches the "what kind of work do you do?" answer at first run. */
  steps: TemplateStep[];
}

const WELCOME: TemplateStep = {
  type: "instructions",
  title: "Welcome",
  description: "A short note before they start.",
  required: false,
  configured: true,
  config: {
    body: "We're glad to have you on board. Before we start, there are a few things we need from you. It takes about 15 minutes and you can stop and come back any time.",
  },
};

const COMPANY_INFO: TemplateStep = {
  type: "info",
  title: "Company information",
  description: "So we know who to contact and how to reach you.",
  required: true,
  configured: true,
  config: {
    fields: [
      { name: "company", label: "Company name", type: "text", required: true },
      { name: "contact", label: "Your name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone", type: "tel", required: false },
      { name: "website", label: "Website", type: "url", required: false },
      { name: "address", label: "Billing address", type: "textarea", required: false },
    ],
  },
};

/** Agreement text is ALWAYS the customer's own. We ship none. */
const AGREEMENT: TemplateStep = {
  type: "agreement",
  title: "Service agreement",
  description: "Please read through, then sign at the bottom.",
  required: true,
  configured: false,
  config: { body: "" },
};

const SCHEDULING: TemplateStep = {
  type: "scheduling",
  title: "Kickoff call",
  description: "Pick a time that works for you.",
  required: false,
  configured: false,
  config: { url: "", duration: "45 minutes", format: "Video call" },
};

function deposit(title: string): TemplateStep {
  return {
    type: "payment",
    title,
    description: "Paid securely to us via Stripe.",
    required: true,
    configured: false,
    // The one dependency that ships on by default: nobody should be
    // able to pay a deposit against an unsigned agreement.
    requiresPrevious: true,
    config: { amountCents: null, currency: "usd", description: title },
  };
}

export const TEMPLATES: Template[] = [
  {
    id: "marketing",
    name: "Marketing agency",
    description:
      "Questionnaire, brand assets, account access, agreement, deposit, kickoff.",
    steps: [
      WELCOME,
      COMPANY_INFO,
      {
        type: "questionnaire",
        title: "Project questionnaire",
        description: "Five questions about the work ahead.",
        required: true,
        configured: true,
        config: {
          questions: [
            { prompt: "What does your business do, in one or two sentences?", type: "long" },
            { prompt: "Who is your ideal customer?", type: "long" },
            { prompt: "What does success look like 90 days from now?", type: "long" },
            { prompt: "Which channels are working today? Which aren't?", type: "long" },
            { prompt: "Who has final approval on creative?", type: "short" },
          ],
        },
      },
      {
        type: "files",
        title: "Brand assets",
        description: "Upload what you have. Anything optional can wait.",
        required: true,
        configured: true,
        config: {
          requests: [
            { key: "logo", label: "Logo", hint: "SVG or PNG, ideally on a transparent background", required: true },
            { key: "guidelines", label: "Brand guidelines", hint: "PDF", required: false },
            { key: "photography", label: "Product photography", hint: "Anything you have — we can work with rough shots", required: false },
            { key: "existing", label: "Existing ad creative", hint: "So we don't repeat what's already been tried", required: false },
          ],
        },
      },
      {
        type: "checklist",
        title: "Account access",
        description:
          "Add us to the accounts we'll be working in. Each takes about a minute.",
        required: true,
        configured: false,
        // NEVER a password field. Accepting a client's platform
        // credentials violates Meta's terms and gets accounts locked.
        // Instructions plus confirmation only.
        config: {
          items: [
            { key: "google-ads", label: "Google Ads", instruction: "Tools & Settings → Access and security → invite your agency email as Standard.", required: true },
            { key: "ga4", label: "Google Analytics 4", instruction: "Admin → Property access management → add your agency email as Editor.", required: true },
            { key: "meta", label: "Meta Business Manager", instruction: "Business Settings → Partners → Add partner → enter your agency's Business ID.", required: true },
          ],
        },
      },
      AGREEMENT,
      deposit("Deposit"),
      SCHEDULING,
    ],
  },

  {
    id: "design",
    name: "Design studio",
    description:
      "Creative brief, reference material, agreement, deposit, kickoff.",
    steps: [
      WELCOME,
      COMPANY_INFO,
      {
        type: "questionnaire",
        title: "Creative brief",
        description: "Five questions so we start in the right place.",
        required: true,
        configured: true,
        config: {
          questions: [
            { prompt: "What are we designing, and what is it for?", type: "long" },
            { prompt: "Who sees this, and what should they feel?", type: "long" },
            { prompt: "Three brands whose look you admire — and why", type: "long" },
            { prompt: "Anything that is definitely off the table?", type: "long" },
            { prompt: "Hard deadlines we should know about?", type: "short" },
          ],
        },
      },
      {
        type: "files",
        title: "Reference material",
        description: "Anything that helps us understand the direction.",
        required: false,
        configured: true,
        config: {
          requests: [
            { key: "existing", label: "Existing brand assets", hint: "Logo, type, colours — whatever exists today", required: false },
            { key: "references", label: "References you like", hint: "Screenshots or links are fine", required: false },
          ],
        },
      },
      AGREEMENT,
      deposit("Deposit"),
      SCHEDULING,
    ],
  },

  {
    id: "consulting",
    name: "Consultant",
    description:
      "Engagement scope, background documents, agreement, first invoice, kickoff.",
    steps: [
      WELCOME,
      COMPANY_INFO,
      {
        type: "questionnaire",
        title: "Engagement scope",
        description: "Five questions about what you're trying to solve.",
        required: true,
        configured: true,
        config: {
          questions: [
            { prompt: "What problem prompted you to reach out now?", type: "long" },
            { prompt: "What have you already tried?", type: "long" },
            { prompt: "How will you know this engagement worked?", type: "long" },
            { prompt: "Who else needs to be involved?", type: "short" },
            { prompt: "What's the decision-making process on your side?", type: "long" },
          ],
        },
      },
      {
        type: "files",
        title: "Background documents",
        description: "Anything that saves us a discovery call.",
        required: false,
        configured: true,
        config: {
          requests: [
            { key: "context", label: "Relevant documents", hint: "Strategy decks, reports, org charts", required: false },
          ],
        },
      },
      AGREEMENT,
      deposit("First invoice"),
      SCHEDULING,
    ],
  },

  {
    id: "scratch",
    name: "Something else",
    description: "Welcome and company information only. Build up from there.",
    // Never an empty canvas. An empty state at first run is an
    // activation failure, not a blank slate.
    steps: [WELCOME, COMPANY_INFO],
  },
];

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[TEMPLATES.length - 1];
}
