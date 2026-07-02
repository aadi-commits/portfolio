"use client";

/**
 * AI Customer Support Agent — full-flow RAG visualizer (client-side, no backend).
 *
 * Mirrors Adit's real architecture:
 *   Auth (JWT) → Upload PDF → Multer/disk → Postgres metadata (PENDING) →
 *   background job (PROCESSING) → extract → clean → chunk → embed →
 *   store in pgvector → COMPLETED.
 *   Then: question → embed → semantic vector search → top-k chunks →
 *   build prompt → OpenAI GPT → answer → save conversation history.
 *
 * The retrieval (chunking + semantic search) genuinely runs in the browser on
 * the ingested docs, so answers respond to whatever you ask. The embeddings are
 * a lightweight lexical approximation (not transformer vectors) and the final
 * answer is assembled from the retrieved context — in the real app that context
 * is sent to OpenAI GPT to write the reply.
 */

import { useRef, useState } from "react";

/* ------------------------------- Retrieval core ------------------------------ */

const STOPWORDS = new Set(
  "a an the is are was were be been being of to in on for and or if with without as at by from into your you i we our do does can how what when where which that this it its".split(
    " ",
  ),
);

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter(
    (t) => t.length > 1 && !STOPWORDS.has(t),
  );
}

function chunkText(text: string): string[] {
  const sentences = text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) || [text];
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    const t = s.trim();
    if (!t) continue;
    if (cur && (cur + " " + t).length > 170) {
      chunks.push(cur.trim());
      cur = t;
    } else {
      cur = cur ? cur + " " + t : t;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

function termFreq(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  for (const [k, v] of a) {
    const w = b.get(k);
    if (w) dot += v * w;
  }
  let na = 0;
  for (const v of a.values()) na += v * v;
  let nb = 0;
  for (const v of b.values()) nb += v * v;
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}

// Small hashed vector purely for the "embedding" visual.
function vizVec(tokens: string[], dims = 12): number[] {
  const b = new Array(dims).fill(0);
  for (const t of tokens) {
    let h = 0;
    for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
    b[h % dims] += 1;
  }
  const max = Math.max(1, ...b);
  return b.map((v) => v / max);
}

type Chunk = {
  id: string;
  docName: string;
  text: string;
  tf: Map<string, number>;
  vec: number[];
};

type DocStatus = "pending" | "processing" | "completed";
type Doc = { id: string; name: string; status: DocStatus; chunkCount: number };

/* --------------------------------- Sample data -------------------------------- */

const SAMPLE_DOCS: Record<string, { name: string; text: string }> = {
  support: {
    name: "support-policy.pdf",
    text: `Refunds are processed within 5 to 7 business days to the original payment method.
You can reschedule an appointment up to 2 hours before the scheduled slot at no charge.
An invoice is generated and sent automatically over WhatsApp after every successful purchase.
Emergency consultations connect you to the next available doctor, usually within 10 minutes.
Appointment bookings send a reminder notification 15 minutes before the slot begins.
To cancel a subscription, open Settings, go to Billing, and choose Cancel Subscription.
Our support team is available Monday to Saturday, from 9 AM to 8 PM IST.
Patient consultation summaries, including prescribed medicines and lab tests, are saved to the Post-Order Summary page.`,
  },
  shipping: {
    name: "shipping-faq.pdf",
    text: `Standard delivery takes 3 to 5 business days within India.
Express delivery is available for an extra fee and arrives in 1 to 2 business days.
Orders above 999 rupees qualify for free standard shipping.
You can track your order from the Orders page using the tracking link sent to you.
International shipping is currently not supported.`,
  },
};

/* ---------------------------------- Component --------------------------------- */

const INGEST_STEPS = [
  "Upload PDF",
  "Multer → save to disk",
  "Metadata → PostgreSQL (PENDING)",
  "Background job (PROCESSING)",
  "Extract text",
  "Clean text",
  "Split into chunks",
  "Generate embeddings",
  "Store in pgvector",
  "COMPLETED",
];

const QUERY_STEPS = [
  "Embed question",
  "Semantic vector search",
  "Retrieve top-k chunks",
  "Build prompt (question + chunks)",
  "OpenAI GPT",
  "Save conversation history",
];

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

type Retrieved = { chunk: Chunk; score: number };

export function RagAgentDemo() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [ingestStep, setIngestStep] = useState(-1);
  const [ingestingName, setIngestingName] = useState<string>("");

  const [query, setQuery] = useState("");
  const [queryStep, setQueryStep] = useState(-1);
  const [retrieved, setRetrieved] = useState<Retrieved[]>([]);
  const [answer, setAnswer] = useState<string>("");
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);

  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const idRef = useRef(0);

  const ready = docs.some((d) => d.status === "completed") && chunks.length > 0;

  async function ingest(name: string, text: string) {
    if (busy) return;
    const ac = new AbortController();
    abortRef.current = ac;
    const { signal } = ac;
    setBusy(true);
    setIngestingName(name);

    const docId = `doc-${idRef.current++}`;
    const built = chunkText(text).map((t, i) => {
      const toks = tokenize(t);
      return {
        id: `${docId}-c${i}`,
        docName: name,
        text: t,
        tf: termFreq(toks),
        vec: vizVec(toks),
      } satisfies Chunk;
    });

    setDocs((d) => [...d, { id: docId, name, status: "pending", chunkCount: 0 }]);

    try {
      for (let i = 0; i < INGEST_STEPS.length; i++) {
        setIngestStep(i);
        // flip status at the right stages
        if (i === 3) setDocs((d) => d.map((x) => (x.id === docId ? { ...x, status: "processing" } : x)));
        if (i === 8) {
          // store in pgvector → make chunks searchable
          setChunks((c) => [...c, ...built]);
          setDocs((d) => d.map((x) => (x.id === docId ? { ...x, chunkCount: built.length } : x)));
        }
        if (i === 9) setDocs((d) => d.map((x) => (x.id === docId ? { ...x, status: "completed" } : x)));
        await sleep(i === 3 || i === 7 ? 650 : 450, signal);
      }
    } catch {
      /* aborted */
    } finally {
      setIngestStep(-1);
      setIngestingName("");
      setBusy(false);
    }
  }

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy || !ready) return;
    const ac = new AbortController();
    abortRef.current = ac;
    const { signal } = ac;
    setBusy(true);
    setAnswer("");
    setRetrieved([]);

    try {
      // 0: embed question
      setQueryStep(0);
      await sleep(600, signal);

      // 1-2: semantic search → top-k (REAL retrieval)
      setQueryStep(1);
      const qtf = termFreq(tokenize(question));
      const scored = chunks
        .map((chunk) => ({ chunk, score: cosine(qtf, chunk.tf) }))
        .sort((a, b) => b.score - a.score);
      await sleep(600, signal);

      setQueryStep(2);
      const top = scored.filter((s) => s.score > 0).slice(0, 3);
      const results = top.length ? top : scored.slice(0, 1); // always show something
      setRetrieved(results);
      await sleep(650, signal);

      // 3: build prompt
      setQueryStep(3);
      await sleep(650, signal);

      // 4: GPT (assembled from retrieved context — illustrative)
      setQueryStep(4);
      await sleep(800, signal);
      const grounded = results[0]?.score
        ? results.slice(0, 2).map((r) => r.chunk.text).join(" ")
        : "";
      const reply = grounded
        ? grounded
        : "I couldn't find that in the uploaded documents. Try rephrasing, or upload a doc that covers it.";
      setAnswer(reply);
      await sleep(300, signal);

      // 5: save history
      setQueryStep(5);
      setHistory((h) => [...h, { q: question, a: reply }]);
      await sleep(500, signal);
      setQueryStep(-1);
    } catch {
      /* aborted */
    } finally {
      setBusy(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-upload of same file
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => ingest(file.name, String(reader.result || ""));
    reader.readAsText(file);
  }

  function reset() {
    abortRef.current?.abort();
    setDocs([]);
    setChunks([]);
    setIngestStep(-1);
    setQueryStep(-1);
    setRetrieved([]);
    setAnswer("");
    setHistory([]);
    setQuery("");
    setBusy(false);
  }

  const promptPreview =
    retrieved.length > 0
      ? `System: Answer ONLY from the context below.\n\nContext:\n${retrieved
          .map((r, i) => `[${i + 1}] ${r.chunk.text}`)
          .join("\n")}\n\nQuestion: ${history[history.length - 1]?.q ?? query}`
      : "";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Toolbar: auth badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2/50 px-5 py-3 font-mono text-xs">
        <span className="text-muted">ai-support-agent · RAG over your PDFs</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          JWT · signed in
        </span>
      </div>

      {/* ---------------- Phase 1: Ingestion ---------------- */}
      <div className="border-b border-border p-5 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h4 className="font-semibold">
            <span className="font-mono text-xs text-accent-2">1 ·</span> Ingest documents
          </h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => ingest(SAMPLE_DOCS.support.name, SAMPLE_DOCS.support.text)}
              disabled={busy}
              className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-contrast transition-transform hover:scale-[1.03] disabled:opacity-50"
            >
              + Ingest sample PDF
            </button>
            <button
              onClick={() => ingest(SAMPLE_DOCS.shipping.name, SAMPLE_DOCS.shipping.text)}
              disabled={busy}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm transition-colors hover:border-accent/50 hover:text-accent-2 disabled:opacity-50"
            >
              + Second doc
            </button>
            <label className="cursor-pointer rounded-full border border-border bg-surface px-3 py-1.5 text-sm transition-colors hover:border-accent/50 hover:text-accent-2">
              Upload .txt/.md
              <input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={onFile} disabled={busy} className="hidden" />
            </label>
          </div>
        </div>

        {/* Pipeline stepper */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {INGEST_STEPS.map((s, i) => {
            const active = ingestStep === i;
            const done = ingestStep > i || (ingestStep === -1 && docs.some((d) => d.status === "completed"));
            return (
              <span
                key={s}
                className={`rounded-md border px-2 py-1 font-mono text-[10px] transition-colors ${
                  active
                    ? "border-accent bg-accent/15 text-accent-2 pulse-ring"
                    : done
                      ? "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-300/90"
                      : "border-border bg-surface-2/40 text-muted/60"
                }`}
              >
                {s}
              </span>
            );
          })}
        </div>
        {ingestStep >= 0 && (
          <p className="mb-3 font-mono text-xs text-accent-2">
            Processing {ingestingName} — {INGEST_STEPS[ingestStep]}…
          </p>
        )}

        {/* Knowledge base */}
        {docs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-surface-2/30 p-4 text-center text-sm text-muted">
            No documents yet. Ingest the sample PDF (or upload a text file) to build the
            knowledge base in pgvector.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {docs.map((d) => (
              <div key={d.id} className="rounded-lg border border-border bg-surface-2/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-xs">📄 {d.name}</span>
                  <StatusBadge status={d.status} />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {d.chunkCount > 0 ? `${d.chunkCount} chunks embedded` : "…"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------------- Phase 2: Query ---------------- */}
      <div className="p-5 sm:p-8">
        <h4 className="mb-4 font-semibold">
          <span className="font-mono text-xs text-accent-2">2 ·</span> Ask the agent
        </h4>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(query);
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ready ? "e.g. How long do refunds take?" : "Ingest a document first…"}
            disabled={!ready || busy}
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={!ready || busy || !query.trim()}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-contrast transition-transform hover:scale-[1.03] disabled:opacity-50"
          >
            Ask
          </button>
        </form>

        {/* suggested questions */}
        {ready && (
          <div className="mt-3 flex flex-wrap gap-2">
            {["How long do refunds take?", "Can I reschedule an appointment?", "How do I cancel my subscription?", "When do I get an invoice?"].map(
              (s) => (
                <button
                  key={s}
                  onClick={() => {
                    setQuery(s);
                    ask(s);
                  }}
                  disabled={busy}
                  className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent/40 hover:text-accent-2 disabled:opacity-50"
                >
                  {s}
                </button>
              ),
            )}
          </div>
        )}

        {/* query pipeline */}
        {queryStep >= 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {QUERY_STEPS.map((s, i) => (
              <span
                key={s}
                className={`rounded-md border px-2 py-1 font-mono text-[10px] transition-colors ${
                  queryStep === i
                    ? "border-accent bg-accent/15 text-accent-2 pulse-ring"
                    : queryStep > i
                      ? "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-300/90"
                      : "border-border bg-surface-2/40 text-muted/60"
                }`}
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* retrieved chunks */}
        {retrieved.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">
              Retrieved chunks (cosine similarity)
            </p>
            <div className="space-y-2">
              {retrieved.map((r, i) => (
                <div key={r.chunk.id} className="rounded-lg border border-border bg-surface-2/40 p-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="font-mono text-[10px] text-accent-2">[{i + 1}]</span>
                    {/* embedding viz */}
                    <span className="flex h-4 items-end gap-[2px]">
                      {r.chunk.vec.map((v, k) => (
                        <span
                          key={k}
                          className="w-[3px] rounded-sm bg-accent/60"
                          style={{ height: `${Math.max(12, v * 100)}%` }}
                        />
                      ))}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-muted">
                      {r.score.toFixed(3)}
                    </span>
                    <div className="h-1 w-16 overflow-hidden rounded-full bg-background">
                      <div className="h-full bg-accent" style={{ width: `${Math.min(100, r.score * 100)}%` }} />
                    </div>
                  </div>
                  <p className="text-sm text-foreground/85">{r.chunk.text}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted/60">{r.chunk.docName}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* prompt preview */}
        {promptPreview && queryStep >= 3 && (
          <details className="mt-4 rounded-lg border border-border bg-background/60 p-3">
            <summary className="cursor-pointer font-mono text-[11px] text-muted">
              Prompt sent to OpenAI GPT
            </summary>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-foreground/70">
              {promptPreview}
            </pre>
          </details>
        )}

        {/* answer */}
        {answer && (
          <div className="mt-4 rounded-xl border border-accent/25 bg-accent/[0.06] p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-accent/20 text-[10px] text-accent-2">
                ✦
              </span>
              <span className="text-sm font-semibold">Agent answer</span>
              <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] text-muted">
                grounded · illustrative
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{answer}</p>
            <p className="mt-2 text-[10px] text-muted/60">
              Retrieval runs live in your browser. In the real app the retrieved context is
              sent to OpenAI GPT, which writes the final reply.
            </p>
          </div>
        )}

        {/* conversation history */}
        {history.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">
              Conversation history ({history.length})
            </p>
            <ul className="space-y-1.5">
              {history.map((h, i) => (
                <li key={i} className="rounded-lg border border-border bg-surface-2/30 px-3 py-2 text-xs">
                  <span className="text-accent-2">Q:</span> {h.q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(docs.length > 0 || history.length > 0) && (
          <button
            onClick={reset}
            disabled={busy}
            className="mt-5 text-sm text-muted transition-colors hover:text-foreground disabled:opacity-50"
          >
            Reset demo
          </button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: DocStatus }) {
  const map: Record<DocStatus, string> = {
    pending: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    processing: "border-accent/30 bg-accent/10 text-accent-2",
    completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${map[status]}`}>
      {status}
    </span>
  );
}
