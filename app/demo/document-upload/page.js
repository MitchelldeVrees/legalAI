"use client";

import { useState } from "react";
import DemoDashboardShell from "../../components/DemoDashboardShell";
import { demoSidebarItems } from "../_data/demoFixtures";

export default function DemoDocumentUploadPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleAnalyze = () => {
    if (loading || done) {
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setDone(true);
      setLoading(false);
    }, 1200);
  };

  return (
    <DemoDashboardShell
      title="Documenten uploaden"
      sidebarItems={demoSidebarItems.upload}
    >
      <div className="form-card dashboard-card">
        <p className="eyebrow">Demo-bestand</p>
        <h2>Dossierstukken bundelen</h2>
        <p className="lead">
          In deze demo kun je een vaste workflow zien voor het uploaden en analyseren
          van meerdere documenten binnen één zaak.
        </p>
        <div className="dashboard-actions">
          <button className="cta" type="button" onClick={handleAnalyze}>
            {loading ? "Analyseren..." : "Start documentanalyse"}
          </button>
          <button className="ghost" type="button" disabled>
            Upload document
          </button>
        </div>
      </div>

      {done ? (
        <div className="form-card analysis-card">
          <p className="eyebrow">Resultaat</p>
          <div className="analysis-output">
            <h3>Dossieroverzicht</h3>
            <ul>
              <li>3 documenten verwerkt: overeenkomst, correspondentie en bijlage.</li>
              <li>Belangrijkste risico's gegroepeerd per documenttype.</li>
              <li>Relevante vervolgstappen per bevinding direct zichtbaar.</li>
            </ul>
          </div>
        </div>
      ) : null}
    </DemoDashboardShell>
  );
}
