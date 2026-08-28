/**
 * The grounds a business can put behind their client's onboarding.
 *
 * A fixed set, not a colour picker, and this is the whole point of
 * the design rather than a shortcut. The client reads a contract on
 * this page and enters payment details on it. A free picker means
 * somebody eventually chooses a ground their own text disappears
 * against, and the person who cannot read the agreement they are
 * signing is not the one who picked it.
 *
 * Each ground here is a pale surface that dark text sits on at well
 * past 4.5:1, and cards stay white on top of it, so the contrast is
 * a property of the list rather than something to re-check per
 * customer. The accent stays separately configurable — that is
 * applied to buttons and progress, never to text on a background.
 *
 * A dark portal is a different job: every ink token has to flip
 * together, not just the ground. Worth doing, not worth faking by
 * letting someone type #101010 in here.
 */

export type PortalGround = "warm" | "white" | "cool" | "sand";

interface GroundSpec {
  label: string;
  /** Replaces --ink-50, which `.portal` paints as the page ground. */
  value: string;
  /** The swatch in Settings, so it reads as itself against the card. */
  swatchBorder: string;
}

export const PORTAL_GROUNDS: Record<PortalGround, GroundSpec> = {
  warm: { label: "Warm", value: "#faf8f5", swatchBorder: "#e6e0d7" },
  white: { label: "White", value: "#ffffff", swatchBorder: "#e2e2e2" },
  cool: { label: "Cool grey", value: "#f6f7f9", swatchBorder: "#dfe3e8" },
  sand: { label: "Sand", value: "#f7f3ec", swatchBorder: "#e5dccc" },
};

/** Anything unrecognised — including nothing — is the default warm. */
export function portalGround(value: unknown): PortalGround {
  return typeof value === "string" && value in PORTAL_GROUNDS
    ? (value as PortalGround)
    : "warm";
}

export function groundColour(value: unknown): string {
  return PORTAL_GROUNDS[portalGround(value)].value;
}

export const PORTAL_GROUND_OPTIONS = (
  Object.keys(PORTAL_GROUNDS) as PortalGround[]
).map((id) => ({ id, ...PORTAL_GROUNDS[id] }));
