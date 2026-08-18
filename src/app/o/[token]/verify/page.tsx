import { redirect } from "next/navigation";
import { Mail } from "lucide-react";
import { PortalShell } from "@/components/portal/portal-shell";
import { VerifyForm } from "@/components/portal/verify-form";
import { getPortal } from "@/lib/portal";
import { sendVerificationCode } from "@/lib/portal-actions";

/** C9 — Email verification. */
export default async function VerifyStep({
  params,
}: PageProps<"/o/[token]/verify">) {
  const { token } = await params;
  const portal = await getPortal(token);
  if (!portal) redirect(`/o/${token}/expired`);
  if (portal.verified) redirect(`/o/${token}/agreement`);

  // Issuing on arrival means the client never has to ask for the
  // first code — the one they came here for is already sent.
  await sendVerificationCode(token);

  return (
    <PortalShell business={portal.business} token={token}>
      <div className="flex flex-1 flex-col justify-center gap-6 py-8 animate-step-in">
        <div className="flex flex-col gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-accent-100">
            <Mail className="size-5 text-accent-600" />
          </span>
          <h1 className="text-2xl font-semibold text-ink-900">
            Check your email
          </h1>
          <p className="measure-prose text-base text-ink-500">
            The next steps involve a contract and a payment, so we need to
            confirm it&apos;s you. We sent a 6-digit code to{" "}
            <span className="font-medium text-ink-900">
              {portal.client.email}
            </span>
            .
          </p>
        </div>

        <VerifyForm token={token} email={portal.client.email} />
      </div>
    </PortalShell>
  );
}
