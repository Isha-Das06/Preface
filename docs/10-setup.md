# Local setup

Everything runs on your own machine. No Supabase account, no cost, nothing online.

## Prerequisites

- **Docker Desktop** — must be *running* (green "Engine running", bottom-left)
- Node 20+

## Start

```bash
.bin/supabase.exe start     # Windows — see note below
npm run dev
```

App on `http://localhost:3000`. Database dashboard on `http://localhost:54323`. Emails land at `http://localhost:54324` — nothing is ever sent to a real address in local development.

## Test account

```
founder@acmeagency.co  /  testpassword123
```

Forgot a password? `/forgot` sends a reset link. Locally it lands in **Mailpit at http://localhost:54324**, never a real inbox — open it there and click through.

Linked to the seeded Acme Agency with 5 clients and 5 onboardings.

## Common commands

| | |
|---|---|
| `.bin/supabase.exe db reset` | Wipe and rebuild from migrations + seed. Use freely — local data is disposable. |
| `.bin/supabase.exe stop` | Stop containers, keep data |
| `.bin/supabase.exe stop --no-backup` | Stop and wipe |
| `.bin/supabase.exe status` | Show URLs and keys |

Restarting Docker is safe — data lives in a volume and survives.

---

## Traps that cost real time

### 1. The npm `supabase` package is broken on Windows

`npm i -D supabase` installs a wrapper whose Windows binary is a **placeholder** — `@supabase/cli-windows-x64` only exists at version `1.0.0` while the wrapper asks for `2.114.0`. It fails with:

```
No matching Supabase CLI binary package found for win32-x64
```

**Fix:** download the real binary from GitHub releases into `.bin/` (gitignored). Already done in this repo.

```bash
curl -sL https://github.com/supabase/cli/releases/download/v2.114.0/supabase_2.114.0_windows_amd64.zip -o .bin/supabase.zip
```

### 2. Creating tables grants the API roles nothing

This one is silent and vicious. Tables created in a migration get `REFERENCES, TRIGGER, TRUNCATE` for `anon`/`authenticated`/`service_role` — **no SELECT, no INSERT**. Every request returns 401 or 403 no matter how correct your RLS policies are, and the error points nowhere near the cause.

The migration now grants explicitly, deliberately tighter than Supabase's stock setup:

| Role | Access | Why |
|---|---|---|
| `anon` | schema usage only, **no tables** | The browser never talks to Postgres. Nothing legitimate needs it. |
| `authenticated` | SELECT/INSERT/UPDATE/DELETE, scoped by RLS | The business app, server-side |
| `service_role` | everything, bypasses RLS | The client portal and webhooks, which have no user and scope by token themselves |

Supabase's default grants everything to `anon` and leans entirely on RLS. Ours removes a whole class of mistake, because a browser-side query is impossible rather than merely unauthorised.

### 3. `ON CONFLICT` and deferrable constraints

`workflow_steps` and `onboarding_steps` have DEFERRABLE unique constraints on `(parent_id, position)` — needed so a reorder can shuffle positions inside one transaction. Postgres refuses a deferrable constraint as an `ON CONFLICT` arbiter:

```
ERROR: ON CONFLICT does not support deferrable unique constraints as arbiters (SQLSTATE 55000)
```

So the seed inserts those tables without `ON CONFLICT`. It only ever runs against a fresh database.

### 4. `RETURNING` is checked against the SELECT policy, and the error lies

This one cost a whole session. A brand-new signup calling `.insert(...).select().single()` on `businesses` fails with:

```
new row violates row-level security policy for table "businesses"
```

That message points at the `WITH CHECK` clause. It is not the `WITH CHECK` clause. `INSERT ... RETURNING` applies the table's **SELECT** policies to the row it hands back, and Postgres reports a failure there with the *same* message as an insert-check failure. At signup the user has no `users` row, so `auth_business_id()` is NULL, so `tenant_select` (`id = auth_business_id()`) matches nothing — the insert lands and the read-back is refused.

Two symptoms worth recognising:

- The insert works in `psql` and fails over PostgREST. PostgREST asks for the row back (`Prefer: return=representation`); a bare `insert` in psql does not.
- Adding `returning id` to the psql statement reproduces it instantly. That is the fastest way to tell the two apart.

**Fix:** don't ask for the row back during bootstrap. `completeSetup` generates the business id with `randomUUID()` and inserts without `.select()`. Once the `users` row exists, `auth_business_id()` is non-null and `.select()` is safe again — which is why the `workflows` insert a few lines later can still use it.

The rule: **any `.select()` chained onto an `.insert()` needs a SELECT policy that matches the new row at that instant.** During bootstrap, that is a different instant from the one you were thinking about.

### 5. Never run `next build` in the same folder as a running `next dev`

`next build` writes production output into `.next`, which `next dev` is also using. Afterwards the dev server serves the app shell but **404s every nested route** — `/o/<token>` works while `/o/<token>/info` does not — with nothing in the log.

```bash
rm -rf .next
```

Then start the dev server again. Worth knowing before you spend twenty minutes convinced you broke routing.

### 6. Mail goes to Mailpit over HTTP, not SMTP

Supabase's local stack publishes Mailpit's **web UI** on `54324` and does not publish its SMTP port at all, so nothing can send mail by connecting to `localhost:1025`. Mailpit's HTTP send API is the way in:

```
POST http://127.0.0.1:54324/api/v1/send
```

`src/lib/email.ts` uses it whenever `RESEND_API_KEY` is unset, which is what keeps local development from ever emailing a real person — and these messages are addressed to a customer's customers, so that matters more than usual. Read what was sent at http://localhost:54324.

---

## Scheduled jobs

Two endpoints do the work that runs on a clock. Neither schedules itself — something external has to call them.

| Endpoint | How often | What it does |
|---|---|---|
| `POST /api/cron/reminders` | hourly | Sends the 2 / 5 / 12-day nudges, at most three per onboarding |
| `POST /api/cron/digest` | weekly | Sends each business its "you're waiting on N clients" summary |

Both require a bearer token matching `CRON_SECRET`, and **refuse to run at all if that variable is unset** rather than running unguarded. They execute as `service_role` across every tenant, so an open URL here would let anyone mail every client of every business.

```bash
curl -X POST http://localhost:3000/api/cron/reminders -H "Authorization: Bearer $CRON_SECRET"
```

Both return a readable report of what they did and, more usefully, what they skipped and why — `"paused after a manual nudge"`, `"active in the last day"`, `"already chased three times"`. Run them by hand before trusting a scheduler.

**Firing them in production** is a Vercel Cron entry, a GitHub Action, or anything that can make an HTTP request on a timer. The reminder job decides what is due from `reminder_count`, not from when it last ran, so a missed hour catches up on the next one and a scheduler that double-fires cannot double-send.

---

## Verifying RLS actually bites

Worth re-running after any policy change. Tenant isolation is the one thing that must never silently break.

```bash
# 1. Sign up a user
curl -s -X POST http://127.0.0.1:54321/auth/v1/signup \
  -H "apikey: <secret key from supabase status>" \
  -H "Content-Type: application/json" \
  -d '{"email":"probe@test.co","password":"testpassword123"}'

# 2. With that token, read a table. Should be 0 rows — the user
#    isn't linked to a business yet, and the seeded data must stay
#    invisible.
curl -s "http://127.0.0.1:54321/rest/v1/clients?select=id" \
  -H "apikey: <publishable key>" -H "Authorization: Bearer <token>"
```

Verified on this schema: **0 rows unlinked, 5 rows once linked**, using the same token. If an unlinked user ever sees a row, stop and fix it before building anything on top.

---

## Moving to a hosted database later

Nothing to export — the schema lives in `supabase/migrations/`.

```bash
.bin/supabase.exe link --project-ref <ref>
.bin/supabase.exe db push
```

Then swap the three keys in `.env.local`. Local data doesn't come with you, and shouldn't — treat it as scratch.

**One difference to expect:** email confirmation is off locally and on by default in hosted projects, so the signup flow will feel different the first time. Config, not a bug.
