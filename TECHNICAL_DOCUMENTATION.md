# LegalAI — Technical Documentation

> **Intended audience:** Prospective AI engineer / technical hire
> **Stack:** Next.js 14 · OpenAI API · Supabase (pgvector) · Azure Blob Storage

---

## 1. System Overview

LegalAI is a Dutch legal-tech SaaS platform built for law firms. It provides three core AI-powered workflows:

| Workflow | Entry Point | AI Method |
|---|---|---|
| Document analysis (intake) | `/document-upload` | RAG + structured GPT-4o-mini |
| Contract review | `/dashboard` | OpenAI Agents (o4-mini + web search) |
| Jurisprudentie Q&A | `/vraag-stellen` / `/jurispudentie-search` | Vector search + RAG |

The backend is entirely Next.js API routes (App Router and Pages Router). No separate server. No LangChain or similar framework — the AI orchestration is hand-rolled.

---

## 2. AI Architecture

### 2.1 Models in Use

| Model | Purpose | Config |
|---|---|---|
| `gpt-4o-mini` | Document analysis, RAG answer generation | Temperature default |
| `o4-mini` | Contract review via Agents SDK | reasoning effort: `medium`, store: `true` |
| `text-embedding-3-small` | Query + document chunk embeddings | 1536-dim vectors |

### 2.2 Embedding Pipeline

All semantic search is backed by OpenAI embeddings stored in Supabase with the `pgvector` extension.

```
User query / document text
        │
        ▼
openai.embeddings.create({ model: "text-embedding-3-small" })
        │
        ▼
Supabase RPC  ──► hybrid_search_chunks (BM25 + cosine similarity)
                          │
                          ▼
               Top-N results ranked by score
```

The embedding input for documents is capped at **8,000 characters** (well within the 8,192-token model limit). Document analysis text is capped at **25,000 characters**.

---

## 3. Workflow Deep-Dives

### 3.1 Document Analysis Pipeline (`/pages/api/document-upload.js`)

This is the most complex AI workflow in the system. Full flow:

```
1. File upload (PDF or DOCX) via multipart form (formidable)
        │
2. Text extraction
   ├── PDF  → pdf-parse (with 4-version fallback: v1.10.100 → v1.10.88 → v1.9.426 → v2.0.550)
   └── DOCX → mammoth.extractRawText()
        │
3. Text sanitization
   ├── Remove null bytes
   ├── Normalize CRLF → LF
   ├── Collapse repeated newlines
   └── Trim
        │
4. Semantic retrieval
   ├── Embed document text (max 8,000 chars) → text-embedding-3-small
   └── Supabase RPC: hybrid_search_chunks → top 10 related jurisprudentie cases
        │
5. Agentic analysis
   └── GPT-4o-mini chat completion with structured JSON prompt
        │
6. JSON response returned to frontend
```

**Prompt design:**

The system prompt is Dutch. It instructs the model to act as a legal intake assistant and mandates **JSON-only output** with a strict 8-section schema:

```json
{
  "zaak_samenvatting":         "string — case summary",
  "kernfeiten":                "[{ tekst, source_ids }]",
  "juridische_issues":         "[{ hypothese, toelichting, source_ids }]",
  "zwakke_punten":             "[{ punt, toelichting, source_ids }]  — max 10",
  "onduidelijkheden":          "[{ onduidelijkheid, impact, source_ids }]",
  "extra_vragen_verweer":      "[{ vraag, doel, prioriteit, source_ids }]  — max 10",
  "verweerstrategie_aanzet":   "[{ strategie, toelichting, source_ids }]",
  "extra_nuttig_voor_advocaat":"[{ tip, toelichting }]  — exactly 2",
  "bronnen":                   "[{ id, type, ref, loc, quote }]"
}
```

**Source attribution schema:**

Every claim in the output must cite at least one source. Two source types exist:

- `DOC-N` — from the uploaded document, with `loc: "chars:1200-1400"` (character range) and a ≤220-char quote
- `ECLI-N` — from a retrieved case, with `loc: "resultaatIndex:3"` pointing to the top-10 results array

This design enables the frontend to render highlighted citations back to exact positions in the original document and link to case law on `rechtspraak.nl`.

---

### 3.2 Contract Review (`/pages/api/analyze.js` + `/lib/openaiAgent.js`)

Uses the **OpenAI Agents SDK** (`@openai/agents` v0.3.8) with an explicit reasoning model:

```js
const agent = new Agent({
  name: "My agent",
  model: "o4-mini",
  modelSettings: { reasoningEffort: "medium", store: true },
  tools: [webSearchTool({ searchContextSize: "medium" })],
  instructions: `...`  // 6-section markdown report instructions
});

const result = await withTrace("contract-review", () =>
  Runner.run(agent, [{ role: "user", content: inputText }])
);
```

The agent can issue web searches mid-generation. This is useful for resolving legal references, legislation numbers, or unfamiliar contract clauses. Output is a **Markdown report** (not JSON), with 6 sections:

1. Documentprofiel
2. Samenvatting
3. Kernbepalingen
4. Aandachtspunten
5. Vragen
6. Onzekerheden

`store: true` enables OpenAI's server-side caching of reasoning state.

---

### 3.3 Jurisprudentie Search + RAG Answer (`/app/api/search` + `/app/api/answer`)

**Search endpoint:**

```
GET /api/search?query=<text>
        │
1. Embed query → text-embedding-3-small
        │
2. Supabase RPC with fallback chain:
   hybrid_search_chunks (preferred)
   match_ecli_chunks variants (fallback x7 argument combinations)
        │
3. Deduplicate by ECLI, keep highest score per case
        │
4. Return top 10 results with metadata
```

**Answer endpoint:**

```
POST /api/answer  { query, results }
        │
1. Build prompt:
   System: "Answer using only these snippets. Cite ECLI(s). If insufficient, say so."
   User:   query + top results (max 1,200 chars per snippet)
        │
2. gpt-4o-mini chat completion
        │
3. Return { answer, citations[] }
```

This is a clean, minimal RAG pattern with no hallucination safety net beyond the "say so if insufficient" instruction. The snippet length cap (1,200 chars) keeps context cost predictable.

---

## 4. Database Schema (Supabase / PostgreSQL)

```sql
-- Law firms
firms (id UUID, name TEXT, size TEXT, jurisdiction TEXT)

-- User accounts
accounts (id UUID, firm_id UUID → firms, full_name TEXT, email TEXT, role TEXT)

-- Dutch case law (jurisprudentie)
jurisprudentie_sources (
  id            UUID,
  ecli          TEXT UNIQUE,        -- e.g. "ECLI:NL:HR:2023:1234"
  title         TEXT,
  court         TEXT,
  decision_date DATE,
  content       TEXT,               -- full text
  -- content chunks + 1536-dim pgvector embeddings for semantic search
)

-- Contact form submissions
contact_requests (full_name, work_email, firm_name, role, use_case, submitted_at)
```

**RLS:** Row-level security is enabled on all tables. Current policies are permissive (anon + authenticated read/write) — tightening this per-firm would be an early production hardening task.

**pgvector:** Hybrid search combines BM25 keyword matching with cosine similarity on 1536-dim vectors. The RPC functions are custom PostgreSQL stored procedures.

---

## 5. External Services

| Service | Role | Auth |
|---|---|---|
| **OpenAI** | LLM completions, embeddings, agents | `OPENAI_API_KEY` |
| **Supabase** | Postgres + pgvector + Auth + Edge Functions | Anon key + service role key |
| **Azure Blob Storage** | Raw jurisprudentie XML documents | Connection string (shared key signing) |
| **Resend** | Transactional email (contact form, magic link) | `RESEND_API_KEY` |
| **rechtspraak.nl** | Dutch case law metadata (public API) | None |

Supabase Edge Functions (Deno runtime) are used for the contact notification flow to avoid exposing email credentials client-side.

---

## 6. Frontend Architecture

- **Next.js 14** App Router with a mix of server and client components
- Auth: Supabase magic-link login — session handled via `@supabase/ssr`
- Markdown rendering: `markdown-to-jsx` (used for contract review output)
- File uploads: raw `fetch` with `FormData`, no upload library
- No global state manager — React `useState`/`useEffect` only
- Demo routes exist (`/demo-*`) for unauthenticated testing of each workflow

---

## 7. Key Engineering Notes

**What's solid:**
- The source attribution system in document analysis is well-designed — character-range citations are precise and deterministic
- The PDF fallback chain handles the surprisingly wide variance in Dutch court document encoding
- Hybrid search (BM25 + vector) is a better default than pure cosine for legal text, which tends to have high keyword overlap

**Known gaps / improvement opportunities:**
- No persistent conversation history — all workflows are single-turn
- RLS policies are too permissive for multi-tenant production use
- No streaming responses — completions block until fully generated
- The OpenAI agent in contract review has no timeout or token budget guardrail
- No retry/backoff on OpenAI API calls (a transient error will surface directly to the user)
- No observability layer (logging, tracing, cost tracking) beyond OpenAI's `withTrace`
- Embeddings are pre-computed for jurisprudentie but re-computed on every document upload (no caching)

---

## 8. Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # server-side only

## 9. Compliance Artifacts (Operational)

The repository includes operational compliance documents for go-live:

- `compliance/DPA_TEMPLATE.md` — signable DPA template.
- `compliance/DPA_EXECUTION_PROCESS.md` — internal DPA request/signature workflow.
- `compliance/SUBPROCESSOR_REGISTER.md` — subprocessor list with regions + SCC basis.
- `compliance/DATA_RETENTION_SOP.md` — retention policy and deletion process for logs/backups/incidents.
SUPABASE_CONTACT_FUNCTION_NAME=

# Azure
AZURE_STORAGE_CONNECTION_STRING=
AZURE_ECLI_CONTAINER=jurisprudentie

# Email
RESEND_API_KEY=
CONTACT_RECIPIENT_EMAIL=
CONTACT_FROM_EMAIL=
```

---

## 9. Repository Structure (AI-Relevant Files)

```
/app
  /api
    /search/route.js          ← vector search endpoint
    /answer/route.js          ← RAG answer generation
    /ecli/[ecli]/route.js     ← case detail + Azure blob fetch
    /contact/route.js         ← contact form → Supabase edge function

/pages/api
  analyze.js                  ← contract review (OpenAI Agents)
  document-upload.js          ← full document analysis pipeline

/lib
  openaiAgent.js              ← Agent/Runner setup
  rechtspraak.js              ← URL builder for case links

/supabase
  /functions
    /contact-notify/index.ts  ← Deno edge function (Resend email)
  schema.sql                  ← full DB schema

/app
  /dashboard/page.js          ← contract review UI
  /document-upload/page.js    ← document analysis UI
  /vraag-stellen/page.js      ← Q&A interface
  /jurispudentie-search/page.js ← search + answer UI
```

---

*Document generated March 2026. Reflects codebase state as of commit `a72dbe6`.*
