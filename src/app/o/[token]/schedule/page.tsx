import Link from "next/link";
import { Calendar, Clock, Video } from "lucide-react";
import { Button, Card, CardBody } from "@/components/ui";
import { PortalShell } from "@/components/portal/portal-shell";
import { StepFrame } from "@/components/portal/step-frame";
import { business, scheduling, stepBySlug, steps } from "@/lib/mock";

/**
 * C7 — Scheduling.
 *
 * Renders the business's existing Cal.com / Calendly booker. We do
 * not build availability, timezones or conflict handling — that is
 * rebuilding Calendly inside a product whose whole thesis is not
 * building things. This mock stands in for that embed.
 */
export default function ScheduleStep() {
  const step = stepBySlug("schedule")!;
  const index = steps.findIndex((s) => s.slug === "schedule") + 1;

  return (
    <PortalShell business={business}>
      <StepFrame
        index={index}
        total={steps.length}
        title="Book your kickoff call"
        description="Pick a time that works for you."
        showSaveIndicator={false}
        footerNote={`Booking runs through ${business.name}'s own ${scheduling.provider} calendar, so it lands directly in their diary.`}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-600">
            <span className="flex items-center gap-1.5">
              <Clock className="size-4 text-ink-400" />
              {scheduling.duration}
            </span>
            <span className="flex items-center gap-1.5">
              <Video className="size-4 text-ink-400" />
              {scheduling.format}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4 text-ink-400" />
              Times shown in {scheduling.booked.timezone}
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {scheduling.slots.map((day) => (
              <Card key={day.day}>
                <CardBody className="flex flex-col gap-3">
                  <span className="text-base font-medium text-ink-900">
                    {day.day}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {day.times.map((t) => (
                      <Button key={t} asChild size="md">
                        <Link href="/o/demo/done" data-numeric>
                          {t}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </StepFrame>
    </PortalShell>
  );
}
