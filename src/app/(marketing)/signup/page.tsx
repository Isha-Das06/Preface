import { signUp } from "@/lib/auth-actions";
import { AuthForm } from "@/components/marketing/auth-form";
import { AuthLink, AuthShell } from "@/components/marketing/auth-shell";

/** M4 — Signup. */
export default function Signup() {
  return (
    <AuthShell
      title="Start onboarding clients properly."
      subtitle="Free while we're in beta. No card."
      footer={
        <>
          Already have an account? <AuthLink href="/login">Log in</AuthLink>
        </>
      }
    >
      <AuthForm action={signUp} mode="signup" submitLabel="Create account" />

      <p className="text-sm text-ink-500">
        By creating an account you agree to our terms and privacy policy.
      </p>
    </AuthShell>
  );
}
