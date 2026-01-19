import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const RAG_MODEL = process.env.RAG_MODEL || "gpt-4o-mini";

const jsonError = (message, status) =>
  NextResponse.json({ error: message }, { status });

const buildSnippetBlock = (results) =>
  results
    .map((result, index) => {
      const snippet = String(result?.content || "").slice(0, 1200);
      const ecli = result?.ecli || "Onbekend";
      return `Snippet ${index + 1} (ECLI: ${ecli}):\n${snippet}`;
    })
    .join("\n\n");

export async function POST(request) {
  if (!OPENAI_API_KEY) {
    return jsonError("Server is not configured for answers.", 500);
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

  const results = Array.isArray(payload?.results) ? payload.results : [];
  if (!results.length) {
    return jsonError("Results are required to generate an answer.", 400);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Answer response error:", response.status, errorText);
      return jsonError("Answer request failed.", 500);
    }

    const data = await response.json();
    const answer =
      data?.output_text ||
      data?.output?.[0]?.content?.[0]?.text ||
      "";

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Answer route error:", error);
    return jsonError("Unexpected error during answer.", 500);
  }
}
