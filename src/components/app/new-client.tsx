"use client";

import { useState } from "react";
import { Check, Copy, Plus, Send } from "lucide-react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogTrigger,
  Field,
  Input,
  Modal,
  toast,
} from "@/components/ui";

/**
 * B4 — New client. A modal, not a page: adding a client is three
 * fields, and a full page navigation for three fields makes the
 * product feel heavier than it is.
 *
 * Two phases in one dialog — collect, then hand back the link.
 * The link is the deliverable, so it gets its own moment rather
 * than a toast that disappears.
 */
export function NewClientButton({ full = false }: { full?: boolean }) {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");

  const ready = company.trim() && /.+@.+\..+/.test(email);
  const link = "app.preface.co/o/k3Xm9pQr2LwTv8Bn";

  function reset(next: boolean) {
    setOpen(next);
    if (!next) {
      setTimeout(() => {
        setCreated(null);
        setCompany("");
        setContact("");
        setEmail("");
      }, 200);
    }
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <Button variant="primary" fullWidth={full}>
          <Plus className="size-4" />
          Add client
        </Button>
      </DialogTrigger>

      {created ? (
        <Modal
          title={`${created} is ready`}
          description="Send them this link. That's the whole onboarding."
          footer={
            <>
              <DialogClose asChild>
                <Button variant="ghost">Done</Button>
              </DialogClose>
              <Button
                variant="primary"
                onClick={() => {
                  reset(false);
                  toast.success(`Onboarding link emailed to ${email}`);
                }}
              >
                <Send className="size-4" />
                Email it to them
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-md border border-ink-200 bg-ink-50 px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate font-mono text-sm text-ink-700">
                {link}
              </span>
              <Button
                size="sm"
                onClick={() => toast.success("Link copied")}
              >
                <Copy className="size-3.5" />
                Copy
              </Button>
            </div>
            <p className="text-sm text-ink-500">
              Or send it yourself, however you normally would.
            </p>
          </div>
        </Modal>
      ) : (
        <Modal
          title="Add a client"
          description="They'll get one link with everything you need from them."
          footer={
            <>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                variant="primary"
                disabled={!ready}
                onClick={() => setCreated(company)}
              >
                Create link
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Field label="Company" required>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Northstar Labs"
                autoFocus
              />
            </Field>
            <Field label="Contact name">
              <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Sarah Chen"
              />
            </Field>
            <Field
              label="Email"
              required
              help="Where the onboarding link and any reminders go."
            >
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@northstarlabs.co"
              />
            </Field>
          </div>
        </Modal>
      )}
    </Dialog>
  );
}
