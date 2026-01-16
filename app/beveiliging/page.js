"use client";

import Link from "next/link";

export default function BeveiligingPage() {
  return (
    <main className="page signup-page">
      <div className="halo" aria-hidden="true" />
      <section className="form-card">
        <div className="form-header">
          <p className="eyebrow">Beveiliging</p>
          <h1>Veiligheid en privacy</h1>
          <p className="lead">
            We behandelen documenten met zorg, gebruiken strikte
            toegangscontrole en volgen best practices voor data bescherming.
          </p>
        </div>
        <div className="signup-form">
          <div>
            <strong>Data isolatie</strong>
            <p>
              Data is alleen zichtbaar voor jouw account en wordt niet gedeeld
              met andere gebruikers. En er wordt ook niks doorverkocht aan derden.
            </p>
          </div>
          <div>
            <strong>Verwijderen betekent echt verwijderen</strong>
            <p>
              Als je account wordt verwijderd, verwijderen we ook alle gekoppelde
              data en documenten uit onze systemen.
            </p>
          </div>
          <div>
            <strong>Data blijft in Nederland</strong>
            <p>
              We verwerken en bewaren alle data via Nederlandse servers.
            </p>
          </div>
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
