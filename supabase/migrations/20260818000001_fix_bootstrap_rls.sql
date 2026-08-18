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
