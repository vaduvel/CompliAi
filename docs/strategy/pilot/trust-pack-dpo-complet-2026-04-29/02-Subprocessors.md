# Subprocessori CompliScan — pilot DPO Complet

**Status:** operational policy pentru pilot  
**Ultima actualizare:** 29 aprilie 2026  
**Scop:** listă clară a serviciilor care pot procesa date în cadrul pilotului.

Această listă trebuie revizuită și atașată DPA-ului semnat înainte de producție cu date reale sensibile.

## Tabel subprocessori

| Serviciu | Provider exact | Rol | Regiune | Date procesate | AI | Training | EU-only | Activare | Status |
|---|---|---|---|---|---|---|---|---|---|
| Vercel | Vercel Inc. / Vercel platform project configured for fra1 serverless runtime | Hosting/runtime | fra1 — Frankfurt, Germany pentru rutele server-side care procesează date client | request metadata, session cookies, workspace routing metadata, runtime logs minimale; fișierele de evidence nu se stochează în Vercel | n/a | not_applicable | yes | întotdeauna pentru aplicația web și API runtime | production_required |
| Supabase | Supabase project production — Postgres + Storage private bucket | Database/auth/storage | eu-central-1 — Frankfurt, Germany | org_state, memberships, event ledger, evidence_objects metadata, fișiere evidence în bucket privat | n/a | not_applicable | yes | obligatoriu pentru producție; `local_fallback` permis doar demo/dev | production_required |
| Resend | Resend transactional email workspace configured for EU sending policy | Email tranzacțional | EU transactional email route; dacă ruta EU nu este contractată, notificările client-facing rămân OFF pentru clienți sensibili | email destinatar, nume cabinet, titlu document, token magic link, status notificare; nu trimite conținutul documentului în email | n/a | not_applicable | yes | opțional; doar dacă pilotul activează notificări email | optional |
| Mistral AI | Mistral AI API — EU provider route for DPO production pilot | AI document assistance | EU provider route — Paris/France data plane pentru pilotul DPO | prompt minim, tip document, variabile template, fragmente strict necesare; nu primește evidence files brute | ai_on_optional | no_customer_training | yes | doar pe client/workspace cu AI ON; implicit AI OFF pentru healthcare/fintech sensibil | optional |
| Google Gemini | Google Gemini API — global provider endpoint disabled by default for DPO production pilot | AI fallback | global provider endpoint — dezactivat implicit pentru producția DPO | prompt minim și context document doar dacă AI ON + provider Gemini este ales explicit | ai_off | no_customer_training | disabled_by_default | nu este folosit în pilotul DPO standard; se activează doar prin decizie explicită a cabinetului | disabled_by_default |
| Stripe | Stripe Payments Europe, Ltd. | Billing | Ireland/EU pentru merchant of record; poate implica procesare globală Stripe pentru plăți | date facturare cabinet, subscription metadata, payment status; nu procesează documente client/evidence | n/a | not_applicable | not_required | doar după activarea billing-ului live | optional |

## Reguli pentru pilot

- Pentru primul pilot, clientul sensibil pornește cu AI OFF.
- Google Gemini rămâne disabled by default.
- Resend poate rămâne OFF; magic link-ul poate fi copiat manual dacă emailul nu este pregătit contractual.
- Date reale se folosesc doar după confirmarea mediului Supabase production.
- `local_fallback` este acceptat doar pentru demo și test pseudonimizat.

## Ce trebuie confirmat înainte de producție

- proiectul Vercel folosește regiunea configurată pentru runtime server-side;
- proiectul Supabase production este în `eu-central-1 — Frankfurt`;
- bucket-ul `compliscan-evidence-private` există și este privat;
- ruta email Resend este acceptabilă pentru pilot sau notificările email rămân OFF;
- provider-ul AI folosit efectiv este documentat în contract;
- orice schimbare de subprocessor este comunicată cabinetului înainte de activare.
