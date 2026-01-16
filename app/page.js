"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <main className="page">
      <div className="halo" aria-hidden="true" />
      <nav className="nav">
        <div className="logo">LegalAI</div>
        <button
          className="menu-toggle"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
        >
          Menu
        </button>
        <div className="nav-links">
          <a href="#capabilities">Mogelijkheden</a>
          <a href="#workflow">Werkwijze</a>
          <a href="#insights">Inzichten</a>
          <Link className="ghost" href="/login">
            Inloggen
          </Link>
          <Link className="cta" href="/signup">
            Toegang aanvragen
          </Link>
        </div>
      </nav>
      <div id="mobile-nav" className={`mobile-nav ${menuOpen ? "open" : ""}`}>
        <a href="#capabilities" onClick={() => setMenuOpen(false)}>
          Mogelijkheden
        </a>
        <a href="#workflow" onClick={() => setMenuOpen(false)}>
          Werkwijze
        </a>
        <a href="#insights" onClick={() => setMenuOpen(false)}>
          Inzichten
        </a>
        <Link className="ghost" href="/login" onClick={() => setMenuOpen(false)}>
          Inloggen
        </Link>
        <Link className="cta" href="/signup" onClick={() => setMenuOpen(false)}>
          Toegang aanvragen
        </Link>
      </div>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Voor juridische teams</p>
          <h1>
            Contracten sneller doorgronden.
            <span> Duidelijke inzichten in minuten.</span>
          </h1>
          <p className="lead">
            Upload een document en krijg direct een helder, gestructureerd
            overzicht van risico’s, kernbepalingen en vragen voor de behandelaar.
          </p>
          <div className="hero-actions">
            <button className="cta">Plan een demo</button>
            <Link className="ghost" href="/demo">
              Bekijk voorbeeld
            </Link>
          </div>
          <div className="meta">
            <span>AVG-ready</span>
            <span>Magic link login</span>
            <span>Nederlandse servers</span>
          </div>
        </div>

        <div className="hero-card">
          <div className="card-header">
            <span>Actieve zaak</span>
            <strong>Clarke v. Stonebridge</strong>
          </div>
          <div className="card-body">
            <div className="card-block">
              <h3>Samenvatting</h3>
              <p>8–12 bullets die meteen duidelijk maken wat telt.</p>
            </div>
            <div className="card-block">
              <h3>Risico’s</h3>
              <p>Conservatieve signalen zonder overdreven claims.</p>
            </div>
            <div className="card-block">
              <h3>Vragenlijst</h3>
              <p>Lawyer-smart vragen om snel te beoordelen.</p>
            </div>
          </div>
          <div className="card-footer">
            <span>Live briefing</span>
            <span className="pulse" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section id="capabilities" className="grid">
        <div className="grid-item">
          <h2>Klaar om te bespreken</h2>
          <p>
            Analyse in duidelijke secties: Documentprofiel, Samenvatting,
            Kernbepalingen, Risico’s en Vragen.
          </p>
        </div>
        <div className="grid-item">
          <h3>Snelle intake</h3>
          <p>Upload en ontvang in één flow het volledige overzicht.</p>
        </div>
        <div className="grid-item">
          <h3>Conservatief</h3>
          <p>Geen harde claims zonder tekstuele onderbouwing.</p>
        </div>
        <div className="grid-item">
          <h3>Direct deelbaar</h3>
          <p>Markdown-rapport dat je zo kunt doorsturen.</p>
        </div>
      </section>

      <section id="workflow" className="workflow">
        <div>
          <p className="eyebrow">Werkwijze</p>
          <h2>Van upload naar inzicht in drie stappen.</h2>
        </div>
        <div className="steps">
          <div className="step">
            <span>01</span>
            <h3>Upload document</h3>
            <p>PDF, DOCX of tekstbestand.</p>
          </div>
          <div className="step">
            <span>02</span>
            <h3>Analyseer</h3>
            <p>Systeem maakt een gestructureerd rapport.</p>
          </div>
          <div className="step">
            <span>03</span>
            <h3>Beoordeel</h3>
            <p>Gebruik de vragenlijst voor snelle review.</p>
          </div>
        </div>
      </section>

      <section id="insights" className="insights">
        <div className="insight-card">
          <h3>1 upload</h3>
          <p>Alles in één overzicht.</p>
        </div>
        <div className="insight-card">
          <h3>6 secties</h3>
          <p>Consistente structuur per document.</p>
        </div>
        <div className="insight-card">
          <h3>NL output</h3>
          <p>Duidelijk en direct toepasbaar.</p>
        </div>
      </section>

      <section className="cta-band">
        <div>
          <h2>Wil je dit in je eigen workflow testen?</h2>
          <p>Start met een document en ontvang direct het rapport.</p>
        </div>
        <button className="cta">Start pilot</button>
      </section>

      <footer className="footer">
        <div>
          <strong>LegalAI</strong>
          <p>Vertrouwd door leiders in litigation, M&amp;A en compliance.</p>
        </div>
        <div className="footer-links">
          <Link href="/beveiliging">Beveiliging</Link>
          <span>Voorwaarden</span>
          <Link href="/vacatures">Vacatures</Link>
        </div>
      </footer>
    </main>
  );
}
