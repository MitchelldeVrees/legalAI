"use client";

import { useState } from "react";
import DashboardShell from "../components/DashboardShell";
import { buildRechtspraakDetailUrl } from "../../lib/rechtspraak";
import { buildAuthenticatedHeaders } from "../../lib/clientApiAuth";

export default function JurispudentieSearchPage() {
  const [searchStatus, setSearchStatus] = useState({
    loading: false,
    error: ""
  });
  const [answerStatus, setAnswerStatus] = useState({
    loading: false,
    error: ""
  });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [answer, setAnswer] = useState("");
  const [answerSources, setAnswerSources] = useState([]);
  const visibleResults = results.filter((result) => String(result?.ecli || "").trim());

  const readAnswerResponse = async (response) => {
    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("application/x-ndjson")) {
      const data = await response.json();
      setAnswer(data?.answer || "");
      setAnswerSources(Array.isArray(data?.answerSources) ? data.answerSources : []);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Missing response body.");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    const handleLine = (line) => {
      const trimmed = String(line || "").trim();
      if (!trimmed) {
        return "";
      }

      let event = null;
      try {
        event = JSON.parse(trimmed);
      } catch {
        return "";
      }

      if (event?.type === "delta" && typeof event.delta === "string") {
        return event.delta;
      }
      if (event?.type === "done") {
        setAnswerSources(
          Array.isArray(event?.answerSources) ? event.answerSources : []
        );
      }
      if (event?.type === "error") {
        throw new Error(event?.message || "Antwoord stream fout.");
      }
      return "";
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let chunkDelta = "";
      for (const line of lines) {
        chunkDelta += handleLine(line);
      }
      if (chunkDelta) {
        setAnswer((prev) => prev + chunkDelta);
      }
    }

    const trailing = buffer.trim();
    if (trailing) {
      const delta = handleLine(trailing);
      if (delta) {
        setAnswer((prev) => prev + delta);
      }
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setSearchStatus({ loading: false, error: "Vul een zoekopdracht in." });
      return;
    }

    setSearchStatus({ loading: true, error: "" });
    setAnswerStatus({ loading: false, error: "" });
    setAnswer("");
    setAnswerSources([]);

    try {
      const headers = await buildAuthenticatedHeaders({
        "Content-Type": "application/json"
      });
      const response = await fetch("/api/search", {
        method: "POST",
        headers,
        body: JSON.stringify({ query: trimmedQuery, k: 6 })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Search request failed:", response.status, errorText);
        throw new Error("Search failed.");
      }

      const data = await response.json();
      setResults(Array.isArray(data?.results) ? data.results : []);
      setSearchStatus({ loading: false, error: "" });
    } catch (error) {
      console.error("Search request error:", error);
      setSearchStatus({
        loading: false,
        error: "Zoeken mislukt. Probeer het opnieuw."
      });
    }
  };

  const handleGenerateAnswer = async () => {
    if (!visibleResults.length) {
      return;
    }

    setAnswerStatus({ loading: true, error: "" });
    setAnswer("");
    setAnswerSources([]);

    try {
      const headers = await buildAuthenticatedHeaders({
        "Content-Type": "application/json"
      });
      const response = await fetch("/api/answer", {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: query.trim(),
          results: visibleResults,
          stream: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Answer request failed:", response.status, errorText);
        throw new Error("Answer failed.");
      }

      await readAnswerResponse(response);
      setAnswerStatus({ loading: false, error: "" });
    } catch (error) {
      console.error("Answer request error:", error);
      setAnswerStatus({
        loading: false,
        error: "Antwoord genereren mislukt. Probeer het opnieuw."
      });
    }
  };

  const getSnippet = (text) => {
    const snippet = String(text || "").trim();
    if (!snippet) {
      return "";
    }
    return snippet.length > 240 ? `${snippet.slice(0, 240)}...` : snippet;
  };

  return (
    <DashboardShell
      title="Jurisprudentie search"
      sidebarItems={[
        { label: "Contract reader", href: "/dashboard" },
        { label: "Jurispudentie search", active: true },
        { label: "Vraag stellen", href: "/vraag-stellen" }
      ]}
    >
      <div className="form-card search-card">
        <p className="eyebrow">Jurisprudentie</p>
        <h2>Vind relevante uitspraken</h2>
        <p className="lead">
          Zoek in jurisprudentie en ontdek direct relevante uitspraken.
        </p>
        <form className="search-form" role="search" onSubmit={handleSearch}>
          <label className="search-label" htmlFor="jurisprudentie-query">
            Zoekopdracht
          </label>
          <div className="search-row">
            <input
              id="jurisprudentie-query"
              name="q"
              type="search"
              className="search-input"
              placeholder="Zoek op jurisprudentie"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              className={`cta ${searchStatus.loading ? "is-loading" : ""}`}
              type="submit"
              disabled={searchStatus.loading}
              aria-busy={searchStatus.loading}
            >
              {searchStatus.loading ? "ECLI's zoeken..." : "Zoek ECLI's"}
            </button>
          </div>
          <p className="search-note">
            Bijvoorbeeld: ontslag op staande voet, kartelboete, zorgplicht bank.
          </p>
        </form>
        {searchStatus.error ? (
          <p className="form-error">{searchStatus.error}</p>
        ) : null}
      </div>

      <div className="form-card results-card">
        <p className="eyebrow">Resultaten</p>
        {visibleResults.length ? (
          <>
            <div className="results-actions">
              <button
                className="ghost"
                type="button"
                onClick={handleGenerateAnswer}
                disabled={answerStatus.loading}
              >
                {answerStatus.loading
                  ? "Antwoord maken..."
                  : "Genereer antwoord"}
              </button>
            </div>
            <div className="results-list">
              {visibleResults.map((result, index) => {
                const ecliValue = result.ecli || "";
                const ecliHref = buildRechtspraakDetailUrl(ecliValue);
                return (
                  <div className="result-item" key={`${result.ecli}-${index}`}>
                    <div className="result-header">
                      <div>
                        {ecliHref ? (
                          <a
                            className="result-link"
                            href={ecliHref}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <strong>{result.ecli}</strong>
                          </a>
                        ) : null}
                        {result.title ? (
                          <p className="result-meta">{result.title}</p>
                        ) : null}
                      </div>
                      <span className="score-chip">
                        <span className="result-rank-icon" aria-hidden="true" />
                        {`Resultaat ${index + 1}`}
                      </span>
                    </div>
                    {getSnippet(result.content) ? (
                      <p className="result-snippet">{getSnippet(result.content)}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="search-note">
            Nog geen resultaten. Voer een zoekopdracht uit.
          </p>
        )}
        {answerStatus.error ? (
          <p className="form-error">{answerStatus.error}</p>
        ) : null}
        {answer ? (
          <div className="analysis-output answer-output">
            <p className="eyebrow">Antwoord</p>
            <p className="ai-disclaimer">
              Dit antwoord is een hulpmiddel en geen juridisch advies. Juridische
              beoordeling door een advocaat blijft noodzakelijk.
            </p>
            <p>{answer}</p>
            {answerSources.length ? (
              <div className="answer-sources">
                <p className="answer-sources-label">Bronnen bij dit antwoord:</p>
                <div className="answer-sources-list">
                  {answerSources.map((source, index) => {
                    const ecli = String(source?.ecli || "").trim();
                    const href = buildRechtspraakDetailUrl(ecli);
                    if (!ecli || !href) {
                      return null;
                    }
                    return (
                      <a
                        key={`${ecli}-${index}`}
                        className="answer-source-chip"
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {ecli}
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
