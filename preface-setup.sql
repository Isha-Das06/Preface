-- Preface — full database setup
-- Paste this whole file into the Supabase SQL Editor and press Run.
--
-- Every migration in order, as one script. Safe to run once on a
-- fresh project. Creates the schema, the row-level security that
-- keeps one agency's clients invisible to another, and the two
-- storage buckets for client uploads and business logos.
-- 6 migrations, generated from supabase/migrations.


-- ==================================================================
-- 20260816000001_init.sql
-- ==================================================================

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
-- GRANTS
--
-- Creating a table grants the API roles nothing usable, so without
-- this block every request returns 401/403 no matter how correct the
-- RLS policies are. Explicit beats relying on default privileges.
--
-- Deliberately tighter than Supabase's stock setup, which grants
-- everything to `anon` and leans entirely on RLS. Our architecture
-- never touches Postgres from the browser: the business app runs as
-- `authenticated` server-side, and the client portal runs as
-- `service_role` server-side. So `anon` needs no table access at
-- all, and giving it none removes a whole class of mistake.
-- ============================================================

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete
  on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Bypasses RLS. Used only by the portal and webhooks, which have no
-- authenticated user and must scope every query by token themselves.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

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


-- ==================================================================
-- 20260818000001_fix_bootstrap_rls.sql
-- ==================================================================

-- ============================================================
-- Fix: a new user could never create their first business.
--
-- The original policy on `businesses` was FOR ALL with
--   check (id = auth_business_id())
-- which is unsatisfiable at signup: auth_business_id() reads the
-- `users` table, the user has no row there yet, so it returns NULL
-- and `id = NULL` is never true. Every real signup failed with
-- "new row violates row-level security policy".
--
-- The same trap applied to `users`: inserting the row that MAKES
-- auth_business_id() non-null required it to already be non-null.
--
-- Fix is to split INSERT out of the tenant policies and give each a
-- bootstrap rule, rather than loosening tenant isolation.
-- ============================================================

-- Does a business already have members? SECURITY DEFINER so the
-- lookup bypasses RLS — a plain subquery inside a policy is itself
-- filtered by RLS, would always come back empty, and would silently
-- make the check below pass for anyone.
create or replace function business_has_users(bid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from users where business_id = bid)
$$;

-- ── businesses ───────────────────────────────────────────────
drop policy if exists tenant_rw on businesses;

create policy tenant_select on businesses for select
  using (id = auth_business_id());

create policy tenant_update on businesses for update
  using (id = auth_business_id())
  with check (id = auth_business_id());

create policy tenant_delete on businesses for delete
  using (id = auth_business_id());

-- Bootstrap: create one only if you don't already have one. A user
-- who somehow creates an orphan business gains nothing — it has no
-- members, so nothing can be attached to it.
create policy bootstrap_insert on businesses for insert
  to authenticated
  with check (auth_business_id() is null);

-- ── users ────────────────────────────────────────────────────
drop policy if exists tenant_rw on users;

create policy tenant_select on users for select
  using (business_id = auth_business_id());

create policy tenant_update on users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Bootstrap: attach ONLY yourself, and only to a business nobody
-- has claimed yet. Without the second condition a user could insert
-- their own row pointing at someone else's business_id and read
-- that tenant's entire account.
create policy bootstrap_insert on users for insert
  to authenticated
  with check (
    id = auth.uid()
    and not business_has_users(business_id)
  );


-- ==================================================================
-- 20260818000002_storage.sql
-- ==================================================================

-- ============================================================
-- Storage for client uploads.
--
-- One private bucket. Nothing in it is ever public: a brand pack, a
-- signed agreement and a company's internal documents are exactly the
-- things that must not sit behind a guessable URL.
--
-- Access model, matching the rest of the app:
--   • the browser NEVER holds a key that can read the bucket
--   • the client portal uploads through a one-shot signed URL that
--     the server issues after resolving the onboarding token
--   • the business downloads through a short-lived signed URL that
--     the server issues after RLS has already proved they own the row
--
-- So `storage.objects` deliberately gets NO policies for anon or
-- authenticated. Without a policy those roles can do nothing at all,
-- which is the intent — every path in and out goes through a server
-- handler that has already decided the caller is allowed.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit)
values (
  'onboarding-files',
  'onboarding-files',
  false,
  -- 25 MB, matching the limit the portal tells the client. Enforced
  -- here as well as in the action, because the action's check is a
  -- courtesy message and this one is the actual rule.
  26214400
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit;

-- Deliberately no `allowed_mime_types`: agencies genuinely receive
-- .ai, .sketch, .zip and things we have not thought of, and a
-- whitelist here turns into a client who cannot send their logo.
-- The safety property comes from how files are served instead —
-- always as an attachment from a signed URL, never rendered inline —
-- so an uploaded .html or .svg cannot run as script on our origin.


-- ==================================================================
-- 20260819000001_logo_storage.sql
-- ==================================================================

-- ============================================================
-- Business logos.
--
-- A separate bucket from onboarding-files, and public where that one
-- is private, because the two have opposite requirements:
--
--   onboarding-files  a client's contract and documents. Private,
--                     signed URLs, always served as an attachment.
--   business-logos    a mark that appears at the top of every client's
--                     onboarding page. It has to load in an <img> for
--                     anyone holding the link, forever.
--
-- A signed URL cannot do that: it expires, and the portal page is
-- server-rendered and cached by nobody, so every render would have to
-- mint a new one. Public is the honest answer for something already
-- shown to every client.
--
-- Mime types are restricted here rather than left open, which is the
-- reverse of the other bucket. There the whitelist would block a
-- client's .ai file and break the step; here anything that is not an
-- image is simply not a logo.
--
-- SVG is allowed because half of all logos are SVG and the templates
-- ask for it by name. An SVG referenced from <img> cannot run script;
-- navigating to one directly can, but storage is served from the
-- Supabase domain rather than the app's, so it has no access to the
-- session cookie either way.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-logos',
  'business-logos',
  true,
  2097152,  -- 2 MB; a logo that needs more than this is the wrong file
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Still no policies for anon or authenticated: uploads go through a
-- one-shot signed URL the server issues after checking who is asking,
-- exactly as client uploads do. `public` governs reads, not writes.


-- ==================================================================
-- 20260821000001_link_recovery.sql
-- ==================================================================

-- Two rate limits the app could not enforce without somewhere to
-- keep a count.
--
-- 1. Resending the verification code used to reset
--    verification_attempts to 0 with nothing capping how often you
--    could ask. Five guesses, resend, five more — the attempt limit
--    protecting the agreement and payment steps did not actually
--    hold, and every resend put another email in a client's inbox.
--
--    Attempts still reset per code, which is what a client who
--    mistyped one deserves. The RESENDS are what is capped now, so
--    total guesses are bounded at attempts x resends.
--
-- 2. "Send me a new link" on the expired-link screen needs a
--    cooldown, or the one screen a stranger can reach without a
--    token becomes a way to mail somebody repeatedly.

alter table onboardings
  add column verification_resends       int not null default 0,
  add column verification_last_sent_at  timestamptz,
  -- Cooldown for the expired-link recovery form.
  add column link_resent_at             timestamptz;

-- The recovery form looks an onboarding up by the client's email
-- address, which is the one query in the app that starts from an
-- email rather than a token or a business.
create index if not exists clients_email_idx on clients (lower(email));


-- ==================================================================
-- 20260828000001_portal_ground.sql
-- ==================================================================

-- The background a business puts behind their client's onboarding.
--
-- A named ground from a fixed list, not a hex value, deliberately.
-- The client reads a contract and enters payment details on this
-- page; a free colour would let a business choose one their own
-- client's text vanishes against. Storing the NAME means the list can
-- be re-tuned later without every row carrying a colour we no longer
-- consider readable.
--
-- 'warm' is what every existing portal already looks like, so this
-- default changes nothing for anyone.
alter table businesses
  add column portal_ground text not null default 'warm';
