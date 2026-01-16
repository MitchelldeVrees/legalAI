import Link from "next/link";

export default function Home() {
  return (
    <main className="page">
      <div className="halo" aria-hidden="true" />
      <nav className="nav">
        <div className="logo">LegalAI</div>
        <div className="nav-links">
          <a href="#capabilities">Mogelijkheden</a>
          <a href="#workflow">Werkwijze</a>
          <a href="#insights">Inzichten</a>
          <Link className="cta" href="/signup">
            Toegang aanvragen
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Gemaakt voor teams met hoge inzet</p>
          <h1>
            Opstellen. Beoordelen. Verdedigen.
            <span> Juridisch onderzoek op proces-tempo.</span>
          </h1>
          <p className="lead">
            LegalAI combineert zoekwerk op citatieniveau, argumentmapping en
            directe redlining in een werkruimte. Ga van intake naar strategie
            zonder het herkomstspoor te verliezen waar je kantoor op vertrouwt.
          </p>
          <div className="hero-actions">
            <button className="cta">Plan een demo</button>
            <button className="ghost">Bekijk voorbeeld</button>
          </div>
          <div className="meta">
            <span>ISO 27001 afgestemd</span>
            <span>On-premise gereed</span>
            <span>VS + EU jurisdicties</span>
          </div>
        </div>

        <div className="hero-card">
          <div className="card-header">
            <span>Actieve zaak</span>
            <strong>Clarke v. Stonebridge</strong>
          </div>
          <div className="card-body">
            <div className="card-block">
              <h3>Argumentenkaart</h3>
              <p>Automatisch gelinkte precedentclusters met scores.</p>
            </div>
            <div className="card-block">
              <h3>Redline-assistent</h3>
              <p>Markeert risicoclausules en stelt verdedigbare herschrijvingen voor.</p>
            </div>
            <div className="card-block">
              <h3>Rechteranalyse</h3>
              <p>Volg uitkomsten van moties over 10 jaar aan indieningen.</p>
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
          <h2>Precisie die je kunt citeren</h2>
          <p>
            Elke bewering heeft een traceerbare bron. Schakel in een klik
            tussen AI-synthese en de originele bron.
          </p>
        </div>
        <div className="grid-item">
          <h3>Clausule-intelligentie</h3>
          <p>Risico-heatmaps op basis van de precedentbibliotheek van je kantoor.</p>
        </div>
        <div className="grid-item">
          <h3>Procesradar</h3>
          <p>Signaleer zwakke plekken voordat de wederpartij dat doet.</p>
        </div>
        <div className="grid-item">
          <h3>Onderhandelingsmotor</h3>
          <p>Scenario-playbooks voor M&amp;A-, privacy- en employment-teams.</p>
        </div>
      </section>

      <section id="workflow" className="workflow">
        <div>
          <p className="eyebrow">Werkwijze</p>
          <h2>Van intake naar strategie in drie stappen.</h2>
        </div>
        <div className="steps">
          <div className="step">
            <span>01</span>
            <h3>Uploaden en normaliseren</h3>
            <p>Neem contracten, jurisprudentie en discovery op in een kaart.</p>
          </div>
          <div className="step">
            <span>02</span>
            <h3>Onderzoek het dossier</h3>
            <p>Vraag, filter en vergelijk met uitlegbare redeneerpaden.</p>
          </div>
          <div className="step">
            <span>03</span>
            <h3>Publiceer met vertrouwen</h3>
            <p>Genereer pleitnota's of redlines met geverifieerde citaties.</p>
          </div>
        </div>
      </section>

      <section id="insights" className="insights">
        <div className="insight-card">
          <h3>92%</h3>
          <p>Minder tijd voor de eerste contractreview.</p>
        </div>
        <div className="insight-card">
          <h3>4.6x</h3>
          <p>Snellere precedentvinding over meerdere jurisdicties.</p>
        </div>
        <div className="insight-card">
          <h3>48 hrs</h3>
          <p>Gemiddelde doorlooptijd voor complexe summary judgment-concepten.</p>
        </div>
      </section>

      <section className="cta-band">
        <div>
          <h2>Klaar om je volgende pleitnota zichzelf te zien samenstellen?</h2>
          <p>We lopen je huidige werkwijze door en bouwen in 14 dagen een pilot.</p>
        </div>
        <button className="cta">Start pilot</button>
      </section>

      <footer className="footer">
        <div>
          <strong>LegalAI</strong>
          <p>Vertrouwd door leiders in litigation, M&amp;A en compliance.</p>
        </div>
        <div className="footer-links">
          <span>Beveiliging</span>
          <span>Voorwaarden</span>
          <span>Vacatures</span>
        </div>
      </footer>
    </main>
  );
}
