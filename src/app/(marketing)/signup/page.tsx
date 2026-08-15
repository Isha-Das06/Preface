import Link from "next/link";
import { Button, Field, Input } from "@/components/ui";
import { AuthLink, AuthShell } from "@/components/marketing/auth-shell";

/** M4 — Signup. */
export default function Signup() {
  return (
    <AuthShell
      title="Start onboarding clients properly."
      subtitle="Fourteen days free. No card."
      footer={
        <>
          Already have an account? <AuthLink href="/login">Log in</AuthLink>
        </>
      }
    >
      <form className="flex flex-col gap-5">
        <Field label="Work email" required>
          <Input
            type="email"
            placeholder="you@youragency.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Password" required help="At least 8 characters.">
          <Input
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </Field>

        <Button asChild variant="primary" size="lg" fullWidth>
          <Link href="/welcome">Create account</Link>
        </Button>
      </form>

      <p className="text-sm text-ink-500">
        By creating an account you agree to our terms and privacy policy.
      </p>
    </AuthShell>
  );
}
