# Build Plan & Launch Checklist

## Two-week solo build

Assumes ~8 focused hours a day, 10 working days. Frontend first, exactly as specified. **Day 5 is a hard stop for review — nothing after it starts until the UI is approved.**

### Day 0 — setup (2 hours, do this the evening before)
```
Next.js 15 + TS + Tailwind + App Router
Fonts self-hosted (General Sans, JetBrains Mono)
design-tokens.css from docs/04
Route groups: (marketing) (app) portal
Deploy to Vercel immediately — deploy on day 0, not day 14
```

### Day 1 — design system
Build every component in `src/components/ui/` against a `/kitchen-sink` page showing all variants and states side by side.
`Button · Input · Textarea · Select · Checkbox · Label · Field · Card · Badge · Divider · ProgressBar · StepList · StatusDot · Skeleton · EmptyState · Toast`

**Do not start a screen until the kitchen sink looks right.** Every hour here saves three later, and this is precisely the phase that gets skipped and then regretted.

### Days 2–3 — client portal, mock data
The most important 16 hours of the build.

Day 2: `PortalShell`, C1 welcome/progress in both first-visit and returning states, C2 information, C3 questionnaire, step transitions.
Day 3: C4 files (dropzone with real drag/drop, upload progress, per-file states), C5 agreement + signature, C6 payment (visual only), C7 scheduling placeholder, C8 completion.

**Build C1 on a 375px viewport first.** Widen after it's right. Every screen gets a real-looking mobile layout before any desktop work.

Spend the extra hour on C1. It's the money shot — it's what goes on the landing page, in the demo video, and in the deck.

### Day 4 — business app, mock data
B1 waiting-on (home), B2 clients, B3 client detail, B4 new-client modal, B5 builder with drag reorder (`dnd-kit`), B6 step editor slide-over, B7 templates, B9 settings.

Density is different here — app type scale, tighter spacing. Resist reusing portal layouts.

### Day 5 — marketing, polish, **STOP**
M1 landing, M2 pricing, M3/M4 auth, M5 first-run.
Then a full pass: every screen at 375 / 768 / 1440. Every empty, loading, and error state. Consistent spacing.

**→ Deploy and review. Do not proceed until approved.**

Checklist for the review: *ugly screens · inconsistent spacing · weak hierarchy · bad typography · unnecessary components · confusing navigation · broken mobile layouts.*

---

### Day 6 — data layer
Supabase project, full schema from `docs/03`, RLS policies, seed script with the mock data already used in the UI (Acme Marketing, Northstar Labs, Vertex Health). Supabase Auth: signup, login, session, protected routes. Business + workflow created on signup from the chosen template.

### Day 7 — business app wired
Replace mocks with real queries. Server actions for workflow CRUD, reorder, client creation, link generation. B1's waiting-on query. Preview reads real workflow data.

### Day 8 — portal wired
Token resolution, **step snapshotting on send** (get this right — it's the schema's load-bearing decision), autosave with debounce and visible saved state, step completion, resume, `getOnboarding` sanitizer, expired-link recovery.

### Day 9 — files, signing, email
Supabase Storage private bucket, signed upload URLs, upload confirm, download-all zip. Signature capture with full audit trail and PDF generation. Resend on a dedicated subdomain with SPF/DKIM/DMARC verified. Invitation, reminder, completion, and handoff emails.

### Day 10 — payments, scheduling, verification
Stripe Connect onboarding flow, PaymentIntent on the connected account, webhook handler with idempotency. Cal.com/Calendly embed + booking webhook. Email verification gate (6-digit code) in front of agreement and payment.

### Day 11 — reminders, handoff, billing
Vercel Cron for the reminder query and the Monday digest. Manual reminder with 48h auto-pause. The handoff email assembled properly — inline answers, zip link, PDF attached, receipt. Stripe Checkout for subscriptions, plan limits, Customer Portal redirect.

### Day 12 — end-to-end and hardening
Full path on real devices: signup → build → send → complete on an actual phone → verify handoff email lands.
Rate limits, file validation, RLS verification (log in as business A, attempt to read business B), error boundaries, Sentry.

### Day 13 — responsive and polish
Every screen at 375 / 414 / 768 / 1024 / 1440. Real iOS Safari and Android Chrome, not devtools emulation. Loading and error states everywhere. Motion and reduced-motion. Focus states and keyboard navigation. Lighthouse ≥ 90.

### Day 14 — launch prep
Legal pages, demo video, landing screenshots from the real product, analytics, support email, seeded demo account.

---

### What will actually go wrong

Budget for these; they're the usual overruns:
- **Stripe Connect onboarding** takes longer than expected. Test mode behaves differently from live.
- **PDF generation** is fiddly. Use `@react-pdf/renderer` and keep the layout plain.
- **Email deliverability** — verify DNS on day 1, not day 9. Propagation is slow and you can't test until it lands.
- **File uploads on mobile Safari** have their own personality. Test early.
- **The builder's drag-and-drop** will eat half a day more than planned.

If you're behind on day 11, cut in this order: **scheduling step → payment step → automated reminders.** Never cut the portal polish or the handoff email — those are the product.

---

## Launch checklist

### Before any real customer
- [ ] Full flow works end-to-end on a real phone
- [ ] Client can complete onboarding with zero help
- [ ] Money reaches the business's Stripe account, not yours
- [ ] Signed PDF is correct, matches what was shown, and has the audit trail
- [ ] Handoff email contains everything and renders in Gmail, Outlook and Apple Mail
- [ ] Reminders fire on schedule and stop at 3
- [ ] Expired link recovery works
- [ ] RLS verified by attempting cross-tenant reads
- [ ] Rate limiting on all portal writes
- [ ] Uploaded files not publicly accessible
- [ ] SPF, DKIM, DMARC pass; test send scores well on mail-tester
- [ ] Errors reach Sentry; you get alerted
- [ ] DB backups on, restore actually tested
- [ ] Privacy policy, terms, DPA published
- [ ] Support email monitored and answered same-day

### Design bar — the questions from §46
- [ ] Would you put this on Product Hunt?
- [ ] Would a $99/mo customer believe this is a real company?
- [ ] Any screen you'd be embarrassed to show a prospect?
- [ ] Does the client portal look like *the agency*, not like SaaS?
- [ ] Does C1 look good enough to be the landing page hero? *(it has to be — it is)*

### First 10 customers
- [ ] 5 agencies you know personally, onboarded by hand — sit with them while they set it up and watch where they hesitate
- [ ] Watch a real client complete a real onboarding, silently, no coaching
- [ ] Ask each: *what nearly stopped you paying?*
- [ ] Track time-from-signup-to-first-sent-link — **if the median is over 20 minutes, the activation flow is broken and nothing else matters**
- [ ] Track completion rate per step — the step with the biggest drop-off is your next week of work
- [ ] Do not build a single requested feature until three separate customers request the same one

### Launch day
- [ ] Demo video, 60 seconds, client experience first
- [ ] Post where agencies actually are — not just Product Hunt
- [ ] Personally email everyone you talked to during validation
- [ ] Be available all day to answer

### Week one after launch
- [ ] Where did people drop out of signup?
- [ ] How many reached a sent link?
- [ ] How many clients completed?
- [ ] What did people email you about?
- [ ] What's the single most common confusion?

Fix the confusion. Ship nothing else that week.

---

## The metric that matters

Not signups. Not MRR. Not visits.

> **How many businesses sent a second onboarding link?**

The first link is curiosity. The second is a habit forming, and it's the only early number that predicts retention. Instrument it on day one and watch it above everything else.
