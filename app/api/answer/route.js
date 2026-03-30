import { NextResponse } from "next/server";
import { requireAuthenticatedAccount } from "../../../lib/serverApiAuth";
import {
  createRequestContext,
  logProviderError,
  logRequestEnd,
  logRequestStart,
  recordOpenAIUsage,
  reportError
} from "../../../lib/observability";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const RAG_MODEL = process.env.RAG_MODEL || "gpt-4o-mini";
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 25000);
const OPENAI_MAX_RETRIES = Number(process.env.OPENAI_MAX_RETRIES || 2);
const ANSWER_MAX_BODY_BYTES = Number(process.env.ANSWER_MAX_BODY_BYTES || 64 * 1024);
const ANSWER_MAX_QUERY_CHARS = Number(process.env.ANSWER_MAX_QUERY_CHARS || 1500);
const ANSWER_MAX_RESULTS = Number(process.env.ANSWER_MAX_RESULTS || 10);
const ANSWER_SNIPPET_MAX_CHARS = Number(process.env.ANSWER_SNIPPET_MAX_CHARS || 1200);

const jsonError = (message, status) =>
  NextResponse.json({ error: message }, { status });

const getContentLength = (request) => {
  const raw = String(request?.headers?.get("content-length") || "").trim();
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
};

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

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

const buildSnippetBlock = (results) =>
  results
    .map((result, index) => {
      const snippet = String(result?.content || "").slice(0, ANSWER_SNIPPET_MAX_CHARS);
      const ecli = result?.ecli || "Onbekend";
      return `Snippet ${index + 1} (ECLI: ${ecli}):\n${snippet}`;
    })
    .join("\n\n");

const extractCitedEclis = (answerText) => {
  const normalized = String(answerText || "");
  const matches = normalized.match(/ECLI:[A-Z]{2}:[A-Z0-9]+:\d{4}:[A-Z0-9.:-]+/gi) || [];
  const unique = new Set(
    matches.map((value) => String(value || "").trim().toUpperCase()).filter(Boolean)
  );
  return Array.from(unique);
};

export async function POST(request) {
  const ctx = createRequestContext({ request, route: "/api/answer" });
  logRequestStart(ctx);

  if (!OPENAI_API_KEY) {
    await logRequestEnd(ctx, { status: 500 });
    return jsonError("Server is not configured for answers.", 500);
  }

  const auth = await requireAuthenticatedAccount(request.headers);
  if (!auth.ok) {
    await logRequestEnd(ctx, {
      status: auth.status,
      extra: { auth_error: true }
    });
    return jsonError(auth.error, auth.status);
  }

  let payload;
  try {
    if (getContentLength(request) > ANSWER_MAX_BODY_BYTES) {
      await logRequestEnd(ctx, { status: 413 });
      return jsonError("Verzoek is te groot. Beperk vraag en bronnen.", 413);
    }

    payload = await request.json();
  } catch {
    await logRequestEnd(ctx, { status: 400 });
    return jsonError("Invalid JSON payload.", 400);
  }

  const query = String(payload?.query || "").trim().slice(0, ANSWER_MAX_QUERY_CHARS);
  if (!query) {
    await logRequestEnd(ctx, { status: 400 });
    return jsonError("Query is required.", 400);
  }

  const results = Array.isArray(payload?.results)
    ? payload.results.slice(0, ANSWER_MAX_RESULTS)
    : [];
  if (!results.length) {
    await logRequestEnd(ctx, { status: 400 });
    return jsonError("Results are required to generate an answer.", 400);
  }

  try {
    const response = await fetchWithRetry(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: RAG_MODEL,
          input: [
            {
              role: "system",
              content:
                "Answer using only the snippets, cite ECLI(s); if insufficient, say so."
            },
            {
              role: "user",
              content: `Vraag: ${query}\n\nSnippets:\n${buildSnippetBlock(
                results
              )}`
            }
          ]
        })
      },
      {
        timeoutMs: OPENAI_TIMEOUT_MS,
        maxRetries: OPENAI_MAX_RETRIES,
        label: "OPENAI_ANSWER"
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Answer response error:", response.status, errorText);
      await logProviderError("openai", {
        route: ctx.route,
        request_id: ctx.request_id,
        status: response.status
      });
      await logRequestEnd(ctx, { status: 503 });
      return jsonError(
        "Antwoord genereren is tijdelijk niet beschikbaar. Probeer het zo opnieuw.",
        503
      );
    }

    const data = await response.json();
    recordOpenAIUsage({
      model: RAG_MODEL,
      inputTokens: Number(data?.usage?.input_tokens ?? data?.usage?.prompt_tokens ?? 0),
      outputTokens: Number(data?.usage?.output_tokens ?? data?.usage?.completion_tokens ?? 0)
    });

    const answer =
      data?.output_text ||
      data?.output?.[0]?.content?.[0]?.text ||
      "";
    const citedEclis = extractCitedEclis(answer);

    const canonicalResults = results.map((item) => ({
      ecli: String(item?.ecli || "").trim().toUpperCase(),
      title: String(item?.title || "").trim()
    }));

    const fromCitations = canonicalResults.filter((item) =>
      citedEclis.includes(item.ecli)
    );
    const fallbackSources = canonicalResults.filter((item) => item.ecli).slice(0, 3);
    const answerSources = (fromCitations.length ? fromCitations : fallbackSources)
      .slice(0, 5)
      .map((item) => ({ ecli: item.ecli, title: item.title }));

    await logRequestEnd(ctx, {
      status: 200,
      extra: { cited_ecli_count: answerSources.length }
    });
    return NextResponse.json({ answer, answerSources });
  } catch (error) {
    console.error("Answer route error:", error);
    await logProviderError("openai", {
      route: ctx.route,
      request_id: ctx.request_id,
      error_message: String(error?.message || "")
    });
    await reportError({
      ctx,
      error,
      status: 503,
      tags: { component: "answer_api" }
    });
    return jsonError(
      "Antwoord genereren is tijdelijk niet beschikbaar. Probeer het zo opnieuw.",
      503
    );
  }
}
