# Data Retention SOP

**Owner:** LegalAI Engineering + Operations  
**Version:** 1.0  
**Last updated:** 30-03-2026

## 1. Scope

Deze SOP beschrijft bewaartermijnen en verwijderprocessen voor:

- applicatielogs;
- tijdelijke uploadbestanden;
- back-ups;
- incident-exports.

## 2. Data classes and retention

| Data class | Example | Retention target | Rationale | Deletion method |
|---|---|---|---|---|
| Auth/account records | `accounts`, `firms` | Zolang account actief + wettelijke plicht | Contractuele levering + administratie | DB delete op verzoek/opzegging |
| Temporary upload files | `formidable` temp files | Direct na verwerking | Minimalisatie | `fs.unlink` in API `finally` |
| App/API operational logs | Request/error/provider logs | 90 dagen (streefwaarde) | Security, troubleshooting | Provider log retention policy |
| Backups (system data) | DB snapshots | 30-35 dagen (provider default tenzij anders ingesteld) | Herstelbaarheid | Automatisch rollover + manual purge waar mogelijk |
| Incident exports | CSV/JSON for incident response | Max 180 dagen na incident-sluiting | Forensische analyse + audit trail | Secure delete na sluiting |

## 3. Operational procedure

1. **Daily**
- Controleer foutpieken en provider errors via `/api/ops/metrics`.
- Controleer of tijdelijke uploadbestanden niet accumuleren.

2. **Weekly**
- Verifieer logvolume en logretentie in hosting/Supabase dashboards.
- Check incident-export folder op verlopen bestanden.

3. **Monthly**
- Formele retentie-review:
  - logs > 90 dagen verwijderen waar beheerd;
  - incident exports > 180 dagen verwijderen;
  - valideren backup-retentie tegen provider-instellingen.

## 4. Incident export handling

- Incident exports bevatten alleen minimaal noodzakelijke gegevens.
- Exports worden opgeslagen in beperkte toegangslocatie.
- Toegang uitsluitend voor geautoriseerde incident responders.
- Na sluiting incident: vervaldatum toekennen en verwijdering plannen.

## 5. Roles and responsibilities

- **Engineering:** implementeert technische verwijdering en bewaartermijnen.
- **Operations:** bewaakt retentie en voert periodieke controles uit.
- **Privacy contact:** beoordeelt uitzonderingen en documenteert afwijkingen.

## 6. Exceptions

Afwijkingen op bewaartermijnen zijn alleen toegestaan bij:

- wettelijke bewaarplicht;
- lopend security-onderzoek of geschil;
- expliciete instructie van verwerkingsverantwoordelijke.

Elke afwijking wordt schriftelijk vastgelegd met:

- reden;
- verantwoordelijke;
- einddatum van afwijking.

## 7. Evidence and audit trail

Bewaar bewijs van uitgevoerde retentie-acties:

- datum/tijd van opschoning;
- type data;
- verantwoordelijke;
- resultaat (geslaagd/mislukt + reden).

