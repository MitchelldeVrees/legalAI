"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardShell from "../components/DashboardShell";

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

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    if (!results.length) {
      return;
    }

    setAnswerStatus({ loading: true, error: "" });
    setAnswer("");

    try {
      const response = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), results })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Answer request failed:", response.status, errorText);
        throw new Error("Answer failed.");
      }

      const data = await response.json();
      setAnswer(data?.answer || "");
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
      return "Geen snippet beschikbaar.";
    }
    return snippet.length > 240 ? `${snippet.slice(0, 240)}...` : snippet;
  };

  return (
    <DashboardShell
      title="Jurisprudentie search"
      sidebarItems={[
        { label: "Contract reader", href: "/dashboard" },
        { label: "Documenten uploaden", href: "/document-upload" },
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
        {results.length ? (
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
              {results.map((result, index) => {
                const ecliValue = result.ecli || "";
                const ecliHref = ecliValue
                  ? `/jurispudentie/${encodeURIComponent(ecliValue)}`
                  : "";
                return (
                  <div className="result-item" key={`${result.ecli}-${index}`}>
                    <div className="result-header">
                      <div>
                        {ecliHref ? (
                          <Link className="result-link" href={ecliHref}>
                            <strong>{result.ecli}</strong>
                          </Link>
                        ) : (
                          <strong>Onbekende ECLI</strong>
                        )}
                        <p className="result-meta">
                          {result.title || "Onbekende uitspraak"}
                        </p>
                      </div>
                      <span className="score-chip">
                        {typeof result.score === "number"
                          ? result.score.toFixed(3)
                          : "n.v.t."}
                      </span>
                    </div>
                    <p className="result-snippet">
                      {getSnippet(result.content)}
                    </p>
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
            <p>{answer}</p>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
