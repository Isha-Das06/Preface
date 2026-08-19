import "server-only";
import { appUrl, render, sendMail, type Block, type MailResult } from "./email";
import type {
  Business,
  Client,
  Onboarding,
  OnboardingStep,
  Signature,
} from "./supabase/types";

/**
 * The five messages this product sends.
 *
 * Copy follows docs/05-copy.md. The tone rule there is load-bearing
 * and easy to erode one word at a time: never "urgent", never "just
 * following up again", never guilt. A client who has not finished is
 * busy, not delinquent, and the agency has to work with them after
 * this is over.
 */

function firstName(client: Client) {
  return (client.name ?? client.company).split(" ")[0];
}

function senderName(business: Business) {
  return business.sender_name?.trim() || business.name;
}

/**
 * "Marcus, Acme Agency" — but not "Marcus at Acme Agency, Acme
 * Agency". Businesses often put the company into the sender name
 * already, and the naive join reads like a mail merge that went
 * wrong.
 */
function signOff(business: Business) {
  const sender = senderName(business);
  return sender.toLowerCase().includes(business.name.toLowerCase())
    ? sender
    : `${sender}, ${business.name}`;
}

function portalUrl(token: string) {
  return appUrl(`/o/${token}`);
}

/** Human list: "a, b and c". */
function list(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

async function send(
  business: Business,
  to: string,
  toName: string | null,
  subject: string,
  blocks: Block[],
  signOff?: string,
): Promise<MailResult> {
  const { text, html } = render(blocks, signOff);
  return sendMail({
    to,
    toName,
    fromName: senderName(business),
    // Always the business. A client replying to their onboarding
    // should reach their agency, not us.
    replyTo: business.reply_to_email,
    subject,
    text,
    html,
  });
}

/* ── To the client ───────────────────────────────────────────── */

export async function sendInvitation(
  business: Business,
  client: Client,
  onboarding: Onboarding,
  steps: OnboardingStep[],
) {
  const named = steps
    .filter((s) => s.type !== "instructions")
    .map((s) => s.title.toLowerCase());

  return send(
    business,
    client.email,
    client.name,
    `Getting started with ${business.name}`,
    [
      { p: `Hi ${firstName(client)},` },
      {
        p: `Great to have you on board. Before we begin, there are a few things we need${named.length ? ` — ${list(named)}` : ""}.`,
      },
      {
        p: "It's all in one place and takes about 15 minutes. You can stop and come back any time.",
      },
      {
        button: {
          label: "Start onboarding",
          href: portalUrl(onboarding.token),
        },
      },
    ],
    signOff(business),
  );
}

export async function sendReminderEmail(
  business: Business,
  client: Client,
  onboarding: Onboarding,
  steps: OnboardingStep[],
) {
  const visible = steps.filter((s) => s.type !== "instructions");
  const done = visible.filter((s) => s.completed_at).length;
  const remaining = visible.filter((s) => !s.completed_at);
  const names = remaining.map((s) => s.title.toLowerCase());

  // Nothing outstanding still has to read like a sentence. A business
  // can press Remind on an onboarding that is already done, or on one
  // whose workflow had no steps configured when it was sent, and
  // "0 things left for your project" is worse than no email at all.
  if (remaining.length === 0) {
    return send(
      business,
      client.email,
      client.name,
      "Your onboarding link",
      [
        { p: `Hi ${firstName(client)},` },
        { p: "Here's your link again, in case it's useful." },
        {
          button: {
            label: "Open your onboarding",
            href: portalUrl(onboarding.token),
          },
        },
        { p: "Any questions, just reply to this email." },
      ],
    );
  }

  const subject =
    remaining.length === 1
      ? "One thing left for your project"
      : `${remaining.length} things left for your project`;

  // "most of the way there" is only true if they are. Otherwise it
  // reads as the kind of cheerful nonsense people stop believing.
  const progress =
    done > 0
      ? `You're ${done * 2 >= visible.length ? "most of the way there" : "underway"} — ${done} of ${visible.length} done. Still to go: ${list(names)}.`
      : `Whenever you have a few minutes: ${list(names)}.`;

  return send(
    business,
    client.email,
    client.name,
    subject,
    [
      { p: `Hi ${firstName(client)},` },
      { p: progress },
      {
        button: {
          label: "Pick up where you left off",
          href: portalUrl(onboarding.token),
        },
      },
      { p: "Any questions, just reply to this email." },
    ],
  );
}

/**
 * The verification code.
 *
 * No copy for this existed in docs/05-copy.md, so it is written to
 * the same rule: explain why we are asking before we ask, and give a
 * plain way out if it was not them.
 */
export async function sendVerification(
  business: Business,
  client: Client,
  code: string,
  expiryMinutes: number,
) {
  return send(
    business,
    client.email,
    client.name,
    `Your code for ${business.name}`,
    [
      { p: `Hi ${firstName(client)},` },
      {
        p: "The next steps involve a contract and a payment, so we check it's you first.",
      },
      { p: `Your code is ${code}` },
      { p: `It works for the next ${expiryMinutes} minutes.` },
      {
        p: "If you weren't expecting this, you can ignore this email — nothing happens without the code.",
      },
    ],
  );
}

export async function sendClientCompletion(
  business: Business,
  client: Client,
  onboarding: Onboarding,
) {
  return send(
    business,
    client.email,
    client.name,
    "You're all set",
    [
      { p: `Hi ${firstName(client)},` },
      {
        p: `Everything's in. ${business.name} has what they need and will be in touch shortly.`,
      },
      {
        p: "You can still open your onboarding page to check anything you sent.",
      },
      {
        button: { label: "View what you sent", href: portalUrl(onboarding.token) },
      },
    ],
    signOff(business),
  );
}

/* ── To the business ─────────────────────────────────────────── */

/**
 * The handoff. docs/05-copy.md calls this the most valuable email in
 * the product, and the reason is that it replaces the agency going
 * digging: everything the client submitted, in one message, in the
 * order they were asked for it.
 */
export async function sendHandoff(
  business: Business,
  client: Client,
  onboarding: Onboarding,
  steps: OnboardingStep[],
  fileCount: number,
  signature: Signature | null,
) {
  const blocks: Block[] = [
    { p: "Everything's in. Here's the summary." },
    { heading: "Client" },
    { row: { label: client.company, value: [client.name, client.email].filter(Boolean).join(" · ") } },
  ];

  const info = steps.find((s) => s.type === "info");
  const infoFields = (info?.config?.fields ?? []) as {
    name: string;
    label: string;
  }[];
  const infoValues = (info?.data?.values ?? {}) as Record<string, string>;
  const filledInfo = infoFields.filter((f) => infoValues[f.name]);
  if (filledInfo.length) {
    blocks.push({ heading: "Company information" });
    for (const f of filledInfo) {
      blocks.push({ row: { label: f.label, value: infoValues[f.name] } });
    }
  }

  const quiz = steps.find((s) => s.type === "questionnaire");
  const prompts = (quiz?.config?.questions ?? []) as { prompt: string }[];
  const answers = (quiz?.data?.answers ?? {}) as Record<string, string>;
  const answered = prompts
    .map((q, i) => ({ prompt: q.prompt, answer: answers[String(i)] ?? "" }))
    .filter((a) => a.answer);
  if (answered.length) {
    blocks.push({ heading: "Questionnaire" });
    for (const a of answered) {
      blocks.push({ row: { label: a.prompt, value: a.answer } });
    }
  }

  if (fileCount > 0) {
    blocks.push({ heading: "Files" });
    blocks.push({
      row: {
        label: `${fileCount} uploaded`,
        value: "download them from the client's page",
      },
    });
  }

  if (signature) {
    blocks.push({ heading: "Agreement" });
    blocks.push({
      row: {
        label: `Signed by ${signature.signer_name}`,
        value: formatDate(signature.signed_at),
      },
    });
  }

  const scheduling = steps.find((s) => s.type === "scheduling");
  if (scheduling?.completed_at) {
    blocks.push({ heading: "Kickoff" });
    blocks.push({
      row: { label: "Booked", value: formatDate(scheduling.completed_at) },
    });
  }

  blocks.push({
    button: {
      label: "View in Preface",
      href: appUrl(`/app/clients/${client.id}`),
    },
  });

  const started = onboarding.started_at ?? onboarding.sent_at;
  if (started && onboarding.completed_at) {
    const days = Math.max(
      1,
      Math.round(
        (new Date(onboarding.completed_at).getTime() -
          new Date(started).getTime()) /
          86400000,
      ),
    );
    blocks.push({
      p: `Started ${formatDate(started)}, finished ${formatDate(onboarding.completed_at)} — ${days} day${days === 1 ? "" : "s"}.`,
    });
  }

  // Goes to the account owner, so replies belong with the client.
  return sendMail({
    to: business.reply_to_email ?? "",
    toName: senderName(business),
    fromName: "Preface",
    replyTo: client.email,
    subject: `${client.company} finished onboarding`,
    ...render(blocks),
  });
}
