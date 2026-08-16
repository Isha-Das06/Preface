-- ============================================================
-- Preface — initial schema
-- Source of truth: docs/03-technical.md
--
-- Twelve tables. The original spec listed eighteen entities;
-- five were over-normalisation (Form/FormField/FormResponse,
-- OnboardingTemplate, TeamMember) and one folded into events.
-- ============================================================

create extension if not exists "pgcrypto";

-- ── Business & auth ──────────────────────────────────────────

create table businesses (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text unique not null,
  logo_url        text,
  accent_color    text not null default '#1F6F4A',
  welcome_message text,
  reply_to_email  text,
  sender_name     text,
  stripe_account_id  text,   -- Connect: receives client payments
  stripe_customer_id text,   -- Billing: pays us
  plan            text not null default 'trial',
  trial_ends_at   timestamptz,
  reminders_enabled boolean not null default true,
  digest_enabled    boolean not null default true,
  created_at      timestamptz not null default now()
);

create table users (
  id          uuid primary key references auth.users(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  email       text not null,
  name        text,
  created_at  timestamptz not null default now()
);
create index on users (business_id);

-- ── Workflow definition (the reusable template) ──────────────

create table workflows (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name        text not null default 'New client onboarding',
  created_at  timestamptz not null default now()
);
create index on workflows (business_id);

create type step_type as enum (
  'instructions','info','questionnaire','files','checklist',
  'agreement','payment','scheduling'
);

create table workflow_steps (
  id          uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows(id) on delete cascade,
  position    int  not null,
  type        step_type not null,
  title       text not null,
  description text,
  required    boolean not null default true,
  enabled     boolean not null default true,
  -- false ⇒ omitted from the client's view entirely. The workflow
  -- stays sendable without it; that is the activation constraint.
  configured  boolean not null default false,
  -- "Locked until earlier steps are done." Dependencies, not strict
  -- sequencing — only payment uses it by default.
  requires_previous boolean not null default false,
  config      jsonb not null default '{}'::jsonb,
  constraint workflow_steps_position_unique
    unique (workflow_id, position) deferrable initially deferred
);
create index on workflow_steps (workflow_id, position);

-- ── Clients & live onboardings ───────────────────────────────

create table clients (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name        text,
  company     text not null,
  email       text not null,
  created_at  timestamptz not null default now()
);
create index on clients (business_id);

create type onboarding_status as enum
  ('not_started','in_progress','waiting','completed');

create table onboardings (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references businesses(id) on delete cascade,
  client_id        uuid not null references clients(id) on delete cascade,
  workflow_id      uuid not null references workflows(id),
  -- 32-char base58 from a CSPRNG. Not sequential, not derived from
  -- client data. This is a bearer credential.
  token            text unique not null,
  status           onboarding_status not null default 'not_started',
  -- Gates the agreement and payment steps. The link alone is enough
  -- for info/questionnaire/files; it is not enough to reach a
  -- contract or a payment request, because links get forwarded.
  email_verified_at      timestamptz,
  verification_code      text,
  verification_expires_at timestamptz,
  verification_attempts  int not null default 0,
  reminders_paused_until timestamptz,
  reminder_count   int not null default 0,
  sent_at          timestamptz,
  started_at       timestamptz,
  last_activity_at timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz not null default now()
);
create index on onboardings (business_id, status);
create index on onboardings (status, last_activity_at);  -- reminder scan
create index on onboardings (client_id);

-- ⚠ Steps are COPIED from workflow_steps at send time.
--   Editing a workflow must never mutate an in-flight onboarding:
--   otherwise a business rewrites questions a client is halfway
--   through, and the signed agreement stops matching what was shown.
create table onboarding_steps (
  id             uuid primary key default gen_random_uuid(),
  onboarding_id  uuid not null references onboardings(id) on delete cascade,
  position       int not null,
  type           step_type not null,
  title          text not null,
  description    text,
  required       boolean not null default true,
  requires_previous boolean not null default false,
  config         jsonb not null default '{}'::jsonb,  -- snapshot
  data           jsonb not null default '{}'::jsonb,  -- client submission
  completed_at   timestamptz,
  constraint onboarding_steps_position_unique
    unique (onboarding_id, position) deferrable initially deferred
);
create index on onboarding_steps (onboarding_id, position);

-- ── Step artifacts ───────────────────────────────────────────

create table files (
  id                 uuid primary key default gen_random_uuid(),
  onboarding_step_id uuid not null references onboarding_steps(id) on delete cascade,
  request_key        text,          -- which requested item this satisfies
  filename           text not null,
  size_bytes         bigint not null,
  mime_type          text,
  storage_path       text not null,
  uploaded_at        timestamptz not null default now()
);
create index on files (onboarding_step_id);

create table signatures (
  id                 uuid primary key default gen_random_uuid(),
  onboarding_step_id uuid not null references onboarding_steps(id) on delete cascade,
  signer_name        text not null,
  signer_email       text not null,
  -- Immutable snapshot of the exact text shown, plus a hash. Never
  -- re-render a signed agreement from the live workflow.
  agreement_text     text not null,
  agreement_hash     text not null,
  ip_address         inet,
  user_agent         text,
  pdf_path           text,
  signed_at          timestamptz not null default now()
);
create index on signatures (onboarding_step_id);

create table payments (
  id                 uuid primary key default gen_random_uuid(),
  onboarding_step_id uuid not null references onboarding_steps(id) on delete cascade,
  stripe_payment_intent_id text unique,
  amount_cents       int not null,
  currency           text not null default 'usd',
  status             text not null,
  paid_at            timestamptz
);
create index on payments (onboarding_step_id);

-- ── Comms & audit ────────────────────────────────────────────

create table reminders (
  id            uuid primary key default gen_random_uuid(),
  onboarding_id uuid not null references onboardings(id) on delete cascade,
  kind          text not null,        -- 'manual' | 'auto_2d' | 'auto_5d' | 'auto_12d'
  sent_at       timestamptz not null default now()
);
create index on reminders (onboarding_id);

-- Single append-only log. Powers the activity feed, the waiting-on
-- view, email tracking and debugging. Replaces a separate
-- EmailEvent table entirely.
create table events (
  id            uuid primary key default gen_random_uuid(),
  onboarding_id uuid references onboardings(id) on delete cascade,
  business_id   uuid references businesses(id) on delete cascade,
  type          text not null,
  meta          jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index on events (onboarding_id, created_at desc);
create index on events (business_id, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
--
-- Every app-side table is scoped to the caller's business. The
-- CLIENT PORTAL bypasses RLS by design — it has no authenticated
-- user. Portal access goes exclusively through server-side handlers
-- that resolve token → onboarding_id and scope every query to it.
-- Never expose an anon-key client query to the portal.
-- ============================================================

alter table businesses      enable row level security;
alter table users           enable row level security;
alter table workflows       enable row level security;
alter table workflow_steps  enable row level security;
alter table clients         enable row level security;
alter table onboardings     enable row level security;
alter table onboarding_steps enable row level security;
alter table files           enable row level security;
alter table signatures      enable row level security;
alter table payments        enable row level security;
alter table reminders       enable row level security;
alter table events          enable row level security;

-- Resolve the caller's business once. SECURITY DEFINER + a pinned
-- search_path so the policies below can't be subverted by a
-- shadowed table, and STABLE so Postgres caches it per statement
-- instead of re-querying for every row.
create or replace function auth_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select business_id from users where id = auth.uid()
$$;

create policy tenant_rw on businesses for all
  using (id = auth_business_id())
  with check (id = auth_business_id());

create policy tenant_rw on users for all
  using (business_id = auth_business_id())
  with check (business_id = auth_business_id());

create policy tenant_rw on workflows for all
  using (business_id = auth_business_id())
  with check (business_id = auth_business_id());

create policy tenant_rw on clients for all
  using (business_id = auth_business_id())
  with check (business_id = auth_business_id());

create policy tenant_rw on onboardings for all
  using (business_id = auth_business_id())
  with check (business_id = auth_business_id());

create policy tenant_rw on events for all
  using (business_id = auth_business_id())
  with check (business_id = auth_business_id());

-- Child tables inherit isolation through their parent.
create policy tenant_rw on workflow_steps for all
  using (exists (
    select 1 from workflows w
    where w.id = workflow_steps.workflow_id
      and w.business_id = auth_business_id()))
  with check (exists (
    select 1 from workflows w
    where w.id = workflow_steps.workflow_id
      and w.business_id = auth_business_id()));

create policy tenant_rw on onboarding_steps for all
  using (exists (
    select 1 from onboardings o
    where o.id = onboarding_steps.onboarding_id
      and o.business_id = auth_business_id()))
  with check (exists (
    select 1 from onboardings o
    where o.id = onboarding_steps.onboarding_id
      and o.business_id = auth_business_id()));

create policy tenant_rw on reminders for all
  using (exists (
    select 1 from onboardings o
    where o.id = reminders.onboarding_id
      and o.business_id = auth_business_id()))
  with check (exists (
    select 1 from onboardings o
    where o.id = reminders.onboarding_id
      and o.business_id = auth_business_id()));

create policy tenant_rw on files for all
  using (exists (
    select 1 from onboarding_steps os
    join onboardings o on o.id = os.onboarding_id
    where os.id = files.onboarding_step_id
      and o.business_id = auth_business_id()))
  with check (exists (
    select 1 from onboarding_steps os
    join onboardings o on o.id = os.onboarding_id
    where os.id = files.onboarding_step_id
      and o.business_id = auth_business_id()));

create policy tenant_rw on signatures for all
  using (exists (
    select 1 from onboarding_steps os
    join onboardings o on o.id = os.onboarding_id
    where os.id = signatures.onboarding_step_id
      and o.business_id = auth_business_id()))
  with check (exists (
    select 1 from onboarding_steps os
    join onboardings o on o.id = os.onboarding_id
    where os.id = signatures.onboarding_step_id
      and o.business_id = auth_business_id()));

create policy tenant_rw on payments for all
  using (exists (
    select 1 from onboarding_steps os
    join onboardings o on o.id = os.onboarding_id
    where os.id = payments.onboarding_step_id
      and o.business_id = auth_business_id()))
  with check (exists (
    select 1 from onboarding_steps os
    join onboardings o on o.id = os.onboarding_id
    where os.id = payments.onboarding_step_id
      and o.business_id = auth_business_id()));
