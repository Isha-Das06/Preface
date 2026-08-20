"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Button,
  Dialog,
  DialogClose,
  Field,
  Input,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
  Modal,
  toast,
} from "@/components/ui";
import {
  createWorkflow,
  deleteWorkflow,
  renameWorkflow,
} from "@/lib/actions";
import type { WorkflowSummary } from "@/lib/queries";

/**
 * Switch between onboardings, when there is more than one.
 *
 * Deliberately not a list page. Most businesses run exactly one
 * onboarding forever, and making everyone click through an index to
 * reach the thing they came to edit taxes the common case to serve
 * the rare one. With one workflow this is a plain heading; a second
 * turns it into a switcher.
 */
export function WorkflowSwitcher({
  workflows,
  selected,
}: {
  workflows: WorkflowSummary[];
  selected: WorkflowSummary;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState("");

  function go(id: string) {
    router.push(`/app/workflow?w=${id}`);
    router.refresh();
  }

  function create() {
    start(async () => {
      const result = await createWorkflow(name);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setCreating(false);
      setName("");
      toast.success("Onboarding created", {
        description: "Add steps or start from a template.",
      });
      go(result.workflowId as string);
    });
  }

  function rename() {
    start(async () => {
      const result = await renameWorkflow(selected.id, name);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setRenaming(false);
      toast.success("Renamed");
      router.refresh();
    });
  }

  function remove() {
    start(async () => {
      const result = await deleteWorkflow(selected.id);
      if (result.error) {
        // Refusals here are rules, not failures — say which one.
        toast.error("Kept it", { description: result.error });
        return;
      }
      toast.success("Deleted");
      const next = workflows.find((w) => w.id !== selected.id);
      if (next) go(next.id);
      else router.refresh();
    });
  }

  return (
    <>
      <Menu>
        <MenuTrigger asChild>
          <button
            type="button"
            className="-mx-2 flex min-h-9 items-center gap-1.5 rounded-md px-2 text-left transition-colors hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)"
          >
            <span className="text-2xl font-semibold text-ink-900">
              {selected.name}
            </span>
            <ChevronDown className="size-4 shrink-0 text-ink-500" />
          </button>
        </MenuTrigger>

        <MenuContent align="start">
          {workflows.length > 1 && (
            <>
              <MenuLabel>Your onboardings</MenuLabel>
              {workflows.map((w) => (
                <MenuItem key={w.id} onSelect={() => go(w.id)}>
                  <Check
                    className={
                      w.id === selected.id
                        ? "size-4 text-accent-600"
                        : "size-4 opacity-0"
                    }
                  />
                  <span className="flex-1">{w.name}</span>
                  <span className="text-xs text-ink-500" data-numeric>
                    {w.stepCount}
                  </span>
                </MenuItem>
              ))}
              <MenuSeparator />
            </>
          )}

          <MenuItem
            onSelect={() => {
              setName(selected.name);
              setRenaming(true);
            }}
          >
            <Pencil className="size-4 text-ink-400" />
            Rename
          </MenuItem>
          <MenuItem
            onSelect={() => {
              setName("");
              setCreating(true);
            }}
          >
            <Plus className="size-4 text-ink-400" />
            New onboarding
          </MenuItem>
          {workflows.length > 1 && (
            <MenuItem destructive onSelect={remove}>
              <Trash2 className="size-4" />
              Delete this one
            </MenuItem>
          )}
        </MenuContent>
      </Menu>

      <Dialog open={creating} onOpenChange={setCreating}>
        <Modal
          title="New onboarding"
          description="A separate set of steps you can send to some clients and not others."
          footer={
            <>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                variant="primary"
                loading={pending}
                disabled={!name.trim()}
                onClick={create}
              >
                Create
              </Button>
            </>
          }
        >
          <Field label="Name" help="Only you see this. Clients never do.">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Design projects"
              autoFocus
            />
          </Field>
        </Modal>
      </Dialog>

      <Dialog open={renaming} onOpenChange={setRenaming}>
        <Modal
          title="Rename onboarding"
          footer={
            <>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                variant="primary"
                loading={pending}
                disabled={!name.trim()}
                onClick={rename}
              >
                Save
              </Button>
            </>
          }
        >
          <Field label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </Field>
        </Modal>
      </Dialog>
    </>
  );
}
