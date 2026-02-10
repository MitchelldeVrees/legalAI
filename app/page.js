"use client";

import Link from "next/link";
import { useState } from "react";

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
          <a href="#voor-wie">Voor wie</a>
          <a href="#resultaat">Resultaat</a>
          <a href="#werkwijze">Werkwijze</a>
          <a href="#vertrouwen">Vertrouwen</a>
          <Link className="ghost" href="/demo">
            Bekijk voorbeeldomgeving
          </Link>
          <Link
            className="cta"
            href="/contact"
            onClick={() => trackEvent("homepage_hero_primary_click", { cta: "nav_plan_demo" })}
          >
            Plan een demo
          </Link>
        </div>
      </nav>

      <div id="mobile-nav" className={`mobile-nav ${menuOpen ? "open" : ""}`}>
        <a href="#voor-wie" onClick={() => setMenuOpen(false)}>
          Voor wie
        </a>
        <a href="#resultaat" onClick={() => setMenuOpen(false)}>
          Resultaat
        </a>
        <a href="#werkwijze" onClick={() => setMenuOpen(false)}>
          Werkwijze
        </a>
        <a href="#vertrouwen" onClick={() => setMenuOpen(false)}>
          Vertrouwen
        </a>
        <Link className="ghost" href="/demo" onClick={() => setMenuOpen(false)}>
          Bekijk voorbeeldomgeving
        </Link>
        <Link
          className="cta"
          href="/contact"
          onClick={() => {
            setMenuOpen(false);
            trackEvent("homepage_hero_primary_click", { cta: "mobile_plan_demo" });
          }}
        >
          Plan een demo
        </Link>
      </div>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">AI voor advocatenkantoren in Nederland</p>
          <h1>
            Meer kwaliteit in minder tijd.
            <span>Onderbouwd met ECLI-bronnen die standhouden.</span>
          </h1>
          <p className="lead">
            LegalAI helpt partners en teams sneller naar een juridisch sterk advies:
            contractanalyse, jurisprudentieonderzoek en beantwoording van juridische
            vragen in een workflow waar de jurist de regie houdt.
          </p>
          <div className="hero-actions">
            <Link
              className="cta"
              href="/contact"
              onClick={() => trackEvent("homepage_hero_primary_click", { cta: "hero_plan_demo" })}
            >
              Plan een demo
            </Link>
            <Link className="ghost" href="/demo">
              Bekijk voorbeeldomgeving
            </Link>
            <Link className="text-link" href="/signup">
              Zelf starten met account
            </Link>
          </div>
          <div className="meta">
            <span>Nederlandse context</span>
            <span>ECLI-bronnen</span>
            <span>AVG-ready</span>
          </div>
        </div>

        <div className="hero-card">
          <div className="card-header">
            <span>Voor partneroverleg en dossierreview</span>
            <strong>Van intake naar inzetbaar advies</strong>
          </div>
          <div className="card-body">
            <div className="card-block">
              <h3>Contractanalyse</h3>
              <p>Samenvatting, kernbepalingen, risico’s en actiegerichte vragen.</p>
            </div>
            <div className="card-block">
              <h3>Jurisprudentie met ECLI-bronnen</h3>
              <p>Relevante uitspraken met snippets voor directe onderbouwing.</p>
            </div>
            <div className="card-block">
              <h3>Juridische vraagbeantwoording</h3>
              <p>Heldere conclusie met bronverwijzing voor memo of bespreking.</p>
            </div>
          </div>
          <div className="card-footer">
            <span>Geschikt voor snelle interne review en cliëntcommunicatie</span>
            <span className="pulse" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section id="voor-wie" className="audience">
        <div className="section-header">
          <p className="eyebrow">Voor wie</p>
          <h2>Relevante output voor elke rol in je kantoor.</h2>
          <p className="lead">
            Niet alleen sneller werken, maar ook consistenter onderbouwen over teams heen.
          </p>
        </div>
        <div className="audience-grid">
          <div className="module-card">
            <div className="module-title">
              <span className="tag">Partners / kantoorleiding</span>
              <h3>Sneller beslissen met beter zicht op risico en strategie.</h3>
            </div>
            <ul className="module-list">
              <li>Overzicht van dossierkansen en risico’s in vaste structuur.</li>
              <li>Bronverwijzingen die bespreekbaar zijn met cliënten en team.</li>
              <li>Snellere go/no-go beslissingen bij complexe zaken.</li>
            </ul>
          </div>
          <div className="module-card">
            <div className="module-title">
              <span className="tag">Senior associates</span>
              <h3>Meer tijd voor inhoudelijke strategie, minder voor zoekwerk.</h3>
            </div>
            <ul className="module-list">
              <li>Snelle input voor memo’s, pleitvoorbereiding en reviews.</li>
              <li>ECLI-resultaten met context, direct bruikbaar in onderbouwing.</li>
              <li>Consistente analyses over verschillende dossiers.</li>
            </ul>
          </div>
          <div className="module-card">
            <div className="module-title">
              <span className="tag">Legal ops / compliance</span>
              <h3>Meer grip op proceskwaliteit en voorspelbare output.</h3>
            </div>
            <ul className="module-list">
              <li>Standaard workflow met reproduceerbare secties per dossier.</li>
              <li>Ondersteuning voor governance en interne kwaliteitscontrole.</li>
              <li>Duidelijke scheiding tussen AI-output en juristbeoordeling.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="resultaat" className="examples">
        <div className="section-header">
          <p className="eyebrow">Resultaat in je praktijk</p>
          <h2>Input, output en directe waarde voor de zaak.</h2>
          <p className="lead">
            Elke output is gericht op betere dossierkwaliteit en sneller intern overleg.
          </p>
        </div>
        <div className="examples-grid">
          <div className="example-card">
            <p className="eyebrow">Contractanalyse voor juridische teams</p>
            <h3>Input: huurovereenkomst woonruimte</h3>
            <div className="example-body">
              <div className="example-row">
                <span className="example-label">Output</span>
                <p>Risico op minimumduur-clausule + gerichte controlevragen.</p>
              </div>
              <div className="example-row">
                <span className="example-label">Waarde</span>
                <p>Sneller bepalen of heronderhandeling of escalatie nodig is.</p>
              </div>
            </div>
          </div>
          <div className="example-card">
            <p className="eyebrow">Jurisprudentie met ECLI-bronnen</p>
            <h3>Input: ontslag op staande voet</h3>
            <div className="example-body">
              <div className="example-row">
                <span className="example-label">Output</span>
                <p>Top ECLI’s met snippet en context van bewijsvereisten.</p>
              </div>
              <div className="example-row">
                <span className="example-label">Waarde</span>
                <p>Snellere onderbouwing voor memo en processtrategie.</p>
              </div>
            </div>
          </div>
          <div className="example-card">
            <p className="eyebrow">Vraagbeantwoording met bron</p>
            <h3>Input: randvoorwaardenkorting</h3>
            <div className="example-body">
              <div className="example-row">
                <span className="example-label">Output</span>
                <p>Conclusie met onderbouwing en relevante ECLI-verwijzingen.</p>
              </div>
              <div className="example-row">
                <span className="example-label">Waarde</span>
                <p>Direct inzetbare basis voor cliëntadvies of intern overleg.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="comparison-card">
          <h3>Voor en na LegalAI</h3>
          <div className="comparison-grid">
            <div>
              <p className="comparison-label">Zonder LegalAI</p>
              <ul className="module-list">
                <li>Zoekwerk verspreid over tools en bronnen.</li>
                <li>Variabele kwaliteit tussen dossiers en teamleden.</li>
                <li>Meer tijd kwijt aan eerste analyse en broncheck.</li>
              </ul>
            </div>
            <div>
              <p className="comparison-label">Met LegalAI</p>
              <ul className="module-list">
                <li>Workflow met structuur van intake tot conclusie.</li>
                <li>Output met ECLI-onderbouwing per juridisch antwoord.</li>
                <li>Sneller intern afstemmen met behoud van kwaliteit.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="werkwijze" className="workflow">
        <div>
          <p className="eyebrow">Werkwijze</p>
          <h2>Van intake naar juridisch inzetbaar advies in drie stappen.</h2>
          <p className="lead">
            Gericht op praktijktempo: van dossierinput naar onderbouwde output in korte cycli.
          </p>
        </div>
        <div className="steps">
          <div className="step">
            <span>01</span>
            <h3>Intake</h3>
            <p>Upload contract of start met een concrete juridische vraag.</p>
          </div>
          <div className="step">
            <span>02</span>
            <h3>Analyse met bronnen</h3>
            <p>Automatische structuur en ECLI-onderbouwing voor relevante passages.</p>
          </div>
          <div className="step">
            <span>03</span>
            <h3>Direct inzetbaar advies</h3>
            <p>Gebruik output als basis voor memo, review of cliëntoverleg.</p>
          </div>
        </div>
      </section>

      <section id="vertrouwen" className="insights trust">
        <div className="insight-card">
          <h3>Dataverwerking</h3>
          <p>Ontworpen met aandacht voor AVG, toegangscontrole en duidelijke datagrenzen.</p>
        </div>
        <div className="insight-card">
          <h3>Jurist houdt regie</h3>
          <p>LegalAI ondersteunt analyse; de eindbeoordeling blijft altijd bij het team.</p>
        </div>
        <div className="insight-card">
          <h3>Transparantie</h3>
          <p>
            Lees meer over onze <Link href="/beveiliging">beveiliging</Link> en
            <Link href="/privacyverklaring"> privacyaanpak</Link>.
          </p>
        </div>
      </section>

      <section className="cta-band">
        <div>
          <h2>Wil je zien hoe dit werkt op jullie dossiers?</h2>
          <p>Plan een demo of neem contact op voor een korte intake van jullie praktijk.</p>
        </div>
        <div className="cta-band-actions">
          <Link
            className="cta"
            href="/contact"
            onClick={() => trackEvent("homepage_midpage_cta_click", { cta: "band_plan_demo" })}
          >
            Plan een demo
          </Link>
          <Link
            className="ghost"
            href="/contact"
            onClick={() => trackEvent("homepage_midpage_cta_click", { cta: "band_contact" })}
          >
            Neem contact op
          </Link>
        </div>
      </section>

      <footer className="footer">
        <div>
          <strong>LegalAI</strong>
          <p>Voor advocatenkantoren die sneller willen werken zonder in te leveren op kwaliteit.</p>
          <p>
            Zakelijk contact: <a className="text-link" href="mailto:mitchelldevries2001@gmail.com">mitchelldevries2001@gmail.com</a>
          </p>
          <p>We reageren doorgaans binnen 1 werkdag.</p>
        </div>
        <div className="footer-links">
          <Link href="/contact">Contact</Link>
          <Link href="/beveiliging">Beveiliging</Link>
          <Link href="/voorwaarden">Voorwaarden</Link>
          <Link href="/privacyverklaring">Privacy</Link>
          <Link href="/vacatures">Vacatures</Link>
        </div>
      </footer>
    </main>
  );
}
