/**
 * The background a business puts behind their client's onboarding.
 *
 * Any colour, picked from a real colour picker. This started as four
 * fixed grounds — the worry being that a free choice lets someone
 * pick a background their own client's text vanishes against, on the
 * page where that client signs a contract.
 *
 * The fix for that is not to take the choice away, it is to make the
 * text follow the choice. A ground's relative luminance decides
 * whether the portal draws in dark ink or light, so a near-black
 * background gets pale text and a pastel gets dark text, and neither
 * can be made unreadable by choosing badly.
 *
 * What stays fixed is the RELATIONSHIP: the ramps below are the ones
 * already used everywhere else in the product, so cards, borders and
 * muted text keep their spacing on the scale rather than each being
 * picked by hand.
 */

/** The old named grounds, so rows saved before this keep their look. */
const LEGACY_GROUNDS: Record<string, string> = {
  warm: "#faf8f5",
  white: "#ffffff",
  cool: "#f6f7f9",
  sand: "#f7f3ec",
};

export const DEFAULT_GROUND = "#faf8f5";

/**
 * Starting points, so nobody faces a colour wheel cold.
 *
 * Kept few and kept APART. The first pass had five pale neutrals in
 * a row — warm white, white, cool white, sand, mist — which is not a
 * palette, it is the same swatch five times. Anything worth its slot
 * has to be tellable from its neighbours at swatch size.
 */
export const GROUND_PRESETS = [
  { label: "Warm", value: "#faf8f5" },
  { label: "White", value: "#ffffff" },
  { label: "Cool grey", value: "#eef2f6" },
  { label: "Ink", value: "#1c1a17" },
  { label: "Midnight", value: "#131a24" },
  { label: "Forest", value: "#13211b" },
  { label: "Plum", value: "#1f1830" },
];

/** Normalise anything stored or typed into a usable #rrggbb. */
export function groundColour(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_GROUND;
  const raw = value.trim().toLowerCase();
  if (raw in LEGACY_GROUNDS) return LEGACY_GROUNDS[raw];

  const hex = raw.startsWith("#") ? raw : `#${raw}`;
  if (/^#[0-9a-f]{6}$/.test(hex)) return hex;
  // Allow the shorthand people actually type.
  if (/^#[0-9a-f]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return DEFAULT_GROUND;
}

/**
 * WCAG relative luminance. Used to decide which way the text goes,
 * so this is the one number that keeps a free colour readable.
 */
export function luminance(hex: string): number {
  const h = groundColour(hex).slice(1);
  const channel = (i: number) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

/**
 * Below this, the ground needs light text on it.
 *
 * 0.35 rather than 0.5: the switch should happen while dark text is
 * still comfortably readable, not at the point it has already become
 * marginal.
 */
export function isDarkGround(hex: string): boolean {
  return luminance(hex) < 0.35;
}

/**
 * The tokens the portal overrides for a given ground.
 *
 * Only what has to move. Everything else stays as `.portal` defines
 * it, so the two paths cannot drift into different-looking portals.
 */
export function groundVariables(value: unknown): Record<string, string> {
  const ground = groundColour(value);

  if (!isDarkGround(ground)) {
    // Light ground: the portal is already built for this. Move the
    // page colour and leave every ink alone.
    return { "--ink-50": ground };
  }

  /**
   * Dark ground: the whole ink ramp inverts, or we get dark text on
   * a dark page. These are the app's own dark values, not a second
   * set invented here — the surface sits slightly above the page so
   * cards still read as cards whatever the business chose.
   */
  return {
    "--ink-50": ground,
    "--ink-950": "#f7f5f2",
    "--ink-900": "#f0ede8",
    "--ink-700": "#d2cdc5",
    "--ink-600": "#ada79e",
    "--ink-500": "#8e8880",
    "--ink-400": "#6e6961",
    "--ink-300": "#4a453e",
    "--ink-200": "#332f2a",
    "--ink-150": "#2a2622",
    "--ink-100": "#232019",
    "--surface": lighten(ground, 0.06),
    "--on-accent": "#0d1a13",
    "--shadow-sm": "0 1px 2px rgb(0 0 0 / 0.4)",
    "--shadow-md":
      "0 4px 12px rgb(0 0 0 / 0.5), 0 1px 3px rgb(0 0 0 / 0.4)",
    "--shadow-lg":
      "0 16px 40px rgb(0 0 0 / 0.6), 0 2px 8px rgb(0 0 0 / 0.4)",
  };
}

/** Nudge a colour toward white, so a card lifts off its own ground. */
function lighten(hex: string, amount: number): string {
  const h = groundColour(hex).slice(1);
  const parts = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16);
    return Math.round(c + (255 - c) * amount)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${parts.join("")}`;
}
