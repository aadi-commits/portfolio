import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { sendContactEmail, isMailerConfigured } from "@/lib/mailer";
import { saveContactSubmission, isDbConfigured } from "@/lib/db";

export const runtime = "nodejs";

function getIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || "unknown";
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: Request) {
  const ip = getIp(req);

  // Contact is a heavier action → tighter limit than chat.
  const rl = await rateLimit(`contact:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json(
      { ok: false, error: "Too many messages. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const { name, email, message, website } = (body ?? {}) as Record<string, unknown>;

  // Honeypot: real users never fill the hidden "website" field.
  if (typeof website === "string" && website.trim() !== "") {
    return NextResponse.json({ ok: true }); // silently accept & drop
  }

  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim() : "";
  const cleanMessage = typeof message === "string" ? message.trim() : "";

  if (cleanName.length < 2 || cleanName.length > 100) {
    return NextResponse.json({ ok: false, error: "Please enter your name." }, { status: 400 });
  }
  if (!isEmail(cleanEmail)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email." },
      { status: 400 },
    );
  }
  if (cleanMessage.length < 10 || cleanMessage.length > 4000) {
    return NextResponse.json(
      { ok: false, error: "Message must be between 10 and 4000 characters." },
      { status: 400 },
    );
  }

  const payload = { name: cleanName, email: cleanEmail, message: cleanMessage };

  // Best-effort: try DB + email in parallel; succeed if either path works, and
  // always log so a message is never silently lost during local dev.
  const [saved, emailed] = await Promise.all([
    saveContactSubmission({ ...payload, ip, userAgent: req.headers.get("user-agent") ?? undefined }),
    sendContactEmail(payload),
  ]);

  if (!saved && !emailed) {
    // Nothing configured (or both failed) → log to server so dev still "works".
    console.log("[contact] (no email/DB configured) new message:", payload);
  }

  return NextResponse.json({
    ok: true,
    delivered: { email: emailed, db: saved !== null },
    configured: { email: isMailerConfigured(), db: isDbConfigured() },
  });
}
