import { cronAuthError } from "../auth";
import { runDigest } from "@/lib/scheduled";

/** Weekly digest. Intended to run once a week, Monday morning. */
export const dynamic = "force-dynamic";

async function handle(request: Request) {
  const denied = cronAuthError(request);
  if (denied) return denied;

  const result = await runDigest();
  return Response.json(result);
}

/**
 * Both verbs, same guard, same work.
 *
 * Vercel Cron invokes a scheduled path with GET, so a POST-only
 * route answers the scheduler with 405 and the job silently never
 * runs — the failure looks exactly like "no reminders were due".
 * POST stays for anything triggering this by hand.
 */
export const GET = handle;
export const POST = handle;
