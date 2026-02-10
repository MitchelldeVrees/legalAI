import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { gunzipSync } from "zlib";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const RAG_DOCS_TABLE = process.env.RAG_DOCS_TABLE || "jurisprudentie_sources";
const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING ||
  process.env.ZURE_STORAGE_CONNECTION_STRING ||
  "";
const AZURE_ECLI_CONTAINER = process.env.AZURE_ECLI_CONTAINER || "jurisprudentie";

const jsonError = (message, status) =>
  NextResponse.json({ error: message }, { status });

const parseAzureConnectionString = (value) => {
  const parts = String(value || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  const map = {};
  parts.forEach((part) => {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex === -1) {
      return;
    }
    const key = part.slice(0, separatorIndex);
    const rawValue = part.slice(separatorIndex + 1);
    map[key] = rawValue;
  });
  return {
    accountName: map.AccountName || "",
    accountKey: map.AccountKey || "",
    endpointSuffix: map.EndpointSuffix || "core.windows.net",
    protocol: map.DefaultEndpointsProtocol || "https"
  };
};

const getSourceLinkFromRow = (row) => {
  const candidateFields = [
    "azure_blob_url",
    "source_url",
    "source_link",
    "blob_url",
    "url",
    "deeplink",
    "xml_url",
    "link"
  ];
  for (const field of candidateFields) {
    const candidate = String(row?.[field] || "").trim();
    if (candidate) {
      return candidate;
    }
  }
  return "";
};

const normalizeBlobPath = (sourceLink, containerName) => {
  const raw = String(sourceLink || "").trim();
  if (!raw) {
    return "";
  }

  if (!/^https?:\/\//i.test(raw)) {
    return raw.replace(/^\/+/, "");
  }

  try {
    const parsed = new URL(raw);
    const path = parsed.pathname.replace(/^\/+/, "");
    const containerPrefix = `${containerName}/`;
    if (path.toLowerCase().startsWith(containerPrefix.toLowerCase())) {
      return path.slice(containerPrefix.length);
    }
    return path;
  } catch {
    return "";
  }
};

const buildSignedAzureHeaders = ({ accountName, accountKey, resourcePath }) => {
  const utcDate = new Date().toUTCString();
  const xMsVersion = "2023-11-03";
  const canonicalizedHeaders = `x-ms-date:${utcDate}\nx-ms-version:${xMsVersion}\n`;
  const canonicalizedResource = `/${accountName}/${resourcePath}`;
  const stringToSign =
    "GET\n\n\n\n\n\n\n\n\n\n\n\n" +
    canonicalizedHeaders +
    canonicalizedResource;

  const signature = crypto
    .createHmac("sha256", Buffer.from(accountKey, "base64"))
    .update(stringToSign, "utf8")
    .digest("base64");

  return {
    "x-ms-date": utcDate,
    "x-ms-version": xMsVersion,
    Authorization: `SharedKey ${accountName}:${signature}`
  };
};

const fetchAzureBlob = async ({
  accountName,
  accountKey,
  endpointSuffix,
  protocol,
  containerName,
  blobPath
}) => {
  const encodedPath = blobPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const url = `${protocol}://${accountName}.blob.${endpointSuffix}/${containerName}/${encodedPath}`;

  const headers = buildSignedAzureHeaders({
    accountName,
    accountKey,
    resourcePath: `${containerName}/${blobPath}`
  });

  const response = await fetch(url, { method: "GET", headers });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Azure fetch failed (${response.status}): ${errorBody.slice(0, 300)}`
    );
  }

  return Buffer.from(await response.arrayBuffer());
};

const fetchXmlFromSource = async (sourceLink) => {
  const azureConfig = parseAzureConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerName = String(AZURE_ECLI_CONTAINER || "jurisprudentie").trim();

  let payloadBuffer = null;

  if (/^https?:\/\//i.test(sourceLink)) {
    const directResponse = await fetch(sourceLink, { method: "GET" });
    if (directResponse.ok) {
      payloadBuffer = Buffer.from(await directResponse.arrayBuffer());
    } else if (!azureConfig.accountName || !azureConfig.accountKey) {
      throw new Error(
        `Directe blob download mislukt (${directResponse.status}) en Azure credentials ontbreken.`
      );
    }
  }

  if (!payloadBuffer) {
    if (!azureConfig.accountName || !azureConfig.accountKey) {
      throw new Error("Azure credentials ontbreken voor private blob download.");
    }
    const blobPath = normalizeBlobPath(sourceLink, containerName);
    if (!blobPath) {
      throw new Error("Azure blob pad ontbreekt.");
    }
    payloadBuffer = await fetchAzureBlob({
      ...azureConfig,
      containerName,
      blobPath
    });
  }

  const lowerSource = String(sourceLink || "").toLowerCase();
  const looksGzipped = lowerSource.endsWith(".gz");
  if (looksGzipped) {
    return gunzipSync(payloadBuffer).toString("utf-8");
  }

  try {
    return gunzipSync(payloadBuffer).toString("utf-8");
  } catch {
    return payloadBuffer.toString("utf-8");
  }
};

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
      .select("*")
      .eq("ecli", ecli)
      .maybeSingle();

    if (error) {
      console.error("Supabase fetch error:", error);
      return jsonError("Failed to load ECLI details.", 500);
    }

    if (!data) {
      return jsonError("ECLI not found.", 404);
    }

    const sourceLink = getSourceLinkFromRow(data);
    let fetchedXml = "";
    let sourceFetchError = "";
    if (sourceLink) {
      try {
        fetchedXml = await fetchXmlFromSource(sourceLink);
      } catch (fetchError) {
        console.error("Azure XML fetch error:", fetchError);
        sourceFetchError = String(fetchError?.message || fetchError || "");
      }
    }

    const sourceXml = fetchedXml || data.raw_xml || "";
    if (!sourceXml) {
      const reason = sourceFetchError
        ? `Bronbestand niet opgehaald: ${sourceFetchError}`
        : "Geen XML gevonden in bronlink of database.";
      return jsonError(reason, 502);
    }
    const uitspraakHtml = extractUitspraakHtml(sourceXml);

    return NextResponse.json({
      ecli,
      title: data.title || "",
      court: data.court || "",
      decision_date: data.decision_date || "",
      publication_date: data.publication_date || "",
      inhoudsindicatie: data.inhoudsindicatie || "",
      deeplink: data.deeplink || "",
      source_link: sourceLink,
      uitspraak_html: uitspraakHtml,
      raw_xml: sourceXml,
      content: data.full_text ? [data.full_text] : []
    });
  } catch (error) {
    console.error("ECLI route error:", error);
    return jsonError("Unexpected error while loading ECLI.", 500);
  }
}
