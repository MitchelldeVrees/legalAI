# DPA Execution Process (Internal)

**Owner:** LegalAI Ops  
**Version:** 1.0  
**Last updated:** 30-03-2026

## 1. Trigger

Start dit proces wanneer:

- een klant expliciet om een DPA vraagt; of
- Sales/Ops een enterprise onboarding start.

## 2. Intake checklist

- [ ] Juridische entiteit klant bevestigd.
- [ ] Tekenbevoegde contactpersoon bevestigd.
- [ ] Klant-specifieke verwerkingscontext bevestigd (eventuele afwijkingen).
- [ ] Regio/tenant configuratie beoordeeld.

## 3. Document preparation

1. Gebruik template: `compliance/DPA_TEMPLATE.md`.
2. Vul placeholders in:
   - klantnaam, adres, registratienummer, contact.
3. Voeg bijlage toe:
   - `compliance/SUBPROCESSOR_REGISTER.md`.
4. Controleer verwijzingen naar:
   - privacyverklaring;
   - algemene voorwaarden;
   - retentie SOP.

## 4. Review and approval

- **Legal/Founder review:** inhoudelijke check.
- **Ops review:** subprocessor/region details actueel.
- **Security review (indien nodig):** aanvullende klantvragen.

## 5. Signature workflow

- Stuur concept naar klant voor review.
- Verwerk redelijke redlines.
- Laat ondertekenen door beide partijen.
- Archiveer ondertekende versie in beperkte toegangslocatie.

## 6. Post-signature actions

- [ ] Markeer klantrecord als "DPA signed".
- [ ] Registreer versie en datum in interne contractindex.
- [ ] Communiceer intern dat DPA actief is.
- [ ] Plan jaarlijkse review op hernieuwingsdatum.

## 7. SLA for DPA requests

- Eerste concept binnen: **5 werkdagen**.
- Redline response: **5 werkdagen** per ronde.
- Doel doorlooptijd tot ondertekening: **<= 20 werkdagen**.

## 8. Escalation

Escaleren naar privacy/security contact wanneer:

- klant afwijkende doorgiftegrondslagen eist;
- klant subprocessor blokkeert;
- er een conflict is met bestaande technische inrichting.

