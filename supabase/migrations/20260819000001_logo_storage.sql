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
