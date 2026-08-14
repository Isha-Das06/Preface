"use client";

import { useState } from "react";
import {
  Ban,
  Copy,
  FileText,
  Inbox,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogClose,
  DialogTrigger,
  Divider,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Modal,
  PageHeader,
  ProgressSummary,
  Radio,
  RadioCard,
  RadioGroup,
  Select,
  Skeleton,
  SkeletonText,
  SlideOver,
  StatusBadge,
  StatusDot,
  StepList,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  Textarea,
  Toaster,
  Tooltip,
  TooltipProvider,
  toast,
  type Step,
} from "@/components/ui";

/* ------------------------------------------------------------------
   Realistic mock data. Never lorem ipsum — placeholder text hides
   the layout problems that real content exposes.
   ------------------------------------------------------------------ */

const STEPS: Step[] = [
  { id: "1", title: "Company information", state: "complete" },
  { id: "2", title: "Project questionnaire", state: "complete" },
  {
    id: "3",
    title: "Brand assets",
    state: "complete",
    meta: "1 optional item skipped",
  },
  { id: "4", title: "Service agreement", state: "complete", meta: "Signed 12 Aug" },
  { id: "5", title: "Deposit", state: "current", meta: "$2,500.00" },
  { id: "6", title: "Kickoff call", state: "upcoming", optional: true },
];

const CLIENTS = [
  { name: "Northstar Labs", contact: "Sarah Chen", status: "waiting", waiting: "Service agreement", days: "6 days", value: "$18,000.00" },
  { name: "Vertex Health", contact: "Marcus Webb", status: "in_progress", waiting: "Brand assets", days: "2 days", value: "$7,400.00" },
  { name: "Atlas Digital", contact: "Priya Raman", status: "in_progress", waiting: "Deposit", days: "4 hours", value: "$2,500.00" },
  { name: "Acme Foods", contact: "Tom Alvarez", status: "completed", waiting: "—", days: "—", value: "$12,000.00" },
] as const;

/* ------------------------------------------------------------------ */

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 scroll-mt-8" id={title.toLowerCase().replace(/\W+/g, "-")}>
      <div className="flex flex-col gap-1">
        <h2 className="label-caps">{title}</h2>
        {note && <p className="measure text-sm text-ink-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

export default function KitchenSink() {
  const [density, setDensity] = useState<"app" | "portal">("app");
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState("marketing");

  return (
    <TooltipProvider>
      <div className={density === "portal" ? "portal min-h-screen" : "min-h-screen"}>
        <div className="mx-auto flex max-w-[1100px] flex-col gap-14 px-6 py-14">
          <PageHeader
            title="Preface design system"
            description="Every component, every variant, every state. If a screen needs something that isn't here, it gets added here first — never styled inline in a page."
            actions={
              <div className="flex items-center gap-2">
                <Button
                  variant={density === "app" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setDensity("app")}
                >
                  App density
                </Button>
                <Button
                  variant={density === "portal" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setDensity("portal")}
                >
                  Portal density
                </Button>
              </div>
            }
          />

          <Card className="bg-accent-50">
            <CardBody className="flex flex-col gap-1">
              <p className="text-base font-medium text-ink-900">
                Currently showing:{" "}
                {density === "app" ? "app density" : "portal density"}
              </p>
              <p className="text-sm text-ink-600">
                Identical components. The container changes the type scale,
                control height, card radius and padding — and the portal forces
                the light palette regardless of theme. Toggle above and watch
                everything below re-space itself.
              </p>
            </CardBody>
          </Card>

          {/* ---------------------------------------------------- */}
          <Section
            title="Buttons"
            note="One primary per screen, without exception. Two primaries means the screen hasn't decided what the user should do."
          >
            <Row>
              <Button variant="primary">Send onboarding</Button>
              <Button variant="secondary">Copy link</Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="danger">Delete client</Button>
            </Row>
            <Row>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </Row>
            <Row>
              <Button variant="primary" loading>
                Sending
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
              <Button variant="secondary" disabled>
                Disabled
              </Button>
              <Button variant="primary">
                <Send className="size-4" />
                With icon
              </Button>
            </Row>
            <div className="max-w-sm">
              <Button variant="primary" fullWidth>
                Full width — the portal default below 640px
              </Button>
            </div>
          </Section>

          {/* ---------------------------------------------------- */}
          <Section
            title="Form controls"
            note="Field owns label, help and error layout, and wires aria-describedby once so no form has to remember to."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Company name" required>
                <Input placeholder="Northstar Labs" />
              </Field>
              <Field label="Work email" help="We'll send the onboarding link here.">
                <Input type="email" placeholder="sarah@northstarlabs.co" />
              </Field>
              <Field label="Deposit amount">
                <Input leading="$" placeholder="2,500.00" inputMode="decimal" />
              </Field>
              <Field
                label="Phone"
                error="That doesn't look like a valid phone number."
              >
                <Input defaultValue="+1 415 555" aria-invalid />
              </Field>
              <Field label="Template" hint="Changeable later">
                <Select
                  options={[
                    { value: "marketing", label: "Marketing agency" },
                    { value: "design", label: "Design studio" },
                    { value: "consulting", label: "Consultant" },
                    { value: "scratch", label: "Start from scratch" },
                  ]}
                  defaultValue="marketing"
                />
              </Field>
              <Field label="Disabled">
                <Input disabled placeholder="Connect Stripe first" />
              </Field>
            </div>

            <Field
              label="What should we know before we begin?"
              help="Answers save as you type."
            >
              <Textarea placeholder="Anything that would change how we approach this." />
            </Field>

            <Divider />

            <div className="flex flex-col gap-4">
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => setChecked(Boolean(v))}
                label="Send automatic reminders"
                description="At 2 days and 5 days of inactivity, then stop."
              />
              <Checkbox checked="indeterminate" label="Indeterminate" />
              <Checkbox disabled label="Disabled" />
            </div>

            <RadioGroup value={radio} onValueChange={setRadio}>
              <Radio value="marketing" label="Marketing agency" />
              <Radio value="design" label="Design studio" />
              <Radio value="disabled" label="Disabled option" disabled />
            </RadioGroup>

            <div className="grid gap-3 sm:grid-cols-2">
              <RadioGroup value={radio} onValueChange={setRadio} className="contents">
                <RadioCard
                  value="marketing"
                  label="Marketing agency"
                  description="Questionnaire, brand assets, agreement, deposit, kickoff."
                />
                <RadioCard
                  value="consulting"
                  label="Consultant"
                  description="Scope, background documents, agreement, first invoice."
                />
              </RadioGroup>
            </div>
          </Section>

          {/* ---------------------------------------------------- */}
          <Section
            title="Progress and steps"
            note='The portal spine. "4 of 6" rather than "67%" — a percentage is a file-transfer readout; a count is how a person thinks about a checklist.'
          >
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardBody className="flex flex-col gap-6">
                  <ProgressSummary value={4} total={6} />
                  <StepList steps={STEPS} />
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex flex-col gap-6">
                  <ProgressSummary value={6} total={6} />
                  <StepList
                    steps={STEPS.map((s) => ({
                      ...s,
                      state: "complete" as const,
                    }))}
                  />
                </CardBody>
              </Card>
            </div>
          </Section>

          {/* ---------------------------------------------------- */}
          <Section title="Status" note="Four onboarding states. No screen invents a fifth.">
            <Row>
              <StatusBadge status="not_started" />
              <StatusBadge status="in_progress" />
              <StatusBadge status="waiting" />
              <StatusBadge status="completed" />
            </Row>
            <Row>
              <span className="flex items-center gap-2 text-sm">
                <StatusDot status="waiting" /> Waiting on agreement
              </span>
              <Divider orientation="vertical" className="h-4" />
              <Avatar name="Sarah Chen" size="sm" />
              <Avatar name="Marcus Webb" />
              <Avatar name="Priya Raman" size="lg" />
            </Row>
            <Row>
              <Badge tone="neutral">Neutral</Badge>
              <Badge tone="info">Info</Badge>
              <Badge tone="warn">Warning</Badge>
              <Badge tone="success">Success</Badge>
              <Badge tone="danger">Danger</Badge>
            </Row>
          </Section>

          {/* ---------------------------------------------------- */}
          <Section
            title="Cards and elevation"
            note="Cards get a border and no shadow. Shadows are only for things that genuinely float. This one rule does more than any other to avoid looking templated."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-0.5">
                    <CardTitle>Northstar Labs</CardTitle>
                    <CardDescription>Sarah Chen · sarah@northstarlabs.co</CardDescription>
                  </div>
                  <Menu>
                    <MenuTrigger asChild>
                      <Button variant="ghost" size="sm" aria-label="More actions">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </MenuTrigger>
                    <MenuContent>
                      <MenuItem>
                        <Copy className="size-4" /> Copy link
                      </MenuItem>
                      <MenuItem>
                        <Send className="size-4" /> Send reminder
                      </MenuItem>
                      <MenuItem>
                        <Pencil className="size-4" /> Edit workflow
                      </MenuItem>
                      <MenuSeparator />
                      <MenuItem destructive>
                        <Trash2 className="size-4" /> Delete client
                      </MenuItem>
                    </MenuContent>
                  </Menu>
                </CardHeader>
                <CardBody>
                  <ProgressSummary value={4} total={6} />
                </CardBody>
                <CardFooter>
                  <Button variant="ghost" size="sm">
                    Copy link
                  </Button>
                  <Button variant="primary" size="sm">
                    Send reminder
                  </Button>
                </CardFooter>
              </Card>

              <div className="flex flex-col gap-4">
                <Card className="shadow-md">
                  <CardBody>
                    <p className="text-base font-medium">shadow-md</p>
                    <p className="text-sm text-ink-500">
                      Dropdowns and popovers. They genuinely float.
                    </p>
                  </CardBody>
                </Card>
                <Card className="shadow-lg">
                  <CardBody>
                    <p className="text-base font-medium">shadow-lg</p>
                    <p className="text-sm text-ink-500">Modals only.</p>
                  </CardBody>
                </Card>
              </div>
            </div>
          </Section>

          {/* ---------------------------------------------------- */}
          <Section
            title="Table"
            note="No zebra striping, no vertical rules. Hairlines and alignment do the work. Numerics are tabular so columns never dance."
          >
            <Card>
              <Table>
                <THead>
                  <TR>
                    <TH>Client</TH>
                    <TH>Status</TH>
                    <TH>Waiting on</TH>
                    <TH numeric>Value</TH>
                  </TR>
                </THead>
                <TBody>
                  {CLIENTS.map((c) => (
                    <TR key={c.name} interactive>
                      <TD>
                        <span className="flex items-center gap-2.5">
                          <Avatar name={c.name} size="sm" />
                          <span className="flex flex-col">
                            <span className="font-medium">{c.name}</span>
                            <span className="text-xs text-ink-500">{c.contact}</span>
                          </span>
                        </span>
                      </TD>
                      <TD>
                        <StatusBadge status={c.status} />
                      </TD>
                      <TD>
                        <span className="text-ink-600">{c.waiting}</span>
                        {c.days !== "—" && (
                          <span className="text-ink-400"> · {c.days}</span>
                        )}
                      </TD>
                      <TD numeric className="font-mono">
                        {c.value}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>
          </Section>

          {/* ---------------------------------------------------- */}
          <Section
            title="Overlays"
            note="Radix supplies focus trap, Esc, focus return and scroll lock. Every pixel is ours."
          >
            <Row>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">Open modal</Button>
                </DialogTrigger>
                <Modal
                  title="Send a reminder to Sarah Chen?"
                  description="She'll get a short email with her link and the two steps left."
                  footer={
                    <>
                      <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button variant="primary">Send reminder</Button>
                      </DialogClose>
                    </>
                  }
                >
                  <p className="text-sm text-ink-500">
                    Automatic reminders pause for 48 hours after this.
                  </p>
                </Modal>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">Open slide-over</Button>
                </DialogTrigger>
                <SlideOver
                  title="Edit step"
                  description="Brand assets"
                  footer={
                    <>
                      <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button variant="primary">Save step</Button>
                      </DialogClose>
                    </>
                  }
                >
                  <div className="flex flex-col gap-5">
                    <Field label="Step title">
                      <Input defaultValue="Brand assets" />
                    </Field>
                    <Field
                      label="Instructions for the client"
                      help="Shown above the upload area."
                    >
                      <Textarea defaultValue="Upload what you have. Anything marked optional can wait." />
                    </Field>
                    <Checkbox defaultChecked label="Required to finish onboarding" />
                  </div>
                </SlideOver>
              </Dialog>

              <Tooltip content="Copies the client's onboarding link">
                <Button variant="ghost">
                  <Copy className="size-4" />
                  Hover me
                </Button>
              </Tooltip>

              <Button
                variant="secondary"
                onClick={() =>
                  toast.success("Reminder sent to Sarah Chen", {
                    description: "Automatic reminders paused for 48 hours.",
                  })
                }
              >
                Success toast
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  toast.error("That file didn't upload", {
                    description: "It may be over 25 MB. Try again.",
                    duration: Infinity,
                  })
                }
              >
                Error toast
              </Button>
            </Row>
          </Section>

          {/* ---------------------------------------------------- */}
          <Section
            title="Empty, loading and error"
            note="All four states for every data surface. The fourth — partial — is the most forgotten and the most common here."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <EmptyState
                  icon={Inbox}
                  title="Nothing to chase"
                  description="Every client is up to date."
                />
              </Card>
              <Card>
                <EmptyState
                  icon={Users}
                  title="No clients yet"
                  description="Add your first one and we'll generate their onboarding link."
                  action={<Button variant="primary" size="sm">Add client</Button>}
                />
              </Card>
              <Card>
                <ErrorState
                  title="Couldn't load clients"
                  description="The connection dropped. Your data is safe."
                  onRetry={() => toast("Retrying…")}
                />
              </Card>
            </div>

            <Card>
              <CardBody className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <SkeletonText lines={3} />
              </CardBody>
            </Card>
          </Section>

          {/* ---------------------------------------------------- */}
          <Section title="Typography" note="Same components, scale set by the container.">
            <div className="flex flex-col gap-3">
              {(["text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl"] as const).map(
                (t) => (
                  <div key={t} className="flex items-baseline gap-4">
                    <span className="w-14 shrink-0 font-mono text-xs text-ink-400">
                      {t.replace("text-", "")}
                    </span>
                    <span className={t}>
                      Turn a new client into a fully onboarded client.
                    </span>
                  </div>
                ),
              )}
            </div>
          </Section>

          <Divider />
          <p className="flex items-center gap-2 pb-8 text-sm text-ink-400">
            <FileText className="size-4" />
            Anti-patterns deliberately absent: gradients, glowing cards,
            glassmorphism, card shadows, a second accent hue, emoji as UI icons,
            uniform rounding.
            <Ban className="size-4" />
          </p>
        </div>
        <Toaster portal={density === "portal"} />
      </div>
    </TooltipProvider>
  );
}
