import Link from "next/link";
import { Button, Field, Input } from "@/components/ui";
import { AuthLink, AuthShell } from "@/components/marketing/auth-shell";

/** M3 — Login. */
export default function Login() {
  return (
    <AuthShell
      title="Welcome back"
      footer={
        <>
          Don't have an account? <AuthLink href="/signup">Start free</AuthLink>
        </>
      }
    >
      <form className="flex flex-col gap-5">
        <Field label="Email" required>
          <Input
            type="email"
            placeholder="you@youragency.com"
            autoComplete="email"
          />
        </Field>
        <Field
          label="Password"
          required
          hint={<AuthLink href="/login">Forgot?</AuthLink>}
        >
          <Input
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </Field>

        <Button asChild variant="primary" size="lg" fullWidth>
          <Link href="/app">Log in</Link>
        </Button>
      </form>
    </AuthShell>
  );
}
