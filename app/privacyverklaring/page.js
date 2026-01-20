"use client";

import Link from "next/link";

export default function PrivacyverklaringPage() {
  return (
    <main className="page signup-page terms-page">
      <div className="halo" aria-hidden="true" />
      <section className="form-card">
        <div className="form-header">
          <p className="eyebrow">Privacy</p>
          <h1>Privacyverklaring - LegalAI (B2B)</h1>
          <div className="terms-meta">
            <span>Versie: 1.0</span>
            <span>Datum: 19-01-2026</span>
          </div>
          <p className="lead">
            Deze privacyverklaring legt uit hoe LegalAI persoonsgegevens verwerkt
            wanneer je onze website en applicatie gebruikt ("Dienst"). LegalAI
            levert uitsluitend aan zakelijke klanten (B2B).
          </p>
        </div>

        <div className="terms-content">
          <ol>
            <li>
              <h2>Wie is verantwoordelijk?</h2>
              <p>
                Verwerkingsverantwoordelijke (controller) voor gegevens van
                bezoekers, prospects en accountbeheer: LegalAI, Langestraat
                XX Alkmaar, Nederland.
              </p>
              <p>
                Registratie: 87292459.
              </p>
              <p>E-mail: mitchelldevries2001@gmail.com</p>
              <p>
                Rol als verwerker (processor): Wanneer jouw medewerkers de
                Dienst gebruiken en daarbij (mogelijk) persoonsgegevens in
                Input zetten (bijv. namen in een contract), verwerkt LegalAI
                die gegevens namens de Klant om de Dienst te leveren. In dat
                geval is de Klant doorgaans verwerkingsverantwoordelijke en
                LegalAI verwerker.
              </p>
              <p>
                Tip: als je een verwerkersovereenkomst (DPA) aanbiedt, zet
                hier: "Op verzoek sluiten wij een verwerkersovereenkomst."
              </p>
            </li>
            <li>
              <h2>Welke persoonsgegevens verwerken we?</h2>
              <p><strong>A) Account- en klantgegevens (B2B):</strong></p>
              <ul>
                <li>Naam, zakelijk e-mailadres, bedrijfsnaam.</li>
                <li>Factuurgegevens (adres, BTW-nummer indien opgegeven).</li>
                <li>Betalings- en abonnementsinformatie (via betaalprovider).</li>
              </ul>
              <p>
                <strong>B) Technische gegevens (bij gebruik van website/app):</strong>
              </p>
              <ul>
                <li>IP-adres, apparaat- en browsergegevens.</li>
                <li>Loggegevens (bijv. foutmeldingen, performance).</li>
                <li>
                  Timestamps en beperkte gebruiksstatistieken (bijv. aantal
                  requests / rate limiting).
                </li>
              </ul>
              <p><strong>C) Inhoud die je invoert (Input) en Output:</strong></p>
              <ul>
                <li>
                  Vragen, prompts, tekstfragmenten en documenten die gebruikers
                  in de app invoeren.
                </li>
                <li>
                  De door de Dienst gegenereerde antwoorden/analyses (Output).
                </li>
              </ul>
            </li>
            <li>
              <h2>
                Waarvoor gebruiken we persoonsgegevens (doeleinden) en op welke
                grondslag?
              </h2>
              <p>Wij verwerken persoonsgegevens voor:</p>
              <ul>
                <li>
                  Het leveren van de Dienst (account aanmaken, authenticatie,
                  functionaliteit aanbieden). Grondslag: uitvoering overeenkomst.
                </li>
                <li>
                  Abonnementen, facturatie en administratie. Grondslag:
                  uitvoering overeenkomst + wettelijke verplichting
                  (boekhouding).
                </li>
                <li>
                  Beveiliging, misbruikpreventie en stabiliteit (logging, rate
                  limiting, incident response). Grondslag: gerechtvaardigd
                  belang (beveiliging en continuiteit).
                </li>
                <li>
                  Support en communicatie (vragen beantwoorden, serviceberichten).
                  Grondslag: uitvoering overeenkomst / gerechtvaardigd belang.
                </li>
                <li>
                  Verbetering van de Dienst (niet op basis van klantcontent).
                  Grondslag: gerechtvaardigd belang, beperkt tot technische
                  metrics en feedback.
                </li>
              </ul>
              <p>
                Belangrijk: we gebruiken geen klant-Input of contractinhoud om
                AI-modellen te trainen.
              </p>
            </li>
            <li>
              <h2>Opslag van contracten, training en AI-specifieke punten</h2>
              <p>
                Geen permanente opslag van contracten: LegalAI biedt geen
                archief/contractopslag. Input kan wel tijdelijk worden verwerkt
                om direct Output te genereren (sessieverwerking).
              </p>
              <p>
                Geen training op klantdata: Input/Output wordt niet gebruikt om
                (AI-)modellen te trainen.
              </p>
              <p>
                Let op met persoonsgegevens: plaats bij voorkeur geen onnodige
                persoonsgegevens of bijzondere gegevens in Input. Anonimiseer
                waar mogelijk.
              </p>
              <p>
                (Als je wel iets van logging bewaart voor debugging: laat
                "tijdelijk" staan en specificeer bewaartermijnen in artikel 7.)
              </p>
            </li>
            <li>
              <h2>Delen wij gegevens met derden?</h2>
              <p>Wij delen persoonsgegevens alleen wanneer nodig:</p>
              <ul>
                <li>
                  Hosting/infra providers (servers, database, monitoring) - als
                  verwerker/subverwerker.
                </li>
                <li>Betaalprovider (voor betalingen en terugboekingen).</li>
                <li>E-mail/Support tooling (als je ticketsysteem gebruikt).</li>
                <li>
                  Wettelijke verplichting (bijv. belastingdienst, gerechtelijke
                  bevelen).
                </li>
              </ul>
              <p>Wij verkopen geen persoonsgegevens.</p>
            </li>
            <li>
              <h2>Doorgifte buiten de EU/EEA</h2>
              <p>
                Wij streven ernaar gegevens binnen de EU/EEA te verwerken. Als
                een leverancier toch buiten de EU/EEA verwerkt, zorgen wij voor
                passende waarborgen (bijv. EU Standard Contractual Clauses) en
                aanvullende maatregelen waar nodig.
              </p>
            </li>
            <li>
              <h2>Bewaartermijnen</h2>
              <p>
                Account- en factuurgegevens: zolang het account actief is +
                wettelijke bewaartermijnen (meestal 7 jaar voor administratieve
                gegevens).
              </p>
              <p>
                Technische logs: 90 dagen, tenzij langer nodig
                voor security-incidenten of fraudeonderzoek.
              </p>
              <p>
                Input/Output in de applicatie: niet bedoeld voor opslag.
                Tijdelijke verwerking vindt plaats voor het leveren van Output;
                structurele opslag vindt niet plaats behalve voor strikt
                noodzakelijke technische logging.
              </p>
            </li>
            <li>
              <h2>Beveiliging</h2>
              <p>LegalAI neemt passende technische en organisatorische maatregelen, zoals:</p>
              <ul>
                <li>versleutelde verbindingen (TLS);</li>
                <li>toegangsbeperkingen (least privilege);</li>
                <li>monitoring en rate limiting;</li>
                <li>back-ups van systeemdata (niet bedoeld als contractopslag);</li>
                <li>incidentmanagement.</li>
              </ul>
            </li>
            <li>
              <h2>Jouw rechten (AVG)</h2>
              <p>
                Als je persoonsgegevens van ons zijn verwerkt als
                verwerkingsverantwoordelijke (bijv. accountbeheer), heb je
                rechten op:
              </p>
              <ul>
                <li>inzage, correctie, verwijdering;</li>
                <li>beperking en bezwaar;</li>
                <li>dataportabiliteit (waar van toepassing).</li>
              </ul>
              <p>
                Verzoeken kun je sturen naar: mitchelldevries2001@gmail.com.
              </p>
              <p>
                Wanneer LegalAI verwerker is (Input bevat persoonsgegevens
                namens Klant): dan loopt een verzoek meestal via jouw
                werkgever/organisatie (de Klant). Wij helpen de Klant waar
                nodig.
              </p>
            </li>
            <li>
              <h2>Cookies en vergelijkbare technieken</h2>
              <p>Wij kunnen functionele cookies gebruiken voor:</p>
              <ul>
                <li>sessiebeheer/inloggen;</li>
                <li>beveiliging;</li>
                <li>voorkeuren.</li>
              </ul>
              <p>
                Analytische cookies gebruiken we alleen met toestemming afhankelijk van jouw
                implementatie.
              </p>
              
            </li>
            <li>
              <h2>Klachten</h2>
              <p>
                Je kunt een klacht indienen bij de Autoriteit Persoonsgegevens.
                We stellen het op prijs als je eerst contact met ons opneemt
                zodat we het kunnen oplossen.
              </p>
            </li>
            <li>
              <h2>Wijzigingen</h2>
              <p>
                We kunnen deze privacyverklaring aanpassen. De nieuwste versie
                staat altijd op onze website. Bij grote wijzigingen informeren
                we klanten via e-mail of in-app.
              </p>
            </li>
          </ol>
        </div>

        <div className="form-actions">
          <Link className="ghost" href="/">
            Terug naar home
          </Link>
          <Link className="cta" href="/signup">
            Toegang aanvragen
          </Link>
        </div>
      </section>
    </main>
  );
}
