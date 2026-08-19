import { cronAuthError } from "../auth";
import { runReminders } from "@/lib/scheduled";

/**
 * Automatic reminders. Intended to run once an hour; the schedule
 * itself lives in reminder_count, not in how often this fires, so a
 * missed run catches up and a double run does not double-send.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = cronAuthError(request);
  if (denied) return denied;

  const result = await runReminders();
  return Response.json(result);
}
