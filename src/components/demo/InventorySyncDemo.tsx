"use client";

/**
 * Inventory Sync + Redis Lock visualizer — client-side only, no backend.
 *
 * CONCEPT DEMO: an explainer of the distributed-lock pattern (not a shipped
 * project). Tells the concurrency story in one glance:
 *   1. Catalog and ERP hold the SAME SKU with DIFFERENT stock (drift).
 *   2. On "Sync", a distributed lock is ACQUIRED on the record (badge appears).
 *   3. The authoritative value flows across the wire.
 *   4. The lock is RELEASED and both sides are consistent.
 *
 * The "Simulate race" button shows WHY the lock matters: a second writer that
 * tries to grab the lock while it's held gets rejected and retries — no
 * double-write, no corruption.
 */

import { useEffect, useRef, useState } from "react";
import { LockIcon } from "@/components/ui/icons";

type Phase =
  | "idle"
  | "acquiring"
  | "locked"
  | "transferring"
  | "releasing"
  | "done";

type LogEntry = { id: number; text: string; kind: "info" | "lock" | "ok" | "warn" };

const SKU = "SKU-4417";

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

export function InventorySyncDemo() {
  // Stock values on each side; they start "drifted".
  const [catalogStock, setCatalogStock] = useState(12);
  const [erpStock, setErpStock] = useState(47);
  const [phase, setPhase] = useState<Phase>("idle");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [contender, setContender] = useState<null | "waiting" | "rejected">(null);
  const [running, setRunning] = useState(false);

  const logId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const push = (text: string, kind: LogEntry["kind"] = "info") =>
    setLog((l) => [...l, { id: logId.current++, text, kind }].slice(-7));

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function runSync(withRace: boolean) {
    if (running) return;
    const ac = new AbortController();
    abortRef.current = ac;
    const { signal } = ac;

    setRunning(true);
    setLog([]);
    setContender(null);

    // Authoritative source is the ERP; catalog will be reconciled to it.
    const authoritative = erpStock;

    try {
      push(`Sync requested for ${SKU}`, "info");
      setPhase("acquiring");
      push(`SETNX lock:inventory:${SKU} → acquiring…`, "lock");
      await sleep(700, signal);

      setPhase("locked");
      push(`Lock ACQUIRED (ttl 30s) — record is now guarded`, "lock");
      await sleep(500, signal);

      if (withRace) {
        // A second worker tries to touch the same SKU mid-flight.
        setContender("waiting");
        push(`Worker #2 tries SETNX on same key…`, "warn");
        await sleep(650, signal);
        setContender("rejected");
        push(`Worker #2 REJECTED — key already held, backing off`, "warn");
        await sleep(450, signal);
      }

      setPhase("transferring");
      push(`Writing authoritative stock (${authoritative}) → catalog`, "info");
      await sleep(1100, signal);
      setCatalogStock(authoritative);
      push(`Idempotent write applied`, "ok");
      await sleep(300, signal);

      setPhase("releasing");
      push(`DEL lock:inventory:${SKU} → releasing`, "lock");
      await sleep(600, signal);

      setPhase("done");
      push(`Lock RELEASED — both sides consistent ✓`, "ok");
      if (withRace) {
        setContender("waiting");
        push(`Worker #2 retries, sees no change needed`, "info");
        await sleep(700, signal);
        setContender(null);
      }
      await sleep(900, signal);
      setPhase("idle");
    } catch {
      // aborted (component unmounted or reset) — leave state as-is
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    abortRef.current?.abort();
    setRunning(false);
    setPhase("idle");
    setContender(null);
    setLog([]);
    setCatalogStock(12);
    setErpStock(47);
  }

  const locked = phase === "locked" || phase === "transferring" || phase === "releasing";
  const consistent = catalogStock === erpStock;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2/50 px-5 py-3">
        <div className="flex items-center gap-2 font-mono text-xs text-muted">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
          <span className="ml-2">inventory-sync · distributed-lock</span>
        </div>
        <PhaseBadge phase={phase} consistent={consistent} />
      </div>

      {/* Stage */}
      <div className="relative grid grid-cols-1 gap-4 p-5 sm:p-8 md:grid-cols-[1fr_auto_1fr]">
        <SystemPanel
          title="Shopping Catalog"
          subtitle="Storefront"
          sku={SKU}
          stock={catalogStock}
          highlight={phase === "transferring"}
        />

        {/* Wire / lock in the middle */}
        <div className="relative flex min-w-[7rem] flex-col items-center justify-center">
          <Wire active={phase === "transferring"} />

          {/* Distributed-lock badge */}
          <div
            className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
              locked ? "scale-100 opacity-100" : "scale-50 opacity-0"
            }`}
          >
            <div
              className={`flex flex-col items-center gap-1 rounded-xl border border-accent/50 bg-background/90 px-3 py-2 text-accent-2 shadow-lg shadow-accent/20 ${
                phase === "locked" ? "pulse-ring" : ""
              }`}
            >
              <LockIcon className="h-5 w-5" />
              <span className="font-mono text-[10px] uppercase tracking-wider">
                Redis lock
              </span>
            </div>
          </div>

          {/* Rejected contender */}
          {contender && (
            <div
              className={`absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[10px] transition-all ${
                contender === "rejected"
                  ? "border-red-500/40 bg-red-500/10 text-red-300"
                  : "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
              }`}
            >
              {contender === "rejected" ? "Worker #2 ✗ rejected" : "Worker #2 ⧗ waiting"}
            </div>
          )}
        </div>

        <SystemPanel
          title="Inventory / ERP"
          subtitle="Source of truth"
          sku={SKU}
          stock={erpStock}
          authoritative
          highlight={phase === "acquiring" || phase === "locked"}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-4 sm:px-8">
        <button
          onClick={() => runSync(false)}
          disabled={running}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-contrast shadow-lg shadow-accent/25 transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sync now
        </button>
        <button
          onClick={() => runSync(true)}
          disabled={running}
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-accent/50 hover:text-accent-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Simulate race ⚡
        </button>
        <button
          onClick={reset}
          disabled={running}
          className="ml-auto text-sm text-muted transition-colors hover:text-foreground disabled:opacity-50"
        >
          Reset
        </button>
      </div>

      {/* Console log */}
      <div className="border-t border-border bg-background/60 px-5 py-4 font-mono text-xs sm:px-8">
        <div className="mb-2 uppercase tracking-widest text-muted/60">Console</div>
        <ul className="space-y-1">
          {log.length === 0 && (
            <li className="text-muted/50">
              Press <span className="text-accent-2">Sync now</span> — watch the lock
              acquire, data transfer, and release.
            </li>
          )}
          {log.map((entry) => (
            <li
              key={entry.id}
              className={
                entry.kind === "lock"
                  ? "text-accent-2"
                  : entry.kind === "ok"
                    ? "text-green-300"
                    : entry.kind === "warn"
                      ? "text-yellow-300"
                      : "text-foreground/70"
              }
            >
              <span className="text-muted/40">$ </span>
              {entry.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------- Sub-components ------------------------------ */

function SystemPanel({
  title,
  subtitle,
  sku,
  stock,
  authoritative = false,
  highlight = false,
}: {
  title: string;
  subtitle: string;
  sku: string;
  stock: number;
  authoritative?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-surface-2/40 p-5 transition-all duration-300 ${
        highlight ? "border-accent/50 shadow-lg shadow-accent/10" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
        {authoritative && (
          <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent-2">
            authoritative
          </span>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-border bg-background/60 p-4">
        <div className="flex items-center justify-between font-mono text-xs text-muted">
          <span>{sku}</span>
          <span>stock</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tabular-nums transition-colors">
            {stock}
          </span>
          <span className="text-sm text-muted">units</span>
        </div>
      </div>
    </div>
  );
}

function Wire({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 120 24"
      className="h-6 w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <line
        x1="4"
        y1="12"
        x2="116"
        y2="12"
        stroke="var(--border)"
        strokeWidth="2"
      />
      <line
        x1="4"
        y1="12"
        x2="116"
        y2="12"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeDasharray="6 10"
        strokeLinecap="round"
        style={{
          animation: active ? "flow-dash 0.6s linear infinite" : "none",
          opacity: active ? 1 : 0.25,
        }}
      />
    </svg>
  );
}

function PhaseBadge({ phase, consistent }: { phase: Phase; consistent: boolean }) {
  const map: Record<Phase, { label: string; cls: string }> = {
    idle: consistent
      ? { label: "Consistent", cls: "text-green-300 border-green-500/30 bg-green-500/10" }
      : { label: "Drifted", cls: "text-yellow-300 border-yellow-500/30 bg-yellow-500/10" },
    acquiring: { label: "Acquiring lock…", cls: "text-accent-2 border-accent/30 bg-accent/10" },
    locked: { label: "Locked", cls: "text-accent-2 border-accent/30 bg-accent/10" },
    transferring: { label: "Transferring…", cls: "text-accent-2 border-accent/30 bg-accent/10" },
    releasing: { label: "Releasing…", cls: "text-accent-2 border-accent/30 bg-accent/10" },
    done: { label: "Consistent ✓", cls: "text-green-300 border-green-500/30 bg-green-500/10" },
  };
  const { label, cls } = map[phase];
  return (
    <span className={`rounded-full border px-3 py-1 font-mono text-xs ${cls}`}>
      {label}
    </span>
  );
}
