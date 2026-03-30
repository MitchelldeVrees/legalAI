# Subprocessor Register

**Owner:** LegalAI  
**Version:** 1.0  
**Last updated:** 30-03-2026

## Purpose

Dit register documenteert de actieve subverwerkers, verwerkingslocaties en doorgiftegrondslagen voor LegalAI.

## Active Subprocessors

| Subprocessor | Service | Data categories | Primary region(s) | Transfer outside EER | SCC basis |
|---|---|---|---|---|---|
| OpenAI | LLM inference + embeddings API | Prompt/input, output, metadata | US/EU (afhankelijk van accountconfiguratie) | Mogelijk | EU SCCs waar vereist |
| Supabase | Database, auth, storage/RPC | Accountgegevens, app-data, logs | EU (project-regio afhankelijk) | Mogelijk (support/ops) | EU SCCs waar vereist |
| Hosting provider (Vercel of equivalent) | App hosting + runtime logs | Request metadata, app logs, env-config references | EU/US (deployment-afhankelijk) | Mogelijk | EU SCCs waar vereist |
| Resend | Transactional email | Contactformulier metadata, e-mailinhoud | US/EU (provider-afhankelijk) | Mogelijk | EU SCCs waar vereist |
| Microsoft Azure Blob Storage | Jurisprudentie bronbestanden | Bronbestanden (jurisprudentie XML), access logs | EU (tenant/account-regio afhankelijk) | Mogelijk | EU SCCs waar vereist |

## Notes

- Klantdata wordt niet gebruikt om algemene AI-modellen te trainen.
- Regio’s zijn afhankelijk van daadwerkelijke tenant/project configuratie.
- Bij wijziging van subverwerkers wordt dit register bijgewerkt en gecommuniceerd.

## Change Log

- 30-03-2026: Eerste formele registerversie opgenomen.

