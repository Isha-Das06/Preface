"use client";

import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { requestPasswordReset } from "@/lib/auth-actions";
import type { AuthResult } from "@/lib/auth-actions";

export function ForgotForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: AuthResult, formData: FormData) =>
      requestPasswordReset(formData),
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field
        label="Email"
        required
        help="We&apos;ll send a link that lets you set a new one."
      >
        <Input
          name="email"
          type="email"
          placeholder="you@youragency.com"
          autoComplete="email"
          autoFocus
          required
        />
      </Field>

      {state?.error && (
        <p role="alert" className="text-sm text-danger-600">
          {state.error}
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" loading={pending}>
        Send reset link
      </Button>
    </form>
  );
}
