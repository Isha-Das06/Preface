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
