"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Mail, Plus } from "lucide-react";
import {
  Select,
  Button,
  Dialog,
  DialogClose,
  DialogTrigger,
  Field,
  Input,
  Modal,
  toast,
} from "@/components/ui";
import { createClientAction, sendOnboarding } from "@/lib/actions";
import { CUSTOM_WORKFLOW } from "@/lib/templates";

/**
 * B4 — New client. A modal, not a page: three fields don't justify
 * a navigation, and a full page would make the product feel heavier
 * than it is.
 *
 * Two phases in one dialog — collect, then hand back the link. The
 * link is the deliverable, so it gets its own moment rather than a
 * toast that disappears.
 */
export function NewClientButton({
  full = false,
  workflows = [],
  defaultWorkflowId,
}: {
  full?: boolean;
  /** Only offered as a choice when there is more than one. */
  workflows?: { id: string; name: string; clientStepCount: number }[];
  defaultWorkflowId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [created, setCreated] = useState<{
    company: string;
    onboardingId: string;
    token: string;
    clientStepCount: number;
  } | null>(null);
  const [sending, startSend] = useTransition();
  const [emailed, setEmailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [workflowId, setWorkflowId] = useState(
    defaultWorkflowId ?? workflows[0]?.id ?? "",
  );

  const ready = company.trim() && /.+@.+\..+/.test(email);
  const link = created
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/o/${created.token}`
    : "";

  function reset(next: boolean) {
    setOpen(next);
    if (!next) {
      setTimeout(() => {
        setCreated(null);
    setEmailed(false);
        setError(null);
        setCompany("");
        setContact("");
        setEmail("");
      }, 200);
    }
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("company", company);
      fd.set("contact", contact);
      fd.set("email", email);
      if (workflowId) fd.set("workflowId", workflowId);

      const result = await createClientAction(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      /**
       * A custom onboarding has nothing in it yet, so the link panel
       * would be handing over a page with no steps. Go straight to
       * the builder instead — that is the next thing to do, and the
       * client is already saved, so nothing is lost on the way.
       */
      if (result.customWorkflowId) {
        reset(false);
        toast.success(`${result.company} added`, {
          description: "Now build what you need from them.",
        });
        router.push(`/app/workflow?w=${result.customWorkflowId}`);
        router.refresh();
        return;
      }

      setCreated({
        company: result.company as string,
        onboardingId: result.onboardingId as string,
        token: result.token as string,
        clientStepCount: result.clientStepCount as number,
      });
    });
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
          title={`${created.company} is ready`}
          description="Send them this link. That's the whole onboarding."
          footer={
            <DialogClose asChild>
              <Button variant="primary">Done</Button>
            </DialogClose>
          }
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-md border border-ink-200 bg-ink-50 px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate font-mono text-sm text-ink-700">
                {link}
              </span>
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard?.writeText(link).catch(() => {});
                  toast.success("Link copied");
                }}
              >
                <Copy className="size-3.5" />
                Copy
              </Button>
            </div>

            {/* docs/05-copy.md: offer to send it, but never insist —
                plenty of agencies would rather paste the link into a
                thread they already have going with the client. */}
            {created.clientStepCount > 0 && (
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="primary"
                  loading={sending}
                  disabled={emailed}
                  onClick={() => {
                    startSend(async () => {
                      const result = await sendOnboarding(created.onboardingId);
                      if (result.error) {
                        toast.error("Couldn't email it", {
                          description: result.error,
                        });
                        return;
                      }
                      setEmailed(true);
                      toast.success("Sent");
                    });
                  }}
                >
                  <Mail className="size-3.5" />
                  {emailed ? "Emailed" : "Email it to them"}
                </Button>
                <span className="text-sm text-ink-500">
                  or send it yourself, however you normally would.
                </span>
              </div>
            )}

            {created.clientStepCount === 0 ? (
              // Honest rather than cheerful: a link with no steps is
              // a dead end, and the fix is one screen away.
              <p className="text-sm text-warn-fg">
                None of your steps are set up yet, so this link is empty. Add
                your agreement text or questions in Workflow, then create the
                client again.
              </p>
            ) : (
              <p className="text-sm text-ink-500">
                They&apos;ll see {created.clientStepCount} step
                {created.clientStepCount === 1 ? "" : "s"}.
              </p>
            )}
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
                loading={pending}
                onClick={submit}
              >
                {workflowId === CUSTOM_WORKFLOW
                  ? "Save and build it"
                  : "Create link"}
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
            {/* Only asked when there is a genuine choice. One
                onboarding means no question worth putting on the
                screen. */}
            {/* Always asked now, even with one onboarding: "custom"
                is a real second answer, so there is always a choice
                worth putting on the screen. */}
            <Field
              label="Which onboarding?"
              help={
                workflowId === CUSTOM_WORKFLOW
                  ? "You'll write this one from scratch, just for them."
                  : "They get a copy of this one, frozen as it is today."
              }
            >
              <Select
                value={workflowId}
                onValueChange={setWorkflowId}
                options={[
                  ...workflows.map((w) => ({
                    value: w.id,
                    label: `${w.name} · ${w.clientStepCount} step${w.clientStepCount === 1 ? "" : "s"}`,
                  })),
                  {
                    value: CUSTOM_WORKFLOW,
                    label: "Custom — build one just for them",
                  },
                ]}
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

            {error && (
              <p role="alert" className="text-sm text-danger-600">
                {error}
              </p>
            )}
          </div>
        </Modal>
      )}
    </Dialog>
  );
}
