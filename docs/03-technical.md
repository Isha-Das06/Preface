# Technical Design

## 1. Architecture

```
Next.js 15 (App Router, TypeScript, Tailwind)  ──►  Vercel
  ├── /(marketing)   static, no auth
  ├── /(app)         business app, Supabase session
  ├── /o/[token]     client portal, token-scoped, NO auth
  └── /api           webhooks + cron only

Supabase          Postgres + Auth + Storage (private buckets, signed URLs)
Stripe            Connect Standard (client payments) + Billing (subscriptions)
Resend            transactional email on mail.[domain]
Vercel Cron       reminders (hourly), digest (Mondays 9am)
```

**Decisions worth stating:**

- **Server Actions for the app, REST only where something external calls in.** Webhooks and cron are the only real API routes. Don't build a REST layer nobody consumes.
- **Stripe Connect Standard, not Express.** Standard means the business owns the account, handles their own compliance, and money never touches your balance. This directly serves "we are not a payment processor."
- **Private storage buckets, signed URLs, 60-minute expiry.** Uploaded files are client business documents; never public-read.
- **No Redis, no queue, no n8n, no microservices.** At this scale, Postgres and cron are correct. Adding infrastructure now buys nothing and costs debugging time you need for distribution.
- **One region.** Multi-region is a v3 problem you will probably never have.

## 2. Database schema

Twelve tables. The spec listed eighteen entities; five were over-normalization and one folded into events.

```sql
-- ── Business & auth ────────────────────────────────────────────
create table businesses (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text unique not null,
  logo_url        text,
  accent_color    text default '#1F6F4A',
  welcome_message text,
  reply_to_email  text,
  stripe_account_id       text,   -- Connect: receives client payments
  stripe_customer_id      text,   -- Billing: pays us
  plan            text not null default 'trial',
  trial_ends_at   timestamptz,
  created_at      timestamptz not null default now()
);

create table users (
  id          uuid primary key references auth.users(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  email       text not null,
  name        text,
  created_at  timestamptz not null default now()
);

-- ── Workflow definition (the reusable template) ────────────────
create table workflows (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name        text not null default 'New client onboarding',
  created_at  timestamptz not null default now()
);

create type step_type as enum (
  'instructions','info','questionnaire','files',
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
  configured  boolean not null default false,  -- false ⇒ omitted from client view
  config      jsonb not null default '{}'::jsonb,
  unique (workflow_id, position) deferrable initially deferred
);

-- ── Clients & live onboardings ─────────────────────────────────
create table clients (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name        text not null,
  company     text,
  email       text not null,
  created_at  timestamptz not null default now()
);

create type onboarding_status as enum
  ('not_started','in_progress','waiting','completed');

create table onboardings (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references businesses(id) on delete cascade,
  client_id        uuid not null references clients(id) on delete cascade,
  workflow_id      uuid not null references workflows(id),
  token            text unique not null,        -- 32-char base58
  status           onboarding_status not null default 'not_started',
  email_verified_at timestamptz,
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

-- ⚠ Steps are COPIED from workflow_steps at send time.
--   Editing a workflow must never mutate an in-flight onboarding.
create table onboarding_steps (
  id             uuid primary key default gen_random_uuid(),
  onboarding_id  uuid not null references onboardings(id) on delete cascade,
  position       int not null,
  type           step_type not null,
  title          text not null,
  description    text,
  required       boolean not null default true,
  config         jsonb not null default '{}'::jsonb,  -- snapshot
  data           jsonb not null default '{}'::jsonb,  -- client submission
  completed_at   timestamptz,
  unique (onboarding_id, position) deferrable initially deferred
);

-- ── Step artifacts ─────────────────────────────────────────────
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

create table signatures (
  id                 uuid primary key default gen_random_uuid(),
  onboarding_step_id uuid not null references onboarding_steps(id) on delete cascade,
  signer_name        text not null,
  signer_email       text not null,
  agreement_text     text not null,   -- immutable snapshot of what was shown
  agreement_hash     text not null,   -- sha256, tamper evidence
  ip_address         inet,
  user_agent         text,
  pdf_path           text,
  signed_at          timestamptz not null default now()
);

create table payments (
  id                 uuid primary key default gen_random_uuid(),
  onboarding_step_id uuid not null references onboarding_steps(id) on delete cascade,
  stripe_payment_intent_id text unique,
  amount_cents       int not null,
  currency           text not null default 'usd',
  status             text not null,
  paid_at            timestamptz
);

-- ── Comms & audit ──────────────────────────────────────────────
create table reminders (
  id            uuid primary key default gen_random_uuid(),
  onboarding_id uuid not null references onboardings(id) on delete cascade,
  kind          text not null,        -- 'manual' | 'auto_2d' | 'auto_5d'
  sent_at       timestamptz not null default now()
);

create table events (
  id            uuid primary key default gen_random_uuid(),
  onboarding_id uuid references onboardings(id) on delete cascade,
  business_id   uuid references businesses(id) on delete cascade,
  type          text not null,   -- link_sent, opened, step_completed,
                                 -- reminder_sent, email_delivered, completed…
  meta          jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index on events (onboarding_id, created_at desc);
```

### Three schema decisions that matter

**1. Snapshotting steps at send time.** `workflow_steps` is the template; `onboarding_steps` is the instance. Copying at send is the single most important structural choice here — without it, a business editing their questionnaire silently rewrites the questions a client is halfway through answering, and the signed agreement stops matching what was actually shown. That second one is a legal problem, not just a bug.

**2. `config` + `data` JSONB instead of Form/FormField/FormResponse.** Three normalized tables buy you queryability you will never use — nobody runs analytics across questionnaire answers in v1. JSONB costs one `zod` schema per step type and saves a large amount of join code.

**3. `events` as a single append-only log.** Powers the activity feed, the waiting-on view, debugging, and email tracking. Replaces `EmailEvent` entirely.

### Row-level security

```sql
alter table businesses, users, workflows, workflow_steps,
             clients, onboardings, onboarding_steps enable row level security;

-- App: everything scoped to the caller's business
create policy tenant_isolation on onboardings for all
  using (business_id = (select business_id from users where id = auth.uid()));
```
The client portal **bypasses RLS by design** — it has no authenticated user. Portal access goes exclusively through server-side handlers that resolve `token → onboarding_id` and scope every query to it. Never expose an anon-key client query to the portal.

## 3. API surface

### Server Actions — business app
```
createWorkflowFromTemplate(templateId)
updateWorkflowStep(stepId, patch)
reorderWorkflowSteps(orderedIds)
toggleWorkflowStep(stepId, enabled)

createClient({name, company, email})       → {onboardingId, url}
sendOnboarding(onboardingId)               -- snapshots steps, emails client
sendReminder(onboardingId)                 -- manual; pauses auto 48h
pauseReminders(onboardingId)
archiveOnboarding(onboardingId)

updateBranding({logo, name, accentColor, welcomeMessage})
updateReminderSettings({enabled, digestEnabled})
createStripeConnectLink()                  → onboarding URL
createBillingPortalSession()               → URL
```

### Server Actions — client portal (token-scoped)
```
getOnboarding(token)                       → sanitized view model
saveStepData(token, stepId, data)          -- autosave, partial, idempotent
completeStep(token, stepId)
requestVerificationCode(token)
verifyCode(token, code)                    -- required before agreement/payment
createUploadUrl(token, stepId, filename)   → signed PUT URL
confirmUpload(token, stepId, fileMeta)
signAgreement(token, stepId, {name, email})
createPaymentIntent(token, stepId)         → client secret
resendLink(email)                          -- expired-link recovery
```

**Portal sanitization is a hard requirement.** `getOnboarding` returns only: business branding, step list with titles/types/status, and the current step's config. It must never return `business_id`, internal IDs, other clients, agreement text for un-reached steps, or anything from `events`. Write this as one mapper function and let nothing bypass it.

### REST routes — external callers only
```
POST /api/webhooks/stripe          payment_intent.succeeded, checkout.*, 
                                   customer.subscription.*
POST /api/webhooks/resend          delivered / bounced / complained
POST /api/webhooks/scheduling      Cal.com + Calendly booking.created
GET  /api/cron/reminders           hourly
GET  /api/cron/digest              Mondays 09:00
GET  /api/files/[id]               auth check → 302 to signed URL
```

**Webhook rules:** verify signatures on all three; treat every handler as idempotent (Stripe *will* deliver twice); return 200 fast and do work after.

### Reminder logic — the whole thing
```sql
select o.* from onboardings o
where o.status in ('in_progress','waiting')
  and o.sent_at is not null
  and o.reminder_count < 3
  and (o.reminders_paused_until is null or o.reminders_paused_until < now())
  and (
    (o.reminder_count = 0 and o.last_activity_at < now() - interval '2 days') or
    (o.reminder_count = 1 and o.last_activity_at < now() - interval '5 days') or
    (o.reminder_count = 2 and o.last_activity_at < now() - interval '12 days')
  );
```
That query plus a send loop is the entire automation engine. Resist every urge to generalize it.

## 4. Security checklist

- Tokens: 32 chars from a CSPRNG, base58. Not sequential, not derived from client data.
- Email verification gates agreement and payment. Code is 6 digits, 10-minute expiry, 5 attempts, rate-limited per token.
- Rate limit portal writes per token; rate limit `resendLink` per email.
- File uploads: 25 MB cap, extension + MIME allowlist, stored under `{businessId}/{onboardingId}/{uuid}`, never the original path.
- Agreement snapshot is immutable once signed. Hash it. Never re-render from the live workflow.
- Signed URLs expire in 60 minutes and are generated per request.
- No PII in URLs or query strings, ever.
- `Reply-To` on all client email is the business's address, never yours.
