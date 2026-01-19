import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const EMBED_MODEL = process.env.EMBED_MODEL || "text-embedding-3-small";
const EMBED_DIM = Number(process.env.EMBED_DIM || 1536);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

const jsonError = (message, status) =>
  NextResponse.json({ error: message }, { status });

export async function POST(request) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !OPENAI_API_KEY) {
    return jsonError("Server is not configured for search.", 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid JSON payload.", 400);
  }

  const query = String(payload?.query || "").trim();
  if (!query) {
    return jsonError("Query is required.", 400);
  }

  const matchCount = Number(payload?.k || 40);

  try {
    const embedResponse = await fetch("https://api.openai.com/v1/embeddings", {
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
    });

    if (!embedResponse.ok) {
      const errorText = await embedResponse.text();
      console.error("Embeddings error:", embedResponse.status, errorText);
      return jsonError("Embedding request failed.", 500);
    }

    const embedJson = await embedResponse.json();
    const embedding = embedJson?.data?.[0]?.embedding;
    if (!Array.isArray(embedding)) {
      return jsonError("Embedding response missing data.", 500);
    }

    const { data, error } = await supabase.rpc("hybrid_search_chunks", {
      query,
      query_embedding: embedding,
      match_count: matchCount
    });

    if (error) {
      console.error("Supabase RPC error:", error);
      return jsonError("Search request failed.", 500);
    }

    const grouped = new Map();
    (data || []).forEach((row) => {
      const key = row.ecli || "";
      if (!key) {
        return;
      }
      const existing = grouped.get(key);
      if (!existing || row.score > existing.score) {
        grouped.set(key, {
          ecli: row.ecli,
          title: row.title,
          court: row.court,
          decision_date: row.decision_date,
          content: row.content,
          score: row.score
        });
      }
    });

    const results = Array.from(grouped.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search route error:", error);
    return jsonError("Unexpected error during search.", 500);
  }
}
