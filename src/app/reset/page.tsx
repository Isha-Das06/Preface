import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthLink, AuthShell } from "@/components/marketing/auth-shell";
import { ResetForm } from "./reset-form";

/**
 * M3c — Set a new password.
 *
 * Reachable only with the session the recovery link established, so
 * arriving here already proves control of the inbox.
 */
export default async function Reset() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/forgot?expired=1");

  return (
    <div className="marketing">
      <AuthShell
        title="Choose a new password"
        footer={
          <>
            Changed your mind? <AuthLink href="/login">Log in</AuthLink>
          </>
        }
      >
        <ResetForm email={user.email ?? ""} />
      </AuthShell>
    </div>
  );
}
