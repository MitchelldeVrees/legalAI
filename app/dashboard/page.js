"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Markdown from "markdown-to-jsx";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function DashboardHome() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState({ loading: false, error: "" });
  const [analysis, setAnalysis] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accountName, setAccountName] = useState("Gebruiker");
  const [accountEmail, setAccountEmail] = useState("");
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const userEmail = data?.user?.email || "";
      if (!userEmail) {
        router.push("/login");
        return;
      }

      setAccountEmail(userEmail);

      const { data: accountRow } = await supabase
        .from("accounts")
        .select("full_name")
        .eq("email", userEmail)
        .single();

      if (accountRow?.full_name) {
        setAccountName(accountRow.full_name);
      }

      setAuthReady(true);
    };

    loadUser();
  }, [router]);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error("Delete account: missing Supabase env vars");
      setStatus({
        loading: false,
        error: "Account verwijderen is nu niet beschikbaar."
      });
      return;
    }

    const confirmed = window.confirm(
      "Weet je zeker dat je dit account permanent wilt verwijderen?"
    );
    if (!confirmed) {
      return;
    }

    const emailToDelete = accountEmail;
    if (!emailToDelete) {
      return;
    }

    setStatus({ loading: true, error: "" });

    try {
      const { data: accountRow, error: fetchError } = await supabase
        .from("accounts")
        .select("id, firm_id")
        .eq("email", emailToDelete)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const { error: deleteAccountError } = await supabase
        .from("accounts")
        .delete()
        .eq("id", accountRow.id);

      if (deleteAccountError) {
        throw deleteAccountError;
      }

      if (accountRow.firm_id) {
        const { error: deleteFirmError } = await supabase
          .from("firms")
          .delete()
          .eq("id", accountRow.firm_id);

        if (deleteFirmError) {
          throw deleteFirmError;
        }
      }

      await handleSignOut();
    } catch (error) {
      console.error("Delete account failed:", error);
      setStatus({
        loading: false,
        error: "Verwijderen mislukt. Probeer het opnieuw."
      });
    }
  };

  if (!authReady) {
    return (
      <main className="page dashboard-shell">
        <div className="halo" aria-hidden="true" />
        <section className="form-card dashboard-card">
          <p className="eyebrow">Dashboard</p>
          <h2>Bezig met laden...</h2>
        </section>
      </main>
    );
  }

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
            <strong>{accountName}</strong>
            <span>Instellingen</span>
          </div>
          <button
            className="avatar-button"
            type="button"
            onClick={() => setAccountMenuOpen((open) => !open)}
            aria-label="Accountmenu"
          >
            <div className="avatar" aria-hidden="true" />
          </button>
          {accountMenuOpen ? (
            <div className="account-menu">
              <button type="button" onClick={handleSignOut}>
                Uitloggen
              </button>
              <button
                type="button"
                className="danger"
                onClick={handleDeleteAccount}
              >
                Account verwijderen
              </button>
            </div>
          ) : null}
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
