import { LinkIcon } from "lucide-react";
import { RecoverForm } from "./recover-form";

/**
 * C10 — Expired or invalid link.
 *
 * A dead end here is a lost onboarding, so the screen's only job is
 * recovery. No apology, no error code, no "contact support".
 *
 * Deliberately renders no business identity: we get here precisely
 * when the token resolved to nothing, so there is no business to
 * name. Guessing one would be worse than saying nothing.
 *
 * The form is real: it re-sends the existing link to the address on
 * the record. It does not mint a new token — the old link works fine
 * if it was merely lost, and rotating it would break the copy that
 * may already be open in another tab.
 */
export default function ExpiredLink() {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-[560px] flex-col justify-center gap-6 px-4 pb-16 sm:px-6">
        <div className="flex flex-col gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-ink-100">
            <LinkIcon className="size-5 text-ink-500" />
          </span>
          <h1 className="text-2xl font-semibold text-ink-900">
            This link isn&apos;t active
          </h1>
          <p className="measure-prose text-base text-ink-500">
            It may have expired or been replaced. Enter your email and we&apos;ll
            send you a fresh one.
          </p>
        </div>

        <RecoverForm />

        <p className="text-sm text-ink-500">
          Still stuck? Reply to the email your onboarding link came in and it
          goes straight to the people expecting you.
        </p>
      </div>
    </div>
  );
}
