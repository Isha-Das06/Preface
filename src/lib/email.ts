import "server-only";

/**
 * Outbound email.
 *
 * Two transports behind one function. Locally everything goes to
 * Mailpit over its HTTP send API, so mail lands in the inbox at
 * http://localhost:54324 and never reaches a real person — which
 * matters more here than usual, because these messages are addressed
 * to a customer's customers. In production, Resend.
 *
 * Mailpit's SMTP port is not published to the host by Supabase's
 * local stack; only the web UI is. Its send API is the way in, and it
 * needs no SMTP client, so there is no mail dependency in this
 * project at all.
 *
 * FROM is always our own domain and REPLY-TO is always the business.
 * We cannot send as their domain without their DNS, and a reply that
 * lands with us instead of the agency is a broken promise — the
 * client is supposed to be talking to their agency, not to Preface.
 */

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const FROM_EMAIL = process.env.EMAIL_FROM ?? "onboarding@preface.test";

export interface Mail {
  to: string;
  toName?: string | null;
  /** Shown as the sender. Always the business, never "Preface". */
  fromName: string;
  replyTo?: string | null;
  subject: string;
  text: string;
  html: string;
}

export type MailResult = { ok: true } | { error: string };

export function appUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

/**
 * Send through an ordinary SMTP server — in practice, Gmail.
 *
 * The reason this exists alongside Resend: Resend will only deliver
 * to strangers once you own and verify a domain, and a domain costs
 * money. An SMTP account you already have does not. A Gmail account
 * will carry roughly 500 messages a day, which is far past what a
 * beta needs, and it means the product can actually email a client
 * today rather than after a purchase.
 *
 * The client still sees the BUSINESS as the sender name, exactly as
 * with Resend. Only the address underneath differs.
 */
async function sendViaSmtp(mail: Mail): Promise<MailResult> {
  const { createTransport } = await import("nodemailer");

  const transport = createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    // 465 is implicit TLS; anything else (587) upgrades with STARTTLS.
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  try {
    await transport.sendMail({
      // Gmail rewrites From to the authenticated account whatever we
      // put here, so the address is the account and only the display
      // name is ours to choose. Saying so beats wondering later why
      // EMAIL_FROM appears to be ignored.
      from: { name: mail.fromName, address: process.env.SMTP_USER! },
      to: mail.toName ? { name: mail.toName, address: mail.to } : mail.to,
      replyTo: mail.replyTo ?? undefined,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: `SMTP refused the message: ${message}` };
  }
}

async function sendViaResend(mail: Mail, key: string): Promise<MailResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${mail.fromName} <${FROM_EMAIL}>`,
      to: [mail.to],
      reply_to: mail.replyTo ?? undefined,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    }),
  });

  if (!res.ok) {
    return { error: `Resend rejected the message (${res.status}).` };
  }
  return { ok: true };
}

async function sendViaMailpit(mail: Mail): Promise<MailResult> {
  const res = await fetch(`${MAILPIT_URL}/api/v1/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      From: { Email: FROM_EMAIL, Name: mail.fromName },
      To: [{ Email: mail.to, Name: mail.toName ?? undefined }],
      ReplyTo: mail.replyTo ? [{ Email: mail.replyTo }] : undefined,
      Subject: mail.subject,
      Text: mail.text,
      HTML: mail.html,
    }),
  });

  if (!res.ok) {
    return { error: `Mailpit rejected the message (${res.status}).` };
  }
  return { ok: true };
}

/**
 * Never throws. A failed send must not take down the action that
 * triggered it: a client who finished onboarding has still finished
 * onboarding even if the handoff email bounced, and losing their
 * submission because our mail provider had a bad minute would be a
 * far worse bug than a missing email.
 */
export async function sendMail(mail: Mail): Promise<MailResult> {
  try {
    /**
     * Resend first when it is configured, then SMTP, then the local
     * catcher. Mailpit is last on purpose: it only exists on a
     * developer's machine, so reaching it in production means no
     * sender was configured at all and every message is being
     * thrown at 127.0.0.1.
     */
    const key = process.env.RESEND_API_KEY;
    const smtp = process.env.SMTP_USER && process.env.SMTP_PASS;

    const result = key
      ? await sendViaResend(mail, key)
      : smtp
        ? await sendViaSmtp(mail)
        : await sendViaMailpit(mail);

    if ("error" in result) console.error("sendMail:", result.error, mail.subject);
    return result;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("sendMail: transport threw", message);
    return { error: message };
  }
}

/* ── Rendering ───────────────────────────────────────────────── */

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface Block {
  /** A paragraph. */
  p?: string;
  /** A call to action. */
  button?: { label: string; href: string };
  /** A labelled row in a summary. */
  row?: { label: string; value: string };
  /** A small heading above a group of rows. */
  heading?: string;
}

/**
 * Renders both bodies from one description of the message.
 *
 * Deliberately spartan: one column, system fonts, no images, no
 * tracking pixel, no logo. These land in a client's inbox next to
 * mail from their accountant, and anything that looks like marketing
 * gets treated like marketing.
 */
export function render(blocks: Block[], signOff?: string) {
  const text = blocks
    .map((b) => {
      if (b.p) return b.p;
      if (b.button) return `${b.button.label}: ${b.button.href}`;
      if (b.row) return `${b.row.label}: ${b.row.value}`;
      if (b.heading) return `\n${b.heading.toUpperCase()}`;
      return "";
    })
    .filter(Boolean)
    .join("\n\n");

  const html = blocks
    .map((b) => {
      if (b.p) {
        return `<p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#1a1a1a">${escapeHtml(b.p)}</p>`;
      }
      if (b.button) {
        return `<p style="margin:0 0 20px"><a href="${escapeHtml(b.button.href)}" style="display:inline-block;padding:11px 18px;background:#1F6F4A;color:#ffffff;border-radius:6px;text-decoration:none;font-size:15px;font-weight:500">${escapeHtml(b.button.label)}</a></p>`;
      }
      if (b.row) {
        return `<p style="margin:0 0 6px;font-size:15px;line-height:1.5;color:#1a1a1a"><strong style="font-weight:600">${escapeHtml(b.row.label)}</strong> — ${escapeHtml(b.row.value)}</p>`;
      }
      if (b.heading) {
        return `<p style="margin:20px 0 8px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#6b7280">${escapeHtml(b.heading)}</p>`;
      }
      return "";
    })
    .join("\n");

  const signOffText = signOff ? `\n\n— ${signOff}` : "";
  const signOffHtml = signOff
    ? `<p style="margin:24px 0 0;font-size:15px;color:#6b7280">— ${escapeHtml(signOff)}</p>`
    : "";

  return {
    text: text + signOffText,
    html: `<div style="margin:0;padding:24px;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"><div style="max-width:520px;margin:0 auto">${html}${signOffHtml}</div></div>`,
  };
}
