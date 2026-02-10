"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardShell from "../components/DashboardShell";

const allowedExtensions = [".pdf", ".docx"];
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const getExtension = (filename) => {
  const trimmed = String(filename || "").trim();
  const dotIndex = trimmed.lastIndexOf(".");
  if (dotIndex === -1) {
    return "";
  }
  return trimmed.slice(dotIndex).toLowerCase();
};

const isAllowedFile = (file) => {
  if (!file) {
    return false;
  }
  const extension = getExtension(file.name);
  if (extension && allowedExtensions.includes(extension)) {
    return true;
  }
  const mime = String(file.type || "").toLowerCase();
  return allowedMimeTypes.has(mime);
};

const formatBytes = (value) => {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  return `${(kb / 1024).toFixed(1)} MB`;
};

const normalizeSpaces = (value) => String(value || "").replace(/\s+/g, " ").trim();

const escapeRegExp = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getTwoSentenceContext = (text, quote) => {
  const normalizedText = normalizeSpaces(text);
  const normalizedQuote = normalizeSpaces(quote);
  if (!normalizedText) {
    return "";
  }

  const sentences = normalizedText
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (!sentences.length) {
    return normalizedText;
  }

  const quoteLower = normalizedQuote.toLowerCase();
  let index = sentences.findIndex((sentence) => sentence.toLowerCase().includes(quoteLower));

  if (index === -1 && quoteLower) {
    const probe = quoteLower.split(" ").slice(0, 6).join(" ");
    if (probe) {
      index = sentences.findIndex((sentence) => sentence.toLowerCase().includes(probe));
    }
  }

  if (index === -1) {
    index = 0;
  }

  const start = Math.max(0, index - 2);
  const end = Math.min(sentences.length - 1, index + 2);
  return sentences.slice(start, end + 1).join(" ");
};

const getFirstSentences = (text, count = 5) => {
  const normalized = normalizeSpaces(text);
  if (!normalized) {
    return "";
  }
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  return sentences.slice(0, count).join(" ");
};

export default function DocumentUploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: ""
  });
  const [serverInfo, setServerInfo] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeSourceId, setActiveSourceId] = useState("");

  const findings = analysisResult?.findings || null;
  const documentText = String(analysisResult?.documentText || "");
  const relatedCases = Array.isArray(analysisResult?.relatedCases)
    ? analysisResult.relatedCases
    : [];
  const bronnen = Array.isArray(findings?.bronnen) ? findings.bronnen : [];

  const sourceById = useMemo(
    () =>
      new Map(
        bronnen
          .map((bron) => ({
            id: String(bron?.id || "").trim(),
            type: String(bron?.type || "").trim(),
            ref: String(bron?.ref || "").trim(),
            loc: String(bron?.loc || "").trim(),
            quote: String(bron?.quote || "").trim()
          }))
          .filter((bron) => bron.id)
          .map((bron) => [bron.id, bron])
      ),
    [bronnen]
  );

  const selectedSource = activeSourceId ? sourceById.get(activeSourceId) : null;

  const resolveEcliCase = (source) => {
    if (!source) {
      return null;
    }

    const ref = String(source.ref || "").trim().toUpperCase();
    if (ref.startsWith("ECLI:")) {
      const byRef = relatedCases.find(
        (item) => String(item?.ecli || "").trim().toUpperCase() === ref
      );
      if (byRef) {
        return byRef;
      }
    }

    const loc = String(source.loc || "");
    const match = loc.match(/resultaatIndex:(\d+)/i);
    if (!match) {
      return null;
    }

    const rawIndex = Number(match[1]);
    if (!Number.isFinite(rawIndex)) {
      return null;
    }

    const candidates = rawIndex === 0 ? [0] : [rawIndex, rawIndex - 1];
    for (const candidate of candidates) {
      if (candidate >= 0 && candidate < relatedCases.length) {
        return relatedCases[candidate];
      }
    }

    return null;
  };

  const selectedEcliCase = useMemo(
    () =>
      selectedSource && String(selectedSource.type || "").toLowerCase() === "ecli"
        ? resolveEcliCase(selectedSource)
        : null,
    [selectedSource, relatedCases]
  );

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setActiveSourceId("");
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const modalContext = useMemo(() => {
    if (!selectedSource) {
      return "";
    }

    const quote = String(selectedSource.quote || "");
    if (!quote) {
      return "";
    }

    const sourceType = String(selectedSource.type || "").toLowerCase();
    if (sourceType === "document") {
      return getTwoSentenceContext(documentText, quote);
    }

    if (sourceType === "ecli") {
      if (selectedEcliCase?.content_excerpt) {
        const excerpt = String(selectedEcliCase.content_excerpt || "");
        const context = getTwoSentenceContext(excerpt, quote);
        if (context && context !== excerpt) {
          return context;
        }
        return getFirstSentences(excerpt, 5) || context || quote;
      }
    }

    return quote;
  }, [selectedSource, documentText, selectedEcliCase]);

  const highlightedContextParts = useMemo(() => {
    if (!selectedSource || !modalContext) {
      return [{ hit: false, text: "" }];
    }

    const quote = normalizeSpaces(selectedSource.quote);
    if (!quote) {
      return [{ hit: false, text: modalContext }];
    }

    const pattern = new RegExp(escapeRegExp(quote), "i");
    const match = modalContext.match(pattern);
    if (!match) {
      return [{ hit: false, text: modalContext }];
    }

    const start = match.index || 0;
    const end = start + match[0].length;

    return [
      { hit: false, text: modalContext.slice(0, start) },
      { hit: true, text: modalContext.slice(start, end) },
      { hit: false, text: modalContext.slice(end) }
    ];
  }, [selectedSource, modalContext]);

  const renderSourceIds = (sourceIds) => {
    const validIds = Array.isArray(sourceIds)
      ? sourceIds
          .map((id) => String(id || "").trim())
          .filter((id) => sourceById.has(id))
      : [];

    if (!validIds.length) {
      return <p className="search-note">Geen bronverwijzing.</p>;
    }

    return (
      <div>
        <p className="search-note">Bronnen:</p>
        <div className="results-actions" style={{ justifyContent: "flex-start", gap: 8 }}>
          {validIds.map((id) => (
            <button
              key={id}
              type="button"
              className="ghost"
              onClick={() => setActiveSourceId(id)}
            >
              {id}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setActiveSourceId("");
    setAnalysisResult(null);
    setServerInfo("");
    setStatus({ loading: false, error: "", success: "" });

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!isAllowedFile(file)) {
      setSelectedFile(null);
      setStatus({
        loading: false,
        error: "Alleen PDF of Word documenten (.docx) zijn toegestaan.",
        success: ""
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setStatus({
        loading: false,
        error: "Selecteer eerst een document om te uploaden.",
        success: ""
      });
      return;
    }

    setStatus({ loading: true, error: "", success: "" });
    setServerInfo("");
    setActiveSourceId("");
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/document-upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Upload failed.";
        const looksLikeHtml =
          String(errorText || "")
            .trim()
            .toLowerCase()
            .startsWith("<!doctype html");

        if (response.status === 404) {
          errorMessage =
            "API endpoint /api/document-upload bestaat niet op de actieve server. Herstart de Next.js dev server.";
        } else if (looksLikeHtml) {
          errorMessage = `Serverfout (${response.status}). Controleer de serverlogs.`;
        }

        try {
          const parsedError = looksLikeHtml ? null : JSON.parse(errorText);
          if (!errorMessage.includes("/api/document-upload") && parsedError?.error) {
            errorMessage = parsedError.error;
          }
        } catch {
          if (!looksLikeHtml) {
            errorMessage = errorText || errorMessage;
          }
        }

        console.error("Document upload failed:", response.status, errorText);
        throw new Error(errorMessage);
      }

      const data = await response.json().catch(() => ({}));
      const metaParts = [];

      if (data?.file?.filename) {
        metaParts.push(`Bestand: ${data.file.filename}`);
      }

      if (typeof data?.file?.size === "number") {
        const formatted = formatBytes(data.file.size);
        if (formatted) {
          metaParts.push(`Grootte: ${formatted}`);
        }
      }

      if (typeof data?.extractedTextLength === "number") {
        metaParts.push(`Tekst: ${data.extractedTextLength} tekens`);
      }

      setServerInfo(metaParts.join(" | "));
      setAnalysisResult({
        findings: data?.findings || null,
        relatedCases: Array.isArray(data?.relatedCases) ? data.relatedCases : [],
        documentText: String(data?.documentText || "")
      });
      setStatus({
        loading: false,
        error: "",
        success: "Document geanalyseerd."
      });
    } catch (error) {
      console.error("Document upload error:", error);
      setStatus({
        loading: false,
        error: error?.message || "Upload mislukt. Probeer het opnieuw.",
        success: ""
      });
    }
  };

  const renderCases = () => {
    const cases = relatedCases;
    if (!cases.length) {
      return <p className="search-note">Geen gerelateerde jurisprudentie gevonden.</p>;
    }

    return (
      <div className="results-list">
        {cases.map((item, index) => {
          const ecliValue = item?.ecli || "";
          const ecliHref = ecliValue
            ? `/jurispudentie/${encodeURIComponent(ecliValue)}`
            : "";

          return (
            <div className="result-item" key={`${ecliValue}-${index}`}>
              <div className="result-header">
                <div>
                  {ecliHref ? (
                    <Link className="result-link" href={ecliHref}>
                      <strong>{ecliValue}</strong>
                    </Link>
                  ) : (
                    <strong>Onbekende ECLI</strong>
                  )}
                  <p className="result-meta">{item?.title || "Onbekende uitspraak"}</p>
                </div>
                <span className="score-chip">
                  {typeof item?.score === "number" ? item.score.toFixed(3) : "n.v.t."}
                </span>
              </div>
              <p className="search-note">
                {item?.court || "Rechtbank onbekend"} | {item?.decision_date || "Datum onbekend"}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <DashboardShell
      title="Documenten uploaden"
      sidebarItems={[
        { label: "Contract reader", href: "/dashboard" },
        { label: "Documenten uploaden", active: true },
        { label: "Jurispudentie search", href: "/jurispudentie-search" },
        { label: "Vraag stellen", href: "/vraag-stellen" }
      ]}
    >
      <div className="form-card dashboard-card">
        <p className="eyebrow">Documenten</p>
        <h2>Upload een Word of PDF document</h2>
        <p className="lead">
          Voeg een document toe aan je dossier. We analyseren het document en
          tonen direct relevante jurisprudentie en verweerinzichten.
        </p>
        <div className="dashboard-actions">
          <label className="cta" htmlFor="document-upload">
            Kies document
          </label>
          <input
            id="document-upload"
            className="file-input"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
          />
          <button
            className="ghost"
            type="button"
            onClick={handleUpload}
            disabled={status.loading}
            aria-busy={status.loading}
          >
            {status.loading ? "Analyseren..." : "Verstuur document"}
          </button>
        </div>
        {selectedFile ? <p className="file-meta">Geselecteerd: {selectedFile.name}</p> : null}
        <p className="search-note">Toegestane bestandstypes: PDF, DOCX.</p>
        {status.error ? <p className="form-error">{status.error}</p> : null}
        {status.success ? <p className="form-success">{status.success}</p> : null}
        {serverInfo ? <p className="file-meta">{serverInfo}</p> : null}
      </div>

      {findings ? (
        <>
          <div className="form-card results-card">
            <p className="eyebrow">Dossier analyse</p>
            {findings.zaak_samenvatting || findings.summary ? (
              <div className="analysis-output answer-output">
                <p>{findings.zaak_samenvatting || findings.summary}</p>
              </div>
            ) : (
              <p className="search-note">Geen samenvatting ontvangen.</p>
            )}
          </div>

          <div className="form-card results-card">
            <p className="eyebrow">Top 10 gerelateerde jurisprudentie</p>
            {renderCases()}
          </div>

          <div className="form-card results-card">
            <p className="eyebrow">Kernfeiten</p>
            {Array.isArray(findings.kernfeiten) && findings.kernfeiten.length ? (
              <div className="results-list">
                {findings.kernfeiten.map((item, index) => (
                  <div className="result-item" key={`kernfeit-${index}`}>
                    <p className="result-snippet">{item.tekst || "-"}</p>
                    {renderSourceIds(item.source_ids)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="search-note">Geen kernfeiten gevonden.</p>
            )}
          </div>

          <div className="form-card results-card">
            <p className="eyebrow">Juridische issues</p>
            {Array.isArray(findings.juridische_issues) && findings.juridische_issues.length ? (
              <div className="results-list">
                {findings.juridische_issues.map((item, index) => (
                  <div className="result-item" key={`issue-${index}`}>
                    <p className="result-snippet">
                      <strong>{item.issue || "-"}</strong>
                    </p>
                    <p className="result-snippet">{item.toelichting || ""}</p>
                    {renderSourceIds(item.source_ids)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="search-note">Geen juridische issues gevonden.</p>
            )}
          </div>

          <div className="form-card results-card">
            <p className="eyebrow">Weakpoints in het verhaal</p>
            {Array.isArray(findings.zwakke_punten) && findings.zwakke_punten.length ? (
              <div className="results-list">
                {findings.zwakke_punten.map((item, index) => (
                  <div className="result-item" key={`weak-${index}`}>
                    <p className="result-snippet">{item.punt || "-"}</p>
                    {renderSourceIds(item.source_ids)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="search-note">Geen weakpoints gevonden.</p>
            )}
          </div>

          <div className="form-card results-card">
            <p className="eyebrow">Onduidelijkheden</p>
            {Array.isArray(findings.onduidelijkheden) && findings.onduidelijkheden.length ? (
              <div className="results-list">
                {findings.onduidelijkheden.map((item, index) => (
                  <div className="result-item" key={`unclear-${index}`}>
                    <p className="result-snippet">
                      <strong>{item.punt || "-"}</strong>
                    </p>
                    <p className="result-snippet">{item.impact || ""}</p>
                    {renderSourceIds(item.source_ids)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="search-note">Geen onduidelijkheden gevonden.</p>
            )}
          </div>

          <div className="form-card results-card">
            <p className="eyebrow">Extra vragen voor beter verweer</p>
            {Array.isArray(findings.extra_vragen_verweer) && findings.extra_vragen_verweer.length ? (
              <div className="results-list">
                {findings.extra_vragen_verweer.map((item, index) => (
                  <div className="result-item" key={`question-${index}`}>
                    <p className="result-snippet">
                      <strong>{item.vraag || "-"}</strong>
                    </p>
                    <p className="result-snippet">
                      Waarom: {item.waarom || "-"} | Prioriteit: {item.prioriteit || "-"}
                    </p>
                    {renderSourceIds(item.source_ids)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="search-note">Geen extra vragen gevonden.</p>
            )}
          </div>

          <div className="form-card results-card">
            <p className="eyebrow">Verweerstrategie aanzet</p>
            {Array.isArray(findings.verweerstrategie_aanzet) && findings.verweerstrategie_aanzet.length ? (
              <div className="results-list">
                {findings.verweerstrategie_aanzet.map((item, index) => (
                  <div className="result-item" key={`strategy-${index}`}>
                    <p className="result-snippet">{item.strategie || "-"}</p>
                    {renderSourceIds(item.source_ids)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="search-note">Geen strategie-aanzet gevonden.</p>
            )}
          </div>

          <div className="form-card results-card">
            <p className="eyebrow">2 extra nuttige punten</p>
            {Array.isArray(findings.extra_nuttig_voor_advocaat) && findings.extra_nuttig_voor_advocaat.length ? (
              <div className="results-list">
                {findings.extra_nuttig_voor_advocaat.map((item, index) => (
                  <div className="result-item" key={`helpful-${index}`}>
                    <strong>{item.title || "Aanbeveling"}</strong>
                    <p className="result-snippet">{item.explanation || "Geen toelichting."}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="search-note">Geen extra punten gevonden.</p>
            )}
          </div>

          <div className="form-card results-card">
            <p className="eyebrow">Bronnen</p>
            {bronnen.length ? (
              <div className="results-list">
                {bronnen.map((bron) => (
                  <div className="result-item" key={bron.id}>
                    <p className="result-snippet">
                      <strong>{bron.id}</strong> | {bron.type} | {bron.ref} | {bron.loc}
                    </p>
                    <button type="button" className="ghost" onClick={() => setActiveSourceId(bron.id)}>
                      Open broncontext
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="search-note">Geen bronnen gevonden.</p>
            )}
          </div>
        </>
      ) : null}

      {selectedSource ? (
        <div className="source-modal-backdrop" onClick={() => setActiveSourceId("")}> 
          <div
            className="source-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Bron context"
          >
            <div className="result-header">
              <div>
                <p className="eyebrow">Bron context</p>
                <p className="result-meta">
                  <strong>{selectedSource.id}</strong> | {selectedSource.type} | {selectedSource.ref} | {selectedSource.loc}
                </p>
                {selectedEcliCase?.ecli ? (
                  <p className="result-meta">
                    <Link
                      className="result-link"
                      href={`/jurispudentie/${encodeURIComponent(selectedEcliCase.ecli)}`}
                    >
                      Open volledige jurisprudentie: {selectedEcliCase.ecli}
                    </Link>
                  </p>
                ) : null}
                {selectedEcliCase?.title ? (
                  <p className="result-meta">
                    {selectedEcliCase.title}
                    {selectedEcliCase.court ? ` | ${selectedEcliCase.court}` : ""}
                    {selectedEcliCase.decision_date ? ` | ${selectedEcliCase.decision_date}` : ""}
                  </p>
                ) : null}
              </div>
              <button type="button" className="ghost" onClick={() => setActiveSourceId("")}>Sluiten</button>
            </div>
            <div className="analysis-output">
              <p className="search-note">Twee zinnen voor en twee zinnen na de bronquote.</p>
              <p>
                {highlightedContextParts.map((part, index) =>
                  part.hit ? <mark key={`mark-${index}`}>{part.text}</mark> : <span key={`txt-${index}`}>{part.text}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
