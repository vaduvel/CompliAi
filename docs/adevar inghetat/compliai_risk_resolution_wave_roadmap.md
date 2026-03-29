# CompliAI Risk Resolution Wave Roadmap

## Scop

Acest document transformă harta de acoperire într-un plan executabil:

- `ce facem în Wave 1`
- `ce facem în Wave 2`
- `ce lăsăm pentru integrări grele`
- `care sunt quick wins`
- `care este raportul impact / dificultate`

Documentul completează:

- `/Users/vaduvageorge/Desktop/CompliAI/docs/adevar inghetat/compliai_risk_resolution_coverage_map.md`

## Principiul de prioritizare

Nu prioritizăm după „ce sună cool”.

Prioritizăm după:

1. `cât leverage de acoperire aduce`
2. `cât cod reutilizăm deja`
3. `cât de onest poate fi vândut ca rezolvare reală`
4. `cât reduce munca concretă a omului`

## Wave 1 — Quick Wins

Ținta:

- urcare de la `6/16` spre `9-10/16`
- fără integrări grele externe
- fără promisiuni false

### 1. DSAR Pack

Țintă:

- riscul `Proces DSAR lipsă`

Status:

- `implementat și validat pe preview`

Ce livrăm:

- procedură DSAR generată
- registru DSAR minim
- owner / responsabil explicit
- flow de handoff din cockpit în DSAR și întoarcere cu dovadă

Ce reutilizăm deja:

- modul DSAR
- store DSAR
- draft generator
- return-to-cockpit

Impact:

- `mare`

Dificultate:

- `medie`

Validare:

- teste țintite verzi
- `next build` verde
- smoke live pe preview:
  - onboarding emite `intake-gdpr-dsar`
  - `/api/dsar` livrează `Pachet minim DSAR`
  - findingul rămâne accesibil în cockpit

### 2. Vendor Pack

Țintă:

- riscul `Vendor governance / documentație externă lipsă`

Ce livrăm:

- pachet de solicitare către vendor
- checklist DPA / security
- scorecard vendor
- reminder / tracking minim

Ce reutilizăm deja:

- vendor review engine
- vendor library
- vendor prefill
- vendor review page

Status acum:

- implementat în produs
- `GET /api/vendor-review` livrează și `Vendor Pack`
- cockpitul `intake-vendor-missing-docs` intră pe `GDPR-011`
- handoff-ul deschide Vendor Review cu `focus=pack`
- revenirea în cockpit este automată cu dovadă precompletată
- validare locală: teste țintite + build verzi
- smoke live reușit pe deploymentul public

Impact:

- `mare`

Dificultate:

- `medie`

### 3. Job Description Pack

Țintă:

- riscul `Fișe de post lipsă sau incomplete`

Ce livrăm:

- tip canonic dedicat `GDPR-021`
- handoff în `Documente` cu pachet HR pregătit
- model de fișă, inventar de roluri și checklist de rollout
- revenire automată în cockpit cu dovadă precompletată

Ce reutilizăm deja:

- intake-ul existent pentru HR
- suprafața `Documente`
- infrastructura de `specialist_handoff`

Impact:

- `mediu`

Dificultate:

- `medie`

Status:

- `livrat`
- următorul pas este generatorul per rol și circuitul de semnare

### 4. HR Procedure Pack

Țintă:

- riscul `Proceduri interne pentru angajați lipsă`

Ce livrăm:

- pachet minim de proceduri interne
- confirmare distribuire internă

Ce reutilizăm deja:

- doar intake și cockpit generic

Impact:

- `mediu`

Dificultate:

- `medie`

Status:

- `livrat`
- flow canonic: `intake-hr-procedures -> GDPR-022 -> /dashboard/documente?focus=hr-procedures -> returnTo cockpit -> evidence prefilled -> close -> under_monitoring`

### 5. Contracts Pack

Țintă:

- riscul `Contracte standard lipsă sau incomplete`

Ce livrăm:

- NDA
- client services baseline
- supplier baseline
- configurare pe B2B/B2C

Ce reutilizăm deja:

- cockpit generic

Impact:

- `mare`

Dificultate:

- `medie spre mare`

Status:

- `livrat`
- flow canonic: `intake-contracts-baseline -> GDPR-020 -> /dashboard/documente?focus=contracts-baseline -> returnTo cockpit -> evidence prefilled -> close -> under_monitoring`

## Wave 2 — Leverage Mare

Ținta:

- urcare spre `13-14/16` asistate puternic

### 1. Fiscal Pre-Validator

Țintă:

- `Factură respinsă / XML invalid în e-Factura`

Ce livrăm:

- parser XML
- mapare deterministă pe erori ANAF / CIUS-RO
- recomandare exactă de corecție
- eventual diff / helper

Ce reutilizăm deja:

- validator e-Factura
- hartă erori
- fiscal page
- ANAF client

Impact:

- `foarte mare`

Dificultate:

- `medie`

### 2. REGES Correction Brief

Țintă:

- `REGES / evidență contracte angajați neactualizată`

Ce livrăm:

- protocol de remediere pentru HR / contabil
- checklist de corecție
- dovadă minimă de finalizare

Impact:

- `mare`

Dificultate:

- `medie`

Status:

- `livrat`
- flow canonic: `intake-hr-registry -> GDPR-023 -> /dashboard/documente?focus=reges-correction -> returnTo cockpit -> evidence prefilled -> close -> under_monitoring`

### 3. SPV Enrollment Guide

Țintă:

- `Înregistrare SPV lipsă`

Ce livrăm:

- wizard de activare
- checklist clar
- dovadă de activare și verificare

Ce reutilizăm deja:

- client SPV / ANAF
- fiscal surfaces

Impact:

- `mediu`

Dificultate:

- `medie`

### 4. Fiscal Status Interpreter

Țintă:

- `Factură blocată în prelucrare ANAF`
- `Factură generată dar netransmisă spre SPV`

Ce livrăm:

- interpretare clară de status
- sugestie de retry / retransmitere / escalare
- dovadă structurată

Impact:

- `mare`

Dificultate:

- `medie`

## Wave 3 — Integrări Grele

Ținta:

- consolidare
- urmă auditabilă mai automată
- reducere de muncă manuală

### 1. Circuit de semnare

- DPA
- contracte
- baseline juridic

### 2. Integrare HR / registru angajați

- import
- comparație
- reconcilieri

### 3. Integrări fiscale mai adânci

- status live mai bogat
- retransmitere orchestrată

### 4. Vendor lifecycle

- expirări
- remindere
- follow-up automat

## Tabel Prioritate / Impact / Dificultate

| Inițiativă | Riscuri țintite | Impact | Dificultate | Reutilizare cod | Prioritate |
| --- | --- | --- | --- | --- | --- |
| DSAR Pack | Proces DSAR lipsă | Mare | Medie | Mare | P1 |
| Vendor Pack | Vendor governance / docs lipsă | Mare | Medie | Mare | P1 |
| Fiscal Pre-Validator | XML invalid / respins | Foarte mare | Medie | Mare | P1 |
| REGES Correction Brief | REGES | Mare | Medie | Mică | P1 |
| SPV Enrollment Guide | SPV lipsă | Mediu | Medie | Medie | P2 |
| Fiscal Status Interpreter | blocat / netransmis | Mare | Medie | Mare | P2 |
| Contracts Pack | contracte standard | Mare | Medie-Mare | Mică | P2 |
| Job Description Pack | fișe de post | Mediu | Medie | Mică | P2 |
| HR Procedure Pack | proceduri interne | Mediu | Medie | Mică | P2 |

## Ce Alegem Prima Dată

Prima alegere sănătoasă:

- `DSAR Pack`

De ce:

- are deja cea mai multă infrastructură reală în produs
- nu depinde de integrare externă grea
- mută un risc important din „detectat / orchestrat” în „asistat puternic”
- stabilește pattern reutilizabil pentru alte pack-uri

## Definition of Done pentru Wave 1

Un wave 1 este considerat bun doar dacă:

1. riscul are flow clar în cockpit
2. pachetul generat este vizibil și utilizabil
3. există dovadă de închidere sau follow-up real
4. nu se închide nimic fals
5. build și runtime rămân curate

## Concluzie

Ordinea corectă este:

1. `DSAR Pack`
2. `Vendor Pack`
3. `Fiscal Pre-Validator`
4. `SPV Enrollment Guide`
5. `Fiscal Status Interpreter`

Nu urmărim `16/16 automat`.

Urmărim:

- `mai multă muncă grea preluată de CompliAI`
- `mai puțină muncă vagă pentru user`
- `mai multă urmă auditabilă`
- `zero rezolvări false`
