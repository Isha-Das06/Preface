# Visual & Motion Plan

Written after the first frontend pass read as flat. Research-backed, not taste-led.

## Diagnosis

The design doc's anti-pattern list (no gradients, no card shadows, one accent, minimal animation) is correct — but I applied it as *absence* rather than *restraint*. Restraint without craft is just plainness. Specifically:

| Problem | Evidence |
|---|---|
| Zero motion on the page | 3–5 purposeful micro-animations reads premium; 0 reads unfinished |
| No social proof anywhere | 100% of high-converting pages place it above the fold; ~63% lift |
| Every section is heading + paragraph | Monotonous rhythm is the single biggest "template" tell |
| Hero visual is a small static card | Real product UI converts better than illustrations; *moving* product UI better still |
| Only the client portal is ever shown | Half the product (the waiting-on view) is invisible |
| Flat `border-t` between every section | No depth, no variation |

## The motion system — five moments, no more

Each must confirm, indicate, or guide. Anything decorative is cut.

1. **Section reveal** — 16px rise + fade as a section enters view, once. IntersectionObserver, not scroll-linked, so it never fights the scroll.
2. **The hero demo plays itself** — steps check off, progress advances, on a loop. This is the demo; it replaces a video above the fold.
3. **The message thread staggers in** — each message 90ms after the last. The section re-enacts the pain of a nine-day chase; staggering makes the reader *feel* the drag instead of reading about it.
4. **Button hover** — 1px lift + darken. Already partly there.
5. **Bento tile hover** — border warms to accent. Signals interactivity.

**Rules:** opacity and transform only, never layout. `prefers-reduced-motion` collapses all five to instant. Nothing animates below the fold on mobile that would delay first paint.

## Structural changes

Research gives a six-section skeleton that maps to how a skeptical buyer evaluates software: **hero → social proof → problem → product → evidence → close.** The current page has problem and product but no proof and no rhythm.

1. **Hero** — self-playing product demo, one primary CTA, social-proof line directly beneath it.
2. **Proof strip** — customer count + the tools replaced. Sits immediately under the hero.
3. **The thread** (problem) — staggered, unchanged copy. It's the best thing on the page.
4. **One link instead of six** — becomes a visual, not two bulleted columns.
5. **Bento grid** (product) — real UI tiles rather than icons. This is where the business dashboard finally appears. Uniform gaps, cognitive chunking.
6. **Client experience** — the no-account argument, with the phone.
7. **Honest scope** — naming HoneyBook. Keep, it's a trust asset.
8. **FAQ → close.**

## On demo video — where it goes

Interactive demos outperform video content by ~7.2x, and the top interactive demos see ~84% engagement with ~54% CTA click-through. So:

- **Above the fold: the self-playing UI demo.** Costs nothing, loads instantly, no third party.
- **Mid-page: an interactive walkthrough** (Arcade / Navattic / Supademo). Best single investment when there's budget — it's the "demo-to-signup bridge".
- **Video: below the fold, secondary.** A 60–90s screen recording is the right *second* asset, not the first. Put it after the problem section where the viewer is already convinced they have the problem.
- **Never autoplay video in the hero.** It delays paint, and it asks for 90 seconds before the visitor knows if they care.

Sequencing for a solo founder: ship the self-playing demo now → record a Loom once there are 5 real customers → interactive demo when there's budget.

## Copy changes for conversion

The existing copy is strong and mostly stays. Gaps:

- **No social proof.** Needs a real number the moment one exists. Placeholder must be obviously a placeholder, never a fabricated count.
- **H1 is already right** — 7 words, 45 characters, sits under the 8-word average for high performers.
- **Missing specificity near the CTA** — "Free for 14 days. No card required." is good; add what happens next.
- **No mid-page CTA.** The page asks once at the top and once at the bottom, and nothing in the middle where conviction peaks.

---

# Part 2 — the logged-in app

Researched separately, because app UX is a different discipline. On a landing page motion persuades; in an app it must **confirm, orient or reassure**, or it is noise the user hits fifty times a week.

## Diagnosis

| Problem | Evidence |
|---|---|
| Day one was undesigned — every screen assumed data | Users hit empty states more than any modal or tour; it is the primary onboarding surface |
| No activation path from signup to first sent link | Most SaaS products lose 40–60% of new users in week one, in the gap between signup and first value |
| `Skeleton` was built in Goal 2 and never used | Visible progress cuts abandonment up to ~30% |
| Clients list had no search or filter | Unusable past ~20 rows |

## What changed

**1. A real first-run screen.** `/app?empty=1`. Not a blank slate with an "Add client" button — a three-item checklist that names the finish line ("Get your first client onboarded"), shows two items already done so the remaining one feels close, and states the honest expectation: *most people send their first link about ten minutes after signing up.*

**2. Sample data underneath, unmistakably labelled.** Showing what the screen becomes beats describing it. Rendered at 55% opacity, `aria-hidden`, `pointer-events-none`, behind an "Example data" divider. Mislabelling sample rows as real would be worse than showing nothing.

**3. Skeletons that match their content.** `loading.tsx` for the waiting-on and clients routes, dimensioned to the real cards (110px) and rows (48px) so nothing jumps when data lands. A skeleton that doesn't match its content trades one bad experience for another.

**4. Search and status filters** on the clients list, with counts on each filter so the shape of the list is legible before clicking. Searches company, contact and email — the three things a person actually types.

**5. A distinct empty state for "no search results"**, separate from "no clients yet". Same screen, opposite meanings: one needs a first action, the other needs a way back.

## What was deliberately NOT added

**Scroll reveals in the app.** Correct on a landing page read once; wrong in a tool opened daily. Entrance animation on a screen you visit repeatedly becomes a tax on every visit.

**Tooltip tours and product-tour modals.** Research favours empty states over tours precisely because they appear in context and cannot be dismissed-and-forgotten. A tour would also violate the product's core promise — you shouldn't need one.

**Optimistic UI with undo for reminders.** The modern pattern is act-then-undo rather than confirm-then-act, and it is genuinely better for most actions. Kept the confirm here because a reminder is an email to *someone else's client* — irreversible and outward-facing — and the rows sit close enough together that a misclick is plausible. Worth revisiting with a Gmail-style delayed send.

**A celebration on first link sent.** Tempting, and the aha moment is real, but the two-phase new-client modal already gives the link its own moment. Confetti would be the decorative kind of motion the design system rules out.

## Sources

- [SaaS landing page trends 2026 — SaaSFrame](https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples)
- [Bento grids, practical guide — SaaSFrame](https://www.saasframe.io/blog/designing-bento-grids-that-actually-work-a-2026-practical-guide)
- [Social proof placement — SaaS Hero](https://www.saashero.net/content/landing-page-social-proof-examples/)
- [Interactive demo benchmarks — Navattic](https://www.navattic.com/blog/interactive-demos)
- [B2B SaaS landing page design — Genesys Growth](https://genesysgrowth.com/blog/designing-b2b-saas-landing-pages)
- [Landing page trust signals — SaaS Hero](https://www.saashero.net/design/landing-page-design-trust-signals/)
- [Empty states as onboarding — 72Technologies](https://www.72technologies.com/blog/empty-states-as-onboarding-surface)
- [SaaS onboarding UX and activation — Pixxen](https://pixxen.com/blog/saas-onboarding-ux/)
- [Skeleton screens vs spinners — OneThing](https://www.onething.design/post/skeleton-screens-vs-loading-spinners)
- [Optimistic UI patterns — Simon Hearne](https://simonhearne.com/2021/optimistic-ui-patterns/)
- [App performance and perceived speed — Orbix](https://www.orbix.studio/blogs/app-performance-ui-ux-optimization)
