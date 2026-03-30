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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const EMBED_MODEL = process.env.EMBED_MODEL || "text-embedding-3-small";
const EMBED_DIM = Number(process.env.EMBED_DIM || 1536);
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 20000);
const OPENAI_MAX_RETRIES = Number(process.env.OPENAI_MAX_RETRIES || 2);
const SUPABASE_TIMEOUT_MS = Number(process.env.SUPABASE_TIMEOUT_MS || 12000);
const SUPABASE_MAX_RETRIES = Number(process.env.SUPABASE_MAX_RETRIES || 2);
const SEARCH_MAX_BODY_BYTES = Number(process.env.SEARCH_MAX_BODY_BYTES || 16 * 1024);
const SEARCH_MAX_QUERY_CHARS = Number(process.env.SEARCH_MAX_QUERY_CHARS || 800);
const SEARCH_MAX_K = Number(process.env.SEARCH_MAX_K || 60);
const SEARCH_MAX_RETURN_RESULTS = Number(process.env.SEARCH_MAX_RETURN_RESULTS || 10);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

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

export async function POST(request) {
  const ctx = createRequestContext({ request, route: "/api/search" });
  logRequestStart(ctx);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !OPENAI_API_KEY) {
    await logRequestEnd(ctx, { status: 500 });
    return jsonError("Server is not configured for search.", 500);
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
    if (getContentLength(request) > SEARCH_MAX_BODY_BYTES) {
      await logRequestEnd(ctx, { status: 413 });
      return jsonError("Verzoek is te groot. Probeer een kortere zoekopdracht.", 413);
    }

    payload = await request.json();
  } catch {
    await logRequestEnd(ctx, { status: 400 });
    return jsonError("Invalid JSON payload.", 400);
  }

  const query = String(payload?.query || "").trim().slice(0, SEARCH_MAX_QUERY_CHARS);
  if (!query) {
    await logRequestEnd(ctx, { status: 400 });
    return jsonError("Query is required.", 400);
  }

  const requestedK = Number(payload?.k || 40);
  const matchCount = Number.isFinite(requestedK)
    ? Math.max(1, Math.min(SEARCH_MAX_K, Math.floor(requestedK)))
    : 40;

  try {
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
          input: query,
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
      console.error("Embeddings error:", embedResponse.status, errorText);
      await logProviderError("openai", {
        route: ctx.route,
        request_id: ctx.request_id,
        status: embedResponse.status
      });
      await logRequestEnd(ctx, { status: 503 });
      return jsonError("Zoeken is tijdelijk niet beschikbaar. Probeer het zo opnieuw.", 503);
    }

    const embedJson = await embedResponse.json();
    recordOpenAIUsage({
      model: EMBED_MODEL,
      inputTokens: Number(embedJson?.usage?.prompt_tokens ?? embedJson?.usage?.input_tokens ?? 0),
      outputTokens: 0
    });

    const embedding = embedJson?.data?.[0]?.embedding;
    if (!Array.isArray(embedding)) {
      await logProviderError("openai", {
        route: ctx.route,
        request_id: ctx.request_id,
        reason: "embedding_missing_data"
      });
      await logRequestEnd(ctx, { status: 503 });
      return jsonError("Zoekresultaten konden niet worden voorbereid. Probeer opnieuw.", 503);
    }

    const data = await callSearchRpc(query, embedding, matchCount);

    const grouped = new Map();
    (data || []).forEach((row) => {
      const key = row.ecli || "";
      if (!key) {
        return;
      }
      const existing = grouped.get(key);
      const rowScore = Number(row?.score ?? row?.similarity ?? row?.rank ?? 0);
      if (!existing || rowScore > existing.score) {
        grouped.set(key, {
          ecli: row.ecli,
          title: row?.title || row?.case_title || "",
          court: row?.court || row?.instantie || "",
          decision_date: row?.decision_date || row?.datum_uitspraak || "",
          content: row?.content || row?.chunk_text || row?.text || "",
          score: rowScore
        });
      }
    });

    const results = Array.from(grouped.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, SEARCH_MAX_RETURN_RESULTS);

    await logRequestEnd(ctx, {
      status: 200,
      extra: { result_count: results.length }
    });
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search route error:", error);
    const message = String(error?.message || "").toLowerCase();
    if (message.includes("supabase") || message.includes("pgrst") || message.includes("schema cache")) {
      await logProviderError("supabase", {
        route: ctx.route,
        request_id: ctx.request_id,
        error_message: String(error?.message || "")
      });
    } else if (message.includes("openai") || message.includes("abort")) {
      await logProviderError("openai", {
        route: ctx.route,
        request_id: ctx.request_id,
        error_message: String(error?.message || "")
      });
    }
    await reportError({
      ctx,
      error,
      status: 503,
      tags: { component: "search_api" }
    });
    return jsonError("Zoeken is tijdelijk niet beschikbaar. Probeer het zo opnieuw.", 503);
  }
}
