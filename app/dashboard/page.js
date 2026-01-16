"use client";

import { useState } from "react";
import Markdown from "markdown-to-jsx";

export default function DashboardHome() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState({ loading: false, error: "" });
  const [analysis, setAnalysis] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setAnalysis("");
    setStatus({ loading: false, error: "" });
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setStatus({
        loading: false,
        error: "Selecteer eerst een bestand."
      });
      return;
    }

    setStatus({ loading: true, error: "" });
    setAnalysis("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Analyze request failed:", response.status, errorText);
        throw new Error("Analyse mislukt.");
      }

      const data = await response.json();
      setAnalysis(data.output || "");
      setStatus({ loading: false, error: "" });
    } catch (error) {
      console.error("Analyze request error:", error);
      setStatus({
        loading: false,
        error: "Analyse mislukt. Probeer het opnieuw."
      });
    }
  };

  return (
    <main className="page dashboard-shell">
      <div className="halo" aria-hidden="true" />
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Welkom terug</h1>
        </div>
        <div className="account-chip">
          <div>
            <p>Account</p>
            <strong>Mitchell van Dijk</strong>
            <span>Instellingen</span>
          </div>
          <div className="avatar" aria-hidden="true" />
        </div>
      </header>

      <div className="dashboard-body">
        <aside className="sidebar">
          <p className="sidebar-title">Navigatie</p>
          <button className="sidebar-item active">Contract reader</button>
        </aside>

        <section className="dashboard-main">
          <div className="form-card dashboard-card">
            <p className="eyebrow">Startpunt</p>
            <h2>Contract reader</h2>
            <p className="lead">
              Upload een contract om clausules, risico's en advies direct te zien.
            </p>
            <div className="dashboard-actions">
              <label className="cta" htmlFor="contract-upload">
                Nieuw contract
              </label>
              <input
                id="contract-upload"
                className="file-input"
                type="file"
                accept=".txt,.pdf,.docx,text/*"
                onChange={handleFileChange}
              />
              <button className="ghost" type="button" onClick={handleAnalyze}>
                {status.loading ? "Analyseren..." : "Verstuur voor analyse"}
              </button>
            </div>
            {selectedFile ? (
              <p className="file-meta">Geselecteerd: {selectedFile.name}</p>
            ) : null}
            {status.error ? <p className="form-error">{status.error}</p> : null}
          </div>

          {analysis ? (
            <div className="form-card analysis-card">
              <p className="eyebrow">Analyse</p>
              <div className="analysis-output">
                <Markdown>{analysis}</Markdown>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
