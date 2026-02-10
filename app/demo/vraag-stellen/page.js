"use client";

import { useState } from "react";
import DemoDashboardShell from "../../components/DemoDashboardShell";
import { demoScenario, demoSidebarItems } from "../_data/demoFixtures";

export default function DemoVraagStellenPage() {
  const [searchStatus, setSearchStatus] = useState({
    loading: false,
    completed: false
  });

  const handleAsk = () => {
    if (searchStatus.loading || searchStatus.completed) {
      return;
    }

    setSearchStatus({ loading: true, completed: false });
    setTimeout(() => {
      setSearchStatus({ loading: false, completed: true });
    }, 900);
  };

  const getSnippet = (text) => {
    const snippet = String(text || "").trim();
    return snippet.length > 240 ? `${snippet.slice(0, 240)}...` : snippet;
  };

  return (
    <DemoDashboardShell title="Vraag stellen" sidebarItems={demoSidebarItems.vraag}>
      <div className="form-card search-card">
        <p className="eyebrow">Jurisprudentie</p>
        <h2>Stel een vraag</h2>
        <p className="lead">
          In deze demo is de vraag vooraf ingesteld en kun je alleen de workflow
          starten.
        </p>
        <form className="search-form" role="search" onSubmit={(e) => e.preventDefault()}>
          <label className="search-label" htmlFor="demo-vraag-query">
            Vraag
          </label>
          <div className="search-row">
            <input
              id="demo-vraag-query"
              type="search"
              className="search-input"
              value={demoScenario.vraagStellen.query}
              disabled
              readOnly
            />
            <button
              className={`cta ${searchStatus.loading ? "is-loading" : ""}`}
              type="button"
              onClick={handleAsk}
              disabled={searchStatus.loading || searchStatus.completed}
              aria-busy={searchStatus.loading}
            >
              {searchStatus.loading ? "Vraag verwerken..." : "Vraag stellen"}
            </button>
          </div>
          <p className="search-note">Vrije invoer is uitgeschakeld in deze demo.</p>
        </form>
      </div>

      <div className="form-card results-card">
        <p className="eyebrow">Antwoord</p>
        {searchStatus.loading ? (
          <p className="search-note">Antwoord genereren...</p>
        ) : searchStatus.completed ? (
          <div className="analysis-output answer-output">
            <p>{demoScenario.vraagStellen.text}</p>
          </div>
        ) : (
          <p className="search-note">Nog geen antwoord. Klik op "Vraag stellen".</p>
        )}
      </div>

      <div className="form-card results-card">
        <p className="eyebrow">Onderbouwing</p>
        {searchStatus.completed ? (
          <div className="results-list">
            {demoScenario.vraagStellen.sources.map((result) => (
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
        ) : (
          <p className="search-note">Nog geen bronnen.</p>
        )}
      </div>
    </DemoDashboardShell>
  );
}
