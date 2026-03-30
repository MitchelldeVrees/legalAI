"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Je sessie wordt ingesteld...");

  const reportAuthFailure = (reason) => {
    fetch("/api/ops/auth-failure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason })
    }).catch(() => {
      // Ignore telemetry failures in the auth UI.
    });
  };

  useEffect(() => {
    const handleAuth = async () => {
      if (typeof window === "undefined") {
        return;
      }

      const url = new URL(window.location.href);
      const errorDescription = url.searchParams.get("error_description");
      if (errorDescription) {
        reportAuthFailure("error_description");
        setMessage("Inloggen mislukt. Probeer het opnieuw.");
        return;
      }

      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("Auth exchange error:", error);
          reportAuthFailure("exchange_code_for_session_failed");
          setMessage("Inloggen mislukt. Probeer het opnieuw.");
          return;
        }
        router.replace("/dashboard");
        return;
      }

      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
      );
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          console.error("Auth session error:", error);
          reportAuthFailure("set_session_failed");
          setMessage("Inloggen mislukt. Probeer het opnieuw.");
          return;
        }

        router.replace("/dashboard");
        return;
      }

      reportAuthFailure("missing_login_token");
      setMessage("Geen geldige login token gevonden. Probeer het opnieuw.");
    };

    handleAuth();
  }, [router]);

  return (
    <main className="page signup-page">
      <div className="halo" aria-hidden="true" />
      <section className="form-card">
        <div className="form-header">
          <p className="eyebrow">Inloggen</p>
          <h1>{message}</h1>
        </div>
        <div className="form-actions">
          <button
            className="ghost"
            type="button"
            onClick={() => router.push("/")}
          >
            Terug naar home
          </button>
        </div>
      </section>
    </main>
  );
}
