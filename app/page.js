"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    const revealEls = Array.from(document.querySelectorAll(".zw-reveal"));

    if (!revealEls.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    revealEls.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="zw">
      <header className="zw-header">
        <nav className="zw-nav">
          <Link className="zw-logo" href="/">
            Zaakwijzer
          </Link>

          <button
            className="zw-menu-toggle"
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="zw-mobile-menu"
          >
            Menu
          </button>

          <div className="zw-links">
            
            <Link href="/demo">Voorbeeldomgeving</Link>
            <Link href="/login">Inloggen</Link>
            <Link
              className="zw-nav-cta"
              href="/contact"
              onClick={() => trackEvent("homepage_nav_cta_click", { cta: "landing_nav_plan_demo" })}
            >
              Plan demo
            </Link>
          </div>
        </nav>

        <div id="zw-mobile-menu" className={`zw-mobile-menu ${menuOpen ? "open" : ""}`}>
         
         
          <Link href="/demo" onClick={() => setMenuOpen(false)}>
            Voorbeeldomgeving
          </Link>
          <Link href="/login" onClick={() => setMenuOpen(false)}>
            Inloggen
          </Link>
          <Link
            className="zw-nav-cta"
            href="/contact"
            onClick={() => {
              setMenuOpen(false);
              trackEvent("homepage_nav_cta_click", { cta: "landing_mobile_plan_demo" });
            }}
          >
            Plan demo
          </Link>
        </div>
      </header>

      <section className="zw-hero">
        <div className="zw-hero-left">
          <p className="zw-hero-eyebrow">AI voor advocatenkantoren</p>
          <h1 className="zw-hero-title">
            Jurisprudentie<br />
            in <em>seconden,</em><br />
            niet uren.
          </h1>
          <p className="zw-hero-sub">
            Zaakwijzer geeft juridische teams directe toegang tot relevante ECLI-bronnen, contractanalyse en
            duidelijke antwoorden met onderbouwing. Meer tijd voor cliënten, minder tijd in zoekwerk.
          </p>
          <div className="zw-hero-actions">
            <Link
              className="cta"
              href="/contact"
              onClick={() => trackEvent("homepage_hero_primary_click", { cta: "landing_hero_plan_demo" })}
            >
              Plan een demo
            </Link>
            <a href="#features" className="zw-btn-ghost">
              Meer ontdekken
            </a>
          </div>
        </div>

        <div className="zw-hero-right">
          <div className="zw-demo-card">
            <div className="zw-demo-bar">
              <div className="zw-demo-dot" />
              <div className="zw-demo-dot" />
              <div className="zw-demo-dot" />
              <span className="zw-demo-label">Zaakwijzer · voorbeeld</span>
            </div>

            <div className="zw-demo-body">
              <div className="zw-demo-input-row">
                <div className="zw-demo-avatar">JV</div>
                <div className="zw-demo-bubble">
                  Mijn cliënt werd ontslagen na 12 jaar dienst. De werkgever stelt disfunctioneren, maar er
                  zijn nooit functioneringsgesprekken gevoerd.
                </div>
              </div>

              <div className="zw-demo-response">
                <div className="zw-demo-response-label">Relevante jurisprudentie gevonden</div>
                <div className="zw-demo-case">
                  <strong>HR 27 april 2001, NJ 2001/421</strong> Ontslag wegens disfunctioneren vereist een
                  aantoonbaar verbetertraject en adequate begeleiding.
                </div>
                <div className="zw-demo-case">
                  <strong>Ktr. Amsterdam 15 maart 2019</strong> Ontslag werd afgewezen zonder gedocumenteerde
                  functioneringsgesprekken.
                </div>
                <div className="zw-demo-tags">
                  <span className="zw-demo-tag">Arbeidsrecht</span>
                  <span className="zw-demo-tag">Ontslag</span>
                  <span className="zw-demo-tag">Disfunctioneren</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="zw-divider">
        <span>Drie kernfuncties</span>
      </div>

      <section id="features" className="zw-features">
        <div className="zw-features-header zw-reveal">
          <div>
            <p className="zw-features-eyebrow">Wat Zaakwijzer doet</p>
            <h2 className="zw-features-title">
              Drie tools.<br />
              <em>Direct</em> bruikbaar.
            </h2>
          </div>
          <p className="zw-features-note">
            Ontworpen voor teams die efficiënter willen werken zonder in te leveren op juridische kwaliteit.
          </p>
        </div>

        <div className="zw-features-grid">
          <article className="zw-feature-item zw-reveal">
            <span className="zw-feature-number">01</span>
            <div className="zw-feature-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M9 12h6M9 16h6M9 8h2M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
              </svg>
            </div>
            <h3 className="zw-feature-name">Zaakanalyse</h3>
            <p className="zw-feature-desc">
              Beschrijf een zaak en ontvang relevante jurisprudentie, gefilterd op toepasbaarheid en direct
              inzetbaar voor memo of bespreking.
            </p>
            <span className="zw-feature-tag">Jurisprudentie op maat</span>
          </article>

          <article className="zw-feature-item zw-reveal zw-delay-1">
            <span className="zw-feature-number">02</span>
            <div className="zw-feature-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="zw-feature-name">Vraag-antwoord met bron</h3>
            <p className="zw-feature-desc">
              Stel een vraag in gewone taal. Zaakwijzer geeft een helder antwoord met verwijzingen naar ECLI’s
              en context voor juridische toetsing.
            </p>
            <span className="zw-feature-tag">Bronnen altijd zichtbaar</span>
          </article>

          <article className="zw-feature-item zw-reveal zw-delay-2">
            <span className="zw-feature-number">03</span>
            <div className="zw-feature-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2m-6 9 2 2 4-4" />
              </svg>
            </div>
            <h3 className="zw-feature-name">Contractanalyse</h3>
            <p className="zw-feature-desc">
              Upload contracten en ontvang risico’s, ontbrekende bepalingen en relevante rechtspraak in een
              vaste, reproduceerbare structuur.
            </p>
            <span className="zw-feature-tag">PDF upload ondersteund</span>
          </article>
        </div>
      </section>

      <div className="zw-divider">
        <span>Waarom Zaakwijzer</span>
      </div>

      <section id="over" className="zw-proof">
        <div className="zw-proof-left zw-reveal">
          <p className="zw-proof-eyebrow">Gebouwd voor de praktijk</p>
          <h2>
            Minder zoektijd.<br />
            <em>Meer inhoudelijk werk.</em>
          </h2>
          <p>
            Kleine en middelgrote advocatenkantoren hebben vaak beperkte researchcapaciteit. Zaakwijzer geeft
            hetzelfde analyseniveau met een werkbare workflow voor dagelijkse dossiers.
          </p>
          <p>
            Geen verspreid zoekwerk over losse bronnen. Gewoon dossierinput, analyse met bronnen en sneller
            intern afstemmen.
          </p>
          <div className="zw-proof-stats">
            <div>
              <div className="zw-stat-number">
                5-10<span>u</span>
              </div>
              <div className="zw-stat-label">gemiddelde tijdsbesparing per week</div>
            </div>
            <div>
              <div className="zw-stat-number">
                3<span>x</span>
              </div>
              <div className="zw-stat-label">sneller dan handmatig zoeken</div>
            </div>
          </div>
        </div>

        <div className="zw-proof-right zw-reveal zw-delay-1">
          <div className="zw-testimonial-card">
            <div className="zw-quote-mark">&quot;</div>
            <p className="zw-testimonial-text">
              Bij een ontslagdossier hadden we binnen enkele minuten bruikbare ECLI’s in beeld. We toetsen
              alles nog steeds zelf, maar de eerste researchronde kost nu duidelijk minder tijd.
            </p>
            <div className="zw-testimonial-author">Anonieme pilotdeelnemer</div>
            <div className="zw-testimonial-role">Advocaat arbeidsrecht, kantoor met 12 medewerkers</div>
            <p className="zw-placeholder-note">Citaat geanonimiseerd op verzoek van het kantoor.</p>
          </div>
        </div>
      </section>

      <section id="demo" className="zw-cta-section">
        <p className="zw-cta-eyebrow zw-reveal">Gratis demo, geen verplichtingen</p>
        <h2 className="zw-cta-title zw-reveal">
          Klaar om sneller<br />
          <em>te werken?</em>
        </h2>
        <p className="zw-cta-sub zw-reveal">
          Laat je e-mailadres achter en plan een persoonlijke demo van 15 minuten. Je ziet meteen hoe
          Zaakwijzer past bij jullie type zaken.
        </p>

        <form
          className="zw-cta-form zw-reveal"
          action="/contact"
          method="get"
          onSubmit={() => trackEvent("homepage_midpage_cta_click", { cta: "landing_demo_form" })}
        >
          <input
            className="zw-cta-input"
            type="email"
            name="email"
            placeholder="uw.naam@kantoor.nl"
            required
          />
          <button className="zw-cta-btn" type="submit">
            Demo aanvragen
          </button>
        </form>

        <p className="zw-cta-reassure zw-reveal">Geen spam. Geen verplichtingen.</p>
      </section>

      <footer className="zw-footer">
        <div className="zw-footer-logo">
          Zaakwijzer
        </div>
        <div className="zw-footer-links">
          <Link href="/contact">Contact</Link>
          <Link href="/beveiliging">Beveiliging</Link>
          <Link href="/voorwaarden">Voorwaarden</Link>
          <Link href="/privacyverklaring">Privacy</Link>
        </div>
        <div className="zw-footer-legal">© {new Date().getFullYear()} Zaakwijzer · zaakwijzer.nl</div>
      </footer>
    </main>
  );
}
