"use client";

import { useEffect, useState } from "react";
import { identity } from "@content/portfolio";

// Section anchors presented as open editor tabs (filenames).
const TABS = [
  { href: "#about", label: "about.md", dot: "var(--fn)" },
  { href: "#experience", label: "experience.log", dot: "var(--num)" },
  { href: "#projects", label: "projects.json", dot: "var(--str)" },
  { href: "#demo", label: "demos.tsx", dot: "var(--kw)" },
  { href: "#contact", label: "contact.sh", dot: "var(--cls)" },
];

export function Nav() {
  const [active, setActive] = useState<string>("#about");

  // Highlight the tab for the section currently in view.
  useEffect(() => {
    const ids = TABS.map((t) => t.href.slice(1));
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) setActive(`#${vis.target.id}`);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5] },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-surface/95">
      {/* Title bar row */}
      <div className="flex h-10 items-center gap-3 border-b border-border px-4">
        <span className="dots">
          <span className="dot" style={{ background: "#ff5f56" }} />
          <span className="dot" style={{ background: "#ffbd2e" }} />
          <span className="dot" style={{ background: "#27c93f" }} />
        </span>
        <span className="text-xs text-muted">
          <span className="text-foreground/80">{identity.name.toLowerCase().replace(/\s+/g, "-")}</span>
          @portfolio: ~/{active.slice(1)}
        </span>
        <button
          onClick={() => window.dispatchEvent(new Event("portfolio:open-chat"))}
          className="ml-auto inline-flex items-center gap-1.5 rounded border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs text-accent-2 transition-colors hover:bg-accent/20"
        >
          <span className="tok-fn">./</span>ask-portfolio
        </button>
      </div>

      {/* Tab strip */}
      <nav className="flex h-9 items-stretch overflow-x-auto text-xs">
        <a
          href="#top"
          className="flex shrink-0 items-center border-r border-border px-3 text-muted transition-colors hover:text-foreground"
        >
          ~/
        </a>
        {TABS.map((t) => {
          const on = active === t.href;
          return (
            <a
              key={t.href}
              href={t.href}
              className={`flex shrink-0 items-center gap-2 border-r border-border px-3.5 transition-colors ${
                on ? "bg-background text-foreground" : "text-muted hover:text-foreground/90"
              }`}
              style={on ? { borderTop: "1px solid var(--accent)" } : undefined}
            >
              <span className="h-2 w-2 rounded-sm" style={{ background: t.dot }} />
              {t.label}
            </a>
          );
        })}
      </nav>
    </header>
  );
}
