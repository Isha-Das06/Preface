# Anti-slop audit

Audited against Adrian Krebs' analysis of 1,590 Show HN submissions, which isolated 16 recurring markers of AI-generated design, plus the functional tells reported separately. His distribution: 22% heavy slop (4+ patterns), 32% mild (2–3), 46% clean (0–1).

**Our score before this pass: 9 hits.** Heavy-slop territory.

## Clean — no action

| Pattern | Us |
|---|---|
| "VibeCode Purple" / purple-cyan gradient | Deep green `#1F6F4A`, no purple anywhere |
| Gradients used extensively | Zero gradients in the codebase |
| Large colored glows / box-shadows for depth | Cards carry a border and no shadow |
| Centered hero headline | Left-aligned |
| Badge directly above H1 | Not present |
| Stats in a horizontal banner row | Not present |
| Sidebar with emoji icons | Lucide icons, no emoji in navigation |
| shadcn/ui default styling | Hand-built on Radix primitives; every visual is ours |
| Body contrast "barely passing AA" | Measured 16.4:1 — far above |
| Permanent dark mode | Three proper theme states |
| Missing edge states | Empty, loading, error and partial all built |

## Hits — fixed in this pass

**1. Glassmorphism.** Marketing header used `bg-ink-50/85 backdrop-blur-sm`. A named CSS tell with no functional benefit. → Solid background.

**2. Colored left border on cards.** Toast used `border-l-4`. Described in the research as *"nearly as reliable a sign of AI-generated design as em-dashes for text."* → Replaced with a semantic **icon**, which is also better for colourblind users, since colour alone was carrying the meaning.

**3. Serif italic as an accent.** The signature pad rendered the typed name in italic. Named font tell. It was also faking a handwritten feel that a typed signature doesn't have — a real signature block is plain text on a rule. → Italic removed, ruled signature block instead.

**4. Generic error copy.** `ErrorState` defaulted to *"Something went wrong."* The research calls this out specifically: it *"strips human voice out exactly when users most need reassurance."* → Default now names what failed and what to do, and every call site passes real copy.

**5. All-caps section labels.** 18 uses of `.label-caps`. Named twice in the pattern list (both under colours and layout). → Kept the structural role, dropped the shouting: small, medium-weight, sentence case, tracked normally.

**6. Identical feature cards with icons above text.** The security section repeated the same shield icon six times. Six identical icons carry no information. → Restructured as a two-column definition list, icon removed.

**7. Hover states on things that aren't clickable.** Bento tiles and pricing cards lifted their border on hover but did nothing when clicked. This is the sharpest functional tell in the research: *"hovering gives a shaded outline suggesting it can be clicked, but clicking yields nothing."* → Hover removed where not interactive; kept only where a real link exists.

**8. Dead buttons.** Copy-all, download-zip, upload-logo, manage-billing and add-step all rendered as live controls and did nothing. → Each now either performs a real action, or is explicitly disabled with a tooltip explaining why.

## Open questions — not changed unilaterally

**Typeface.** Plus Jakarta Sans is *not* on the named list (that's Inter, Space Grotesk, Instrument Serif, Geist), and it isn't a default reach. But it is a popular modern-SaaS pick. Alternatives with less exposure: Schibsted Grotesk, Onest, Public Sans, Instrument Sans. Changing it now is a large visual shift for a modest gain — worth a deliberate decision, not a silent swap.

**Numbered 1-2-3 step sequences.** A named layout tell, and we use it twice. But both are *genuine* sequences where order carries information the reader needs, which is exactly the case where numbering is correct information design. Restyled so it doesn't read as the default circled-badge, kept the numbers.

## The deeper point

Most of these were not aesthetic mistakes. They were **defaults that went unexamined** — the toast border because semantic colour needed somewhere to live, the italic because signatures feel handwritten, the hover because tiles felt inert without it. Each was locally reasonable and collectively a signature.

The functional tells matter more than the visual ones. A purple gradient reads as unfashionable; a button that does nothing when clicked reads as **broken**, and that is what actually costs trust with someone deciding whether to route a client's deposit through you.

## Source

- [16 AI design tells, from 1,590 Show HN submissions — Developers Digest](https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it)
- [AI design slop and the fix — SmoothUI](https://smoothui.dev/blog/ai-design-slop)
- [AI slop design tells — 925 Studios](https://www.925studios.co/blog/ai-slop-design-tells)
