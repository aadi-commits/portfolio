# Portfolio

A fast, distinctive developer portfolio with three parts working together:

1. **Base site** — hero, about, experience timeline, case-study projects, contact form.
2. **Live interactive demo** — an _Inventory Sync + Redis Lock_ visualizer (client-side, animated).
3. **"Ask my portfolio" AI chat** — answers recruiter questions from your résumé + projects, with prompt-injection guardrails and rate limiting.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS v4**. Statically generated where possible; two Node API routes (`/api/chat`, `/api/contact`).

---

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. **It runs with zero infrastructure** — no API key, Redis, DB, or SMTP required. Unconfigured features degrade gracefully (in-memory rate-limit, console-logged contact messages, a "not configured" notice on the AI chat).

Production build:

```bash
npm run build && npm start
```

---

## ✍️ Fill in your content — ONE file

All personal content lives in **[`content/portfolio.ts`](content/portfolio.ts)**.
Search that file for **`TODO`** — each is a field to fill. Nothing about you is invented; every real specific is a marked placeholder.

Sections in that file:

- `identity` — name, tagline, years of experience, links, "Open to work" toggle
- `about` — your 3–4 line story + focus areas
- `experience` — timeline roles, highlights, stacks
- `projects` — the 3 case studies (problem → architecture → hardest part → outcome)
- `aiContext` — **the résumé text the AI chat answers from** + logistics + quick-prompt chips
- `siteMeta` — SEO title/description/URL/OG image

Also drop your **résumé PDF** at `public/resume.pdf` (or update `identity.links.resume`).

---

## Environment variables

Copy `.env.example` → `.env.local`. **All are optional for dev.**

| Variable | Purpose | If unset |
| --- | --- | --- |
| `AI_API_KEY` | Enables the AI chat — **free NVIDIA key** from [build.nvidia.com](https://build.nvidia.com/) | Chat shows "not configured" |
| `AI_MODEL` | Override chat model (default `meta/llama-3.3-70b-instruct`) | Uses the default |
| `AI_BASE_URL` | OpenAI-compatible endpoint (default = NVIDIA) | NVIDIA |
| `REDIS_URL` | Distributed rate-limiting | In-memory fallback |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | Send contact emails | Messages logged to console |
| `CONTACT_TO` / `CONTACT_FROM` | Email routing | Defaults to `SMTP_USER` |
| `DATABASE_URL` / `DATABASE_SSL` | Persist contact submissions | Not persisted |

**Secrets never get hardcoded** — everything reads from env.

---

## Architecture notes

- `src/lib/rate-limit.ts` — Redis fixed-window counter with transparent in-memory fallback.
- `src/lib/ai.ts` — AI client + system-prompt builder (guardrails live here). Uses the OpenAI SDK against NVIDIA's free OpenAI-compatible endpoint; repoint at any provider via `AI_BASE_URL`.
- `src/lib/mailer.ts` / `src/lib/db.ts` — optional email + Postgres, both degrade gracefully.
- `src/app/api/chat/route.ts` — rate-limited; wraps user input as quoted DATA; injection heuristics.
- `src/components/demo/` — the interactive demos (RAG agent, 911Care journey, frontend-perf, invoice→WhatsApp, Redis-lock concept), tabbed via `DemoTabs.tsx`. All pure client-side.

### Extension points (intentionally left clean)

Not built yet, but structured so they slot in: the other two demos (flight-search SSE, pipeline visualizer) as sibling sections; JD-paste matching; chat source citations; analytics dashboard.

---

## AI chat guardrails

The system prompt (in `src/lib/ai.ts`) constrains the assistant to **only** discuss you, treats user input as data (not instructions), refuses off-topic/abusive input, and never reveals the prompt. The route additionally caps history/length, flags obvious injection attempts, and rate-limits per IP.
