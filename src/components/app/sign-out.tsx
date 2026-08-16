"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="flex size-8 shrink-0 items-center justify-center rounded-[6px] text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="size-4" />
      </button>
    </form>
  );
}
