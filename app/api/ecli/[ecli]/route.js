import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const RAG_DOCS_TABLE = process.env.RAG_DOCS_TABLE || "documents";

const jsonError = (message, status) =>
  NextResponse.json({ error: message }, { status });

const extractUitspraakHtml = (xml) => {
  if (!xml) {
    return "";
  }

  const uitspraakMatch = xml.match(/<uitspraak[\s\S]*<\/uitspraak>/i);
  if (!uitspraakMatch) {
    return "";
  }

  let section = uitspraakMatch[0];

  section = section.replace(/<\?xml[\s\S]*?\?>/gi, "");
  section = section.replace(
    /<uitspraak[^>]*>/i,
    '<section class="uitspraak-root">'
  );
  section = section.replace(/<\/uitspraak>/i, "</section>");

  section = section.replace(
    /<([a-zA-Z0-9]+)\.([a-zA-Z0-9]+)[^>]*>/g,
    '<div class="$1-$2">'
  );
  section = section.replace(/<\/([a-zA-Z0-9]+)\.([a-zA-Z0-9]+)>/g, "</div>");

  section = section.replace(/<para[^>]*>/g, "<p>");
  section = section.replace(/<\/para>/g, "</p>");

  return section.trim();
};

export async function GET(_request, { params }) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return jsonError("Server is not configured for search.", 500);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
  });

  const rawEcli = params?.ecli ? decodeURIComponent(params.ecli) : "";
  const ecli = String(rawEcli || "").trim();
  if (!ecli) {
    return jsonError("ECLI is required.", 400);
  }

  try {
    const { data, error } = await supabase
      .from(RAG_DOCS_TABLE)
      .select(
        "ecli,title,court,decision_date,publication_date,inhoudsindicatie,full_text,deeplink,raw_xml"
      )
      .eq("ecli", ecli)
      .maybeSingle();

    if (error) {
      console.error("Supabase fetch error:", error);
      return jsonError("Failed to load ECLI details.", 500);
    }

    if (!data) {
      return jsonError("ECLI not found.", 404);
    }

    let fetchedXml = "";
    try {
      const xmlResponse = await fetch(
        `https://data.rechtspraak.nl/uitspraken/content?id=${encodeURIComponent(
          ecli
        )}`,
        { method: "GET" }
      );
      if (xmlResponse.ok) {
        fetchedXml = await xmlResponse.text();
      } else {
        const errorText = await xmlResponse.text();
        console.error(
          "Rechtspraak XML fetch failed:",
          xmlResponse.status,
          errorText
        );
      }
    } catch (fetchError) {
      console.error("Rechtspraak XML fetch error:", fetchError);
    }

    const sourceXml = fetchedXml || data.raw_xml || "";
    const uitspraakHtml = extractUitspraakHtml(sourceXml);

    return NextResponse.json({
      ecli,
      title: data.title || "",
      court: data.court || "",
      decision_date: data.decision_date || "",
      publication_date: data.publication_date || "",
      inhoudsindicatie: data.inhoudsindicatie || "",
      deeplink: data.deeplink || "",
      uitspraak_html: uitspraakHtml,
      raw_xml: sourceXml,
      content: data.full_text ? [data.full_text] : []
    });
  } catch (error) {
    console.error("ECLI route error:", error);
    return jsonError("Unexpected error while loading ECLI.", 500);
  }
}
