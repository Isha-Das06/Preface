import { cronAuthError } from "../auth";
import { runDigest } from "@/lib/scheduled";

/** Weekly digest. Intended to run once a week, Monday morning. */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = cronAuthError(request);
  if (denied) return denied;

  const result = await runDigest();
  return Response.json(result);
}
