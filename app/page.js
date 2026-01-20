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
          <a href="#modules">Modules</a>
          <a href="#examples">Voorbeelden</a>
          <a href="#workflow">Werkwijze</a>
          <a href="#trust">Vertrouwen</a>
          <Link className="ghost" href="/login">
            Inloggen
          </Link>
          <Link className="cta" href="/signup">
            Toegang aanvragen
          </Link>
        </div>
      </nav>
      <div id="mobile-nav" className={`mobile-nav ${menuOpen ? "open" : ""}`}>
        <a href="#modules" onClick={() => setMenuOpen(false)}>
          Modules
        </a>
        <a href="#examples" onClick={() => setMenuOpen(false)}>
          Voorbeelden
        </a>
        <a href="#workflow" onClick={() => setMenuOpen(false)}>
          Werkwijze
        </a>
        <a href="#trust" onClick={() => setMenuOpen(false)}>
          Vertrouwen
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
          <p className="eyebrow">Voor juridische teams in Nederland</p>
          <h1>
            Contracten, jurisprudentie en vragen in één werkstroom.
            <span> Altijd met bronverwijzing.</span>
          </h1>
          <p className="lead">
            LegalAI leest contracten, zoekt relevante uitspraken en formuleert
            antwoorden met ECLI-verwijzingen. Je krijgt een strak rapport met
            samenvatting, kernbepalingen, risico’s en gerichte vragen.
          </p>
          <div className="hero-actions">
            <Link className="cta" href="/signup">
              Plan een demo
            </Link>
            <Link className="ghost" href="/demo">
              Bekijk voorbeeld
            </Link>
          </div>
          <div className="meta">
            <span>AVG-ready</span>
            <span>ECLI-citaties</span>
            <span>Nederlandse servers</span>
          </div>
        </div>

        <div className="hero-card">
          <div className="card-header">
            <span>Live workflow</span>
            <strong>Van intake tot antwoord</strong>
          </div>
          <div className="card-body">
            <div className="card-block">
              <h3>Contract reader</h3>
              <p>Samenvatting, kernbepalingen en risico’s.</p>
            </div>
            <div className="card-block">
              <h3>Jurisprudentie search</h3>
              <p>Zoek ECLI’s met direct bruikbare snippets.</p>
            </div>
            <div className="card-block">
              <h3>Vraag stellen</h3>
              <p>Antwoord met concrete ECLI-verwijzingen.</p>
            </div>
          </div>
          <div className="card-footer">
            <span>Nieuwe inzichten binnen minuten</span>
            <span className="pulse" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section id="modules" className="modules">
        <div className="section-header">
          <p className="eyebrow">Wat je krijgt</p>
          <h2>Drie modules, één dossier.</h2>
          <p className="lead">
            Gebruik alleen wat je nodig hebt of combineer alles tot één
            onderbouwd advies.
          </p>
        </div>
        <div className="modules-grid">
          <div className="module-card">
            <div className="module-title">
              <span className="tag">Contract reader</span>
              <h3>Lees en beoordeel contracten in minuten.</h3>
            </div>
            <p>
              Elk document wordt uitgesplitst in vaste secties zodat je niets
              mist.
            </p>
            <ul className="module-list">
              <li>Documentprofiel met type, partijen en looptijd.</li>
              <li>Kernbepalingen en afwijkingen op een rij.</li>
              <li>Risico’s + vragenlijst voor snelle review.</li>
            </ul>
          </div>
          <div className="module-card">
            <div className="module-title">
              <span className="tag">Jurisprudentie search</span>
              <h3>Vind de juiste uitspraken sneller.</h3>
            </div>
            <p>
              Zoek op thema of kwestie en ontvang direct bruikbare ECLI’s.
            </p>
            <ul className="module-list">
              <li>Topresultaten met score en snippet.</li>
              <li>Snelle doorklik naar de uitspraak.</li>
              <li>Antwoord genereren op basis van bronnen.</li>
            </ul>
          </div>
          <div className="module-card">
            <div className="module-title">
              <span className="tag">Vraag stellen</span>
              <h3>Krijg een helder antwoord met bron.</h3>
            </div>
            <p>
              Formuleer je juridische vraag en ontvang een beargumenteerde
              reactie.
            </p>
            <ul className="module-list">
              <li>Antwoord met ECLI-verwijzingen.</li>
              <li>Onderbouwing met relevante passages.</li>
              <li>Geschikt voor memo of bespreking.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="examples" className="examples">
        <div className="section-header">
          <p className="eyebrow">Voorbeelden</p>
          <h2>Zo ziet een output eruit in de praktijk.</h2>
          <p className="lead">
            Concrete voorbeelden uit contractanalyse en jurisprudentie.
          </p>
        </div>
        <div className="examples-grid">
          <div className="example-card">
            <p className="eyebrow">Contract reader</p>
            <h3>Huurcontract woonruimte</h3>
            <div className="example-body">
              <div className="example-row">
                <span className="example-label">Risico</span>
                <p>Minimumduur 24 maanden zonder tussentijdse opzegging.</p>
              </div>
              <div className="example-row">
                <span className="example-label">Vraag</span>
                <p>Is het gehuurde zelfstandig of onzelfstandig?</p>
              </div>
              <div className="example-row">
                <span className="example-label">Actie</span>
                <p>Check bijlage energielabel + servicekostenonderbouwing.</p>
              </div>
            </div>
          </div>
          <div className="example-card">
            <p className="eyebrow">Jurisprudentie search</p>
            <h3>Ontslag op staande voet</h3>
            <div className="example-body">
              <div className="example-row">
                <span className="example-label">Top ECLI</span>
                <p>ECLI:NL:HR:2019:1734 — dringende reden + bewijs.</p>
              </div>
              <div className="example-row">
                <span className="example-label">Snippet</span>
                <p>Voorafgaande waarschuwingen wogen mee in oordeel.</p>
              </div>
              <div className="example-row">
                <span className="example-label">Gebruik</span>
                <p>Onderbouwing voor memo of pleitnota.</p>
              </div>
            </div>
          </div>
          <div className="example-card">
            <p className="eyebrow">Vraag stellen</p>
            <h3>Randvoorwaardenkorting</h3>
            <div className="example-body">
              <div className="example-row">
                <span className="example-label">Vraag</span>
                <p>Mag een randvoorwaardenkorting worden opgelegd?</p>
              </div>
              <div className="example-row">
                <span className="example-label">Antwoord</span>
                <p>Ja, mits de feiten concreet zijn vastgesteld.</p>
              </div>
              <div className="example-row">
                <span className="example-label">Bron</span>
                <p>ECLI:NL:CBB:2021:476 en ECLI:NL:CBB:2020:452.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="examples-flow" aria-hidden="true">
          <span className="flow-dot" />
          <span className="flow-dot" />
          <span className="flow-dot" />
        </div>
      </section>

      <section id="workflow" className="workflow">
        <div>
          <p className="eyebrow">Werkwijze</p>
          <h2>Van vraag naar onderbouwd advies in drie stappen.</h2>
        </div>
        <div className="steps">
          <div className="step">
            <span>01</span>
            <h3>Upload of zoek</h3>
            <p>Contract, dossier of zoekopdracht.</p>
          </div>
          <div className="step">
            <span>02</span>
            <h3>Analyseer en vind bronnen</h3>
            <p>Structuur + ECLI’s met snippets.</p>
          </div>
          <div className="step">
            <span>03</span>
            <h3>Beoordeel en deel</h3>
            <p>Rapport en antwoord direct inzetbaar.</p>
          </div>
        </div>
      </section>

      <section id="trust" className="insights trust">
        <div className="insight-card">
          <h3>Bronnen</h3>
          <p>ECLI-verwijzingen bij antwoorden en resultaten.</p>
        </div>
        <div className="insight-card">
          <h3>Structuur</h3>
          <p>Vaste secties per contract, zodat niets verdwijnt.</p>
        </div>
        <div className="insight-card">
          <h3>Compliance</h3>
          <p>AVG-ready + Nederlandse servers.</p>
        </div>
      </section>

      <section className="cta-band">
        <div>
          <h2>Wil je dit in je eigen workflow testen?</h2>
          <p>Plan een demo of start een pilot met je eigen dossiers.</p>
        </div>
        <Link className="cta" href="/signup">
          Start pilot
        </Link>
      </section>

      <footer className="footer">
        <div>
          <strong>LegalAI</strong>
          <p>Vertrouwd door leiders in litigation, M&amp;A en compliance.</p>
        </div>
        <div className="footer-links">
          <Link href="/beveiliging">Beveiliging</Link>
          <Link href="/voorwaarden">Voorwaarden</Link>
          <Link href="/privacyverklaring">Privacy</Link>
          <Link href="/vacatures">Vacatures</Link>
        </div>
      </footer>
    </main>
  );
}
