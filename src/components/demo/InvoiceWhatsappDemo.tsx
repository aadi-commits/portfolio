"use client";

/**
 * PDF Invoice → WhatsApp automation visualizer (client-side, no backend).
 *
 * Mirrors the real backend service: on a completed purchase, generate a PDF
 * invoice and deliver it to the customer over WhatsApp as a post-purchase
 * notification. Hit "Run automation" to watch each stage fire in sequence.
 */

import { useEffect, useMemo, useState } from "react";

type StageState = "idle" | "active" | "done";

const STAGES = [
  { key: "order", title: "Order placed", detail: "Purchase completed → event fires" },
  { key: "generate", title: "Generate PDF invoice", detail: "Render template → PDF buffer" },
  { key: "store", title: "Attach & queue", detail: "Prepare WhatsApp message + media" },
  { key: "send", title: "Send via WhatsApp", detail: "Deliver invoice to the customer" },
] as const;

const STEP_MS = 1100;

export function InvoiceWhatsappDemo() {
  const [step, setStep] = useState(-1); // -1 = not started; index = active stage
  const [running, setRunning] = useState(false);

  const delivered = step >= STAGES.length;

  useEffect(() => {
    if (!running) return;
    if (step >= STAGES.length) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [running, step]);

  function run() {
    setStep(0);
    setRunning(true);
  }

  const stateOf = (i: number): StageState =>
    step > i ? "done" : step === i ? "active" : "idle";

  const showInvoice = step >= 1;
  const invoiceBuilt = step >= 2;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border bg-surface-2/50 px-5 py-3 font-mono text-xs text-muted">
        <span>automation · post-purchase notification</span>
        <span className={delivered ? "text-emerald-300" : ""}>
          {delivered ? "delivered ✓" : running ? "running…" : "idle"}
        </span>
      </div>

      <div className="grid gap-6 p-5 sm:p-8 md:grid-cols-[1fr_auto]">
        {/* Pipeline */}
        <ol className="space-y-3">
          {STAGES.map((s, i) => {
            const st = stateOf(i);
            return (
              <li
                key={s.key}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-all duration-300 ${
                  st === "active"
                    ? "border-accent/50 bg-accent/[0.07] shadow-lg shadow-accent/10"
                    : st === "done"
                      ? "border-emerald-400/30 bg-emerald-400/[0.05]"
                      : "border-border bg-surface-2/40 opacity-60"
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-xs ${
                    st === "done"
                      ? "bg-emerald-400/20 text-emerald-300"
                      : st === "active"
                        ? "bg-accent/20 text-accent-2 pulse-ring"
                        : "bg-surface-2 text-muted"
                  }`}
                >
                  {st === "done" ? "✓" : i + 1}
                </span>
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-sm text-muted">{s.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Artifacts: invoice doc → whatsapp bubble */}
        <div className="mx-auto flex w-[240px] shrink-0 flex-col items-center gap-4">
          {/* Invoice doc */}
          <div
            className={`w-40 rounded-lg border bg-background p-3 transition-all duration-500 ${
              showInvoice
                ? "border-accent/40 opacity-100"
                : "border-dashed border-border opacity-30"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-accent-2">
                Invoice
              </span>
              <span className="text-[10px] text-muted">PDF</span>
            </div>
            <div className="space-y-1">
              {[80, 60, 90, 45].map((w, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded bg-border transition-all duration-500"
                  style={{ width: invoiceBuilt ? `${w}%` : "20%" }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-2 font-mono text-[10px]">
              <span className="text-muted">Total</span>
              <span className={invoiceBuilt ? "text-foreground" : "text-muted/40"}>₹ 1,499</span>
            </div>
          </div>

          {/* flow arrow */}
          <svg viewBox="0 0 24 24" className={`h-5 w-5 transition-colors ${delivered || step >= 3 ? "text-emerald-400" : "text-muted/40"}`} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4v16M6 14l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          {/* WhatsApp bubble */}
          <div className="w-full">
            <div
              className={`ml-auto max-w-[92%] rounded-2xl rounded-br-sm border p-2.5 transition-all duration-500 ${
                delivered
                  ? "reveal is-visible border-emerald-500/40 bg-emerald-500/10"
                  : "border-border bg-surface-2/40 opacity-30"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/30 text-[8px] text-emerald-300">
                  ✓
                </span>
                <span className="text-[11px] font-semibold text-emerald-200">WhatsApp</span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-foreground/90">
                Thanks for your order! Your invoice is attached. 📄
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-background/60 p-1.5">
                <span className="text-xs">📎</span>
                <span className="font-mono text-[10px] text-muted">invoice_1499.pdf</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-4 sm:px-8">
        <button
          onClick={run}
          disabled={running}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-contrast shadow-lg shadow-accent/25 transition-transform hover:scale-[1.03] disabled:opacity-50"
        >
          {delivered ? "Run again" : "Run automation"}
        </button>
        <p className="text-sm text-muted">
          Order → PDF invoice → WhatsApp, fully automated on purchase completion.
        </p>
      </div>
    </div>
  );
}
