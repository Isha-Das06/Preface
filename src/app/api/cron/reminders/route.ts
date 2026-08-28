import { cronAuthError } from "../auth";
import { runReminders } from "@/lib/scheduled";

/**
 * Automatic reminders. Intended to run once an hour; the schedule
 * itself lives in reminder_count, not in how often this fires, so a
 * missed run catches up and a double run does not double-send.
 */
export const dynamic = "force-dynamic";

async function handle(request: Request) {
  const denied = cronAuthError(request);
  if (denied) return denied;

  const result = await runReminders();
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
