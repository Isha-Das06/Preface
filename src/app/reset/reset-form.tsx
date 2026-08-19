"use client";

import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { updatePassword, type AuthResult } from "@/lib/auth-actions";

export function ResetForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: AuthResult, formData: FormData) => updatePassword(formData),
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <p className="text-sm text-ink-500">
        Setting a new password for{" "}
        <span className="font-medium text-ink-900">{email}</span>.
      </p>

      <Field label="New password" required help="At least 8 characters.">
        <Input
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          autoFocus
          required
        />
      </Field>

      <Field label="Confirm password" required>
        <Input
          name="confirm"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          required
        />
      </Field>

      {state?.error && (
        <p role="alert" className="text-sm text-danger-600">
          {state.error}
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" loading={pending}>
        Set password and continue
      </Button>
    </form>
  );
}
