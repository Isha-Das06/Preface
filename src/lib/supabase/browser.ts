import { createClient } from "@supabase/supabase-js";

/**
 * Browser client, for Storage uploads and nothing else.
 *
 * This is the one place the browser talks to Supabase directly, and
 * it is narrower than it looks. It carries the publishable anon key,
 * which by design has no table access at all (see the GRANTS block in
 * the initial migration) and no storage policies either — so on its
 * own it can read and write precisely nothing.
 *
 * What authorises an upload is the one-shot signed token the server
 * issues from `requestUpload`, after it has resolved the onboarding
 * token and decided the file is allowed. The key here just gets the
 * request to the right project.
 *
 * The alternative was streaming every upload through a Server Action,
 * which caps at 1MB by default while the portal promises 25MB.
 */
export function createStorageClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export const UPLOAD_BUCKET = "onboarding-files";
