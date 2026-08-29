"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogTrigger,
  Modal,
  toast,
} from "@/components/ui";
import { deleteClient } from "@/lib/actions";

/**
 * Remove a client, and everything they ever sent.
 *
 * Deliberately not a button on the clients table. A row is scanned,
 * and a delete control sitting in one is a mis-click away from
 * destroying a signed agreement and a set of uploads. This lives on
 * the client's own page, which you have to open on purpose, at the
 * bottom, away from anything you would click by habit.
 *
 * The dialog names what goes and says it cannot be undone, because
 * both are true: the foreign keys cascade through the onboarding,
 * its answers, the files and the signature, and there is no soft
 * delete to restore from.
 */
export function DeleteClient({
  clientId,
  company,
  hasSigned,
}: {
  clientId: string;
  company: string;
  /** Worth saying out loud — a signature is a record, not just data. */
  hasSigned: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Trash2 className="size-4" />
          Delete client
        </Button>
      </DialogTrigger>

      <Modal
        title={`Delete ${company}?`}
        description="This can't be undone."
        footer={
          <>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="danger"
              loading={pending}
              onClick={() =>
                start(async () => {
                  const result = await deleteClient(clientId);
                  if (result.error) {
                    toast.error("Couldn't delete that", {
                      description: result.error,
                    });
                    return;
                  }
                  setOpen(false);
                  toast.success(`${company} deleted`);
                  router.push("/app/clients");
                  router.refresh();
                })
              }
            >
              Delete permanently
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 text-base text-ink-700">
          <p className="measure-prose">
            Their onboarding, every answer they gave, and every file they
            uploaded will be deleted. Their link stops working immediately.
          </p>
          {hasSigned && (
            <p className="measure-prose rounded-md bg-warn-100 px-3 py-2.5 text-sm text-warn-fg">
              {company} has signed an agreement. Deleting them removes the
              signature and the record of what they signed. Download anything
              you need to keep first.
            </p>
          )}
        </div>
      </Modal>
    </Dialog>
  );
}
