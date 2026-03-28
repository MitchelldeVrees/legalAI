"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const OTP_COOLDOWN_SECONDS = 60;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ loading: false, error: "" });
  const [info, setInfo] = useState("");
  const [retryAfter, setRetryAfter] = useState(0);

  useEffect(() => {
    if (searchParams.get("sent") === "1") {
      setInfo("Check je e-mail voor de magische link om in te loggen.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (retryAfter <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setRetryAfter((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [retryAfter]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (retryAfter > 0) {
      return;
    }

    setStatus({ loading: true, error: "" });
    setInfo("");

    try {
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        throw new Error("Supabase omgevingsvariabelen ontbreken.");
      }

      const { data, error } = await supabase
        .from("accounts")
        .select("email")
        .eq("email", email)
        .single();

      if (error || !data) {
        throw new Error("Geen account gevonden.");
      }

      if (typeof window !== "undefined") {
        const redirectTo = `${window.location.origin}/auth/callback`;
        const { error: authError } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo }
        });

        if (authError) {
          if (authError.status === 429) {
            setRetryAfter(OTP_COOLDOWN_SECONDS);
            throw new Error("RATE_LIMIT");
          }
          throw authError;
        }
      }

      setInfo("Check je e-mail voor de magische link om in te loggen.");
      setEmail("");
    } catch (error) {
      setStatus({
        loading: false,
        error:
          error?.message === "RATE_LIMIT"
            ? "Te veel inlogpogingen. Wacht 60 seconden en probeer opnieuw."
            : "Inloggen mislukt. Controleer je gegevens."
      });
      return;
    }

    setStatus({ loading: false, error: "" });
  };

  return (
    <main className="page signup-page">
      <div className="halo" aria-hidden="true" />
      <section className="form-card">
        <div className="form-header">
          <p className="eyebrow">Inloggen</p>
          <h1>Ga terug naar je workspace</h1>
          <p className="lead">Vul het e-mailadres van je account in.</p>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <label>
            E-mailadres
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="sanne@kantoor.nl"
            />
          </label>

          {info ? <p className="form-success">{info}</p> : null}
          {status.error ? <p className="form-error">{status.error}</p> : null}

          <div className="form-actions">
            <button
              className="cta"
              type="submit"
              disabled={status.loading || retryAfter > 0}
            >
              {status.loading
                ? "Bezig..."
                : retryAfter > 0
                ? `Wacht ${retryAfter}s`
                : "Inloggen"}
            </button>
            <button
              className="ghost"
              type="button"
              onClick={() => router.push("/")}
            >
              Terug naar home
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="page signup-page">
          <div className="halo" aria-hidden="true" />
          <section className="form-card">
            <div className="form-header">
              <p className="eyebrow">Inloggen</p>
              <h1>Even laden...</h1>
            </div>
          </section>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
