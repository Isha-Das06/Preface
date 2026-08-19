import { AuthLink, AuthShell } from "@/components/marketing/auth-shell";
import { ForgotForm } from "./forgot-form";

/** M3b — Forgot password. */
export default async function Forgot({ searchParams }: PageProps<"/forgot">) {
  const { sent } = await searchParams;

  return (
    <AuthShell
      title={sent === "1" ? "Check your email" : "Reset your password"}
      footer={
        <>
          Remembered it? <AuthLink href="/login">Log in</AuthLink>
        </>
      }
    >
      {sent === "1" ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-600">
            If that address has an account, a reset link is on its way. It
            works for one hour.
          </p>
          <p className="text-sm text-ink-500">
            Nothing arrived? Check spam, or{" "}
            <AuthLink href="/forgot">try again</AuthLink>.
          </p>
        </div>
      ) : (
        <ForgotForm />
      )}
    </AuthShell>
  );
}
