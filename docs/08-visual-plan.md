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

## Sources

- [SaaS landing page trends 2026 — SaaSFrame](https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples)
- [Bento grids, practical guide — SaaSFrame](https://www.saasframe.io/blog/designing-bento-grids-that-actually-work-a-2026-practical-guide)
- [Social proof placement — SaaS Hero](https://www.saashero.net/content/landing-page-social-proof-examples/)
- [Interactive demo benchmarks — Navattic](https://www.navattic.com/blog/interactive-demos)
- [B2B SaaS landing page design — Genesys Growth](https://genesysgrowth.com/blog/designing-b2b-saas-landing-pages)
