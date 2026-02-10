"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const initialForm = {
  fullName: "",
  workEmail: "",
  firmName: "",
  role: "",
  useCase: "",
  website: ""
};

function trackEvent(name, params = {}) {
  if (typeof window === "undefined") {
    return;
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: name, ...params });
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }

  if (typeof window.plausible === "function") {
    window.plausible(name, { props: params });
  }

  if (window.umami && typeof window.umami.track === "function") {
    window.umami.track(name, params);
  }
}

export default function ContactPage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ loading: false, error: "", success: false });
  const [started, setStarted] = useState(false);

  const calendarUrl = useMemo(() => process.env.NEXT_PUBLIC_DEMO_CALENDAR_URL || "", []);

  const handleStart = () => {
    if (started) {
      return;
    }
    setStarted(true);
    trackEvent("contact_form_started", { source: "contact_page" });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: "", success: false });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verzenden is mislukt.");
      }

      setForm(initialForm);
      setStatus({ loading: false, error: "", success: true });
      trackEvent("contact_form_submit_success", { source: "contact_page" });
      return;
    } catch (error) {
      setStatus({
        loading: false,
        error: "Je aanvraag kon niet worden verzonden. Controleer je gegevens en probeer opnieuw.",
        success: false
      });
    }
  };

  return (
    <main className="page signup-page">
      <div className="halo" aria-hidden="true" />
      <section className="form-card contact-card">
        <div className="form-header">
          <p className="eyebrow">Plan demo</p>
          <h1>Plan een demo voor jouw advocatenkantoor</h1>
          <p className="lead">
            Laat weten waar je team op vastloopt. We laten in een korte sessie zien
            hoe LegalAI kan helpen in jullie dagelijkse praktijk.
          </p>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Naam
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                onFocus={handleStart}
                required
                placeholder="Sanne de Boer"
              />
            </label>
            <label>
              Zakelijk e-mailadres
              <input
                type="email"
                name="workEmail"
                value={form.workEmail}
                onChange={handleChange}
                onFocus={handleStart}
                required
                placeholder="sanne@kantoor.nl"
              />
            </label>
            <label>
              Kantoornaam
              <input
                name="firmName"
                value={form.firmName}
                onChange={handleChange}
                onFocus={handleStart}
                required
                placeholder="Van Dijk Advocaten"
              />
            </label>
            <label>
              Functie
              <input
                name="role"
                value={form.role}
                onChange={handleChange}
                onFocus={handleStart}
                required
                placeholder="Partner"
              />
            </label>
          </div>

          <label>
            Korte hulpvraag
            <textarea
              name="useCase"
              value={form.useCase}
              onChange={handleChange}
              onFocus={handleStart}
              required
              rows={5}
              placeholder="Waar kost dossieranalyse nu de meeste tijd?"
            />
          </label>

          <label className="honeypot" aria-hidden="true">
            Website
            <input
              name="website"
              value={form.website}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
            />
          </label>

          {status.error ? <p className="form-error">{status.error}</p> : null}
          {status.success ? (
            <p className="form-success">
              Bedankt. We nemen binnen 1 werkdag contact met je op.
            </p>
          ) : null}

          <div className="form-actions">
            <button className="cta" type="submit" disabled={status.loading}>
              {status.loading ? "Verzenden..." : "Aanvraag verzenden"}
            </button>
            <Link className="ghost" href="/">
              Terug naar home
            </Link>
            {status.success && calendarUrl ? (
              <a
                className="text-link"
                href={calendarUrl}
                target="_blank"
                rel="noreferrer"
              >
                Of plan direct een tijdslot
              </a>
            ) : null}
          </div>
        </form>
      </section>
    </main>
  );
}
