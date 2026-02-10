"use client";

import { useState } from "react";
import DemoDashboardShell from "../../components/DemoDashboardShell";
import { demoScenario, demoSidebarItems } from "../_data/demoFixtures";

export default function DemoJurispudentieSearchPage() {
  const [searchStatus, setSearchStatus] = useState({
    loading: false,
    completed: false
  });
  const [answerStatus, setAnswerStatus] = useState({
    loading: false,
    completed: false
  });

  const handleSearch = () => {
    if (searchStatus.loading || searchStatus.completed) {
      return;
    }

    setSearchStatus({ loading: true, completed: false });
    setAnswerStatus({ loading: false, completed: false });

    setTimeout(() => {
      setSearchStatus({ loading: false, completed: true });
    }, 900);
  };

  const handleGenerateAnswer = () => {
    if (!searchStatus.completed || answerStatus.loading || answerStatus.completed) {
      return;
    }

    setAnswerStatus({ loading: true, completed: false });
    setTimeout(() => {
      setAnswerStatus({ loading: false, completed: true });
    }, 900);
  };

  const getSnippet = (text) => {
    const snippet = String(text || "").trim();
    return snippet.length > 240 ? `${snippet.slice(0, 240)}...` : snippet;
  };

  const results = searchStatus.completed ? demoScenario.searchResults : [];

  return (
    <DemoDashboardShell
      title="Jurispudentie search"
      sidebarItems={demoSidebarItems.search}
    >
      <div className="form-card search-card">
        <p className="eyebrow">Jurisprudentie</p>
        <h2>Vind relevante uitspraken</h2>
        <p className="lead">
          Deze demo gebruikt een vaste zoekopdracht en toont vooraf geladen
          resultaten.
        </p>
        <form className="search-form" role="search" onSubmit={(e) => e.preventDefault()}>
          <label className="search-label" htmlFor="demo-jurisprudentie-query">
            Zoekopdracht
          </label>
          <div className="search-row">
            <input
              id="demo-jurisprudentie-query"
              type="search"
              className="search-input"
              value={demoScenario.searchQuery}
              disabled
              readOnly
            />
            <button
              className={`cta ${searchStatus.loading ? "is-loading" : ""}`}
              type="button"
              onClick={handleSearch}
              disabled={searchStatus.loading || searchStatus.completed}
              aria-busy={searchStatus.loading}
            >
              {searchStatus.loading ? "ECLI's zoeken..." : "Zoek ECLI's"}
            </button>
          </div>
          <p className="search-note">Vrije invoer is uitgeschakeld in deze demo.</p>
        </form>
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
                disabled={answerStatus.loading || answerStatus.completed}
              >
                {answerStatus.loading ? "Antwoord maken..." : "Genereer antwoord"}
              </button>
            </div>
            <div className="results-list">
              {results.map((result) => (
                <div className="result-item" key={result.ecli}>
                  <div className="result-header">
                    <div>
                      <a
                        className="result-link"
                        href={`/demo/jurispudentie/${encodeURIComponent(result.ecli)}`}
                      >
                        <strong>{result.ecli}</strong>
                      </a>
                      <p className="result-meta">{result.title}</p>
                    </div>
                    <span className="score-chip">{result.score.toFixed(3)}</span>
                  </div>
                  <p className="result-snippet">{getSnippet(result.content)}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="search-note">Nog geen resultaten. Klik op "Zoek ECLI's".</p>
        )}

        {answerStatus.completed ? (
          <div className="analysis-output answer-output">
            <p className="eyebrow">Antwoord</p>
            <p>{demoScenario.vraagStellen.text}</p>
          </div>
        ) : null}
      </div>
    </DemoDashboardShell>
  );
}
