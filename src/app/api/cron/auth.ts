import "server-only";

/**
 * Shared guard for the scheduled endpoints.
 *
 * These run as service_role across every tenant, so an open URL here
 * would let anyone on the internet trigger mail to every client of
 * every business. It is the single most dangerous route in the app.
 *
 * Requires `Authorization: Bearer <CRON_SECRET>`. If CRON_SECRET is
 * unset the route refuses outright rather than running unguarded —
 * failing closed matters more than a scheduler that quietly works in
 * an environment nobody configured.
 */
export function cronAuthError(request: Request): Response | null {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return Response.json(
      { error: "CRON_SECRET is not set, so scheduled jobs are disabled." },
      { status: 503 },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!timingSafeEqual(provided, secret)) {
    return Response.json({ error: "Not authorised." }, { status: 401 });
  }

  return null;
}

/** Constant-time compare, so the secret can't be guessed a byte at a time. */
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
