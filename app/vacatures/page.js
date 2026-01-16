"use client";

import Link from "next/link";

export default function VacaturesPage() {
  return (
    <main className="page signup-page">
      <div className="halo" aria-hidden="true" />
      <section className="form-card">
        <div className="form-header">
          <p className="eyebrow">Vacatures</p>
          <h1>Geen vacatures voor nu</h1>
          <p className="lead">
            We zijn niet actief aan het werven. Kom later nog eens terug.
          </p>
        </div>
        <div className="form-actions">
          <Link className="cta" href="/">
            Terug naar home
          </Link>
        </div>
      </section>
    </main>
  );
}
