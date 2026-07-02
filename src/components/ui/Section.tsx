import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

// Per-section "open file" identity: filename + tab dot color.
const FILES: Record<string, { file: string; dot: string }> = {
  about: { file: "about.md", dot: "var(--fn)" },
  experience: { file: "experience.log", dot: "var(--num)" },
  projects: { file: "projects.json", dot: "var(--str)" },
  demo: { file: "demos.tsx", dot: "var(--kw)" },
  chat: { file: "assistant.ai", dot: "var(--cyan)" },
  contact: { file: "contact.sh", dot: "var(--cls)" },
};

export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className = "",
}: {
  id: string;
  eyebrow?: string;
  title?: string;
  intro?: string;
  children: ReactNode;
  className?: string;
}) {
  const meta = FILES[id] ?? { file: `${id}.tsx`, dot: "var(--accent)" };

  return (
    <section
      id={id}
      className={`mx-auto w-full max-w-4xl scroll-mt-28 px-5 py-16 sm:py-24 ${className}`}
    >
      {(eyebrow || title) && (
        <Reveal className="mb-10">
          {/* filename tab */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-t-md border border-b-0 border-border bg-surface-2 px-3 py-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-sm" style={{ background: meta.dot }} />
            {meta.file}
          </div>

          {eyebrow && (
            <p className="comment mb-2 text-sm">
              <span className="text-muted/60">// </span>
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              <span className="text-accent">{"> "}</span>
              {title}
            </h2>
          )}
          {intro && <p className="comment mt-3 max-w-2xl text-sm leading-relaxed">{intro}</p>}
        </Reveal>
      )}
      {children}
    </section>
  );
}
