"use client";

import { useState } from "react";
import Link from "next/link";
import Markdown from "markdown-to-jsx";

const demoAnalysis = `# Analyse (demo)

## A. Documentprofiel
- **Type:** HUUR-OVEREENKOMST WOONRUIMTE (model ROZ 2017.21). **Zekerheid:** hoog.
- **Partijen:** Partij 1 (verhuurder) en Persoon 1 + Persoon 2 (huurders).
- **Datum / looptijd:** ingangsdatum 1 september 2024; minimumduur 24 maanden, daarna onbepaalde tijd.
- **Rechtsgebied:** huurrecht woonruimte. Let op mogelijke onduidelijkheid zelfstandig/onzelfstandig.

## B. Samenvatting (NL)
- ROZ‑model huurovereenkomst woonruimte (2017.21) als basis.
- Gehuurde: Langestraat 86 C te Alkmaar; met gemeenschappelijke ruimten (p. 2).
- Startdatum 1 september 2024; minimumduur 24 maanden zonder tussentijdse opzegging (p. 3–4).
- Huurprijs € 1.150 per maand + voorschotten (€ 15 nuts, € 15 service) = € 1.180 (p. 4).
- Jaarlijkse huurprijsaanpassing mogelijk per 1 juli volgens wettelijke norm (p. 4–5, 13).
- Huurder sluit individuele nutscontracten; voorschot/verrekening voor servicekosten (p. 5).
- Waarborgsom € 2.300 vóór sleuteloverdracht; terugbetaling binnen 1 maand bij correcte oplevering (p. 6).
- Boetebepalingen variërend van € 20 tot € 5.000 (p. 6–7).
- Uitgebreide verplichtingen rondom gebruik, onderhoud en oplevering (p. 7–14).
- Digitale ondertekening met bewaarplicht van transactiebewijs (p. 14).

## C. Kernbepalingen / secties
- **Artikel 1 – Het gehuurde (p. 2):** adres, bestemming en opleveringsproces.
- **Artikel 2 – Voorwaarden (p. 2):** ROZ‑bepalingen en hiërarchie.
- **Artikel 3 – Duur en opzegging (p. 3–4):** minimumduur en opzegtermijn.
- **Artikel 4 – Betaling (p. 4):** huurprijs en voorschotten.
- **Artikel 5 & 23 – Huurprijswijziging (p. 4–5, 13):** wettelijke index + max. opslag.
- **Artikel 10 – Waarborgsom (p. 6):** bedrag en terugbetaling.
- **Artikel 11 – Boetes (p. 6–7):** oplopende sancties.
- **Artikel 12–22 – Verplichtingen huurder (p. 7–14):** gebruik, onderhoud, inspectie.
- **Artikel 24 – Communicatie (p. 13–14):** elektronisch berichtenverkeer.
- **Artikel 26 – Slotbepalingen (p. 14):** wijzigingen, ongeldigheid, digitale ondertekening.

## D. Aandachtspunten & risico’s
- **Let op:** minimumduur 24 maanden beperkt flexibiliteit (p. 3.3).
- **Let op:** onduidelijkheid zelfstandig/onzelfstandig beïnvloedt huurbescherming.
- **Let op:** hoge boetebedragen kunnen disproportioneel uitpakken (p. 6–7).
- **Let op:** servicekosten met 5% administratieopslag (p. 5).
- **Let op:** strikte verbodsbepalingen voor wijzigingen aan woning (p. 14, 18, 22.3).
- **Let op:** ruime inspectie‑ en toegangsbepalingen voor verhuurder (p. 16).

## E. Vragen voor de behandelaar
1. Is het gehuurde juridisch zelfstandig of onzelfstandig?
2. Past de minimumduur van 24 maanden bij het doel van de huur?
3. Zijn boetebedingen redelijk en proportioneel?
4. Zijn alle bijlagen (energielabel, plattegrond) correct verstrekt?
5. Is de huurprijs geliberaliseerd of gereguleerd?
6. Zijn servicekosten en opslag aantoonbaar onderbouwd?
7. Is de digitale ondertekening juridisch voldoende geborgd?

## F. Onzekerheden
- Onzeker: status zelfstandig/onzelfstandig blijft onduidelijk.
- Onzeker: bijlagen ontbreken in dit exemplaar.
- Onzeker: paginanummering start niet op p. 1.
- Onzeker: eerste betaalperiode vs. ondertekeningsdatum.
`;

export default function DemoPage() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");

  const handleDemoAnalyze = () => {
    if (loading || analysis) {
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setAnalysis(demoAnalysis);
      setLoading(false);
    }, 10000);
  };

  return (
    <main className="page dashboard-shell">
      <div className="halo" aria-hidden="true" />
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Demo</p>
          <h1>Contract reader</h1>
        </div>
        <div className="header-actions">
          <Link className="ghost" href="/">
            Ga terug naar home
          </Link>
          <div className="account-chip">
            <div>
              <p>Account</p>
              <strong>Demo gebruiker</strong>
              <span>Voorbeeldomgeving</span>
            </div>
            <div className="avatar" aria-hidden="true" />
          </div>
        </div>
      </header>

      <div className="dashboard-body">
        <aside className="sidebar">
          <p className="sidebar-title">Navigatie</p>
          <button className="sidebar-item active">Contract reader</button>
        </aside>

        <section className="dashboard-main">
          <div className="form-card dashboard-card">
            <p className="eyebrow">Demo-bestand</p>
            <h2>Opgaaf gegevens voor de loonheffingen</h2>
            <p className="lead">
              Voorbeeldbestand staat klaar. Upload is uitgeschakeld in deze demo.
            </p>
            <div className="dashboard-actions">
              <button className="cta" type="button" onClick={handleDemoAnalyze}>
                {loading ? "Analyseren..." : "Verstuur voor analyse"}
              </button>
              <button className="ghost" type="button" disabled>
                Nieuw contract
              </button>
              
            </div>
            <p className="file-meta">Geselecteerd: LH008_2024_demo.pdf</p>
          </div>

          {analysis ? (
            <div className="form-card analysis-card">
              <p className="eyebrow">Analyse</p>
              <div className="analysis-output">
                <Markdown>{analysis}</Markdown>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
