"use client";

import { useTransition } from "react";
import { Calendar, Check, ExternalLink } from "lucide-react";
import { Button, Card, CardBody, toast } from "@/components/ui";
import { markScheduled } from "@/lib/portal-actions";

/**
 * C7 — Scheduling.
 *
 * Sends the client to the business's existing Cal.com / Calendly
 * link, then asks them to confirm they booked. We do not build
 * availability, timezones or conflict handling — that is rebuilding
 * Calendly inside a product whose whole thesis is not building
 * things, and it would need a two-way calendar sync to be correct
 * rather than merely present.
 *
 * The confirmation is the client's word, deliberately. The booking
 * itself already landed in the business's own calendar, which is the
 * record that matters; asking here only tells the progress view that
 * the step is done.
 */
export function ScheduleConfirm({
  token,
  url,
  booked,
}: {
  token: string;
  url: string;
  booked: boolean;
}) {
  const [pending, start] = useTransition();

  if (booked) {
    return (
      <Card className="border-accent-300 bg-accent-50">
        <CardBody className="flex items-center gap-3">
          <Check className="size-5 shrink-0 text-accent-600" strokeWidth={3} />
          <span className="text-base text-ink-900">
            Your call is booked. You&apos;ll get a calendar invite by email.
          </span>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {url ? (
        <Button asChild variant="primary" size="lg" className="w-full">
          <a href={url} target="_blank" rel="noreferrer noopener">
            <Calendar className="size-4" />
            Pick a time
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
      ) : (
        <Card>
          <CardBody className="text-base text-ink-600">
            No booking link has been added yet. You can mark this done and
            arrange a time by email instead.
          </CardBody>
        </Card>
      )}

      <Button
        variant="secondary"
        size="lg"
        loading={pending}
        className="w-full"
        onClick={() =>
          start(async () => {
            const result = await markScheduled(token);
            if (result?.error) {
              toast.error("That didn't save", { description: result.error });
            }
          })
        }
      >
        {url ? "I've booked a time" : "Mark as done"}
      </Button>
    </div>
  );
}
