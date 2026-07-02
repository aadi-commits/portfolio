"use client";

/**
 * Donor CRM visualizer (client-side, no backend) — models Adit's Donor
 * Management System (Spring Boot, RBAC, multi-stage approval workflow).
 *
 * Flow:
 *   1. A user APPLIES to become a donor (category: Individual / Organization).
 *   2. A Trust Admin (RBAC) APPROVES or REJECTS the application.
 *   3. Once approved, the donor DONATES — money, physical goods, or both —
 *      mapped to one of the UN's 17 Sustainable Development Goals (SDGs) and a
 *      VPM Trust institution.
 *   4. Everything rolls up into a CRM ledger + impact summary.
 *
 * Data here is illustrative sample data.
 */

import { useRef, useState } from "react";

/* ------------------------------- SDGs (the "17") ------------------------------ */
// The 17 UN Sustainable Development Goals + official colors.
const SDGS: { n: number; name: string; color: string }[] = [
  { n: 1, name: "No Poverty", color: "#E5243B" },
  { n: 2, name: "Zero Hunger", color: "#DDA63A" },
  { n: 3, name: "Good Health & Well-being", color: "#4C9F38" },
  { n: 4, name: "Quality Education", color: "#C5192D" },
  { n: 5, name: "Gender Equality", color: "#FF3A21" },
  { n: 6, name: "Clean Water & Sanitation", color: "#26BDE2" },
  { n: 7, name: "Affordable & Clean Energy", color: "#FCC30B" },
  { n: 8, name: "Decent Work & Growth", color: "#A21942" },
  { n: 9, name: "Industry & Infrastructure", color: "#FD6925" },
  { n: 10, name: "Reduced Inequalities", color: "#DD1367" },
  { n: 11, name: "Sustainable Cities", color: "#FD9D24" },
  { n: 12, name: "Responsible Consumption", color: "#BF8B2E" },
  { n: 13, name: "Climate Action", color: "#3F7E44" },
  { n: 14, name: "Life Below Water", color: "#0A97D9" },
  { n: 15, name: "Life on Land", color: "#56C02B" },
  { n: 16, name: "Peace & Justice", color: "#00689D" },
  { n: 17, name: "Partnerships", color: "#19486A" },
];
const sdg = (n: number) => SDGS.find((s) => s.n === n)!;

const INSTITUTIONS = [
  "B. N. Bandodkar College of Science",
  "Dr. V. N. Bedekar Institute of Management",
  "K. G. Joshi College of Arts",
  "VPM English Medium School",
  "VPM Polytechnic",
];

const ITEM_CATALOG = ["Benches", "Projector", "Blackboard", "Computers", "Books", "Desks"];

type Category = "Individual" | "Organization";
type Status = "PENDING" | "APPROVED" | "REJECTED";
type DType = "Money" | "Physical" | "Both";
type Donor = { id: string; name: string; category: Category; status: Status };
type Item = { name: string; qty: number };
type Donation = {
  id: string;
  donorId: string;
  donorName: string;
  type: DType;
  amount: number;
  items: Item[];
  sdg: number;
  institution: string;
};

const rupee = (n: number) => "₹" + n.toLocaleString("en-IN");

export function DonorCrmDemo() {
  const idRef = useRef(100);
  const nextId = (p: string) => `${p}-${idRef.current++}`;

  const [donors, setDonors] = useState<Donor[]>([
    { id: "d1", name: "Rotary Club of Thane", category: "Organization", status: "APPROVED" },
    { id: "d2", name: "Anjali Deshpande", category: "Individual", status: "APPROVED" },
    { id: "d3", name: "Sunil Kamath", category: "Individual", status: "PENDING" },
  ]);
  const [donations, setDonations] = useState<Donation[]>([
    {
      id: "g1",
      donorId: "d1",
      donorName: "Rotary Club of Thane",
      type: "Both",
      amount: 200000,
      items: [{ name: "Projector", qty: 2 }],
      sdg: 4,
      institution: "B. N. Bandodkar College of Science",
    },
    {
      id: "g2",
      donorId: "d2",
      donorName: "Anjali Deshpande",
      type: "Money",
      amount: 25000,
      items: [],
      sdg: 5,
      institution: "VPM English Medium School",
    },
  ]);

  // Apply form
  const [applyName, setApplyName] = useState("");
  const [applyCat, setApplyCat] = useState<Category>("Individual");

  // Donate form
  const approved = donors.filter((d) => d.status === "APPROVED");
  const [donorId, setDonorId] = useState("d1");
  const [dtype, setDtype] = useState<DType>("Money");
  const [amount, setAmount] = useState(10000);
  const [items, setItems] = useState<Record<string, number>>({});
  const [gsdg, setGsdg] = useState(4);
  const [institution, setInstitution] = useState(INSTITUTIONS[0]);
  const [flash, setFlash] = useState("");

  function apply() {
    const name = applyName.trim();
    if (name.length < 2) return;
    setDonors((d) => [...d, { id: nextId("d"), name, category: applyCat, status: "PENDING" }]);
    setApplyName("");
    setFlash(`Application submitted — ${name} is now PENDING admin approval.`);
    setTimeout(() => setFlash(""), 2600);
  }

  function review(id: string, ok: boolean) {
    setDonors((d) => d.map((x) => (x.id === id ? { ...x, status: ok ? "APPROVED" : "REJECTED" } : x)));
  }

  function toggleItem(name: string) {
    setItems((it) => {
      const next = { ...it };
      if (next[name]) delete next[name];
      else next[name] = 1;
      return next;
    });
  }
  function setItemQty(name: string, qty: number) {
    setItems((it) => ({ ...it, [name]: Math.max(1, qty) }));
  }

  const wantsMoney = dtype === "Money" || dtype === "Both";
  const wantsItems = dtype === "Physical" || dtype === "Both";

  function donate() {
    const donor = donors.find((x) => x.id === donorId && x.status === "APPROVED");
    if (!donor) return;
    const chosen: Item[] = Object.entries(items).map(([name, qty]) => ({ name, qty }));
    if (wantsMoney && amount <= 0) return;
    if (wantsItems && chosen.length === 0) return;

    setDonations((g) => [
      ...g,
      {
        id: nextId("g"),
        donorId: donor.id,
        donorName: donor.name,
        type: dtype,
        amount: wantsMoney ? amount : 0,
        items: wantsItems ? chosen : [],
        sdg: gsdg,
        institution,
      },
    ]);
    setItems({});
    setFlash(`Donation recorded for ${donor.name} → SDG ${gsdg}.`);
    setTimeout(() => setFlash(""), 2600);
  }

  // Impact rollups
  const totalMoney = donations.reduce((s, d) => s + d.amount, 0);
  const totalItems = donations.reduce((s, d) => s + d.items.reduce((a, i) => a + i.qty, 0), 0);
  const bySdg = donations.reduce<Record<number, number>>((m, d) => {
    m[d.sdg] = (m[d.sdg] ?? 0) + 1;
    return m;
  }, {});
  const pending = donors.filter((d) => d.status === "PENDING");

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border bg-surface-2/50 px-5 py-3 font-mono text-xs text-muted">
        <span>donor-crm · VPM Trust · RBAC + approval workflow</span>
        <span className="text-str">17 SDGs</span>
      </div>

      <div className="grid gap-0 lg:grid-cols-2">
        {/* ---------- LEFT: workflow ---------- */}
        <div className="space-y-5 border-b border-border p-5 lg:border-b-0 lg:border-r">
          {/* 1. Apply */}
          <div>
            <Head n="1" role="applicant" title="Apply to become a donor" />
            <div className="mt-2 space-y-2">
              <input
                value={applyName}
                onChange={(e) => setApplyName(e.target.value)}
                placeholder="Full name / organization"
                className="input"
              />
              <div className="flex gap-2">
                {(["Individual", "Organization"] as Category[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setApplyCat(c)}
                    className={`flex-1 rounded border px-2 py-1.5 text-xs transition-colors ${
                      applyCat === c
                        ? "border-accent bg-accent/10 text-accent-2"
                        : "border-border bg-surface-2 text-muted hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <button
                onClick={apply}
                disabled={applyName.trim().length < 2}
                className="w-full rounded bg-accent px-3 py-2 text-sm font-semibold text-accent-contrast transition-transform hover:scale-[1.02] disabled:opacity-50"
              >
                Submit application →
              </button>
            </div>
          </div>

          {/* 2. Approval queue (RBAC) */}
          <div>
            <Head n="2" role="TRUST_ADMIN" title="Approval queue" />
            {pending.length === 0 ? (
              <p className="mt-2 rounded border border-dashed border-border bg-surface-2/30 p-2.5 text-center text-xs text-muted">
                No pending applications.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {pending.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 rounded border border-border bg-surface-2/40 p-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">
                      {d.name} <CategoryTag c={d.category} />
                    </span>
                    <button
                      onClick={() => review(d.id, true)}
                      className="rounded bg-str/15 px-2 py-1 text-xs text-str transition-colors hover:bg-str/25"
                    >
                      ✓ approve
                    </button>
                    <button
                      onClick={() => review(d.id, false)}
                      className="rounded bg-err/10 px-2 py-1 text-xs text-err transition-colors hover:bg-err/20"
                    >
                      ✗ reject
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 3. Donate */}
          <div>
            <Head n="3" role="DONOR" title="Make a donation" />
            <div className="mt-2 space-y-2.5">
              <label className="block">
                <span className="mb-1 block text-[11px] text-muted">Approved donor</span>
                <select value={donorId} onChange={(e) => setDonorId(e.target.value)} className="input">
                  {approved.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.category})
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2">
                {(["Money", "Physical", "Both"] as DType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setDtype(t)}
                    className={`flex-1 rounded border px-2 py-1.5 text-xs transition-colors ${
                      dtype === t
                        ? "border-accent bg-accent/10 text-accent-2"
                        : "border-border bg-surface-2 text-muted hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {wantsMoney && (
                <label className="block">
                  <span className="mb-1 block text-[11px] text-muted">Amount (₹)</span>
                  <input
                    type="number"
                    min={0}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    className="input"
                  />
                </label>
              )}

              {wantsItems && (
                <div>
                  <span className="mb-1 block text-[11px] text-muted">Physical goods</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ITEM_CATALOG.map((it) => {
                      const on = items[it] != null;
                      return (
                        <span key={it} className="inline-flex items-center">
                          <button
                            onClick={() => toggleItem(it)}
                            className={`rounded border px-2 py-1 text-xs transition-colors ${
                              on
                                ? "border-accent bg-accent/10 text-accent-2"
                                : "border-border bg-surface-2 text-muted hover:text-foreground"
                            }`}
                          >
                            {it}
                          </button>
                          {on && (
                            <input
                              type="number"
                              min={1}
                              value={items[it]}
                              onChange={(e) => setItemQty(it, Number(e.target.value) || 1)}
                              className="ml-1 w-12 rounded border border-border bg-surface-2 px-1.5 py-1 text-xs"
                            />
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] text-muted">SDG (of 17)</span>
                  <select value={gsdg} onChange={(e) => setGsdg(Number(e.target.value))} className="input">
                    {SDGS.map((s) => (
                      <option key={s.n} value={s.n}>
                        SDG {s.n} · {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] text-muted">Institution</span>
                  <select value={institution} onChange={(e) => setInstitution(e.target.value)} className="input">
                    {INSTITUTIONS.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                onClick={donate}
                className="w-full rounded bg-accent px-3 py-2 text-sm font-semibold text-accent-contrast transition-transform hover:scale-[1.02]"
              >
                Record donation →
              </button>
            </div>
          </div>

          {flash && (
            <p className="rounded border border-str/30 bg-str/10 px-3 py-2 text-xs text-str">{flash}</p>
          )}
        </div>

        {/* ---------- RIGHT: CRM ledger + impact ---------- */}
        <div className="space-y-5 p-5">
          {/* Impact */}
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">Impact</p>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="raised" value={rupee(totalMoney)} tone="text-str" />
              <Stat label="goods" value={`${totalItems}`} tone="text-fn" />
              <Stat label="donors" value={`${donors.filter((d) => d.status === "APPROVED").length}`} tone="text-kw" />
            </div>
            {/* SDG breakdown */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(bySdg)
                .sort((a, b) => b[1] - a[1])
                .map(([n, count]) => (
                  <span key={n} className="inline-flex items-center gap-1 rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px]">
                    <span className="h-2 w-2 rounded-sm" style={{ background: sdg(Number(n)).color }} />
                    SDG {n}
                    <span className="text-muted">×{count}</span>
                  </span>
                ))}
            </div>
          </div>

          {/* Donors */}
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">
              Donors ({donors.length})
            </p>
            <ul className="space-y-1">
              {donors.map((d) => (
                <li key={d.id} className="flex items-center gap-2 rounded border border-border bg-surface-2/40 px-2.5 py-1.5 text-xs">
                  <span className="min-w-0 flex-1 truncate">{d.name}</span>
                  <CategoryTag c={d.category} />
                  <StatusTag s={d.status} />
                </li>
              ))}
            </ul>
          </div>

          {/* Donations ledger */}
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">
              Donation ledger ({donations.length})
            </p>
            <ul className="space-y-1.5">
              {donations
                .slice()
                .reverse()
                .map((g) => (
                  <li key={g.id} className="rounded border border-border bg-surface-2/40 p-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate font-medium">{g.donorName}</span>
                      <span className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted">{g.type}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
                      {g.amount > 0 && <span className="text-str">{rupee(g.amount)}</span>}
                      {g.items.map((i) => (
                        <span key={i.name} className="text-fn">
                          {i.name}×{i.qty}
                        </span>
                      ))}
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-sm" style={{ background: sdg(g.sdg).color }} />
                        SDG {g.sdg}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-muted/70">→ {g.institution}</p>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Small pieces ------------------------------- */

function Head({ n, role, title }: { n: string; role: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-5 w-5 place-items-center rounded bg-accent/15 font-mono text-[11px] text-accent-2">
        {n}
      </span>
      <span className="text-sm font-semibold">{title}</span>
      <span className="ml-auto rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] text-muted">
        role: {role}
      </span>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded border border-border bg-surface-2/40 p-2 text-center">
      <p className={`font-mono text-base font-semibold ${tone}`}>{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  );
}

function CategoryTag({ c }: { c: Category }) {
  return (
    <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] ${c === "Individual" ? "bg-fn/15 text-fn" : "bg-kw/15 text-kw"}`}>
      {c === "Individual" ? "IND" : "ORG"}
    </span>
  );
}

function StatusTag({ s }: { s: Status }) {
  const map: Record<Status, string> = {
    PENDING: "bg-num/15 text-num",
    APPROVED: "bg-str/15 text-str",
    REJECTED: "bg-err/15 text-err",
  };
  return <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] ${map[s]}`}>{s}</span>;
}
