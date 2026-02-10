"use client";

import { useState } from "react";
import Markdown from "markdown-to-jsx";
import DemoDashboardShell from "../components/DemoDashboardShell";
import { demoScenario, demoSidebarItems } from "./_data/demoFixtures";

export default function DemoPage() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");

  const handleDemoAnalyze = () => {
    if (loading || analysis) {
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setAnalysis(demoScenario.contractAnalysisMarkdown);
      setLoading(false);
    }, 1200);
  };

  return (
    <DemoDashboardShell
      title="Contract reader"
      sidebarItems={demoSidebarItems.contract}
    >
      <div className="form-card dashboard-card">
        <p className="eyebrow">Demo-bestand</p>
        <h2>{demoScenario.contractTitle}</h2>
        <p className="lead">
          Voorbeeldbestand staat klaar. Upload en vrije invoer zijn uitgeschakeld
          in deze demo.
        </p>
        <div className="dashboard-actions">
          <button className="cta" type="button" onClick={handleDemoAnalyze}>
            {loading ? "Analyseren..." : "Verstuur voor analyse"}
          </button>
          <button className="ghost" type="button" disabled>
            Nieuw contract
          </button>
        </div>
        <p className="file-meta">Geselecteerd: {demoScenario.contractFileName}</p>
      </div>

      {analysis ? (
        <div className="form-card analysis-card">
          <p className="eyebrow">Analyse</p>
          <div className="analysis-output">
            <Markdown>{analysis}</Markdown>
          </div>
        </div>
      ) : null}
    </DemoDashboardShell>
  );
}
