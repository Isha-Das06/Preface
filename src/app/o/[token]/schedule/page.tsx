import { redirect } from "next/navigation";
import { Clock, Video } from "lucide-react";
import { PortalShell } from "@/components/portal/portal-shell";
import { StepFrame } from "@/components/portal/step-frame";
import { ScheduleConfirm } from "@/components/portal/schedule-confirm";
import { getPortal, stepBySlug } from "@/lib/portal";

/** C7 — Scheduling. Runs on the business's own booking link. */
export default async function ScheduleStep({
  params,
}: PageProps<"/o/[token]/schedule">) {
  const { token } = await params;
  const portal = await getPortal(token);
  if (!portal) redirect(`/o/${token}/expired`);

  const step = stepBySlug(portal, "schedule");
  if (!step) redirect(`/o/${token}`);

  const url = typeof step.config.url === "string" ? step.config.url : "";
  const duration =
    typeof step.config.duration === "string" ? step.config.duration : null;
  const format =
    typeof step.config.format === "string" ? step.config.format : null;

  return (
    <PortalShell business={portal.business} token={token}>
      <StepFrame
        token={token}
        index={step.displayIndex}
        total={portal.steps.length}
        title={step.title}
        description={step.description ?? undefined}
        footerNote={`Booking runs through ${portal.business.name}'s own calendar, so it lands directly in their diary.`}
      >
        <div className="flex flex-col gap-6">
          {(duration || format) && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-600">
              {duration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4 text-ink-400" />
                  {duration}
                </span>
              )}
              {format && (
                <span className="flex items-center gap-1.5">
                  <Video className="size-4 text-ink-400" />
                  {format}
                </span>
              )}
            </div>
          )}

          <ScheduleConfirm
            token={token}
            url={url}
            booked={Boolean(step.completedAt)}
          />
        </div>
      </StepFrame>
    </PortalShell>
  );
}
