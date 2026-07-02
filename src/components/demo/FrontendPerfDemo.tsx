"use client";

/**
 * Frontend Performance visualizer (client-side, no backend).
 *
 * Illustrates the real optimization work: redesigning the Angular bundle
 * pipeline (lazy loading / code-split), removing redundant API calls, and
 * fixing N+1 fetches — cutting production load time by ~60%.
 *
 * Toggle "Apply optimizations" to watch the network waterfall shrink and the
 * load-time counter drop from the baseline to the optimized number.
 *
 * The numbers are an illustrative reconstruction of the 60% improvement, not a
 * captured trace.
 */

import { useEffect, useState } from "react";

type Bar = {
  label: string;
  // start/width as a % of the total baseline timeline
  start: number;
  width: number;
  kind: "bundle" | "api" | "redundant" | "render";
  removedByOpt?: boolean; // dropped entirely after optimization
  optStart?: number; // new start after optimization
  optWidth?: number; // new width after optimization
};

// Baseline waterfall (~5.0s): one big bundle, sequential + duplicated API calls.
const BARS: Bar[] = [
  { label: "main.js bundle (eager)", start: 0, width: 42, kind: "bundle", optStart: 0, optWidth: 15 },
  { label: "GET /user", start: 42, width: 12, kind: "api", optStart: 15, optWidth: 12 },
  { label: "GET /user (duplicate)", start: 54, width: 12, kind: "redundant", removedByOpt: true },
  { label: "GET /orders (N+1 #1)", start: 66, width: 8, kind: "redundant", removedByOpt: true },
  { label: "GET /orders (N+1 #2)", start: 74, width: 8, kind: "redundant", removedByOpt: true },
  { label: "GET /orders (batched)", start: 66, width: 14, kind: "api", optStart: 15, optWidth: 14 },
  { label: "First contentful render", start: 88, width: 12, kind: "render", optStart: 30, optWidth: 10 },
];

const BASELINE_MS = 5000;
const OPTIMIZED_MS = 2000; // 60% faster

const KIND_STYLES: Record<Bar["kind"], string> = {
  bundle: "bg-accent/70 border-accent",
  api: "bg-sky-400/60 border-sky-400",
  redundant: "bg-red-400/60 border-red-400",
  render: "bg-emerald-400/60 border-emerald-400",
};

export function FrontendPerfDemo() {
  const [optimized, setOptimized] = useState(false);
  const [displayMs, setDisplayMs] = useState(BASELINE_MS);

  // Animate the load-time counter toward the target whenever the toggle flips.
  useEffect(() => {
    const target = optimized ? OPTIMIZED_MS : BASELINE_MS;
    let raf = 0;
    const start = displayMs;
    const startTs = performance.now();
    const dur = 700;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTs) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayMs(Math.round(start + (target - start) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optimized]);

  // Visible bars: after optimization the redundant ones disappear.
  const visibleBars = BARS.filter((b) => !(optimized && b.removedByOpt));
  // Total timeline width in the optimized state is compressed to 60%.
  const scale = optimized ? 0.6 : 1;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2/50 px-5 py-3">
        <div className="flex items-center gap-2 font-mono text-xs text-muted">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
          <span className="ml-2">network · load waterfall</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className={`font-mono text-2xl font-semibold tabular-nums transition-colors ${
              optimized ? "text-emerald-300" : "text-foreground"
            }`}
          >
            {(displayMs / 1000).toFixed(1)}s
          </span>
          <span className="text-xs text-muted">load time</span>
        </div>
      </div>

      {/* Waterfall */}
      <div className="space-y-2.5 p-5 sm:p-8">
        {visibleBars.map((b) => {
          const start = optimized ? (b.optStart ?? b.start) : b.start;
          const width = optimized ? (b.optWidth ?? b.width) : b.width;
          return (
            <div key={b.label} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate text-right font-mono text-[11px] text-muted">
                {b.label}
              </span>
              <div className="relative h-5 flex-1 overflow-hidden rounded bg-background/60">
                <div
                  className={`absolute top-0 h-full rounded border-l-2 transition-all duration-700 ease-out ${KIND_STYLES[b.kind]}`}
                  style={{ left: `${start * scale}%`, width: `${Math.max(2, width * scale)}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Axis */}
        <div className="flex items-center gap-3 pt-1">
          <span className="w-40 shrink-0" />
          <div className="relative h-4 flex-1">
            <span className="absolute left-0 font-mono text-[10px] text-muted/60">0s</span>
            <span className="absolute right-0 font-mono text-[10px] text-muted/60">
              {optimized ? "~2s" : "~5s"}
            </span>
          </div>
        </div>
      </div>

      {/* Techniques */}
      <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4 sm:px-8">
        {[
          { on: true, label: "Lazy loading / code-split bundle" },
          { on: optimized, label: "Removed redundant API calls" },
          { on: optimized, label: "Fixed N+1 → batched fetch" },
          { on: optimized, label: "Optimized payload contracts" },
        ].map((t) => (
          <span
            key={t.label}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              t.on && optimized
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                : "border-border bg-surface-2 text-muted"
            }`}
          >
            {optimized ? "✓ " : "○ "}
            {t.label}
          </span>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-4 sm:px-8">
        <button
          onClick={() => setOptimized((o) => !o)}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-contrast shadow-lg shadow-accent/25 transition-transform hover:scale-[1.03]"
        >
          {optimized ? "Reset to baseline" : "Apply optimizations"}
        </button>
        <p className="text-sm text-muted">
          {optimized ? (
            <>
              <span className="font-semibold text-emerald-300">60% faster</span> — smaller initial
              bundle, no duplicate/N+1 requests.
            </>
          ) : (
            <>Baseline: eager bundle, duplicate <span className="text-red-300">redundant</span> &amp; N+1 calls.</>
          )}
        </p>
      </div>
    </div>
  );
}
