-- ============================================================
-- Realistic step config for the seeded demo tenant.
--
-- The original seed wrote '{}' into every workflow_steps.config,
-- which predates templates.ts. Once the portal reads real data that
-- becomes visible as a broken demo: an info step with no fields, a
-- questionnaire with no questions, an agreement with nothing to sign.
--
-- seed.sql now carries this config directly, so a fresh `db reset`
-- needs none of this. It is kept as a backfill for a database that
-- was already seeded with the empty version, where a reset would
-- drop local auth users along with the bad data.
--
-- Scoped to the demo tenant by slug: a real signup's steps come from
-- templates.ts and are already correct. Safe to re-run.
-- ============================================================

-- ── The workflow template the business edits ─────────────────

update workflow_steps set config = jsonb_build_object(
  'body', 'We are glad to have you on board. Before we start, there are a few things we need from you. It takes about 15 minutes and you can stop and come back any time.'
) where type = 'instructions'
  and workflow_id in (select w.id from workflows w join businesses b on b.id = w.business_id where b.slug = 'acme-agency');

update workflow_steps set config = jsonb_build_object(
  'fields', jsonb_build_array(
    jsonb_build_object('name','company','label','Company name','type','text','required',true),
    jsonb_build_object('name','contact','label','Your name','type','text','required',true),
    jsonb_build_object('name','email','label','Email','type','email','required',true),
    jsonb_build_object('name','phone','label','Phone','type','tel','required',false),
    jsonb_build_object('name','website','label','Website','type','url','required',false),
    jsonb_build_object('name','address','label','Billing address','type','textarea','required',false)
  )
) where type = 'info'
  and workflow_id in (select w.id from workflows w join businesses b on b.id = w.business_id where b.slug = 'acme-agency');

update workflow_steps set config = jsonb_build_object(
  'questions', jsonb_build_array(
    jsonb_build_object('prompt','What does your business do, in one or two sentences?','type','long'),
    jsonb_build_object('prompt','Who is your ideal customer?','type','long'),
    jsonb_build_object('prompt','What does success look like 90 days from now?','type','long'),
    jsonb_build_object('prompt','Which channels are working today? Which are not?','type','long'),
    jsonb_build_object('prompt','Who has final approval on creative?','type','short')
  )
) where type = 'questionnaire'
  and workflow_id in (select w.id from workflows w join businesses b on b.id = w.business_id where b.slug = 'acme-agency');

update workflow_steps set config = jsonb_build_object(
  'requests', jsonb_build_array(
    jsonb_build_object('key','logo','label','Logo','hint','SVG or PNG, ideally on a transparent background','required',true),
    jsonb_build_object('key','guidelines','label','Brand guidelines','hint','PDF','required',false),
    jsonb_build_object('key','photography','label','Product photography','hint','Anything you have - we can work with rough shots','required',false),
    jsonb_build_object('key','existing','label','Existing ad creative','hint','So we do not repeat what has already been tried','required',false)
  )
) where type = 'files'
  and workflow_id in (select w.id from workflows w join businesses b on b.id = w.business_id where b.slug = 'acme-agency');

-- Never a password field. Accepting a client's platform credentials
-- violates Meta's terms and gets accounts locked.
update workflow_steps set config = jsonb_build_object(
  'items', jsonb_build_array(
    jsonb_build_object('key','google-ads','label','Google Ads','instruction','Tools & Settings -> Access and security -> invite ads@acmeagency.co as Standard.','required',true),
    jsonb_build_object('key','ga4','label','Google Analytics 4','instruction','Admin -> Property access management -> add ads@acmeagency.co as Editor.','required',true),
    jsonb_build_object('key','meta','label','Meta Business Manager','instruction','Business Settings -> Partners -> Add partner -> enter our ID 402 998 117 431.','required',true),
    jsonb_build_object('key','shopify','label','Shopify','instruction','Settings -> Users and permissions -> invite ads@acmeagency.co with Reports access.','required',false)
  )
), configured = true where type = 'checklist'
  and workflow_id in (select w.id from workflows w join businesses b on b.id = w.business_id where b.slug = 'acme-agency');

-- Agreement text is always the customer's own; we ship none in the
-- templates. The demo tenant needs one to be a working demo.
update workflow_steps set config = jsonb_build_object(
  'body', jsonb_build_array(
    jsonb_build_object('heading','1. Scope of work','text','Acme Agency will provide marketing strategy, campaign design, and campaign management services as described in the accompanying proposal. Any work beyond that scope will be agreed in writing before it begins.'),
    jsonb_build_object('heading','2. Term','text','This agreement begins on the effective date and continues for an initial term of six months. Either party may end it with 30 days written notice.'),
    jsonb_build_object('heading','3. Fees and payment','text','The total engagement fee is $5,000.00 per month. A deposit of $2,500.00 is due before work begins. Invoices are issued monthly in advance and are payable within 14 days.'),
    jsonb_build_object('heading','4. Ownership','text','On full payment, the client owns all final deliverables produced under this agreement. Acme Agency retains ownership of its underlying tools, templates and know-how.'),
    jsonb_build_object('heading','5. Confidentiality','text','Each party will keep the other non-public information confidential and use it only to perform this agreement. This obligation continues for two years after the agreement ends.'),
    jsonb_build_object('heading','6. Liability','text','Neither party is liable for indirect or consequential loss. Each party total liability under this agreement is limited to the fees paid in the three months before the claim arose.')
  )
), configured = true where type = 'agreement'
  and workflow_id in (select w.id from workflows w join businesses b on b.id = w.business_id where b.slug = 'acme-agency');

update workflow_steps set config = jsonb_build_object(
  'amountCents', 250000,
  'currency', 'usd',
  'description', 'Project deposit'
), configured = true where type = 'payment'
  and workflow_id in (select w.id from workflows w join businesses b on b.id = w.business_id where b.slug = 'acme-agency');

update workflow_steps set config = jsonb_build_object(
  'url', 'https://cal.com/acmeagency/kickoff',
  'duration', '45 minutes',
  'format', 'Video call'
), configured = true where type = 'scheduling'
  and workflow_id in (select w.id from workflows w join businesses b on b.id = w.business_id where b.slug = 'acme-agency');

-- ── Snapshots already sent to clients ────────────────────────
--
-- Backfill only: a real snapshot is taken at send time and must
-- never be rewritten afterwards. This exists because the seeded
-- snapshots were written empty, which is a seeding bug rather than
-- a legitimate edit.

update onboarding_steps os
set config = ws.config
from workflow_steps ws, onboardings o, businesses b
where ws.type = os.type
  and o.id = os.onboarding_id
  and b.id = o.business_id
  and b.slug = 'acme-agency'
  and ws.workflow_id = o.workflow_id
  and os.config = '{}'::jsonb;
