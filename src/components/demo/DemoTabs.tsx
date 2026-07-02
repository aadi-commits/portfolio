"use client";

import { useState } from "react";
import { RagAgentDemo } from "./RagAgentDemo";
import { PatientJourneyDemo } from "./PatientJourneyDemo";
import { DonorCrmDemo } from "./DonorCrmDemo";
import { FrontendPerfDemo } from "./FrontendPerfDemo";
import { InvoiceWhatsappDemo } from "./InvoiceWhatsappDemo";
import { InventorySyncDemo } from "./InventorySyncDemo";

const TABS = [
  {
    id: "rag-agent",
    label: "AI Support Agent (RAG)",
    intro:
      "My AI Customer Support Agent, end to end: upload a PDF → background pipeline (Multer → Postgres status → extract → chunk → embed → pgvector) → ask a question → semantic vector search → prompt-build → GPT answer → saved history. The retrieval actually runs in your browser, so it answers what you ask.",
    Component: RagAgentDemo,
  },
  {
    id: "911care",
    label: "911Care journey",
    intro:
      "The end-to-end patient flow I built and shipped to Google Play — symptom-led booking, a live doctor queue with RMO assignment, Zoom video consults, and push updates the whole way through. Toggle Emergency vs Appointment.",
    Component: PatientJourneyDemo,
  },
  {
    id: "perf",
    label: "60% faster load",
    intro:
      "How I cut production load times by ~60%: lazy-loading the Angular bundle, removing redundant API calls, and fixing N+1 fetches. Hit “Apply optimizations” to watch the waterfall shrink.",
    Component: FrontendPerfDemo,
  },
  {
    id: "donor-crm",
    label: "Donor CRM",
    intro:
      "My Donor Management System (Spring Boot, RBAC, approval workflows): a user applies to be a donor (individual or organization) → a Trust Admin approves → they donate money, physical goods, or both, mapped to one of the UN's 17 Sustainable Development Goals and a VPM Trust institution. Try the whole flow — it updates the CRM ledger live.",
    Component: DonorCrmDemo,
  },
  {
    id: "automation",
    label: "Invoice → WhatsApp",
    intro:
      "A post-purchase automation I built: on order completion, generate a PDF invoice and deliver it to the customer over WhatsApp. Run it to watch each stage fire.",
    Component: InvoiceWhatsappDemo,
  },
  {
    id: "redis-lock",
    label: "Redis lock",
    concept: true,
    intro:
      "A concept demo I built to explain the Redis distributed-lock pattern — how you stop two workers from corrupting the same record. Two systems drift on one SKU; “Sync” acquires a lock, transfers the authoritative value, and releases it. “Simulate race” shows a second worker getting rejected and retrying.",
    Component: InventorySyncDemo,
  },
] as const;

export function DemoTabs() {
  const [active, setActive] = useState(0);
  const Active = TABS[active].Component;

  return (
    <div>
      {/* Tabs */}
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Interactive demos">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === i}
            onClick={() => setActive(i)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              active === i
                ? "border-accent bg-accent text-accent-contrast shadow-lg shadow-accent/20"
                : "border-border bg-surface text-muted hover:border-accent/40 hover:text-accent-2"
            }`}
          >
            {t.label}
            {"concept" in t && t.concept && (
              <span
                className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                  active === i ? "bg-accent-contrast/20" : "bg-accent-2/15 text-accent-2"
                }`}
              >
                concept
              </span>
            )}
          </button>
        ))}
      </div>

      <p className="mb-5 max-w-3xl text-sm leading-relaxed text-muted">
        {"concept" in TABS[active] && TABS[active].concept && (
          <span className="mr-1.5 rounded border border-accent-2/30 bg-accent-2/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent-2">
            Concept demo
          </span>
        )}
        {TABS[active].intro}
      </p>

      {/* Active demo (remounts on switch so animations start clean) */}
      <div key={TABS[active].id}>
        <Active />
      </div>
    </div>
  );
}
