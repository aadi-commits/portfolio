"use client";

import { useEffect, useState } from "react";
import { identity } from "@content/portfolio";

/** VS Code-style bottom status bar. */
export function StatusBar() {
  const [pct, setPct] = useState(0);

  // Scroll progress → "Ln" style indicator.
  // Coalesced to one update per animation frame, and only re-renders when the
  // rounded percentage actually changes — so scrolling stays smooth.
  useEffect(() => {
    let ticking = false;
    let last = -1;
    const update = () => {
      ticking = false;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? Math.round((h.scrollTop / max) * 100) : 0;
      if (p !== last) {
        last = p;
        setPct(p);
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex h-7 items-center gap-4 border-t border-border bg-surface-2 px-3 font-mono text-[11px] text-muted">
      {/* branch */}
      <span className="flex items-center gap-1.5 text-accent-2">
        <GitBranch /> main
      </span>
      <span className="flex items-center gap-1">
        <span className="text-str">✓ 0</span>
        <span className="text-err">✗ 0</span>
      </span>

      {identity.openToWork && (
        <span className="hidden items-center gap-1.5 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          open to work
        </span>
      )}

      <span className="ml-auto hidden sm:inline">Ln {pct}, Col 1</span>
      <span className="hidden sm:inline">UTF-8</span>
      <span className="text-fn">TypeScript React</span>
      <span className="hidden sm:inline">{pct}%</span>
    </div>
  );
}

function GitBranch() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="8" r="2.5" />
      <path d="M6 8.5v7M18 10.5c0 3-3 3.5-6 3.5" />
    </svg>
  );
}
