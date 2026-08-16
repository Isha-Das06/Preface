"use client";

import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import type { AuthResult } from "@/lib/auth-actions";

type Action = (formData: FormData) => Promise<AuthResult>;

/**
 * Shared form shell for login and signup.
 *
 * Uses useActionState so the pending state is real — the button
 * genuinely disables while the request is in flight, rather than
 * looking live and doing nothing on a double-click.
 */
export function AuthForm({
  action,
  submitLabel,
  mode,
  next,
}: {
  action: Action;
  submitLabel: string;
  mode: "login" | "signup";
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: AuthResult, formData: FormData) => action(formData),
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {next && <input type="hidden" name="next" value={next} />}

      <Field label={mode === "signup" ? "Work email" : "Email"} required>
        <Input
          name="email"
          type="email"
          placeholder="you@youragency.com"
          autoComplete="email"
          required
        />
      </Field>

      <Field
        label="Password"
        required
        help={mode === "signup" ? "At least 8 characters." : undefined}
      >
        <Input
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
        />
      </Field>

      {state?.error && (
        <p role="alert" className="text-sm text-danger-600">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={pending}
      >
        {submitLabel}
      </Button>
    </form>
  );
}
