import formidable from "formidable";
import fs from "fs/promises";
import path from "path";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import { createClient } from "@supabase/supabase-js";
import { requireAuthenticatedAccount } from "../../lib/serverApiAuth";
import {
  createRequestContext,
  logProviderError,
  logRequestEnd,
  logRequestStart,
  recordOpenAIUsage,
  reportError
} from "../../lib/observability";

export const config = {
  api: {
    bodyParser: false
  }
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const EMBED_MODEL = process.env.EMBED_MODEL || "text-embedding-3-small";
const EMBED_DIM = Number(process.env.EMBED_DIM || 1536);
const DOCUMENT_ANALYZE_MODEL = process.env.DOCUMENT_ANALYZE_MODEL || "gpt-4o-mini";
const MAX_DOCUMENT_CHARS = Number(process.env.MAX_DOCUMENT_CHARS || 25000);
const MAX_EMBED_CHARS = Number(process.env.MAX_EMBED_CHARS || 8000);
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 25000);
const OPENAI_MAX_RETRIES = Number(process.env.OPENAI_MAX_RETRIES || 2);
const SUPABASE_TIMEOUT_MS = Number(process.env.SUPABASE_TIMEOUT_MS || 12000);
const SUPABASE_MAX_RETRIES = Number(process.env.SUPABASE_MAX_RETRIES || 2);
const DOCUMENT_UPLOAD_MAX_FILE_SIZE_BYTES = Number(
  process.env.DOCUMENT_UPLOAD_MAX_FILE_SIZE_BYTES || 12 * 1024 * 1024
);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

const allowedExtensions = [".pdf", ".docx"];
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const cleanupTempFile = async (file) => {
  const filePath = String(file?.filepath || "").trim();
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore cleanup failures for already-removed temp files.
  }
};

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const withTimeout = async (promise, timeoutMs, label) => {
  let timer = null;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label}_TIMEOUT`)), timeoutMs);
      })
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

const fetchWithRetry = async (url, init, { timeoutMs, maxRetries, label }) => {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeout);

      const canRetryStatus = response.status >= 500 || response.status === 429;
      if (response.ok || !canRetryStatus || attempt === maxRetries) {
        return response;
      }

      await sleep(300 * (attempt + 1));
      continue;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt === maxRetries) {
        break;
      }
      await sleep(300 * (attempt + 1));
    }
  }

  throw lastError || new Error(`${label}_REQUEST_FAILED`);
};

const isRetryableSupabaseError = (error) => {
  if (!error) {
    return false;
  }

  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "").toLowerCase();

  return (
    code === "57014" ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("network") ||
    message.includes("connection")
  );
};

const callRpcWithRetry = async (name, args) => {
  let lastError = null;
  for (let attempt = 0; attempt <= SUPABASE_MAX_RETRIES; attempt += 1) {
    try {
      const rpcResult = await withTimeout(
        supabase.rpc(name, args),
        SUPABASE_TIMEOUT_MS,
        "SUPABASE_RPC"
      );
      const { data, error } = rpcResult || {};
      if (!error) {
        return { data: data || [], error: null };
      }

      lastError = error;
      if (!isRetryableSupabaseError(error) || attempt === SUPABASE_MAX_RETRIES) {
        return { data: null, error };
      }
    } catch (error) {
      lastError = error;
      if (attempt === SUPABASE_MAX_RETRIES) {
        break;
      }
    }

    await sleep(250 * (attempt + 1));
  }

  return { data: null, error: lastError || new Error("SUPABASE_RPC_FAILED") };
};

const getExtension = (filename) => {
  const trimmed = String(filename || "").trim();
  const dotIndex = trimmed.lastIndexOf(".");
  if (dotIndex === -1) {
    return "";
  }
  return trimmed.slice(dotIndex).toLowerCase();
};

const isAllowedFile = (file) => {
  const extension = getExtension(file?.originalFilename || "");
  if (extension && allowedExtensions.includes(extension)) {
    return true;
  }
  const mime = String(file?.mimetype || "").toLowerCase();
  return allowedMimeTypes.has(mime);
};

const sanitizeText = (value) =>
  String(value || "")
    .replace(/\u0000/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const limitText = (value, maxChars) => {
  const text = String(value || "");
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}\n\n[Ingekort vanwege lengte]`;
};

const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = formidable({
      multiples: false,
      maxFiles: 1,
      maxFileSize: DOCUMENT_UPLOAD_MAX_FILE_SIZE_BYTES
    });
    form.parse(req, (err, _fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(files);
    });
  });

const parsePdfWithFallback = async (buffer) => {
  const attempts = [
    { version: "v1.10.100" },
    { version: "v1.10.88" },
    { version: "v1.9.426" },
    { version: "v2.0.550" },
    {}
  ];

  let lastError = null;
  for (const options of attempts) {
    try {
      const parsed = await pdf(buffer, options);
      const parsedText = sanitizeText(parsed?.text || "");
      if (parsedText) {
        return parsedText;
      }
    } catch (error) {
      lastError = error;
    }
  }

  const pdfError = new Error(
    "PDF kon niet worden uitgelezen. Gebruik een andere PDF-export of upload als DOCX."
  );
  pdfError.code = "PDF_PARSE_FAILED";
  pdfError.cause = lastError;
  throw pdfError;
};

const extractTextFromFile = async (file) => {
  const ext = getExtension(file?.originalFilename || "");
  const mime = String(file?.mimetype || "").toLowerCase();
  const buffer = await fs.readFile(file.filepath);

  if (ext === ".pdf" || mime === "application/pdf") {
    return await parsePdfWithFallback(buffer);
  }

  if (
    ext === ".docx" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const parsed = await mammoth.extractRawText({ buffer });
    return sanitizeText(parsed?.value || "");
  }

  return "";
};

const fetchEmbedding = async (inputText) => {
  const embedResponse = await fetchWithRetry(
    "https://api.openai.com/v1/embeddings",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: EMBED_MODEL,
        input: limitText(inputText, MAX_EMBED_CHARS),
        dimensions: EMBED_DIM
      })
    },
    {
      timeoutMs: OPENAI_TIMEOUT_MS,
      maxRetries: OPENAI_MAX_RETRIES,
      label: "OPENAI_EMBED"
    }
  );

  if (!embedResponse.ok) {
    const errorText = await embedResponse.text();
    console.error("Document upload embeddings error:", embedResponse.status, errorText);
    throw new Error("Embedding request failed.");
  }

  const embedJson = await embedResponse.json();
  recordOpenAIUsage({
    model: EMBED_MODEL,
    inputTokens: Number(embedJson?.usage?.prompt_tokens ?? embedJson?.usage?.input_tokens ?? 0),
    outputTokens: 0
  });
  const embedding = embedJson?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) {
    throw new Error("Embedding response missing data.");
  }

  return embedding;
};

const callSearchRpc = async (queryText, embedding, matchCount) => {
  const rpcAttempts = [
    {
      name: "hybrid_search_chunks",
      args: {
        query: queryText,
        query_embedding: embedding,
        match_count: matchCount
      }
    },
    {
      name: "match_ecli_chunks",
      args: {
        query_embedding: embedding,
        match_count: matchCount
      }
    },
    {
      name: "match_ecli_chunks",
      args: {
        embedding,
        match_count: matchCount
      }
    },
    {
      name: "match_ecli_chunks",
      args: {
        query: queryText,
        query_embedding: embedding,
        match_count: matchCount
      }
    },
    {
      name: "match_ecli_chunks",
      args: {
        query_text: queryText,
        query_embedding: embedding,
        match_count: matchCount
      }
    },
    {
      name: "match_ecli_chunks",
      args: {
        query_embedding: embedding,
        match_threshold: 0,
        match_count: matchCount
      }
    },
    {
      name: "match_ecli_chunks",
      args: {
        embedding,
        match_threshold: 0,
        match_count: matchCount
      }
    }
  ];

  let lastError = null;

  for (const attempt of rpcAttempts) {
    const { data, error } = await callRpcWithRetry(attempt.name, attempt.args);
    if (!error) {
      return data || [];
    }

    lastError = error;
    const isMissingOrSignatureError =
      error?.code === "PGRST202" ||
      String(error?.message || "").toLowerCase().includes("schema cache");

    if (!isMissingOrSignatureError) {
      throw error;
    }
  }

  throw (
    lastError ||
    new Error("No compatible search RPC function found (hybrid_search_chunks/match_ecli_chunks).")
  );
};

const getTopRelatedCases = async (documentText) => {
  const embedding = await fetchEmbedding(documentText);
  const rpcQuery = limitText(documentText, 1200);
  const data = await callSearchRpc(rpcQuery, embedding, 60);

  const grouped = new Map();
  (data || []).forEach((row) => {
    const key = String(row?.ecli || "").trim();
    if (!key) {
      return;
    }
    const previous = grouped.get(key);
    const rowScore = Number(row?.score ?? row?.similarity ?? row?.rank ?? 0);
    if (!previous || rowScore > Number(previous.score || 0)) {
      grouped.set(key, {
        ecli: key,
        title: row?.title || row?.case_title || "",
        court: row?.court || row?.instantie || "",
        decision_date: row?.decision_date || row?.datum_uitspraak || "",
        score: rowScore,
        content: sanitizeText(row?.content || row?.chunk_text || row?.text || "")
      });
    }
  });

  return Array.from(grouped.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
};

const buildCaseContext = (cases) =>
  cases
    .map((item, index) => {
      const snippet = limitText(item.content, 900);
      const scoreText = Number.isFinite(item.score) ? item.score.toFixed(3) : "n.v.t.";
      const rid = index + 1;
      return [
        `RESULTAAT_ID: R${rid}`,
        `ECLI: ${item.ecli || "Onbekend"}`,
        `Titel: ${item.title || "Onbekend"}`,
        `Rechtbank: ${item.court || "Onbekend"}`,
        `Datum: ${item.decision_date || "Onbekend"}`,
        `Score: ${scoreText}`,
        `SNIPPET: ${snippet}`
      ].join("\n");
    })
    .join("\n\n");

const parseJsonPayload = (rawText) => {
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    const match = String(rawText).match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const SYSTEM_PROMPT = `
Je bent een Nederlandse juridische intake-assistent voor advocaten.

Doel: snel, betrouwbaar en controleerbaar samenvatten + verweergerichte intake-vragen formuleren.
Je werkt met 2 bronnen:
(1) DOCUMENTTEKST (van client) en (2) TOP GERELATEERDE JURISPRUDENTIE (snippets met ECLI).

CRUCIALE REGELS (streng):
- Antwoord ALLEEN met geldige JSON die exact het schema volgt. Geen markdown, geen extra tekst.
- Scheid strikt:
  * "kernfeiten": alleen feiten die letterlijk/duidelijk uit DOCUMENTTEKST volgen.
  * "juridische_issues", "zwakke_punten", "verweerstrategie_aanzet": interpretatie/hypotheses (noem het nooit als feit).
- Als een essentieel feit ontbreekt of onduidelijk is: zet het in "onduidelijkheden" en stel gerichte vragen.
- Elke inhoudelijke bullet in "kernfeiten", "zwakke_punten", "juridische_issues" en "verweerstrategie_aanzet"
  MOET ten minste 1 bronverwijzing hebben in "bronnen" (document of ecli).
- Gebruik alleen jurisprudentie die in de meegegeven TOP-resultaten staat. Geen externe kennis of verzonnen ECLI's.
- Wees bondig, praktisch en verweer-gericht. Max 10 zwakke punten. Max 10 vragen.
- Bij "extra_nuttig_voor_advocaat": exact 2 items, praktisch uitvoerbaar.

SCHEMA (exact):
{
  "zaak_samenvatting": "string",
  "kernfeiten": [{"tekst":"string","source_ids":["string"]}],
  "juridische_issues": [{"issue":"string","toelichting":"string","source_ids":["string"]}],
  "zwakke_punten": [{"punt":"string","source_ids":["string"]}],
  "onduidelijkheden": [{"punt":"string","impact":"string","source_ids":["string"]}],
  "extra_vragen_verweer": [{"vraag":"string","waarom":"string","prioriteit":"hoog|middel|laag","source_ids":["string"]}],
  "verweerstrategie_aanzet": [{"strategie":"string","source_ids":["string"]}],
  "extra_nuttig_voor_advocaat": [{"titel":"string","toelichting":"string"}],
  "bronnen": [{"id":"string","type":"document|ecli","ref":"string","loc":"string","quote":"string"}]
}

BRON-ID REGELS:
- Gebruik bron-ids die jij zelf aanmaakt en uniek zijn binnen dit antwoord.
- Formaat:
  * Document: "DOC-1", "DOC-2", ...
  * ECLI snippet: "ECLI-1", "ECLI-2", ...
- "bronnen[].ref":
  * document: altijd "doc"
  * ecli: de ECLI string (bijv. "ECLI:NL:HR:2020:123")
- "bronnen[].loc":
  * document: "chars:start-end" (schat mag; consistent blijven)
  * ecli: "resultaatIndex:X" of "chunk:ID" als beschikbaar
- "bronnen[].quote": korte letterlijke quote (max ~220 tekens), geen parafrase.
`;

const analyzeDocument = async ({ documentText, relatedCases }) => {
  const USER_PROMPT = `
Analyseer dit dossier voor intake en verweerstrategie. Werk in deze volgorde:
1) Extract "kernfeiten" (alleen uit DOCUMENTTEKST).
2) Noteer "onduidelijkheden" + impact.
3) Formuleer "juridische_issues" (hypotheses) en "zwakke_punten".
4) Stel "extra_vragen_verweer" met prioriteit (hoog als antwoord strategie/deadline/risico bepaalt).
5) Geef een korte "verweerstrategie_aanzet" (hypotheses, geen zekerheid).
6) Voeg bronnen toe (DOC-* en ECLI-*) met quotes.

DOCUMENTTEKST:
${limitText(documentText, MAX_DOCUMENT_CHARS)}

TOP GERELATEERDE JURISPRUDENTIE (snippets):
${buildCaseContext(relatedCases) || "Niet gevonden."}
`;

  const response = await fetchWithRetry(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: DOCUMENT_ANALYZE_MODEL,
        input: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: USER_PROMPT
          }
        ]
      })
    },
    {
      timeoutMs: OPENAI_TIMEOUT_MS,
      maxRetries: OPENAI_MAX_RETRIES,
      label: "OPENAI_ANALYZE"
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Document upload analyze error:", response.status, errorText);
    throw new Error("Analyze request failed.");
  }

  const data = await response.json();
  recordOpenAIUsage({
    model: DOCUMENT_ANALYZE_MODEL,
    inputTokens: Number(data?.usage?.input_tokens ?? data?.usage?.prompt_tokens ?? 0),
    outputTokens: Number(data?.usage?.output_tokens ?? data?.usage?.completion_tokens ?? 0)
  });
  const rawText = data?.output_text || data?.output?.[0]?.content?.[0]?.text || "";
  const parsed = parseJsonPayload(rawText);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("OpenAI returned invalid JSON.");
  }

  const bronnen = Array.isArray(parsed.bronnen)
    ? parsed.bronnen
        .map((item) => ({
          id: String(item?.id || "").trim(),
          type: String(item?.type || "").trim().toLowerCase(),
          ref: String(item?.ref || "").trim(),
          loc: String(item?.loc || "").trim(),
          quote: String(item?.quote || "").trim()
        }))
        .filter((item) => item.id && item.type && item.ref && item.loc && item.quote)
    : [];

  if (!bronnen.length) {
    throw new Error("OpenAI returned JSON without bronnen[].");
  }

  const sourceIdsSet = new Set(bronnen.map((item) => item.id));
  const toSourceIds = (value) =>
    Array.isArray(value)
      ? value
          .map((id) => String(id || "").trim())
          .filter((id) => id && sourceIdsSet.has(id))
      : [];

  const kernfeiten = Array.isArray(parsed.kernfeiten)
    ? parsed.kernfeiten
        .map((item) => ({
          tekst: String(item?.tekst || "").trim(),
          source_ids: toSourceIds(item?.source_ids)
        }))
        .filter((item) => item.tekst)
    : [];

  const juridischeIssues = Array.isArray(parsed.juridische_issues)
    ? parsed.juridische_issues
        .map((item) => ({
          issue: String(item?.issue || "").trim(),
          toelichting: String(item?.toelichting || "").trim(),
          source_ids: toSourceIds(item?.source_ids)
        }))
        .filter((item) => item.issue || item.toelichting)
    : [];

  const zwakkePunten = Array.isArray(parsed.zwakke_punten)
    ? parsed.zwakke_punten
        .map((item) => ({
          punt: String(item?.punt || "").trim(),
          source_ids: toSourceIds(item?.source_ids)
        }))
        .filter((item) => item.punt)
        .slice(0, 10)
    : [];

  const onduidelijkheden = Array.isArray(parsed.onduidelijkheden)
    ? parsed.onduidelijkheden
        .map((item) => ({
          punt: String(item?.punt || "").trim(),
          impact: String(item?.impact || "").trim(),
          source_ids: toSourceIds(item?.source_ids)
        }))
        .filter((item) => item.punt || item.impact)
    : [];

  const extraVragenVerweerStructured = Array.isArray(parsed.extra_vragen_verweer)
    ? parsed.extra_vragen_verweer
        .map((item) => ({
          vraag: String(item?.vraag || "").trim(),
          waarom: String(item?.waarom || "").trim(),
          prioriteit: ["hoog", "middel", "laag"].includes(
            String(item?.prioriteit || "").trim().toLowerCase()
          )
            ? String(item?.prioriteit || "").trim().toLowerCase()
            : "middel",
          source_ids: toSourceIds(item?.source_ids)
        }))
        .filter((item) => item.vraag)
        .slice(0, 10)
    : [];

  const verweerstrategieAanzet = Array.isArray(parsed.verweerstrategie_aanzet)
    ? parsed.verweerstrategie_aanzet
        .map((item) => ({
          strategie: String(item?.strategie || "").trim(),
          source_ids: toSourceIds(item?.source_ids)
        }))
        .filter((item) => item.strategie)
    : [];

  const extraNuttig = Array.isArray(parsed.extra_nuttig_voor_advocaat)
    ? parsed.extra_nuttig_voor_advocaat
        .map((item) => ({
          title: String(item?.titel || "").trim(),
          explanation: String(item?.toelichting || "").trim()
        }))
        .filter((item) => item.title && item.explanation)
        .slice(0, 2)
    : [];

  return {
    summary: String(parsed.zaak_samenvatting || "").trim(),
    zaak_samenvatting: String(parsed.zaak_samenvatting || "").trim(),
    kernfeiten,
    juridische_issues: juridischeIssues,
    zwakke_punten: zwakkePunten,
    onduidelijkheden,
    extra_vragen_verweer: extraVragenVerweerStructured,
    verweerstrategie_aanzet: verweerstrategieAanzet,
    extra_nuttig_voor_advocaat: extraNuttig,
    bronnen,
    weakpoints: zwakkePunten.map((item) => item.punt),
    defenseQuestions: extraVragenVerweerStructured.map((item) => item.vraag),
    extraHelpful: extraNuttig
  };
};

export default async function handler(req, res) {
  const ctx = createRequestContext({ request: req, route: "/api/document-upload" });
  logRequestStart(ctx);
  let loggedEnd = false;
  const respond = async (status, payload, extra = {}) => {
    if (!loggedEnd) {
      await logRequestEnd(ctx, { status, extra });
      loggedEnd = true;
    }
    res.status(status).json(payload);
  };

  if (req.method === "GET") {
    await respond(200, {
      ok: true,
      route: "/api/document-upload",
      methods: ["POST"]
    });
    return;
  }

  if (req.method !== "POST") {
    await respond(405, { error: "Method not allowed" });
    return;
  }

  if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    await respond(500, { error: "Serverconfiguratie ontbreekt." });
    return;
  }

  let file = null;
  try {
    const auth = await requireAuthenticatedAccount(req.headers);
    if (!auth.ok) {
      await respond(auth.status, { error: auth.error }, { auth_error: true });
      return;
    }

    const files = await parseForm(req);
    const rawFile = files.file || Object.values(files)[0];
    file = Array.isArray(rawFile) ? rawFile[0] : rawFile;

    if (!file) {
      await respond(400, { error: "Geen bestand ontvangen." });
      return;
    }

    if (!isAllowedFile(file)) {
      await respond(400, { error: "Alleen PDF en DOCX documenten zijn toegestaan." });
      return;
    }

    const text = await extractTextFromFile(file);
    if (!text) {
      await respond(400, {
        error:
          "Geen leesbare tekst gevonden. Gebruik een tekst-PDF of een DOCX-bestand."
      });
      return;
    }

    const relatedCases = await getTopRelatedCases(text);
    const findings = await analyzeDocument({ documentText: text, relatedCases });

    await respond(200, {
      ok: true,
      file: {
        filename: path.basename(file.originalFilename || "document"),
        mime: file.mimetype || "application/octet-stream",
        size: Number(file.size || 0)
      },
      extractedTextLength: text.length,
      documentText: limitText(text, MAX_DOCUMENT_CHARS),
      relatedCases: relatedCases.map((item) => ({
        ecli: item.ecli,
        title: item.title,
        court: item.court,
        decision_date: item.decision_date,
        score: item.score,
        content_excerpt: limitText(item.content, 1800)
      })),
      findings
    }, { related_case_count: relatedCases.length, text_length: text.length });
  } catch (error) {
    console.error("Document upload route error:", error);
    if (error?.code === "PDF_PARSE_FAILED") {
      await respond(400, { error: error.message });
      return;
    }
    const message = String(error?.message || "").toLowerCase();
    if (message.includes("supabase") || message.includes("pgrst") || message.includes("schema cache")) {
      await logProviderError("supabase", {
        route: ctx.route,
        request_id: ctx.request_id,
        error_message: String(error?.message || "")
      });
    } else {
      await logProviderError("openai", {
        route: ctx.route,
        request_id: ctx.request_id,
        error_message: String(error?.message || "")
      });
    }
    await reportError({
      ctx,
      error,
      status: 500,
      tags: { component: "document_upload_api" }
    });
    loggedEnd = true;
    res.status(500).json({ error: "Document analyse mislukt. Probeer het opnieuw." });
  } finally {
    await cleanupTempFile(file);
  }
}
