/**
 * TEMPORARY — token proof page.
 * Verifies Goal 1's done-condition: every token from
 * docs/04-design-system.md resolves in the browser, in both
 * themes and both densities.
 *
 * Replaced by the real landing page in Goal 5.
 */

const INK = [
  "950", "900", "700", "600", "500",
  "400", "300", "200", "150", "100", "50",
] as const;

const ACCENT = ["700", "600", "500", "300", "100", "50"] as const;

const SEMANTIC = [
  { name: "warn", fill: "bg-warn-100", text: "text-warn-600" },
  { name: "danger", fill: "bg-danger-100", text: "text-danger-600" },
  { name: "info", fill: "bg-info-100", text: "text-info-600" },
  { name: "accent", fill: "bg-accent-100", text: "text-accent-700" },
];

const SCALE = [
  { token: "text-xs", label: "xs" },
  { token: "text-sm", label: "sm" },
  { token: "text-base", label: "base" },
  { token: "text-lg", label: "lg" },
  { token: "text-xl", label: "xl" },
  { token: "text-2xl", label: "2xl" },
  { token: "text-3xl", label: "3xl" },
];

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="label-caps">{title}</h2>
        {note ? (
          <p className="measure text-sm text-ink-500">{note}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function TypeScale() {
  return (
    <div className="flex flex-col gap-3">
      {SCALE.map(({ token, label }) => (
        <div key={token} className="flex items-baseline gap-4">
          <span className="w-10 shrink-0 font-mono text-xs text-ink-400">
            {label}
          </span>
          <span className={token}>
            Turn a new client into a fully onboarded client.
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TokenProof() {
  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-12 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Preface — design tokens</h1>
        <p className="measure text-base text-ink-500">
          Goal 1 verification. Toggle your OS between light and dark: every
          colour below is defined token-level, so both themes resolve from one
          set of component styles.
        </p>
      </header>

      <Section
        title="Neutral ramp"
        note="Warm bias — a touch of red-yellow, not the usual cool grey. Warm greys read as paper; cool greys read as enterprise software."
      >
        <div className="flex flex-wrap gap-2">
          {INK.map((step) => (
            <div key={step} className="flex flex-col gap-1.5">
              <div
                className="size-16 rounded-md border border-ink-200"
                style={{ background: `var(--ink-${step})` }}
              />
              <span className="font-mono text-xs text-ink-500">{step}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Accent"
        note="One accent, used sparingly. Green because the product is about clearance to proceed — it is the semantics, not decoration. More than two accent elements on a screen means one of them is wrong."
      >
        <div className="flex flex-wrap gap-2">
          {ACCENT.map((step) => (
            <div key={step} className="flex flex-col gap-1.5">
              <div
                className="size-16 rounded-md border border-ink-200"
                style={{ background: `var(--accent-${step})` }}
              />
              <span className="font-mono text-xs text-ink-500">{step}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Semantic" note="Kept distinct from the accent hue.">
        <div className="flex flex-wrap gap-2">
          {SEMANTIC.map(({ name, fill, text }) => (
            <span
              key={name}
              className={`rounded-full px-2 py-[3px] text-xs font-medium ${fill} ${text}`}
            >
              {name}
            </span>
          ))}
        </div>
      </Section>

      <Section
        title="Surfaces and elevation"
        note="Cards get a border and no shadow. Shadows are only for things that genuinely float. This single rule does more than anything else to stop a UI looking templated."
      >
        <div className="flex flex-wrap gap-4">
          <div className="w-56 rounded-md border border-ink-200 bg-surface p-5">
            <p className="text-sm font-medium">Card</p>
            <p className="mt-1 text-sm text-ink-500">Border, no shadow.</p>
          </div>
          <div className="w-56 rounded-md border border-ink-200 bg-surface p-5 shadow-md">
            <p className="text-sm font-medium">Dropdown</p>
            <p className="mt-1 text-sm text-ink-500">shadow-md — it floats.</p>
          </div>
          <div className="w-56 rounded-lg border border-ink-200 bg-surface p-5 shadow-lg">
            <p className="text-sm font-medium">Modal</p>
            <p className="mt-1 text-sm text-ink-500">shadow-lg, radius-lg.</p>
          </div>
        </div>
      </Section>

      <Section
        title="Type scale — app density"
        note="The app is scanned. Dense and efficient. Body sits at 14px."
      >
        <TypeScale />
      </Section>

      <Section
        title="Type scale — portal density"
        note="The system's defining move. The portal is read, not scanned — body at 17px, generous leading, and permanently light. Identical components; the container decides the density."
      >
        <div className="portal rounded-lg border border-ink-200 p-8">
          <TypeScale />
        </div>
      </Section>

      <Section
        title="Numerics"
        note="Tabular figures everywhere digits line up in a column, so nothing dances between renders."
      >
        <div className="w-64 rounded-md border border-ink-200 bg-surface">
          {[
            ["Acme Foods", "$2,500.00"],
            ["Northstar Labs", "$18,000.00"],
            ["Vertex Health", "$975.50"],
          ].map(([client, amount], i) => (
            <div
              key={client}
              className={`flex items-center justify-between px-4 py-3 text-sm ${
                i > 0 ? "border-t border-ink-150" : ""
              }`}
            >
              <span>{client}</span>
              <span data-numeric className="font-mono">
                {amount}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Focus" note="Visible keyboard state on every interactive element. Tab through these.">
        <div className="flex flex-wrap gap-3">
          <button className="rounded-[6px] bg-accent-600 px-4 py-2 text-sm font-medium text-on-accent transition-colors duration-[120ms]">
            Primary
          </button>
          <button className="rounded-[6px] border border-ink-200 bg-surface px-4 py-2 text-sm font-medium transition-colors duration-[120ms] hover:bg-ink-100">
            Secondary
          </button>
          <button className="rounded-[6px] border border-danger-600 bg-surface px-4 py-2 text-sm font-medium text-danger-600 transition-colors duration-[120ms]">
            Danger
          </button>
        </div>
      </Section>
    </main>
  );
}
