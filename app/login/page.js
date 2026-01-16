"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ loading: false, error: "" });
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (searchParams.get("sent") === "1") {
      setInfo("Check je e-mail voor de magische link om in te loggen.");
    }
  }, [searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: "" });

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
        const redirectTo = `${window.location.origin}/dashboard`;
        const { error: authError } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo }
        });

        if (authError) {
          throw authError;
        }
      }

      setInfo("Check je e-mail voor de magische link om in te loggen.");
      setEmail("");
    } catch (error) {
      setStatus({
        loading: false,
        error: "Inloggen mislukt. Controleer je gegevens."
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
            <button className="cta" type="submit" disabled={status.loading}>
              {status.loading ? "Bezig..." : "Inloggen"}
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
