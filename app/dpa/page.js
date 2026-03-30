"use client";

import Link from "next/link";

export default function DpaPage() {
  return (
    <main className="page signup-page terms-page">
      <div className="halo" aria-hidden="true" />
      <section className="form-card">
        <div className="form-header">
          <p className="eyebrow">DPA</p>
          <h1>Verwerkersovereenkomst (DPA) - Zaakwijzer</h1>
          <div className="terms-meta">
            <span>Versie: 1.0</span>
            <span>Datum: 30-03-2026</span>
          </div>
          <p className="lead">
            Zaakwijzer sluit op verzoek een verwerkersovereenkomst met zakelijke
            klanten. Deze pagina beschrijft de kernpunten van onze
            gegevensverwerking als verwerker.
          </p>
        </div>

        <div className="terms-content">
          <ol>
            <li>
              <h2>Rollen</h2>
              <p>
                Klant is verwerkingsverantwoordelijke voor persoonsgegevens in
                Input. Zaakwijzer is verwerker en verwerkt alleen op instructie van
                de Klant om de Dienst te leveren.
              </p>
            </li>
            <li>
              <h2>Verwerkingsdoel</h2>
              <p>
                Verwerking is beperkt tot het leveren van functionaliteit voor
                contractanalyse, jurisprudentie-zoekopdrachten en vraag/antwoord
                met bronverwijzingen.
              </p>
            </li>
            <li>
              <h2>Data-categorieen</h2>
              <p>
                Klant bepaalt welke persoonsgegevens in Input worden geplaatst.
                Zaakwijzer adviseert dataminimalisatie en anonimiseren waar mogelijk.
              </p>
            </li>
            <li>
              <h2>Subverwerkers (huidige stack)</h2>
              <ul>
                <li>OpenAI (model inference en embeddings).</li>
                <li>Supabase (database, authenticatie en RPC-verwerking).</li>
                <li>Hostingprovider van Zaakwijzer (runtime en operationele logging).</li>
                <li>Resend (alleen voor contact/e-mailfunctionaliteit).</li>
                <li>Azure Blob Storage (bronbestanden jurisprudentie, indien gebruikt).</li>
              </ul>
            </li>
            <li>
              <h2>Opslag en retentie</h2>
              <p>
                Zaakwijzer biedt geen permanente contractopslag. Geuploade documenten
                worden verwerkt voor analyse en tijdelijke uploadbestanden worden
                na verwerking verwijderd waar technisch mogelijk.
              </p>
              <p>
                Operationele logs kunnen beperkte technische metadata bevatten en
                worden bewaard volgens retentie van onderliggende providers.
              </p>
            </li>
            <li>
              <h2>Beveiliging</h2>
              <p>
                Maatregelen omvatten TLS-transport, toegangsbeperking,
                rate-limiting, monitoring en incidentafhandeling.
              </p>
            </li>
            <li>
              <h2>Rechten van betrokkenen</h2>
              <p>
                Zaakwijzer ondersteunt de Klant bij AVG-verzoeken van betrokkenen
                voor zover dit betrekking heeft op verwerkingen in de Dienst.
              </p>
            </li>
            <li>
              <h2>Contact voor ondertekening</h2>
              <p>
                Voor een ondertekende DPA kun je contact opnemen via
                <strong> team@zaakwijzer.nl</strong>.
              </p>
            </li>
          </ol>
        </div>

        <div className="form-actions">
          <Link className="ghost" href="/">
            Terug naar home
          </Link>
        </div>
      </section>
    </main>
  );
}

