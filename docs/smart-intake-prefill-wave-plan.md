# Smart Intake Prefill Wave Plan

Data: 2026-03-20
Branch de context: `codex/smart-intake-wizard`
Status: plan activ, ancorat in log

## Ce este live acum

- `slice-ul mic` live in onboarding inseamna:
  - capture flow scurt in `components/compliscan/applicability-wizard.tsx`
  - `CUI` optional
  - sector
  - marime org
  - folosire AI
  - necesar e-Factura
- `POST /api/org/profile` salveaza profilul si calculeaza applicability
- `CUI` este folosit deja ca prefill pentru documente generate

Ce nu face inca acest slice:

- nu face lookup real dupa `CUI`
- nu deduce raspunsuri din documente, site sau vendori
- nu foloseste end-to-end `lib/compliance/intake-engine.ts` in runtime-ul live
- nu duce userul prin confirmare asistata completa

## Wave 1

Scop: promovam logica deja scrisa in runtime-ul real, fara conectori noi.

Include:

- conectare `lib/compliance/intake-engine.ts` in wizardul live
- pas `Ce am inteles despre firma ta` construit doar din `orgProfile`
- `deriveSuggestedAnswers(...)` + suppression doar pentru semnale deja cunoscute
- 7 intrebari decisive + intrebari conditionale in flow-ul real
- persistenta `intakeAnswers` prin `POST /api/org/profile`
- generare runtime pentru:
  - findings initiale
  - document request list
  - next best action

De ce intra primul:

- are impact UX imediat
- foloseste cod deja existent
- reduce riscul fata de un lot mare de surse noi

## Wave 2

Scop: adaugam prefill automat real, cu provenance si confidence.

Include:

- lookup `CUI` / ANAF
- semnale vendor din e-Factura si importuri
- prefill din documente urcate / AI Compliance Pack
- semnale din site
- sursa + confidence + motiv scurt pentru fiecare sugestie
- suppression doar pe `high confidence`

## Primul pas recomandat

`Wave 1.1`:

- leaga wizardul si `POST /api/org/profile` la engine-ul existent
- nu adauga conectori noi
- masoara:
  - cate intrebari dispar
  - cat dureaza pana la first findings
  - ce surse de prefill merita adaugate in `Wave 2`

## Regula de log

Pe firul asta nu mai lasam lucru neconservat:

- fiecare pass actualizeaza `docs/log-codex-1.md`
- daca un wave nu intra complet, se noteaza imediat:
  - branch-ul
  - blocker-ul
  - ce este deja live
  - validarea rulata
- daca nu intra codul, intra macar commitul de log sau documentatia minima care conserva contextul
