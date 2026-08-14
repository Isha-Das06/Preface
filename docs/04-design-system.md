# Design System

This document is deliberately prescriptive. Where a value is given, use that value. The goal is that you never make an aesthetic judgment call mid-build — every decision is already made here, so building becomes assembly rather than design.

## 0. The governing idea

The product's promise is *calm*. The design has one job: make a business owner who is behind on three clients feel that this is under control.

That produces three rules everything else follows from:

1. **Borders, not shadows.** Hierarchy comes from 1px lines and whitespace. Shadows are for things that genuinely float (dropdowns, modals) and nothing else. Cards do not float.
2. **One accent, used sparingly.** Green appears on primary actions and completion states. If a screen has more than two green elements, one of them is wrong.
3. **Density is contextual.** The business app is dense and efficient. The client portal is generous and slow. Same tokens, different scale. This is the system's defining move.

## 1. Color

Warm neutrals (a red-yellow bias, not the usual cool grey) with a single deep green. Warm greys read as paper and calm; cool greys read as enterprise software. Green because the product is fundamentally about *clearance to proceed* — it's the semantics of the product, not a decoration.

```css
:root {
  /* Warm neutral ramp */
  --ink-950: #12110F;
  --ink-900: #1C1A17;   /* primary text */
  --ink-700: #3E3B36;
  --ink-600: #57534C;
  --ink-500: #78736B;   /* secondary text */
  --ink-400: #9C968D;   /* placeholder, disabled */
  --ink-300: #C4BFB6;
  --ink-200: #DFDAD1;   /* borders */
  --ink-150: #EAE6DE;   /* dividers, table rules */
  --ink-100: #F2EFE9;   /* subtle fill, hover */
  --ink-50:  #FAF8F5;   /* page background */
  --white:   #FFFFFF;   /* card / surface */

  /* Accent — deep green */
  --accent-700: #16543A;
  --accent-600: #1F6F4A;  /* primary buttons, active */
  --accent-500: #2A8A5D;
  --accent-300: #8FC7AC;
  --accent-100: #E4F1EA;  /* tint fills */
  --accent-50:  #F2F9F5;

  /* Semantic — distinct from accent */
  --warn-600:   #A8620B;
  --warn-100:   #FBF0DC;
  --danger-600: #A93226;
  --danger-100: #FBEAE7;
  --info-600:   #2C5D8A;
  --info-100:   #E8F0F7;

  /* Focus */
  --focus: #2A8A5D;
  --focus-ring: 0 0 0 3px rgba(42,138,93,.22);
}
```

**Business app supports dark mode. The client portal does not.** The portal is a branded surface reflecting the *agency's* accent color, and honoring a viewer's dark preference on top of arbitrary customer branding produces unpredictable, sometimes unreadable results. Light-only there is a deliberate choice, not an omission — and it also means the agency's logo always sits on the background they designed it for.

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* app only */
    --ink-950: #F7F5F2; --ink-900: #F0EDE8; --ink-700: #D2CDC5;
    --ink-600: #ADA79E; --ink-500: #8E8880; --ink-400: #6E6961;
    --ink-300: #4A453E; --ink-200: #332F2A; --ink-150: #2A2622;
    --ink-100: #232019; --ink-50: #171512; --white: #1E1B17;
    --accent-600: #3D9E6E; --accent-500: #4CB07E;
    --accent-100: #1B2E24; --accent-50: #16211B;
  }
}
:root[data-theme="dark"] { /* same block repeated */ }
```

**Rule:** never write a color literal in a component. Every color comes from a token. This is what makes dark mode work without a second design pass.

### Customer accent colors
The business picks one accent for their portal. It replaces `--accent-600` only. Never let it touch text colors, borders, or backgrounds — a customer picking neon yellow must not be able to make their portal unreadable. Clamp incoming colors to a minimum 4.5:1 contrast against white; if it fails, darken until it passes.

## 2. Typography

**Faces**
- **Plus Jakarta Sans** (Google Fonts, free) — UI and headings. Geometric-humanist, warm, distinctive at UI sizes without being eccentric. Pointedly not Inter.
- **JetBrains Mono** — amounts, IDs, dates in tables. Only where digits must align.

Both are loaded via `next/font/google`, which self-hosts at build time, subsets to latin, and generates size-adjusted fallback metrics so there is no layout shift. No font files in the repo, no external request at runtime.

```css
--font-sans: var(--font-jakarta), ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
--font-mono: var(--font-jetbrains), ui-monospace, 'SFMono-Regular', monospace;
```

*Originally specced as General Sans (Fontshare). Switched during Goal 1: Fontshare's CDN wasn't reachable from the build environment, and hand-managing woff2 binaries costs more than it buys. Plus Jakarta Sans is the closest match in character and `next/font` handles subsetting and fallback metrics automatically.*

**Two scales — this is the system's key move.**

| Token | App | Portal | Use |
|---|---|---|---|
| `--text-xs` | 12px/16 | 13px/18 | Labels, meta, badges |
| `--text-sm` | 13px/18 | 15px/24 | Secondary text, table cells |
| `--text-base` | 14px/20 | 17px/28 | Body |
| `--text-lg` | 16px/24 | 19px/30 | Emphasis, card titles |
| `--text-xl` | 18px/26 | 22px/32 | Section headings |
| `--text-2xl` | 22px/30 | 28px/36 | Page titles |
| `--text-3xl` | 28px/36 | 34px/42 | Portal welcome |
| `--text-4xl` | 36px/44 | 44px/52 | Marketing only |

The app is scanned; the portal is read. Applying the app scale to the portal makes it feel like software, which is the exact failure mode to avoid.

**Weights:** 400 body · 500 UI labels and buttons · 600 headings. Never 700 in the app; never below 400 anywhere.

**Rules**
- Body copy caps at 68ch. Portal prose caps at 60ch.
- Headings get `text-wrap: balance`.
- Uppercase labels: `--text-xs`, weight 500, `letter-spacing: .06em`, `--ink-500`.
- All aligned numerics get `font-variant-numeric: tabular-nums`.
- Never center body text. Center only the portal welcome block and empty states.

## 3. Spacing

4px base. Only these values exist:
```
--space-1:4  --space-2:8   --space-3:12  --space-4:16  --space-5:20
--space-6:24 --space-8:32  --space-10:40 --space-12:48 --space-16:64
--space-20:80 --space-24:96
```

**Composition rule:** lay out sibling groups with flex/grid + `gap`. Do not stack per-element margins — that's where inconsistent spacing comes from and it's the most common way a hand-built UI starts to look amateur.

**Standard measurements**
| Context | Value |
|---|---|
| App page padding | 24 desktop / 16 mobile |
| App card padding | 20 |
| Portal card padding | 32 desktop / 24 mobile |
| Portal page max-width | 560px |
| App content max-width | 1200px |
| Section gap (app) | 32 |
| Section gap (portal) | 40 |
| Form field gap | 20 |
| Related items gap | 12 |

## 4. Radius, borders, elevation

```css
--radius-sm: 4px;    /* badges, small inputs */
--radius:    6px;    /* buttons, inputs — the default */
--radius-md: 8px;    /* cards */
--radius-lg: 12px;   /* portal cards, modals */
--radius-full: 999px;/* pills, avatars, progress */

--border: 1px solid var(--ink-200);
--border-subtle: 1px solid var(--ink-150);
```

Not everything is rounded to the same degree — that's the flattening effect that makes generic UIs look generic. Small things get small radii.

**Elevation — only three levels, and two of them are for overlays:**
```css
--shadow-sm: 0 1px 2px rgba(28,26,23,.05);              /* buttons only */
--shadow-md: 0 4px 12px rgba(28,26,23,.08),
             0 1px 3px rgba(28,26,23,.06);              /* dropdowns, popovers */
--shadow-lg: 0 16px 40px rgba(28,26,23,.14),
             0 2px 8px rgba(28,26,23,.06);              /* modals */
```
**Cards get a border and no shadow.** This is the single most effective rule for looking deliberate rather than templated.

## 5. Components

### Button
| Variant | Fill | Text | Border | Use |
|---|---|---|---|---|
| Primary | `--accent-600` | white | none | One per screen |
| Secondary | `--white` | `--ink-900` | `--ink-200` | Everything else |
| Ghost | transparent | `--ink-600` | none | Tertiary, table rows |
| Danger | `--white` | `--danger-600` | `--danger-600` | Destructive |

Sizes: `sm` 28px / `md` 36px (default) / `lg` 44px (portal default).
Padding: 12/16/20 horizontal. Weight 500. Radius `--radius`.
Hover darkens fill ~6%. Active darkens ~10% with no transform. Focus: `--focus-ring`.
Disabled: `--ink-100` fill, `--ink-400` text, no pointer events.
Loading: spinner replaces label, width locked to prevent layout shift.

**One primary button per screen, without exception.** Two primaries means you haven't decided what the user should do.

### Input
36px app / 44px portal. `--border`, radius `--radius`, 12px horizontal padding, `--white` fill.
Focus: border `--accent-600` + `--focus-ring`. Error: border `--danger-600`, message below in `--text-xs`.
Label above, `--text-sm`, weight 500, `--ink-700`, 6px gap. Help text below in `--ink-500`.
Placeholders describe format, never repeat the label.

### Card
`--white` fill, `--border`, `--radius-md` (app) / `--radius-lg` (portal). No shadow.
Header: title `--text-lg` weight 600, optional action right-aligned, `--border-subtle` divider below.

### Badge
Pill, `--text-xs`, weight 500, 8px/3px padding, tinted background + matching 600 text.
| Status | Tokens |
|---|---|
| Not started | `--ink-100` / `--ink-600` |
| In progress | `--info-100` / `--info-600` |
| Waiting | `--warn-100` / `--warn-600` |
| Completed | `--accent-100` / `--accent-700` |

### Progress
- **Bar** — 6px, `--radius-full`, track `--ink-150`, fill `--accent-600`, 400ms ease-out width transition.
- **Step list** — the portal's core component. Each row: 24px status circle, title, optional meta. Completed = filled accent circle with white check, title `--ink-500`. Current = accent ring, weight 500, `--ink-900`. Upcoming = `--ink-200` ring, `--ink-400` text.
- Never a percentage number in the portal. "4 of 6" is human; "67%" is a progress bar for a file transfer.

### Table
`--text-sm`. Header row `--text-xs` uppercase `--ink-500`, `--border-subtle` beneath. Rows 48px, `--border-subtle` between, hover `--ink-50`. Numerics right-aligned + tabular. No zebra striping, no vertical rules.
Below 768px, tables become stacked cards. Never horizontally scroll a data table on mobile.

### Modal / slide-over
Modal: max 480px, centered, `--radius-lg`, `--shadow-lg`, backdrop `rgba(28,26,23,.4)`.
Slide-over: 420px, right, full height — use this for the step editor. Editing feels lighter in a panel than a dialog.
Both: Esc closes, focus trapped, focus returns to trigger, body scroll locked.

### Toast
Bottom-right (app) / bottom-center (portal). `--white`, `--border`, `--shadow-md`, `--radius-md`. 4px semantic left edge. Auto-dismiss 4s; errors persist until dismissed. Max 3 stacked.

### States — build all four for every data surface
- **Empty** — icon (32px, `--ink-300`), one-line explanation, one action. Never just "No data."
- **Loading** — skeletons matching final layout, `--ink-100`, 1.5s pulse. Never a centered spinner on a full page.
- **Error** — what broke and what to do. A retry button. Never a raw error code.
- **Partial** — some data, some missing. The most-forgotten state and very common here (a client who did 3 of 6).

## 6. Motion

```css
--ease: cubic-bezier(.2,0,.2,1);
--dur-fast: 120ms;   /* hover, focus */
--dur:      180ms;   /* dropdowns, toggles */
--dur-slow: 260ms;   /* modals, slide-overs */
```
Animate only `opacity` and `transform`. Never animate layout properties.

Exactly three deliberate moments, and no others:
1. Step completion — the circle fills and checks (260ms), progress bar advances.
2. Portal step transition — 180ms fade + 8px slide.
3. Completion screen — a single restrained celebration. One moment, not confetti.

Everything else is instant. Honor `prefers-reduced-motion: reduce` by dropping all three to opacity-only.

## 7. Responsive

Breakpoints: `sm 640 · md 768 · lg 1024 · xl 1280`.

**Portal is mobile-first and genuinely mobile-designed.** Single column always, 560px cap, 16px gutters. Buttons full-width below 640px. Touch targets ≥44px. Primary action reachable with a thumb — never at the top of a long scroll. File upload offers camera capture on mobile. Test at 375px first, widen after.

**App is desktop-first, mobile-usable.** Sidebar collapses to a bottom bar below 768px. Tables become cards. The builder is desktop-only below 768px — show "Open on a larger screen to edit your workflow." That's an honest constraint, better than a bad drag-and-drop experience on a phone.

## 8. Anti-patterns — do not ship these

Gradients on buttons or cards · glowing or neon accents · glassmorphism · shadows on cards · more than one accent hue · emoji as UI icons (one exception: the completion screen) · animated gradient borders · giant marketing type inside the app · centered body text · full-page spinners · placeholder text replacing labels · more than one primary button · icon-only buttons without a label or tooltip · `rounded-lg` applied uniformly to everything · purple-to-blue anything.

## 9. Build order for the component library

`src/components/ui/` — build these before any screen:
```
Button  Input  Textarea  Select  Checkbox  Radio  Label  Field
Card  Badge  Avatar  Divider
ProgressBar  StepList  StatusDot
Table  EmptyState  Skeleton  ErrorState
Modal  SlideOver  Dropdown  Tooltip  Toast
PageHeader  Sidebar  MobileNav
```
Portal-specific in `src/components/portal/`: `PortalShell` `PortalCard` `PortalHeader` `StepNav` `FileDropzone` `SignaturePad`.

Every screen composes from these. If a screen needs something new, extend the system here first — never style inline in a page file. This rule is what keeps the product looking like one product.
