# CompliAI Risk Resolution Coverage Map

## Scop

Acest document fixează adevărul operațional pentru cele `16` familii reale de risc pe care CompliAI le poate identifica azi din:

- `CUI`
- `website`
- `ANAF e-Factura / SPV`
- `questionary`

Întrebarea la care răspunde:

- `câte rezolvăm real azi`
- `câte asistăm serios`
- `cât cod avem deja`
- `ce mai lipsește până la o rezolvare aproape completă`

## Snapshot Actual

- `16` familii reale de risc detectabile
- `6/16` rezolvabile real azi prin `CompliAI + om`
- `10/16` încă nu sunt închise onest cap-coadă de produs
- `3` riscuri sunt deja `operational-assisted` în cod:
  - `GDPR-005`
  - `GDPR-017`
  - `AI-OPS`

## Clasele reale de rezolvare

- `documentary`
  - CompliAI generează documentul, validează, leagă la finding, îl trimite în Dosar și pornește monitorizarea
- `operational`
  - CompliAI cere acțiune reală și dovadă operațională
- `operational-assisted`
  - CompliAI generează un document de suport, dar cazul nu se închide fără dovadă operațională
- `specialist_handoff`
  - CompliAI trimite în modul specialist și readuce cazul în cockpit pentru închidere

## Surse de adevăr din cod

- clasă de execuție și suport de document:
  - `/Users/vaduvageorge/Desktop/CompliAI/lib/compliscan/finding-kernel.ts`
- finding-uri de intake și `suggestedDocumentType`:
  - `/Users/vaduvageorge/Desktop/CompliAI/lib/compliance/intake-engine.ts`
- motoare reale de generare documente:
  - `/Users/vaduvageorge/Desktop/CompliAI/lib/server/document-generator.ts`
- suprafețe specialist deja existente:
  - `/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/dsar/page.tsx`
  - `/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/vendor-review/page.tsx`
  - `/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/fiscal/page.tsx`

## Harta Celor 16 Riscuri

### 1. Privacy / informare GDPR lipsă

- status azi: `rezolvat real`
- clasă: `documentary`
- cât avem deja: `90%`
- ce există:
  - generator `privacy-policy`
  - flow live confirmat cap-coadă
- ce mai lipsește până la 100%:
  - publicare asistată pe site și verificare automată post-publicare

### 2. Cookies consent neconform

- status azi: `rezolvat real, dar asistat`
- clasă: `operational-assisted`
- cât avem deja: `75%`
- ce există:
  - generator `cookie-policy`
  - flow live confirmat
  - dovadă operațională obligatorie
- ce mai lipsește până la 100%:
  - scanner preventiv mai strict pentru încărcarea scripturilor înainte de consimțământ
  - interpretare automată mai bună a configurării bannerului

### 3. DPA lipsă pentru procesatori / vendori

- status azi: `rezolvat real`
- clasă: `documentary`
- cât avem deja: `85%`
- ce există:
  - generator `dpa`
  - flow live confirmat
- ce mai lipsește până la 100%:
  - circuit de semnare / urmărire semnături
  - legare automată mai bună la vendor registry

### 4. Vendor governance / documentație externă lipsă

- status azi: `asistat puternic`
- clasă: `specialist_handoff`
- cât avem deja: `75%`
- ce există:
  - vendor review engine
  - vendor review page
  - vendor risk / vendor library / vendor prefill
  - `Vendor Pack` generat în produs
  - template solicitare documentație vendor
  - checklist vendor governance
  - plan intern de remediere
  - checklist de revenire în cockpit
  - handoff + revenire automată în cockpit
- ce mai lipsește până la 100%:
  - scorecard vendor
  - tracking expirări și răspunsuri
  - follow-up mai clar pe review-ul pornit
  - smoke live final confirmat pe deploymentul public
- ce ar urca riscul:
  - specialist flow aproape complet, cu Vendor Pack gata de folosit în produs

### 5. Proces DSAR lipsă

- status azi: `asistat puternic`
- clasă: `specialist_handoff`
- cât avem deja: `75%`
- ce există:
  - modul DSAR
  - store DSAR
  - draft helpers
  - handoff + revenire în cockpit
  - `DSAR Pack` generat în produs
  - procedură DSAR
  - registru DSAR minim
  - playbook / owner guidance
  - checklist de revenire în cockpit
  - smoke live confirmat pe preview
- ce mai lipsește până la 100%:
  - template de răspuns DSAR afișat direct în același pack
  - salvare explicită a ownerului desemnat în state
  - follow-up mai clar pentru primul caz DSAR real
- ce ar urca riscul:
  - specialist flow aproape complet, cu pachet DSAR gata de folosit în produs

### 6. Retenție date neclară

- status azi: `rezolvat real`
- clasă: `documentary`
- cât avem deja: `90%`
- ce există:
  - generator `retention-policy`
  - flow live confirmat
  - follow-up automat `GDPR-016 -> GDPR-017`
- ce mai lipsește până la 100%:
  - asistent mai bun pentru categorii de date și reguli de retenție per sistem

### 7. Politică internă de utilizare AI lipsă

- status azi: `rezolvat real`
- clasă: `documentary`
- cât avem deja: `85%`
- ce există:
  - generator `ai-governance`
  - flow live confirmat
- ce mai lipsește până la 100%:
  - bibliotecă mai bogată de controale AI pe roluri și tool-uri
  - confirmare distribuire internă mai bine modelată

### 8. Date confidențiale introduse în AI fără protecție

- status azi: `rezolvat real, dar asistat`
- clasă: `operational-assisted`
- cât avem deja: `70%`
- ce există:
  - suport `ai-governance`
  - flow live confirmat pe modelul document de suport + dovadă operațională
- ce mai lipsește până la 100%:
  - inventory de tool-uri AI aprobate
  - controale de training / distribuire
  - eventual integrare DLP sau policy attestation

### 9. Fișe de post lipsă sau incomplete

- status azi: `specialist_handoff real`
- clasă: `specialist_handoff`
- cât avem deja: `65%`
- ce există:
  - finding de intake
  - tip canonic dedicat `GDPR-021`
  - `Job Description Pack` în suprafața `Documente`
  - revenire automată în cockpit cu dovadă precompletată
- ce mai lipsește până la 100%:
  - generator per rol
  - formular scurt: rol, departament, senioritate, manager
  - circuit de confirmare / semnare
- ce ar urca riscul:
  - generare per rol + rollout asistat până la fișiere finale

### 10. REGES / evidență contracte angajați neactualizată

- status azi: `doar detectat`
- clasă: `operational`
- cât avem deja: `20%`
- ce există:
  - finding de intake
- ce mai lipsește până la 100%:
  - `REGES Correction Brief`
  - import/export și comparație minimă
  - pachet pentru HR/contabil
  - checklist de confirmare după operare
- ce ar urca riscul:
  - mutare în `operational-assisted`

### 11. Proceduri interne pentru angajați lipsă

- status azi: `doar detectat`
- clasă: `operational`
- cât avem deja: `15%`
- ce există:
  - finding de intake
- ce mai lipsește până la 100%:
  - `HR Procedure Pack`
  - pachet minim de proceduri interne
  - confirmare distribuire internă
- ce ar urca riscul:
  - mutare în `operational-assisted`

### 12. Contracte standard lipsă sau incomplete

- status azi: `doar detectat`
- clasă: `operational`
- cât avem deja: `15%`
- ce există:
  - finding de intake
- ce mai lipsește până la 100%:
  - `Contracts Pack`
  - NDA
  - client services template
  - supplier baseline
  - configurare pe B2B/B2C și tip business
- ce ar urca riscul:
  - mutare în `operational-assisted`

### 13. Înregistrare SPV lipsă

- status azi: `asistat slab-mediu`
- clasă: `operational`
- cât avem deja: `35%`
- ce există:
  - client ANAF/SPV
  - suprafață fiscală
- ce mai lipsește până la 100%:
  - `SPV Enrollment Guide`
  - wizard cu pași clari
  - dovadă de activare și verificare
- ce ar urca riscul:
  - rămâne `operational`, dar mult mai asistat

### 14. Factură respinsă / XML invalid în e-Factura

- status azi: `asistat mediu`
- clasă: `operational`
- cât avem deja: `55%`
- ce există:
  - validator e-Factura
  - hartă de erori
  - fiscal risk card
  - prefill / client ANAF
- ce mai lipsește până la 100%:
  - `Fiscal Pre-Validator`
  - diagnostic mai precis pe eroare
  - recomandare exactă de corecție
  - eventual diff / XML helper
- ce ar urca riscul:
  - mutare în `operational-assisted` puternic

### 15. Factură blocată în prelucrare ANAF

- status azi: `asistat mediu`
- clasă: `operational`
- cât avem deja: `45%`
- ce există:
  - fiscal state / checks
  - interpretare de risc
- ce mai lipsește până la 100%:
  - `Status Interpreter`
  - distincție clară între latență normală și blocaj real
  - recomandare de retry / escalare

### 16. Factură generată dar netransmisă spre SPV

- status azi: `asistat mediu`
- clasă: `operational`
- cât avem deja: `45%`
- ce există:
  - fiscal checks
  - signal hardening
- ce mai lipsește până la 100%:
  - `Transmission Recovery Pack`
  - verificare recipisă / dovadă de transmitere
  - protocol de retransmitere
- ce ar urca riscul:
  - mutare în `operational-assisted`

## Cât Este Azi „Gata” Din Ce Ne Trebuie

### Rezolvabile real azi

- `6/16`
- acestea sunt:
  - `Privacy / informare GDPR lipsă`
  - `Cookies consent neconform`
  - `DPA lipsă`
  - `Retenție date neclară`
  - `Politică internă AI lipsă`
  - `Date confidențiale introduse în AI fără protecție`

### Asistate bine, dar încă neînchise curat doar de produs

- `4/16`
- acestea sunt:
  - `Vendor governance / documentație externă lipsă`
  - `Proces DSAR lipsă`
  - `Înregistrare SPV lipsă`
  - `cele 3 riscuri fiscale de execuție`

### Doar detectate azi

- `4/16`
- acestea sunt:
  - `Fișe de post`
  - `REGES`
  - `Proceduri interne`
  - `Contracte standard`

## Unde Putem Crește Cel Mai Repede

### Wave 1 — Quick Wins

- `DSAR Pack`
- `Vendor Pack`
- `Job Description Pack`
- `HR Procedure Pack`
- `Contracts Pack`

Impact estimat:

- urcare de la `6/16` la `9-10/16` rezolvate sau aproape rezolvate serios

### Wave 2 — Leverage Mare

- `Fiscal Pre-Validator`
- `REGES Correction Brief`
- `SPV Enrollment Guide`

Impact estimat:

- urcare spre `13-14/16` asistate puternic

### Wave 3 — Integrări Grele

- semnare / urmă bilaterală pentru DPA și contracte
- integrare HR / registru angajați
- integrare fiscală mai adâncă
- remindere și expirări vendor

## Reguli De Încredere

CompliAI rămâne legal, curat și credibil doar dacă păstrăm aceste reguli:

1. niciun draft nu este prezentat ca verdict juridic final
2. niciun risc factual nu se închide doar cu document dacă cere acțiune reală
3. fiecare recomandare tehnică trebuie să fie auditabilă și explicabilă
4. orice handoff extern trebuie să lase urmă în Dosar

## Concluzie

Ținta sănătoasă nu este `16/16 rezolvate autonom`.

Ținta sănătoasă este:

- `10/16` rezolvate real sau aproape real de `CompliAI + om`
- `13-14/16` asistate puternic
- `0` riscuri închise fals

Formula corectă de produs:

- `detectare`
- `drafting`
- `pre-fill`
- `guided execution`
- `evidence collection`
- `monitoring`

Nu `magic solve bot`.
