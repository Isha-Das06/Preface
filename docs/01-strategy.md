# Strategy

## 1. Refined concept

**What it is:** A hosted onboarding link. A service business builds a short checklist once, sends one URL per new client, and watches it complete.

**What it is not:** a client portal. A portal is a place clients *live*. This is a place clients *leave*. The product's success condition is the client never coming back — they finish and are done. That single distinction keeps scope honest, because every "wouldn't it be nice if the client could also…" idea fails the test.

**The job to be done, stated precisely:**
> "I signed a client on Tuesday. It's now the following Thursday and I still can't start, because I don't have the logo, the contract isn't signed, and the deposit hasn't landed. I don't want a business operating system. I want to stop chasing."

The buyer is not buying forms, files, signatures, or payments. Those are commodities they already have. They are buying **the end of chasing.**

## 2. Contradictions and weak assumptions

These are ordered by how much damage they do if left unresolved.

### 2.1 "No client account" collides with multi-session onboarding — and with security

The spec says the client shouldn't need an account, and separately that onboarding spans days. Both can't be casually true. If there's no account, **the URL is the credential**, and that URL grants access to a contract, a payment request, and uploaded business documents. It will be forwarded over email, pasted into Slack, and sit in browser history.

This is the single most important unresolved design decision in the spec, and it must be settled before the first screen is drawn, not patched later.

**Resolution:** tiered sensitivity.
- Link = a 32-char unguessable token. Sufficient on its own for welcome, info, questionnaire, and file upload.
- Before the **agreement** and **payment** steps, require a one-time code sent to the client's email on file. Valid 30 days, stored in an `httpOnly` cookie.
- Resume is by link OR by "email me my link" on any expired session.

The client still never sets a password, never picks a username, never sees a signup form. The promise holds. The liability doesn't.

### 2.2 Scheduling is scope creep wearing an MVP costume

"Basic Google Calendar integration" is not basic. It is OAuth consent screens, refresh-token rotation, free/busy queries, working-hours config, buffer rules, timezone correctness, and double-booking races. It is *building Calendly* inside a product whose entire thesis is not building things.

**Resolution for v1:** the scheduling step embeds the customer's existing Cal.com or Calendly link. Mark complete via their webhook if it's Cal.com/Calendly (both send one, both are trivial), otherwise a "I've booked my call" confirmation.

This is not a downgrade. It is *more* on-message — "works with the tools you already use" — and it costs half a day instead of most of a week.

### 2.3 The e-signature dodge doesn't survive contact

The spec says don't compete with DocuSign, then makes signing step 4 of 7. But DocuSign's embedded-signing API is expensive and heavy for an MVP, and a business will not pay you to *forward them to another vendor*.

The good news: a typed-name signature with a captured audit trail (timestamp, IP, user agent, immutable snapshot of the exact agreement text shown) is legally sufficient under US ESIGN/UETA and EU eIDAS for ordinary commercial service agreements. That is roughly a day of work, and it is genuinely all that's needed.

**Resolution:** build the simple signature. Be honest internally that it is a real feature, not a skipped one. Do not build templates, routing, multi-party signing, or field placement. Never market it as "e-signature."

### 2.4 Pricing is anchored far too low

This is where I'd push back hardest. $19/mo for a product that collects a $1,000 deposit and displaces DocuSign ($15–45/mo) + Calendly ($12/mo) + a form tool is value-destroying, in both directions:

- At $19, $10k MRR needs ~500 paying customers. For a solo founder with no distribution, that is a multi-year slog.
- At $79, it needs ~125. That is reachable by hand.
- Agencies billing $5k–50k per project do not evaluate a $79 tool the way a consumer evaluates a $19 one. Below a threshold, low price actively signals "hobby project" and *reduces* trust — which is fatal when you're asking to sit in the contract-and-deposit path.

**Recommendation:** $49 / $99 / $199. Validate downward if you must; you can always discount, you can almost never raise.

### 2.5 The free tier is the wrong instrument here

An agency onboarding 3 clients a month lives on a 3-client free tier permanently. Meanwhile every free account costs you Stripe, storage, and email. Freemium works when usage growth is naturally coupled to value — here it isn't; a customer's volume is roughly constant.

**Recommendation:** 14-day free trial, no card. Plus a permanently free *sandbox* — you can build and preview a workflow forever, you just can't send a live link. That gives you the product-led "try it right now" motion without the permanent free rider.

### 2.6 "10-minute setup" has a hidden dependency chain

To send a real onboarding, a business needs their agreement text, a connected Stripe account, a logo, and written questions. That is not ten minutes; it's an afternoon, and it happens *before* they've seen any value. This is the #1 activation killer.

**Resolution — a hard design constraint on the builder:** any step can be left unconfigured, and an onboarding with unconfigured steps is still sendable — those steps are simply omitted from the client's view and shown to the business as "Add later." First value must be reachable using only info + questionnaire + files, which need zero external setup.

### 2.7 The dashboard's stated hierarchy is backwards

Section 8 leads with a client list; section 9 mentions "waiting on" almost as a footnote. That's inverted. A client list is a filing cabinet — no one opens a filing cabinet daily. **"What am I waiting on" is the entire retention mechanism.**

**Resolution:** "Waiting on" *is* the home screen. The client list is a second tab. And it should also be an email — a Monday-morning digest of what's stalled. That email, not the app, is what creates the weekly habit.

### 2.8 Nothing happens after completion — the biggest actual gap

The spec ends at "🎉 You're all set." But the business's real job isn't "client finished the checklist," it's **"I can start work."** Right now the collected data dies inside your app, and the business must log in and click through six steps to read it. That makes you a silo, and silos churn.

**This is the one thing I'd add.** On completion, send the business a single handoff email: every answer rendered inline, a link to download all files as one zip, the signed PDF attached, the payment receipt, the kickoff time. One email that means "here is your client, go start."

It is maybe six hours of work and it is plausibly the highest-leverage feature in the product, because it's the moment the customer *feels* the value they paid for.

### 2.9 Email deliverability is an infrastructure decision made too late

You'll be sending automated reminders to *other people's clients* from your domain. At any volume this gets you spam-flagged, and once your sending domain is burned, the reminder feature — a headline feature — silently stops working and you may not notice for weeks.

**Resolution:** from day one, send on a dedicated subdomain (`mail.yourapp.com`) separate from anything you use for marketing, with correct SPF/DKIM/DMARC. Set `Reply-To` to the business's own address so replies route to them. Offer custom sending domains as a paid tier later.

### 2.10 Drop n8n

Reminders are `SELECT` + `send` on a schedule. That's a cron job and about 30 lines. Introducing n8n adds a service to deploy, monitor, secure, and debug, for zero benefit at this scale. Use Vercel Cron or `pg_cron`.

### 2.11 The risk list misses the real one

The listed risks are all competitive. The actual risk is **trigger, not competition.**

Agencies have a bad process that nonetheless works. Nobody switches tools because something is mildly annoying. They switch after a *specific incident*: a client ghosted for three weeks, work started without a signed contract, a deposit was never collected and the project ran at a loss.

**Implication for GTM:** market the incident, not the annoyance. "Ever started work before the contract came back?" converts. "Streamline your onboarding" does not.

## 3. Strongest positioning

The spec's hero — "Onboard clients without the back-and-forth" — is competent but abstract. "Back-and-forth" is a category cliché; every competitor claims to reduce it.

The sharpest line is already in the spec, buried as a section header in §24. Promote it:

> ### Stop sending new clients five different links.

It works because it's **concrete, countable, and self-diagnosing.** The reader immediately counts their own links — form, Drive, DocuSign, Stripe, Calendly — and lands on four or five. You've made them measure their own problem in about two seconds. No competitor headline does that.

Supporting line:
> One link. Everything a new client needs to do before you start.

**Category framing.** Never say "client management platform" — that's HoneyBook's field, and on their field you lose. Say what you literally are:
> The onboarding link for service businesses.

**One-line pitch:**
> HoneyBook runs your business. We just get your clients onboarded.

**Positioning statement (internal):**
> For small service businesses who lose days between signing a client and starting work, Preface is a client onboarding link that replaces the five tools they currently stitch together. Unlike HoneyBook, Dubsado, and Bonsai — which ask you to move your whole business in — Preface does one thing and needs no setup.

### Naming

The spec never picks a name. Ranked:

1. **Kickoff** — semantically perfect (the thing onboarding exists to reach), warm, instantly understood. Crowded namespace; needs a modified domain.
2. **Greenlight** — the moment work may begin. Strong, confident, maps directly to the green-accent design system. My pick.
3. **Handoff** — the most literally accurate: sales → delivery. Slightly internal-jargon.
4. **Precheck** — "everything cleared before you fly." Clear, less warm.

Docs use **Preface**. Decide before the landing page — the name shapes the copy.

## 4. Differentiation

The defensible wedge is not features. It's **what you refuse to build.**

| | HoneyBook | Dubsado | Bonsai | Preface |
|---|---|---|---|---|
| Promise | Run your business | Automate your workflows | Manage your business | Get your clients onboarded |
| Time to first live client | Hours | Days | Hours | Under 10 minutes |
| Requires client account | Yes | Yes | Yes | **No** |
| Onboarding is the product | No | No | No | **Yes** |
| Scope | Everything | Everything + logic | Everything + finance | One workflow |

Note the matrix's honest row: on breadth, you lose to all three. That's the point, and saying it out loud is what makes the rest credible.

**Real advantages, in order of defensibility:**
1. **No client account.** Structural. The incumbents can't copy it without breaking their portal model — the portal is where their upsells live.
2. **The waiting-on view as the home screen.** Onboarding-specific by construction; a general CRM can't prioritize it.
3. **Time to first live link.** A discipline, not a feature — and disciplines are the hardest thing for a broad product to retrofit.
4. **Completion handoff.** Only coherent if onboarding is your whole scope.

## 5. What to remove from the current concept

| Remove | Why |
|---|---|
| Native Google Calendar scheduling | Rebuilding Calendly. Embed their existing link. |
| 7 launch templates | A weak template is worse than none. Ship 3 excellent + scratch. |
| Free tier | Wrong instrument for constant-volume usage. Trial + free sandbox. |
| n8n | Operational dependency for a cron job. |
| `TeamMember` entity | No teams in v1. |
| `Form` / `FormField` / `FormResponse` entities | Over-normalized. A step with `config` + `data` JSONB. |
| `OnboardingTemplate` table | Templates are code constants until users can save their own. |
| Billing *screen* | Stripe Customer Portal is a redirect, not a page you build. |
| "Workflow preview" screen | It's the client view with a preview banner. Same component. |
| `EmailEvent` entity | Fold into a general `events` table. |

That removes 5 tables and 2 screens before a line is written.

## 6. What to add — only these four

Each earns its place by being load-bearing for the core promise.

1. **Completion handoff email** (§2.8) — converts a data silo into a delivered outcome. Highest ROI item in the doc.
2. **Magic-link resume** (§2.1) — without it, "no account" is a security hole rather than a feature.
3. **Weekly "waiting on" digest** — the habit loop. The app is checked when the email says to check it.
4. **Explicit save-and-resume on every step** — the spec says answers autosave; make it a first-class requirement with visible "Saved" state. Onboarding spans days; a lost questionnaire is a churned customer.

Nothing else. Every other idea in §20 waits for paying customers.

## 7. Risks, honestly

**Ranked by probability × damage.**

**1. No switching trigger (highest).** The existing bad process works. Mitigation: market the incident, not the annoyance. Interview 10 agencies and ask "when did onboarding last actually cost you money?" If nobody has a story, the thesis is weak and you should know that in week one, not month six.

**2. Onboarding is a feature, not a product.** The real threat isn't losing to HoneyBook; it's HoneyBook shipping "onboarding links" as a checkbox. Mitigation: your moat is the customer who *refuses* the all-in-one. That's a real, durable segment — but it is smaller than the total market, and you must accept that ceiling deliberately.

**3. Acquisition is harder than the build.** Almost certain. This is a 2-week build and a 12-month distribution problem. Budget accordingly: if you're spending more than 30% of your time coding after week 3, you're avoiding the hard part.

**4. Low-frequency usage weakens retention.** An agency signing 2 clients a month opens the app twice a month. That is dangerously close to "forgot I pay for this." Mitigation: the digest email keeps you present between uses. Watch for cancellation at month 3 — that's where it'll show.

**5. Switching costs for configured incumbents.** Real, but points at the right target: sell to businesses using *nothing*, not businesses using Dubsado. Your competitor is a spreadsheet and a Gmail draft folder, not a funded SaaS.

**6. Trust threshold.** You're asking to sit in the contract-and-deposit path as an unknown vendor. Mitigation: this is exactly why price shouldn't be $19, and why visual polish is a functional requirement rather than a nicety.

**The question the spec correctly refuses to assume — and my honest read:**
> Is onboarding pain big enough to pay for standalone?

Probably yes, but *not* on the pain alone. Onboarding annoyance sustains maybe $19/mo. What sustains $99/mo is the money attached to it: deposits collected before work starts, contracts signed before work starts. Sell the pain, but price the money. If validation calls show people won't pay above $29, the honest conclusion is that this is a lifestyle product, not a venture one — which is a fine outcome, but you want to learn it early.
