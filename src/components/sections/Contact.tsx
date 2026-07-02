"use client";

import { useState } from "react";
import { identity } from "@content/portfolio";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { SendIcon, MailIcon } from "@/components/ui/icons";

type Status = "idle" | "sending" | "success" | "error";

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Something went wrong.");
      }
      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <Section
      id="contact"
      eyebrow="Contact"
      title="Let's talk"
      intro="Hiring, a project, or just a question about the demo — drop me a line."
    >
      <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
        <Reveal className="space-y-4 text-muted">
          <p>
            The fastest way to reach me is the form — it lands in my inbox. Prefer
            email or socials? All linked at the top.
          </p>
          {identity.links.email && (
            <a
              href={`mailto:${identity.links.email}`}
              className="inline-flex items-center gap-2 text-accent-2 hover:underline"
            >
              <MailIcon className="h-4 w-4" />
              {identity.links.email}
            </a>
          )}
          <p className="text-sm text-muted/70">{identity.location}</p>
        </Reveal>

        <Reveal delay={100}>
          {status === "success" ? (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-8 text-center">
              <p className="text-lg font-semibold text-green-300">
                Thanks — message sent!
              </p>
              <p className="mt-2 text-sm text-muted">
                I&apos;ll get back to you soon.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-4 text-sm text-accent-2 hover:underline"
              >
                Send another
              </button>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="space-y-4 rounded-2xl border border-border bg-surface p-6 sm:p-8"
            >
              {/* Honeypot — hidden from humans, catches bots */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="hidden"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" htmlFor="name">
                  <input
                    id="name"
                    name="name"
                    required
                    minLength={2}
                    placeholder="Jane Recruiter"
                    className="input"
                  />
                </Field>
                <Field label="Email" htmlFor="email">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="jane@company.com"
                    className="input"
                  />
                </Field>
              </div>

              <Field label="Message" htmlFor="message">
                <textarea
                  id="message"
                  name="message"
                  required
                  minLength={10}
                  rows={5}
                  placeholder="Tell me about the role or project…"
                  className="input resize-y"
                />
              </Field>

              {status === "error" && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 font-medium text-accent-contrast shadow-lg shadow-accent/25 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <SendIcon className="h-4 w-4" />
                {status === "sending" ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </Section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block font-mono text-xs uppercase tracking-[0.16em] text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
