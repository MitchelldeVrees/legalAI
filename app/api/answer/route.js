import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const RAG_DOCS_TABLE = process.env.RAG_DOCS_TABLE || "jurisprudentie_sources";
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

const toSnippetText = (result) => {
  const content = String(result?.content || "").trim();
  if (content) {
    return content.slice(0, ANSWER_SNIPPET_MAX_CHARS);
  }

  const title = String(result?.title || "").trim();
  const court = String(result?.court || "").trim();
  const decisionDate = String(result?.decision_date || "").trim();
  const titleLine = title ? `Titel: ${title}` : "";
  const metaParts = [court, decisionDate].filter(Boolean);
  const metaLine = metaParts.length ? `Meta: ${metaParts.join(" | ")}` : "";
  const fallback = [titleLine, metaLine].filter(Boolean).join("\n");

  return fallback || "Geen inhoudelijk fragment beschikbaar voor deze uitspraak.";
};

const buildSnippetBlock = (results) =>
  results
    .map((result, index) => {
      const snippet = toSnippetText(result);
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

const toAnswerSources = (results, answer) => {
  const citedEclis = extractCitedEclis(answer);
  const canonicalResults = results.map((item) => ({
    ecli: String(item?.ecli || "").trim().toUpperCase(),
    title: String(item?.title || "").trim()
  }));

  return canonicalResults
    .filter((item) => citedEclis.includes(item.ecli))
    .slice(0, 5)
    .map((item) => ({ ecli: item.ecli, title: item.title }));
};

const buildStreamEvent = (payload) => `${JSON.stringify(payload)}\n`;

const extractDeltaTextFromEvent = (event) => {
  if (!event || typeof event !== "object") {
    return "";
  }
  if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
    return event.delta;
  }
  return "";
};

const buildDocumentSnippet = (row) => {
  const fullText = String(row?.full_text || "").trim();
  if (fullText) {
    return fullText;
  }

  const inhoudsindicatie = String(row?.inhoudsindicatie || "").trim();
  if (inhoudsindicatie) {
    return inhoudsindicatie;
  }

  return "";
};

const hydrateResultsWithDocumentContent = async (results) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return results;
  }

  const missingContentEclis = Array.from(
    new Set(
      results
        .filter((item) => !String(item?.content || "").trim())
        .map((item) => String(item?.ecli || "").trim())
        .filter(Boolean)
    )
  );

  if (!missingContentEclis.length) {
    return results;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
  });

  const { data, error } = await supabase
    .from(RAG_DOCS_TABLE)
    .select("*")
    .in("ecli", missingContentEclis);

  if (error) {
    throw new Error(`Failed to hydrate answer snippets: ${error.message}`);
  }

  const byEcli = new Map(
    (data || []).map((row) => [String(row?.ecli || "").trim().toUpperCase(), row])
  );

  return results.map((item) => {
    const existingContent = String(item?.content || "").trim();
    if (existingContent) {
      return item;
    }

    const ecli = String(item?.ecli || "").trim().toUpperCase();
    const row = byEcli.get(ecli);
    if (!row) {
      return item;
    }

    const hydratedContent = buildDocumentSnippet(row);
    return {
      ...item,
      title: String(item?.title || row?.title || row?.case_title || "").trim(),
      court: String(item?.court || row?.court || row?.instantie || "").trim(),
      decision_date: String(
        item?.decision_date || row?.decision_date || row?.datum_uitspraak || ""
      ).trim(),
      content: hydratedContent
    };
  });
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

  const wantsStream = payload?.stream !== false;

  try {
    let hydratedResults = results;
    try {
      hydratedResults = await hydrateResultsWithDocumentContent(results);
    } catch (hydrateError) {
      console.error("Answer hydration error:", hydrateError);
      await logProviderError("supabase", {
        route: ctx.route,
        request_id: ctx.request_id,
        error_message: String(hydrateError?.message || hydrateError || "")
      });
    }

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
          stream: wantsStream,
          input: [
            {
              role: "system",
              content:
                "Answer in Dutch using only the snippets. Cite ECLI(s) explicitly in the answer text. If the available snippets are insufficient, say that the available bronfragmenten are onvoldoende for a concrete conclusie. Do not claim that snippets were not provided."
            },
            {
              role: "user",
              content: `Vraag: ${query}\n\nSnippets:\n${buildSnippetBlock(
                hydratedResults
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

    if (!wantsStream) {
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
      const answerSources = toAnswerSources(hydratedResults, answer);

      await logRequestEnd(ctx, {
        status: 200,
        extra: { cited_ecli_count: answerSources.length }
      });
      return NextResponse.json({ answer, answerSources });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const upstream = response.body?.getReader();

    if (!upstream) {
      await logProviderError("openai", {
        route: ctx.route,
        request_id: ctx.request_id,
        reason: "missing_stream_body"
      });
      await logRequestEnd(ctx, { status: 503 });
      return jsonError(
        "Antwoord genereren is tijdelijk niet beschikbaar. Probeer het zo opnieuw.",
        503
      );
    }

    let answerBuffer = "";
    let streamBuffer = "";
    let usageInputTokens = 0;
    let usageOutputTokens = 0;

    const stream = new ReadableStream({
      start(controller) {
        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await upstream.read();
              if (done) {
                break;
              }

              streamBuffer += decoder.decode(value, { stream: true });
              const events = streamBuffer.split("\n\n");
              streamBuffer = events.pop() || "";

              for (const eventBlock of events) {
                const lines = eventBlock
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean);

                for (const line of lines) {
                  if (!line.startsWith("data:")) {
                    continue;
                  }

                  const raw = line.replace(/^data:\s*/, "");
                  if (!raw || raw === "[DONE]") {
                    continue;
                  }

                  let eventPayload = null;
                  try {
                    eventPayload = JSON.parse(raw);
                  } catch {
                    eventPayload = null;
                  }

                  const delta = extractDeltaTextFromEvent(eventPayload);
                  if (delta) {
                    answerBuffer += delta;
                    controller.enqueue(
                      encoder.encode(buildStreamEvent({ type: "delta", delta }))
                    );
                  }

                  if (eventPayload?.type === "response.completed") {
                    const usage = eventPayload?.response?.usage || {};
                    usageInputTokens = Number(
                      usage?.input_tokens ?? usage?.prompt_tokens ?? usageInputTokens
                    );
                    usageOutputTokens = Number(
                      usage?.output_tokens ?? usage?.completion_tokens ?? usageOutputTokens
                    );
                  }
                }
              }
            }

            recordOpenAIUsage({
              model: RAG_MODEL,
              inputTokens: usageInputTokens,
              outputTokens: usageOutputTokens
            });

            const answerSources = toAnswerSources(hydratedResults, answerBuffer);
            controller.enqueue(
              encoder.encode(buildStreamEvent({ type: "done", answerSources }))
            );
            controller.close();
            await logRequestEnd(ctx, {
              status: 200,
              extra: { cited_ecli_count: answerSources.length, streamed: true }
            });
          } catch (streamError) {
            await logProviderError("openai", {
              route: ctx.route,
              request_id: ctx.request_id,
              error_message: String(streamError?.message || streamError || "")
            });
            controller.enqueue(
              encoder.encode(
                buildStreamEvent({
                  type: "error",
                  message:
                    "Antwoord genereren is tijdelijk niet beschikbaar. Probeer het zo opnieuw."
                })
              )
            );
            controller.close();
            await reportError({
              ctx,
              error: streamError,
              status: 503,
              tags: { component: "answer_api_stream" }
            });
          }
        };

        void pump();
      }
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });
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
