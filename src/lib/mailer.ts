/**
 * Email via nodemailer over SMTP (all config from env).
 *
 * If SMTP isn't configured, sending is a graceful no-op that returns false —
 * the caller then falls back to logging / DB so the contact form still "works"
 * during dev with zero infra.
 */

import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;
let tried = false;

export function isMailerConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  );
}

async function getTransporter(): Promise<Transporter | null> {
  if (!isMailerConfigured()) return null;
  if (tried) return transporter;
  tried = true;

  try {
    const nodemailer = await import("nodemailer");
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true", // true for 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  } catch (err) {
    console.error("[mailer] init failed:", err);
    transporter = null;
    return null;
  }
}

export type ContactEmail = {
  name: string;
  email: string;
  message: string;
};

/** @returns true if the email was sent, false if not configured / failed. */
export async function sendContactEmail(data: ContactEmail): Promise<boolean> {
  const tx = await getTransporter();
  if (!tx) return false;

  const to = process.env.CONTACT_TO ?? process.env.SMTP_USER!;
  const from = process.env.CONTACT_FROM ?? process.env.SMTP_USER!;

  try {
    await tx.sendMail({
      to,
      from,
      replyTo: `${data.name} <${data.email}>`,
      subject: `Portfolio contact — ${data.name}`,
      text: `From: ${data.name} <${data.email}>\n\n${data.message}`,
      html: `
        <div style="font-family:system-ui,sans-serif;line-height:1.5">
          <h2 style="margin:0 0 8px">New portfolio message</h2>
          <p style="margin:0 0 4px"><strong>${escapeHtml(data.name)}</strong>
             &lt;${escapeHtml(data.email)}&gt;</p>
          <hr style="border:none;border-top:1px solid #eee;margin:12px 0" />
          <p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>
        </div>`,
    });
    return true;
  } catch (err) {
    console.error("[mailer] send failed:", err);
    return false;
  }
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
