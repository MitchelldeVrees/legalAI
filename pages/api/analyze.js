import formidable from "formidable";
import fs from "fs/promises";
import path from "path";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import { runWorkflow } from "../../lib/openaiAgent";
import { requireAuthenticatedAccount } from "../../lib/serverApiAuth";
import {
  createRequestContext,
  logProviderError,
  logRequestEnd,
  logRequestStart,
  reportError
} from "../../lib/observability";

export const config = {
  api: {
    bodyParser: false
  }
};

const MAX_UPLOAD_FILE_SIZE_BYTES = Number(
  process.env.ANALYZE_MAX_UPLOAD_FILE_SIZE_BYTES || 8 * 1024 * 1024
);
const MAX_ANALYZE_CHARS = Number(process.env.ANALYZE_MAX_CHARS || 30000);

const readTextFile = async (filepath) => {
  return await fs.readFile(filepath, "utf-8");
};

const limitText = (value, maxChars) => {
  const text = String(value || "");
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}\n\n[Ingekort vanwege lengte]`;
};

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

const extractText = async (file) => {
  const mime = file.mimetype || "";
  const filename = file.originalFilename || "";
  const ext = path.extname(filename).toLowerCase();

  if (
    mime === "application/pdf" ||
    mime === "application/octet-stream" ||
    ext === ".pdf"
  ) {
    const buffer = await fs.readFile(file.filepath);
    const parsed = await pdf(buffer);
    return parsed.text || "";
  }

  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === ".docx"
  ) {
    const buffer = await fs.readFile(file.filepath);
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value || "";
  }

  return await readTextFile(file.filepath);
};

const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = formidable({
      multiples: false,
      maxFiles: 1,
      maxFileSize: MAX_UPLOAD_FILE_SIZE_BYTES
    });
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });

const ANALYZE_TIMEOUT_MS = Number(process.env.ANALYZE_TIMEOUT_MS || 45000);

const withTimeout = async (promise, timeoutMs) => {
  let timer = null;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("ANALYZE_TIMEOUT")), timeoutMs);
      })
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

export default async function handler(req, res) {
  const ctx = createRequestContext({ request: req, route: "/api/analyze" });
  logRequestStart(ctx);
  let loggedEnd = false;
  const respond = async (status, payload, extra = {}) => {
    if (!loggedEnd) {
      await logRequestEnd(ctx, { status, extra });
      loggedEnd = true;
    }
    res.status(status).json(payload);
  };

  if (req.method !== "POST") {
    await respond(405, { error: "Method not allowed" });
    return;
  }

  let file = null;
  try {
    const auth = await requireAuthenticatedAccount(req.headers);
    if (!auth.ok) {
      await respond(auth.status, { error: auth.error }, { auth_error: true });
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("Analyze API (pages): missing OPENAI_API_KEY");
      await logProviderError("openai", {
        route: ctx.route,
        request_id: ctx.request_id,
        reason: "missing_api_key"
      });
      await respond(500, { error: "Serverconfiguratie ontbreekt." });
      return;
    }

    const { files } = await parseForm(req);
    const rawFile = files.file || Object.values(files)[0];
    file = Array.isArray(rawFile) ? rawFile[0] : rawFile;

    if (!file) {
      console.error("Analyze API (pages): no file uploaded");
      await respond(400, { error: "Geen bestand ontvangen." });
      return;
    }

    console.log("Analyze API (pages): received file", {
      filename: file.originalFilename,
      mime: file.mimetype,
      size: file.size
    });

    const text = await extractText(file);

    if (!text.trim()) {
      console.error("Analyze API (pages): extracted empty text", {
        filename: file.originalFilename,
        type: file.mimetype
      });
      await respond(400, { error: "Het bestand bevat geen leesbare tekst." });
      return;
    }

    const result = await withTimeout(
      runWorkflow({ input_as_text: limitText(text, MAX_ANALYZE_CHARS) }),
      ANALYZE_TIMEOUT_MS
    );
    console.log("Agent response:", result.output_text);
    await respond(200, { output: result.output_text }, { text_length: text.length });
  } catch (error) {
    console.error("Analyze API (pages): unexpected error", error);
    if (error?.message === "ANALYZE_TIMEOUT") {
      await logProviderError("openai", {
        route: ctx.route,
        request_id: ctx.request_id,
        reason: "analyze_timeout"
      });
      await respond(504, {
        error: "Analyse duurde te lang. Probeer het opnieuw met een korter document."
      });
      return;
    }
    await logProviderError("openai", {
      route: ctx.route,
      request_id: ctx.request_id,
      error_message: String(error?.message || "")
    });
    await reportError({
      ctx,
      error,
      status: 500,
      tags: { component: "analyze_api" }
    });
    loggedEnd = true;
    res.status(500).json({ error: "Analyse mislukt. Probeer het opnieuw." });
  } finally {
    await cleanupTempFile(file);
  }
}
