import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with correct override precedence.
 * Later classes win, so component consumers can always override
 * a default without fighting specificity.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * A customer-supplied link, or null if it is not safe to render.
 *
 * These URLs are typed by a business and clicked by THEIR client, so
 * they are attacker-controllable input as far as the person clicking
 * is concerned. Only http and https survive: a `javascript:` href
 * would run in the client's session on the portal origin, and `data:`
 * can carry a whole fake page.
 *
 * A bare `cal.com/you` or `buy.stripe.com/x` is what people actually
 * paste, so a missing scheme is treated as https rather than dropped.
 */
export function safeExternalUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;

  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value)
    ? value
    : `https://${value}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  return parsed.protocol === "http:" || parsed.protocol === "https:"
    ? parsed.toString()
    : null;
}
