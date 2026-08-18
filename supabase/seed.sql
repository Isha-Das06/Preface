-- ============================================================
-- Seed data — mirrors src/lib/mock-app.ts so the app looks the
-- same before and after the database is wired up. That matters:
-- if seeded data looked different from the mocks you'd never know
-- whether a layout broke or the data just changed.
--
-- Runs automatically on `npx supabase db reset`.
--
-- The auth user is created separately; sign up through the UI with
-- any email, then re-run this with your own business id if you want
-- these clients attached to your account.
-- ============================================================

do $$
declare
  biz_id  uuid := '11111111-1111-1111-1111-111111111111';
  wf_id   uuid := '22222222-2222-2222-2222-222222222222';
  c_north uuid := gen_random_uuid();
  c_vertex uuid := gen_random_uuid();
  c_atlas uuid := gen_random_uuid();
  c_harbor uuid := gen_random_uuid();
  c_acme  uuid := gen_random_uuid();
begin

insert into businesses (id, name, slug, accent_color, welcome_message,
                        reply_to_email, sender_name, plan, trial_ends_at)
values (
  biz_id, 'Acme Agency', 'acme-agency', '#1F6F4A',
  'Before we start, there are a few things we need from you. It takes about 15 minutes and you can stop and come back any time.',
  'marcus@acmeagency.co', 'Marcus at Acme Agency', 'studio',
  now() + interval '14 days'
) on conflict (id) do nothing;

insert into workflows (id, business_id, name)
values (wf_id, biz_id, 'New client onboarding')
on conflict (id) do nothing;

-- Eight steps, matching the marketing-agency template, each with the
-- config its screen actually reads.
--
-- These used to be seeded as '{}'. That was invisible while the
-- portal ran on mock data and became a broken demo the moment it read
-- real rows: an info step with no fields, a questionnaire with no
-- questions, an agreement with nothing to sign. Seed data has to be
-- representative or it only proves the page renders.
--
-- All eight are configured here, including the agreement text, so the
-- demo tenant exercises the whole flow. A real signup still gets the
-- template's unconfigured agreement/payment/scheduling steps, because
-- the agreement text is always the customer's own.
insert into workflow_steps
  (workflow_id, position, type, title, description, required, enabled, configured, requires_previous, config)
values
  (wf_id, 0, 'instructions', 'Welcome', 'A short note before they start.', false, true, true, false,
   '{"body":"We are glad to have you on board. Before we start, there are a few things we need from you. It takes about 15 minutes and you can stop and come back any time."}'::jsonb),
  (wf_id, 1, 'info', 'Company information', 'So we know who to contact and how to reach you.', true, true, true, false,
   '{"fields":[{"name":"company","label":"Company name","type":"text","required":true},{"name":"contact","label":"Your name","type":"text","required":true},{"name":"email","label":"Email","type":"email","required":true},{"name":"phone","label":"Phone","type":"tel","required":false},{"name":"website","label":"Website","type":"url","required":false},{"name":"address","label":"Billing address","type":"textarea","required":false}]}'::jsonb),
  (wf_id, 2, 'questionnaire', 'Project questionnaire', 'Five questions about the work ahead.', true, true, true, false,
   '{"questions":[{"prompt":"What does your business do, in one or two sentences?","type":"long"},{"prompt":"Who is your ideal customer?","type":"long"},{"prompt":"What does success look like 90 days from now?","type":"long"},{"prompt":"Which channels are working today? Which are not?","type":"long"},{"prompt":"Who has final approval on creative?","type":"short"}]}'::jsonb),
  (wf_id, 3, 'files', 'Brand assets', 'Upload what you have.', true, true, true, false,
   '{"requests":[{"key":"logo","label":"Logo","hint":"SVG or PNG, ideally on a transparent background","required":true},{"key":"guidelines","label":"Brand guidelines","hint":"PDF","required":false},{"key":"photography","label":"Product photography","hint":"Anything you have - we can work with rough shots","required":false},{"key":"existing","label":"Existing ad creative","hint":"So we do not repeat what has already been tried","required":false}]}'::jsonb),
  (wf_id, 4, 'checklist', 'Account access', 'Add us to the accounts we will be working in.', true, true, true, false,
   '{"items":[{"key":"google-ads","label":"Google Ads","instruction":"Tools & Settings -> Access and security -> invite ads@acmeagency.co as Standard.","required":true},{"key":"ga4","label":"Google Analytics 4","instruction":"Admin -> Property access management -> add ads@acmeagency.co as Editor.","required":true},{"key":"meta","label":"Meta Business Manager","instruction":"Business Settings -> Partners -> Add partner -> enter our ID 402 998 117 431.","required":true},{"key":"shopify","label":"Shopify","instruction":"Settings -> Users and permissions -> invite ads@acmeagency.co with Reports access.","required":false}]}'::jsonb),
  (wf_id, 5, 'agreement', 'Service agreement', 'Please read through, then sign at the bottom.', true, true, true, false,
   '{"body":[{"heading":"1. Scope of work","text":"Acme Agency will provide marketing strategy, campaign design, and campaign management services as described in the accompanying proposal. Any work beyond that scope will be agreed in writing before it begins."},{"heading":"2. Term","text":"This agreement begins on the effective date and continues for an initial term of six months. Either party may end it with 30 days written notice."},{"heading":"3. Fees and payment","text":"The total engagement fee is $5,000.00 per month. A deposit of $2,500.00 is due before work begins. Invoices are issued monthly in advance and are payable within 14 days."},{"heading":"4. Ownership","text":"On full payment, the client owns all final deliverables produced under this agreement. Acme Agency retains ownership of its underlying tools, templates and know-how."},{"heading":"5. Confidentiality","text":"Each party will keep the other non-public information confidential and use it only to perform this agreement. This obligation continues for two years after the agreement ends."},{"heading":"6. Liability","text":"Neither party is liable for indirect or consequential loss. Each party total liability under this agreement is limited to the fees paid in the three months before the claim arose."}]}'::jsonb),
  (wf_id, 6, 'payment', 'Deposit', 'Paid securely to Acme Agency.', true, true, true, true,
   '{"amountCents":250000,"currency":"usd","description":"Project deposit"}'::jsonb),
  (wf_id, 7, 'scheduling', 'Kickoff call', 'Pick a time that works for you.', false, true, true, false,
   '{"url":"https://cal.com/acmeagency/kickoff","duration":"45 minutes","format":"Video call"}'::jsonb);
-- No ON CONFLICT here: workflow_steps' unique constraint is
-- DEFERRABLE, and Postgres refuses a deferrable constraint as an
-- ON CONFLICT arbiter (SQLSTATE 55000). The seed only ever runs
-- against a fresh database, so there is nothing to conflict with.

insert into clients (id, business_id, name, company, email) values
  (c_north,  biz_id, 'Sarah Chen',    'Northstar Labs',  'sarah@northstarlabs.co'),
  (c_vertex, biz_id, 'Marcus Webb',   'Vertex Health',   'marcus@vertexhealth.com'),
  (c_atlas,  biz_id, 'Priya Raman',   'Atlas Digital',   'priya@atlasdigital.io'),
  (c_harbor, biz_id, 'Dan Okoro',     'Harbor & Finch',  'dan@harborfinch.co.uk'),
  (c_acme,   biz_id, 'Tom Alvarez',   'Acme Foods',      'tom@acmefoods.com');

-- Spread across every status so the waiting-on view, the filters
-- and the empty states all have something real to render.
insert into onboardings
  (business_id, client_id, workflow_id, token, status, sent_at, started_at, last_activity_at, completed_at, reminder_count)
values
  (biz_id, c_north,  wf_id, 'k3Xm9pQr2LwTv8BnHjK4dR7sY1uZ6aWc', 'waiting',     now() - interval '8 days',  now() - interval '8 days', now() - interval '6 days',  null, 2),
  (biz_id, c_vertex, wf_id, 'p7Nc2VbG9tYh4RkQ1mLxZ3sD6wJ8fA5e', 'waiting',     now() - interval '5 days',  now() - interval '5 days', now() - interval '2 days',  null, 1),
  (biz_id, c_atlas,  wf_id, 'w4Tz8HmK2bXq6PdL9vRn3cY7jF1sG5aU', 'in_progress', now() - interval '3 days',  now() - interval '3 days', now() - interval '4 hours', null, 0),
  (biz_id, c_harbor, wf_id, 'q9Bs5JkD3nWt7ZxM2hVc8rP4yL6gN1eT', 'not_started', now() - interval '19 hours', null,                      now() - interval '19 hours', null, 0),
  (biz_id, c_acme,   wf_id, 'm2Fy7LpX4dGh9QsB6vKw1tZc8nR3jH5A', 'completed',   now() - interval '15 days', now() - interval '15 days', now() - interval '11 days', now() - interval '11 days', 1);

end $$;
