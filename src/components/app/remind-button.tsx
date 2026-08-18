"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogTrigger,
  Modal,
  toast,
} from "@/components/ui";
import { sendReminder } from "@/lib/actions";

/**
 * Reminders are confirmed, never one-click. Sending an email to
 * someone else's client is outward-facing and irreversible, and the
 * rows sit close enough together that a misclick is plausible.
 */
export function RemindButton({
  onboardingId,
  client,
  contact,
  remaining,
  variant = "secondary",
}: {
  onboardingId: string;
  client: string;
  contact: string;
  remaining: number;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const first = contact.split(" ")[0];

  function send() {
    startTransition(async () => {
      const result = await sendReminder(onboardingId);
      setOpen(false);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Reminder sent to ${first}`, {
        description: "Automatic reminders paused for 48 hours.",
      });
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm">
          <Send className="size-4" />
          <span className="hidden sm:inline">Remind</span>
        </Button>
      </DialogTrigger>
      <Modal
        title={`Send a reminder to ${first}?`}
        description={`They'll get a short email with their link and the ${remaining} step${remaining === 1 ? "" : "s"} left.`}
        footer={
          <>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button variant="primary" loading={pending} onClick={send}>
              Send reminder
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-500">
          Automatic reminders to {client} pause for 48 hours after this, so
          nobody gets chased twice in a day.
        </p>
      </Modal>
    </Dialog>
  );
}
