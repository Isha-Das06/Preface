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
