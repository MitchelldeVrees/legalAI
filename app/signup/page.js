"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const initialState = {
  firmName: "",
  firmSize: "",
  jurisdiction: "",
  fullName: "",
  email: "",
  role: ""
};

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState({ loading: false, error: "" });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

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

      const { data: existingAccount, error: existingError } = await supabase
        .from("accounts")
        .select("id")
        .eq("email", form.email)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingAccount) {
        if (typeof window !== "undefined") {
          const redirectTo = `${window.location.origin}/dashboard`;
          const { error: authError } = await supabase.auth.signInWithOtp({
            email: form.email,
            options: { emailRedirectTo: redirectTo }
          });

          if (authError) {
            throw authError;
          }
        }

        setForm(initialState);
        router.push("/login?sent=1");
        return;
      }

      const { data: firmData, error: firmError } = await supabase
        .from("firms")
        .insert({
          name: form.firmName,
          size: form.firmSize,
          jurisdiction: form.jurisdiction
        })
        .select("id")
        .single();

      if (firmError) {
        throw firmError;
      }

      const { error: accountError } = await supabase.from("accounts").insert({
        firm_id: firmData.id,
        full_name: form.fullName,
        email: form.email,
        role: form.role
      });

      if (accountError) {
        if (accountError.code === "23505") {
          if (typeof window !== "undefined") {
            const redirectTo = `${window.location.origin}/dashboard`;
            const { error: authError } = await supabase.auth.signInWithOtp({
              email: form.email,
              options: { emailRedirectTo: redirectTo }
            });

            if (authError) {
              throw authError;
            }
          }

          setForm(initialState);
          router.push("/login?sent=1");
          return;
        }

        throw accountError;
      }

      if (typeof window !== "undefined") {
        const redirectTo = `${window.location.origin}/dashboard`;
        const { error: authError } = await supabase.auth.signInWithOtp({
          email: form.email,
          options: { emailRedirectTo: redirectTo }
        });

        if (authError) {
          throw authError;
        }
      }

      setForm(initialState);
      router.push("/login?sent=1");
    } catch (error) {
      setStatus({
        loading: false,
        error: "Aanmelden mislukt. Controleer je gegevens en probeer opnieuw."
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
          <p className="eyebrow">Aanmelden</p>
          <h1>Maak je kantooraccount aan</h1>
          <p className="lead">
            Vul je gegevens in. We maken het kantoor en het account direct aan.
          </p>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Kantoornaam
              <input
                name="firmName"
                value={form.firmName}
                onChange={handleChange}
                required
                placeholder="Van Dijk Advocaten"
              />
            </label>
            <label>
              Grootte
              <input
                name="firmSize"
                value={form.firmSize}
                onChange={handleChange}
                placeholder="25-50 juristen"
              />
            </label>
            <label>
              Jurisdictie
              <input
                name="jurisdiction"
                value={form.jurisdiction}
                onChange={handleChange}
                placeholder="Nederland, EU"
              />
            </label>
            <label>
              Naam
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                placeholder="Sanne de Boer"
              />
            </label>
            <label>
              E-mailadres
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="sanne@kantoor.nl"
              />
            </label>
            <label>
              Functie
              <input
                name="role"
                value={form.role}
                onChange={handleChange}
                placeholder="Partner, Legal Ops"
              />
            </label>
          </div>

          {status.error ? <p className="form-error">{status.error}</p> : null}

          <div className="form-actions">
            <button className="cta" type="submit" disabled={status.loading}>
              {status.loading ? "Bezig..." : "Account aanmaken"}
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
