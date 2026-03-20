# Smart Intake Prefill Wave Plan

Data: 2026-03-20
Branch de context: `codex/smart-intake-wizard`
Status: plan activ, ancorat in log

## Ultimul pass

- `Wave 1.1` este conservat si pe `origin/main`
- wizardul live foloseste confirmare asistata cap-coada
- `POST /api/org/profile` proceseaza iar `intakeAnswers` si regenereaza iesirile initiale
- `Wave 2.1` a pornit cu primul source real de prefill:
  - lookup `CUI -> ANAF`
  - card runtime cu firma gasita, `CAEN`, `TVA`, `RO e-Factura`
  - sugestii explicabile pentru `sector` si `requiresEfactura`
- `Wave 2.2` continua firul fara sa piarda prefill-ul:
  - persistenta `orgProfilePrefill` in state
  - rehidratare prin `GET /api/org/profile`
  - curatare automata cand `CUI`-ul din profil nu mai corespunde
- `Wave 2.3` adauga primele semnale vendor reutilizabile din e-Factura:
  - extragere `supplierCui` / `customerCui`
  - agregare furnizori cu dedup pe `CUI`
  - context `invoiceCount` pentru importul in registrul `NIS2`
- validare confirmata:
  - `npm test -- app/api/org/profile/route.test.ts lib/compliance/intake-engine.test.ts`
  - `npm run lint`
  - `npm run build`

## Ce este live acum

- `Wave 1.1`:
  - wizardul live foloseste `lib/compliance/intake-engine.ts` pentru confirmare asistata
  - salveaza `intakeAnswers`
  - regenereaza findings initiale, `documentRequests` si `nextBestAction`
- `Wave 2.1`:
  - `POST /api/org/profile/prefill` face lookup real `CUI -> ANAF`
  - onboarding-ul afiseaza firma gasita si sugestii explicabile pentru `sector` si `requiresEfactura`
- `Wave 2.2`:
  - `orgProfilePrefill` este stare persistata si rehidratabila
- `Wave 2.3`:
  - importul vendorilor din e-Factura retine `CUI` si `invoiceCount`
  - registrul `NIS2` poate deduplica vendorii pe semnale mai bune decat numele simplu

Stare git confirmata pe 2026-03-20:

- `Wave 1.1` este pe `origin/main`
- `Wave 2.1`, `Wave 2.2` si `Wave 2.3` sunt pe firul `codex/smart-intake-wizard` pana la promovarea pe `main`

Ce nu face inca acest slice:

- nu propune inca raspunsuri runtime din semnalele vendor importate
- nu unifica inca toate sursele de prefill sub acelasi model complet `source + confidence + reason`
- nu deduce inca raspunsuri din documente urcate sau website
- nu face inca suppression automat pe baza unui model unitar multi-sursa

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

Primul slice intrat:

- `Wave 2.1`:
  - route dedicata `POST /api/org/profile/prefill`
  - client ANAF pentru registrul TVA / RO e-Factura
  - sugestii runtime:
    - `sector` din `CAEN`
    - `requiresEfactura` din `RO e-Factura` / `TVA`
- `Wave 2.2`:
  - `orgProfilePrefill` devine stare persistata, nu doar raspuns efemer de route
  - onboarding-ul si pasii urmatori pot consuma aceeasi baza de provenance fara relookup imediat
- `Wave 2.3`:
  - semnalele vendor din e-Factura sunt extrase cu `CUI` si volum minim (`invoiceCount`)
  - importul in registrul `NIS2` foloseste dedup pe `CUI` cand sursa il ofera
  - pasul pregateste prefill-ul ulterior pentru `usesExternalVendors` si `vendorsUsed`, fara sa dubleze parsing-ul XML

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
