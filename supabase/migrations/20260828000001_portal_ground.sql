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
