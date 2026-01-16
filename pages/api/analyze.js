import formidable from "formidable";
import fs from "fs/promises";
import path from "path";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import { runWorkflow } from "../../lib/openaiAgent";

export const config = {
  api: {
    bodyParser: false
  }
};

const readTextFile = async (filepath) => {
  return await fs.readFile(filepath, "utf-8");
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
    const form = formidable({ multiples: false });
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("Analyze API (pages): missing OPENAI_API_KEY");
      res.status(500).json({ error: "Serverconfiguratie ontbreekt." });
      return;
    }

    const { files } = await parseForm(req);
    const rawFile = files.file || Object.values(files)[0];
    const file = Array.isArray(rawFile) ? rawFile[0] : rawFile;

    if (!file) {
      console.error("Analyze API (pages): no file uploaded");
      res.status(400).json({ error: "Geen bestand ontvangen." });
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
      res.status(400).json({ error: "Het bestand bevat geen leesbare tekst." });
      return;
    }

    const result = await runWorkflow({ input_as_text: text });
    console.log("Agent response:", result.output_text);
    res.status(200).json({ output: result.output_text });
  } catch (error) {
    console.error("Analyze API (pages): unexpected error", error);
    res.status(500).json({ error: "Analyse mislukt. Probeer het opnieuw." });
  }
}
