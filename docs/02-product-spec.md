# Product Spec

## 1. The exact MVP

The rule: **a feature is in v1 only if removing it breaks "send one link, watch it complete."**

### In

**Auth** — email + password, magic link fallback. One user per business. No teams, no roles, no invites.

**Workflow builder** — one workflow per business at launch (named "New client onboarding"). Pick a template, toggle steps on/off, drag to reorder, edit step titles and fields. Steps may be left unconfigured and still send.

**Step types** — exactly eight, no more:
| Type | Client does | Config |
|---|---|---|
| `info` | Fills name/company/email/phone/address | Which fields, which required |
| `questionnaire` | Answers custom questions | Question list (text, long text, choice, multi) |
| `files` | Uploads requested files | Requested items, each required or optional |
| `checklist` | Confirms doing something in another system | Named items, instructions each, required or optional |
| `agreement` | Reads and signs | Agreement text |
| `payment` | Pays a fixed amount | Amount, currency, description |
| `scheduling` | Books via embedded link | Cal.com / Calendly URL |
| `instructions` | Reads (no input) | Rich text |

**On `checklist`** — added after research, not in the original spec. Agency onboarding checklists universally name "request access" as its own step, and standalone companies (Leadsie, AgencyAccess, OneClick Onboard) exist solely to serve it. It doesn't fit `files` or `questionnaire`: the client acts in *another* system and reports back.

Without it the marketing template is incomplete, and the agency sends a separate "now add us to your ad accounts" email — which is the sixth link the product exists to eliminate. It also feeds the waiting-on view, which can only say *"waiting on: Meta access"* if each item carries its own state.

**Hard rule: `checklist` never collects credentials.** Accepting a client's platform password violates Meta's ToS and triggers account lockouts; correct practice is partner/role-based access granted on the client's own device. The step is instructions plus confirmation, never a password field. Agencies already using Leadsie paste that link into the item's instructions — we orchestrate, we don't rebuild.

**Clients** — create (name, company, email), assign the workflow, generate link, view progress and every submission.

**Client portal** — public tokenized link, welcome/progress screen, all seven step types, autosave, resume, completion screen.

**Reminders** — manual "Send reminder" button, plus automatic at 2 days and 5 days of inactivity. Two settings only: on/off, and a per-onboarding stop. Hard cap of 3 automated reminders ever.

**Completion handoff** — email to the business with all answers inline, files zipped, signed PDF attached, payment receipt, kickoff time.

**Waiting-on digest** — Monday email listing stalled onboardings. Off by default until the business has ≥2 active onboardings.

**Payments** — Stripe Connect (Standard). Money goes to their account, not yours.

**Branding** — logo, business name, one accent color, custom welcome message.

**Billing** — Stripe Checkout in, Stripe Customer Portal out.

### Out — deliberately

Teams and permissions · multiple workflows per business · conditional logic · custom domains · analytics · AI · mobile app · Zapier/API/webhooks · saved custom templates · document generation · client-side accounts · in-app chat · notifications center · dark mode (client portal is light-only; see design doc) · multi-currency beyond Stripe defaults · file previews beyond images and PDF.

### The activation constraint

A brand-new signup must reach a live, sendable link **without connecting Stripe, without writing an agreement, and without uploading a logo.** Steps requiring setup show an "Add later" state in the builder and are silently omitted from the client's view. Violating this is the fastest way to kill the product.

## 2. Exact screens

21 screens total. Numbered as they'll be built.

### Client portal — build first, polish hardest

| # | Screen | Route | Notes |
|---|---|---|---|
| C1 | Welcome / progress | `/o/[token]` | **The money shot.** Also the hub returned to between steps. |
| C2 | Information | `/o/[token]/info` | |
| C3 | Questionnaire | `/o/[token]/questions` | |
| C4 | File upload | `/o/[token]/files` | |
| C5 | Agreement | `/o/[token]/agreement` | Gated by email verification |
| C6 | Payment | `/o/[token]/payment` | Gated by email verification |
| C7 | Scheduling | `/o/[token]/schedule` | Embedded iframe |
| C8 | Complete | `/o/[token]/done` | |
| C9 | Verify email | `/o/[token]/verify` | 6-digit code, only before C5/C6 |
| C10 | Expired / invalid link | `/o/[token]/expired` | "Email me a new link" |

**Portal rules, applied without exception:**
- Every step returns to C1 on completion. C1 is the spine; steps are leaves. The client is never lost.
- Autosave on blur and every 5s while dirty. Persistent "Saved" indicator.
- One question of visual weight per screen. Never two competing calls to action.
- Progress is always visible but never nagging — a thin bar, not a percentage badge shouting at them.
- No business chrome. No "powered by," no nav bar, no footer links. The client sees the agency's brand and nothing else.

### Business app

| # | Screen | Route | Notes |
|---|---|---|---|
| B1 | Waiting on (home) | `/app` | Default landing. Stalled items, sorted by days waiting. |
| B2 | Clients | `/app/clients` | Table, filter by status |
| B3 | Client detail | `/app/clients/[id]` | Steps, submissions, activity, actions |
| B4 | New client | `/app/clients/new` | Modal, not a page. Name, company, email → link. |
| B5 | Workflow builder | `/app/workflow` | Step list, toggles, drag reorder |
| B6 | Step editor | `/app/workflow/[stepId]` | Slide-over panel, not a page |
| B7 | Template picker | `/app/workflow/templates` | First-run and reset |
| B8 | Preview | `/app/workflow/preview` | C1 in a device frame with a banner |
| B9 | Settings | `/app/settings` | Branding, email, reminders |
| B10 | Account & plan | `/app/settings/account` | Redirects out to Stripe portal |

### Marketing and auth

| # | Screen | Route |
|---|---|---|
| M1 | Landing | `/` |
| M2 | Pricing | `/pricing` |
| M3 | Login | `/login` |
| M4 | Signup | `/signup` |
| M5 | First-run setup | `/welcome` |

**M5 is the most important business-side screen** and the spec omitted it. Three questions on one screen — business name, what kind of work you do (picks the template), logo (skippable) — then straight into a pre-filled builder. Signup to sendable link in under 3 minutes. Never a multi-step wizard.

## 3. User journeys

### J1 — First-time business, signup to first sent link (target: under 10 minutes)

```
Landing → "Create your first onboarding"
  → Signup (email + password)                          0:30
  → M5: business name, work type, logo (skip)          1:30
  → Builder, pre-filled from template                  2:00
      toggles off "Payment" (no Stripe yet)
      edits 2 questionnaire questions                  6:00
  → "Add your first client" → modal → name/company/email
  → Link generated + copy button + "Send it for me"    7:30
  → Sends
  → B1 now shows one client, Not started
```
**Failure modes to design against:** an empty builder after signup (always pre-fill from template); a Stripe connect wall (always skippable); a "your workflow is incomplete" blocker (never block sending).

### J2 — Client completes onboarding (spans days, multiple devices)

```
Day 0, phone, 9:12pm
  Opens email → C1 Welcome
  "Acme Agency — 6 things to do, about 15 minutes"
  → C2 Information (2 min) → back to C1, 1 of 6
  → C3 Questionnaire — answers 3 of 5, closes phone
      (autosaved; C1 will show "In progress")

Day 1, laptop, 10:40am
  Reopens link → C1 shows "Continue where you left off"
  → C3 finishes → C4 Files: uploads logo, misses brand guide
      (optional → step completes, C1 notes "1 optional item skipped")

Day 3 — no activity → automated reminder #1

Day 3, 4:15pm
  → C5 Agreement → C9 verify (6-digit code) → signs
  → C6 Payment → Stripe → $2,500 paid
  → C7 Schedule → books Thursday 10am
  → C8 Complete 🎉

  Business receives handoff email within 60 seconds.
```

### J3 — Business chases a stalled client
```
Monday 9am digest email: "You're waiting on 2 clients"
  → B1: Northstar Labs — Agreement — 6 days
  → Click → B3 → sees last activity, 4 of 6 done
  → "Send reminder" → preview → send
  → Activity log records it; automated reminders pause 48h
```

### J4 — Business reads a completed onboarding
```
Handoff email → "View everything" → B3
  → All answers on one page, files downloadable,
    signed PDF, receipt, kickoff time
  → Copy-all button for pasting into their PM tool
```
This journey is where the customer decides whether to renew. It must feel like a delivered package, not a database view.

## 4. Template system

### Design rules
- Templates are **content, not configuration.** A template is a starting set of steps with real, credible questions already written. Its value is the questions, not the structure.
- Templates are **code constants** in v1 (`lib/templates/*.ts`), not database rows. Version them; never migrate an existing workflow when a template changes.
- Applying a template **overwrites the draft workflow.** Never merge — merging is a source of confusion far worse than a re-edit.
- Ship **3 excellent + scratch.** A thin consulting template does more damage than no consulting template, because it tells the visitor "this product doesn't know my business."

### Launch templates

**1. Marketing agency**
```
1  Welcome              instructions
2  Company information  info
3  Project questionnaire questionnaire
     · What does your business do, in one or two sentences?
     · Who is your ideal customer?
     · What does success look like 90 days from now?
     · Which channels are working today? Which aren't?
     · Who has final approval on creative?
4  Brand assets         files
     · Logo (SVG or PNG)          required
     · Brand guidelines            optional
     · Product photography         optional
     · Existing ad creative        optional
5  Service agreement    agreement
6  Deposit              payment
7  Kickoff call         scheduling
```

**2. Design / creative studio**
```
1  Welcome              instructions
2  Company information  info
3  Creative brief       questionnaire
     · What are we designing, and what is it for?
     · Who sees this, and what should they feel?
     · Three brands whose look you admire — and why
     · Anything that is definitely off the table?
     · Hard deadlines we should know about?
4  Reference material   files
5  Agreement            agreement
6  Deposit              payment
7  Kickoff call         scheduling
```

**3. Consultant / advisor**
```
1  Welcome              instructions
2  Company information  info
3  Engagement scope     questionnaire
     · What problem prompted you to reach out now?
     · What have you already tried?
     · How will you know this engagement worked?
     · Who else needs to be involved?
     · What's the decision-making process on your side?
4  Background documents files
5  Agreement            agreement
6  First invoice        payment
7  Kickoff call         scheduling
```

**4. Start from scratch** — Welcome + Company information only. Never an empty canvas; an empty state at this moment is an activation failure.

### Deliberately not shipping yet
Recruiting, accounting, legal, professional services. Add one at a time, only when a real customer in that field asks — and write the questions *with* them. That conversation is worth more than the template.

### The builder must not become a workflow tool

Permitted: reorder, toggle, rename, edit fields/questions, mark required/optional.
Forbidden in v1: branching, conditions, dependencies between steps, custom step types, formulas, triggers, multiple workflows, saved templates.

If a builder feature requires a tooltip to explain, it doesn't ship.
