import { signIn } from "@/lib/auth-actions";
import { AuthForm } from "@/components/marketing/auth-form";
import { AuthLink, AuthShell } from "@/components/marketing/auth-shell";

/** M3 — Login. */
export default async function Login({
  searchParams,
}: PageProps<"/login">) {
  const { next } = await searchParams;

  return (
    <AuthShell
      title="Welcome back"
      footer={
        <>
          Don't have an account? <AuthLink href="/signup">Start free</AuthLink>
        </>
      }
    >
      <AuthForm
        action={signIn}
        mode="login"
        submitLabel="Log in"
        next={typeof next === "string" ? next : undefined}
      />
    </AuthShell>
  );
}
