"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardShell from "../components/DashboardShell";

export default function VraagStellenPage() {
  const [question, setQuestion] = useState("");
  const [searchStatus, setSearchStatus] = useState({
    loading: false,
    error: ""
  });
  const [answerStatus, setAnswerStatus] = useState({
    loading: false,
    error: ""
  });
  const [results, setResults] = useState([]);
  const [answer, setAnswer] = useState("");

  const handleAsk = async (event) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setSearchStatus({ loading: false, error: "Stel eerst een vraag." });
      return;
    }

    setSearchStatus({ loading: true, error: "" });
    setAnswerStatus({ loading: false, error: "" });
    setAnswer("");
    setResults([]);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmedQuestion, k: 40 })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Vraag zoeken mislukt:", response.status, errorText);
        throw new Error("Search failed.");
      }

      const data = await response.json();
      const nextResults = Array.isArray(data?.results) ? data.results : [];
      setResults(nextResults);
      setSearchStatus({ loading: false, error: "" });

      if (!nextResults.length) {
        return;
      }

      setAnswerStatus({ loading: true, error: "" });
      const answerResponse = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmedQuestion, results: nextResults })
      });

      if (!answerResponse.ok) {
        const errorText = await answerResponse.text();
        console.error("Antwoord genereren mislukt:", answerResponse.status, errorText);
        throw new Error("Answer failed.");
      }

      const answerData = await answerResponse.json();
      setAnswer(answerData?.answer || "");
      setAnswerStatus({ loading: false, error: "" });
    } catch (error) {
      console.error("Vraag stellen error:", error);
      setSearchStatus({
        loading: false,
        error: "Vraag verwerken mislukt. Probeer het opnieuw."
      });
      setAnswerStatus({ loading: false, error: "" });
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
      title="Vraag stellen"
      sidebarItems={[
        { label: "Contract reader", href: "/dashboard" },
        { label: "Documenten uploaden", href: "/document-upload" },
        { label: "Jurispudentie search", href: "/jurispudentie-search" },
        { label: "Vraag stellen", active: true }
      ]}
    >
      <div className="form-card search-card">
        <p className="eyebrow">Jurisprudentie</p>
        <h2>Stel een vraag</h2>
        <p className="lead">
          Beschrijf je vraag. We zoeken uitspraken en geven een antwoord met
          ECLI-verwijzingen.
        </p>
        <form className="search-form" role="search" onSubmit={handleAsk}>
          <label className="search-label" htmlFor="vraag-query">
            Vraag
          </label>
          <div className="search-row">
            <input
              id="vraag-query"
              name="q"
              type="search"
              className="search-input"
              placeholder="Bijv. Mag de minister een randvoorwaardenkorting opleggen?"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <button
              className={`cta ${searchStatus.loading ? "is-loading" : ""}`}
              type="submit"
              disabled={searchStatus.loading}
              aria-busy={searchStatus.loading}
            >
              {searchStatus.loading ? "Vraag verwerken..." : "Vraag stellen"}
            </button>
          </div>
          <p className="search-note">
            Antwoord wordt gebaseerd op jurisprudentie en citeert ECLI's.
          </p>
        </form>
        {searchStatus.error ? (
          <p className="form-error">{searchStatus.error}</p>
        ) : null}
      </div>

      <div className="form-card results-card">
        <p className="eyebrow">Antwoord</p>
        {answerStatus.loading ? (
          <p className="search-note">Antwoord genereren...</p>
        ) : answer ? (
          <div className="analysis-output answer-output">
            <p>{answer}</p>
          </div>
        ) : (
          <p className="search-note">Nog geen antwoord. Stel een vraag.</p>
        )}
        {answerStatus.error ? (
          <p className="form-error">{answerStatus.error}</p>
        ) : null}
      </div>

      <div className="form-card results-card">
        <p className="eyebrow">Onderbouwing</p>
        {results.length ? (
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
                  <p className="result-snippet">{getSnippet(result.content)}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="search-note">Nog geen bronnen.</p>
        )}
      </div>
    </DashboardShell>
  );
}
