# Setup

The app runs **without any of this** — every screen renders on mock data, nothing 500s. Follow this when you want real auth and a real database.

## Option A — local, no account (recommended for dev)

Docker is already installed on this machine; the daemon just needs to be running.

1. **Start Docker Desktop** and wait for it to say "Engine running".

2. **Start Supabase.** First run pulls several GB of images, so give it a few minutes.
   ```bash
   npx supabase start
   ```
   It prints an API URL, an `anon key` and a `service_role key` when it finishes.

3. **Copy the env file and paste those three values in.**
   ```bash
   cp .env.example .env.local
   ```
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   SUPABASE_SERVICE_ROLE_KEY=<service_role key>
   ```

4. **Apply the schema and seed.**
   ```bash
   npx supabase db reset
   ```

5. **Restart the dev server** so it picks up `.env.local`.

Local Studio runs at `http://127.0.0.1:54323` — useful for inspecting rows and confirming RLS actually bites.

## Option B — hosted Supabase

1. Create a project at supabase.com.
2. **Project Settings → API** gives you the URL, `anon` key and `service_role` key. Put them in `.env.local`.
3. Push the schema:
   ```bash
   npx supabase link --project-ref <your-ref>
   npx supabase db push
   ```
4. Paste `supabase/seed.sql` into the SQL editor if you want the sample clients.

## After it's connected

Generate the real database types and delete the hand-written note in `src/lib/supabase/types.ts`:

```bash
npx supabase gen types typescript --local > src/lib/supabase/types.ts
```

Then the client can take its `<Database>` generic back and every query becomes fully typed. Until then reads are typed explicitly against the row interfaces — see the note in that file for why the generic isn't hand-written.

## What exists after Goal 6

- 12 tables with RLS, tenant-isolated through a single `auth_business_id()` helper
- Email/password auth, session refresh in middleware, `/app` and `/welcome` guarded
- Signup → first run → **business, workflow and steps created from the chosen template**, so the builder is never empty
- Sign-out in the sidebar

**Not yet wired:** the app screens still read from `src/lib/mock-app.ts`. Swapping those for real queries is Goal 7, and the portal is Goal 8.

## Verifying RLS actually works

Worth doing once, because a silent RLS failure is the worst bug in a multi-tenant app. In Studio's SQL editor:

```sql
-- as an authenticated user of business A, this must return 0 rows
select * from onboardings where business_id = '<business B id>';
```

If it returns rows, a policy is wrong — stop and fix it before Goal 7.
