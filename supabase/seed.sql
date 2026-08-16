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

-- Eight steps, matching the marketing-agency template. Two are
-- unconfigured on purpose: the workflow must stay sendable without
-- them, and the builder should show that state.
insert into workflow_steps
  (workflow_id, position, type, title, description, required, enabled, configured, requires_previous, config)
values
  (wf_id, 0, 'instructions', 'Welcome', 'A short note before they start.', false, true, true, false, '{}'),
  (wf_id, 1, 'info', 'Company information', 'So we know who to contact and how to reach you.', true, true, true, false, '{}'),
  (wf_id, 2, 'questionnaire', 'Project questionnaire', 'Five questions about the work ahead.', true, true, true, false, '{}'),
  (wf_id, 3, 'files', 'Brand assets', 'Upload what you have.', true, true, true, false, '{}'),
  (wf_id, 4, 'checklist', 'Account access', 'Add us to the accounts we will be working in.', true, true, true, false, '{}'),
  (wf_id, 5, 'agreement', 'Service agreement', 'Please read through, then sign at the bottom.', true, true, false, false, '{}'),
  (wf_id, 6, 'payment', 'Deposit', 'Paid securely to Acme Agency.', true, true, false, true, '{}'),
  (wf_id, 7, 'scheduling', 'Kickoff call', 'Pick a time that works for you.', false, true, true, false, '{}')
on conflict do nothing;

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
