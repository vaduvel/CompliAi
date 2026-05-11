# DPO Consultant runtime demo — 3 clienți fictivi, flow cap-coadă

**Status**: scenariu demo rulabil în aplicație.
**URL local**: `/demo/dpo-consultant`
**Rol demo**: Diana Popescu, CIPP/E — consultant DPO la DPO Complet SRL.
**Scop**: arătăm cum un consultant DPO folosește CompliScan ca să găsească probleme, să le rezolve, să le dosarieze, să monitorizeze și să exporte dovada.

---

## Cum pornești demo-ul

1. Pornește aplicația local:
   ```bash
   COMPLISCAN_DATA_BACKEND=local COMPLISCAN_AUTH_BACKEND=local npm run dev
   ```
2. Deschide:
   ```text
   http://localhost:3000/demo/dpo-consultant
   ```
3. Ruta seedează automat:
   - cont demo DPO Complet SRL;
   - user mode `partner`;
   - white-label cabinet DPO Complet;
   - 3 workspace-uri client cu rol `partner_manager`;
   - state real per client: findings, alerts, documente, dovezi, evenimente.
4. Redirect final: `/dashboard/partner`.

Datele sunt fictive. Nu se folosesc date reale și nu se trimit documente către terți.

---

## Povestea demo

> „Sunt Diana, consultant DPO. Am trei clienți în portofoliu. În loc să țin Excel, Word, Drive și emailuri separate, intru în CompliScan și văd unde arde, ce trebuie generat, ce e deja dovedit și ce poate intra în Audit Pack.”

### Client 1 — Apex Logistic SRL

**Context**: firmă logistică cu plăți online prin Stripe.

Finding-uri seed-uite:
- `apex-gdpr-dpa-stripe` — DPA Stripe expirat / nelink-uit la dosar, GDPR Art. 28.
- `apex-gdpr-ropa-stripe` — RoPA nu include Stripe ca procesator, GDPR Art. 30.
- `apex-gdpr-cookie-reject` — cookie banner fără opțiune reală de respingere.

Ce arătăm:
- DPA-ul Apex × Stripe este deja pregătit de DPO Complet.
- Aprobarea clientului este capturată ca dovadă `sufficient`.
- Traceability și Audit Pack pot arăta ce este validat și ce rămâne `review_required`.
- Rămân două acțiuni reale: update RoPA + dovadă cookie banner.

Demo line:
> „Aici se vede cap-coadă: problemă Art. 28, document generat, patron aprobă prin magic link, dovada intră în dosar. Nu mai rămâne doar email trimis.”

### Client 2 — Lumen Clinic SRL

**Context**: clinică medicală, date speciale Art. 9 GDPR.

Finding-uri seed-uite:
- `lumen-dsar-overdue` — DSAR pacient depășit peste termenul de 30 zile.
- `lumen-dpia-special-categories` — DPIA lipsă pentru portal programări medicale.
- `lumen-retention-policy` — politica de retenție amestecă fișe medicale cu marketing.

Ce arătăm:
- Urgența este diferită: aici nu e DPA vendor, ci DSAR și categorii speciale.
- Sistemul scoate în față riscul critic.
- Consultantul poate pregăti răspunsul DSAR și poate păstra dovada trimiterii.

Demo line:
> „La Lumen nu vând aceeași rețetă. Aici CompliScan îmi spune că prioritatea este DSAR-ul, nu încă un document generic.”

### Client 3 — Cobalt Fintech IFN

**Context**: fintech sensibil, scoring credit și utilizare AI internă.

Finding-uri seed-uite:
- `cobalt-gdpr-credit-dpia` — DPIA lipsă pentru scoring credit / decizie asistată.
- `cobalt-ai-inventory-chatgpt` — ChatGPT Enterprise folosit fără regulă de minimizare date.
- `cobalt-payroll-dpa` — DPA payroll fără clauză de incident.

Ce arătăm:
- Client sensibil: AI OFF este tratat ca dovadă operațională.
- Politica AI / minimizare prompturi este atașată ca evidence.
- Rămân deschise DPIA credit scoring și addendum DPA payroll.

Demo line:
> „Pentru Cobalt, nu forțez AI peste tot. Clientul sensibil poate merge template-only, iar configurația AI OFF devine dovadă în dosar.”

---

## Flow de prezentare în 12 minute

1. Deschide `/demo/dpo-consultant`.
2. Ajungi în `/dashboard/partner`.
3. Arată portofoliul: 3 clienți, scoruri diferite, alerte diferite.
4. Intră în Apex Logistic.
5. Arată finding-ul DPA Stripe și dovada aprobată.
6. Deschide Dosar / Audit Pack pentru Apex.
7. Explică `review_required`: nu mințim că totul este audit-ready.
8. Revino în portofoliu și intră în Lumen Clinic.
9. Arată DSAR critic și DPIA pentru date medicale.
10. Revino în portofoliu și intră în Cobalt Fintech.
11. Arată AI OFF + policy evidence.
12. Închide cu loop-ul universal:
    ```text
    găsire problemă → rezolvare asistată → dovadă → monitorizare → audit pack
    ```

---

## Ce trebuie să observe DPO-ul

- CompliScan nu încearcă să îl înlocuiască pe DPO.
- CompliScan îl ajută să nu piardă follow-up-uri, dovezi și versiuni.
- Fiecare client are alt risc, alt flow și alt tip de dovadă.
- Audit Pack este onest: `review_required` până când toate dovezile sunt validate.
- White-label-ul face ca patronul să interacționeze cu DPO Complet, nu cu o aplicație străină.

---

## Acceptance criteria demo

- [ ] `/demo/dpo-consultant` pornește fără eroare și redirecționează în partner dashboard.
- [ ] Portofoliul afișează 3 clienți: Apex Logistic, Lumen Clinic, Cobalt Fintech.
- [ ] Apex are DPA Stripe `signed` și evidence quality `sufficient`.
- [ ] Lumen are DSAR critic deschis.
- [ ] Cobalt are AI OFF / policy evidence validată.
- [ ] Exportul Audit Pack pentru Apex nu promite fals `audit_ready` dacă mai există acțiuni deschise.

