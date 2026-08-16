/**
 * Row shapes for the tables in supabase/migrations.
 *
 * These type READS explicitly. They are not Supabase's generated
 * `Database` type and must not be passed as its generic — see the
 * note at the foot of this file.
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

export type OnboardingStatus =
  | "not_started"
  | "in_progress"
  | "waiting"
  | "completed";

export interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  accent_color: string;
  welcome_message: string | null;
  reply_to_email: string | null;
  sender_name: string | null;
  stripe_account_id: string | null;
  stripe_customer_id: string | null;
  plan: string;
  trial_ends_at: string | null;
  reminders_enabled: boolean;
  digest_enabled: boolean;
  created_at: string;
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  position: number;
  type: StepType;
  title: string;
  description: string | null;
  required: boolean;
  enabled: boolean;
  configured: boolean;
  requires_previous: boolean;
  config: Record<string, unknown>;
}

export interface Client {
  id: string;
  business_id: string;
  name: string | null;
  company: string;
  email: string;
  created_at: string;
}

export interface Onboarding {
  id: string;
  business_id: string;
  client_id: string;
  workflow_id: string;
  token: string;
  status: OnboardingStatus;
  email_verified_at: string | null;
  reminders_paused_until: string | null;
  reminder_count: number;
  sent_at: string | null;
  started_at: string | null;
  last_activity_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface OnboardingStep {
  id: string;
  onboarding_id: string;
  position: number;
  type: StepType;
  title: string;
  description: string | null;
  required: boolean;
  requires_previous: boolean;
  config: Record<string, unknown>;
  data: Record<string, unknown>;
  completed_at: string | null;
}

export interface AppUser {
  id: string;
  business_id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Workflow {
  id: string;
  business_id: string;
  name: string;
  created_at: string;
}

export interface FileRow {
  id: string;
  onboarding_step_id: string;
  request_key: string | null;
  filename: string;
  size_bytes: number;
  mime_type: string | null;
  storage_path: string;
  uploaded_at: string;
}

export interface Signature {
  id: string;
  onboarding_step_id: string;
  signer_name: string;
  signer_email: string;
  agreement_text: string;
  agreement_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  pdf_path: string | null;
  signed_at: string;
}

export interface Payment {
  id: string;
  onboarding_step_id: string;
  stripe_payment_intent_id: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  paid_at: string | null;
}

export interface Reminder {
  id: string;
  onboarding_id: string;
  kind: string;
  sent_at: string;
}

export interface EventRow {
  id: string;
  onboarding_id: string | null;
  business_id: string | null;
  type: string;
  meta: Record<string, unknown>;
  created_at: string;
}

/**
 * NOTE: there is deliberately no hand-written `Database` type here.
 *
 * Supabase's generated shape carries version-specific internal
 * constraints (GenericTable needs Relationships; GenericSchema needs
 * Views/Functions with a string index signature; SupabaseClient
 * threads an __InternalSupabase PostgrestVersion). Reconstructing it
 * by hand silently collapses every table to `never`, and the error
 * surfaces at the call site pointing nowhere near the cause.
 *
 * So the client stays untyped and reads are typed explicitly with
 * the interfaces above. Once the database is running, generate the
 * real thing and add the generic back:
 *
 *   npx supabase gen types typescript --local > src/lib/supabase/types.ts
 */
