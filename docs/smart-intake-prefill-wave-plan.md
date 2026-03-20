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
- `Wave 2.4` duce semnalul vendor in runtime:
  - `orgProfilePrefill` include sugestie `usesExternalVendors`
  - onboarding-ul vede top vendorii detectati din e-Factura
  - intake-ul foloseste semnalul direct, nu doar euristica din `requiresEfactura`
- `Wave 2.5` foloseste inventarul AI deja existent:
  - `orgProfilePrefill` include sugestii pentru `usesAITools` si `processesPersonalData`
  - onboarding-ul vede contextul sistemelor AI confirmate / detectate
  - intake-ul foloseste semnalul direct AI pentru date personale, nu doar euristica pe sector
- `Wave 2.6` foloseste memoria documentelor deja existente:
  - `generatedDocuments` devine stare persistata pentru documentele generate in platforma
  - `orgProfilePrefill` include `documentSignals` si sugestii pentru `hasSiteWithForms` si `hasStandardContracts`
  - onboarding-ul vede provenienta din documente generate si documente scanate
- `Wave 2.7` inchide guardrail-ul de confirmare:
  - fiecare sugestie de prefill poarta explicit `source + confidence + reason`
  - doar sugestiile `high confidence` se auto-completeaza in intake
  - sugestiile `medium` raman vizibile, dar necesita confirmare explicita in wizard
- `Wave 2.8` extinde prefill-ul si pe intrebari conditionale:
  - document memory sugereaza acum si politici GDPR, DPA-uri, documentatie vendor si politica AI
  - AI inventory sugereaza direct si `aiUsesConfidentialData` cand sistemele confirmate sau detectate proceseaza date personale
  - wizardul arata sugestiile doar pentru intrebarile conditionale care sunt efectiv vizibile in pasul curent
- `Wave 2.9` adauga semnale directe din website-ul public:
  - onboarding-ul poate porni prefill si doar din `website`, nu doar din `CUI`
  - website-ul public sugereaza acum `hasSiteWithForms`, `hasSitePrivacyPolicy`, `hasPrivacyPolicy`, `processesPersonalData` si `hasCookiesConsent`
  - `website` devine camp persistat in `OrgProfile`, iar prefill-ul se pastreaza doar cand `CUI` / `website` raman aliniate
- `Wave 2.10` adauga `AI Compliance Pack` ca sursa separata de onboarding:
  - prefill-ul poate porni acum si fara input extern, cand workspace-ul are deja pack-ul construit
  - `OrgProfilePrefill` include provenance separat `ai_compliance_pack`
  - wizardul afiseaza distinct contextul din pack fata de `AI inventory`
- validare confirmata:
  - `npm test -- lib/server/ai-compliance-pack-prefill-signals.test.ts app/api/org/profile/prefill/route.test.ts app/api/org/profile/route.test.ts lib/compliance/intake-engine.test.ts`
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
- `Wave 2.4`:
  - `POST /api/org/profile/prefill` intoarce acum si semnal direct pentru `usesExternalVendors`
  - wizardul afiseaza contextul vendor din e-Factura si precompleteaza intake-ul cu incredere mare cand exista dovezi directe
- `Wave 2.5`:
  - `POST /api/org/profile/prefill` intoarce si semnale AI din inventarul intern existent
  - pasul `Folosiți unelte AI` nu mai porneste de la zero cand exista sisteme confirmate / detectate
  - `processesPersonalData` poate veni direct din sistemele AI care proceseaza date, nu doar din euristici generale
- `Wave 2.6`:
  - `app/api/documents/generate` persista documentele generate in `ComplianceState.generatedDocuments`
  - `POST /api/org/profile/prefill` intoarce si `documentSignals` din documente generate + documente scanate
  - intake-ul vede acum semnale directe pentru `hasSiteWithForms` si `hasStandardContracts`
- `Wave 2.7`:
  - toate sugestiile de onboarding folosesc acelasi contract `source + confidence + reason`
  - intake-ul auto-completeaza doar semnalele `high confidence`
  - wizardul arata explicit sursa pentru fiecare sugestie, inclusiv in intrebarile care raman de confirmat
- `Wave 2.8`:
  - onboarding-ul poate sugera acum si raspunsuri conditionale, nu doar cele 7 intrebari decisive
  - semnalele din documente existente reduc intrebarile despre policy-uri, DPA-uri si documentatie vendor
  - semnalele AI existente reduc si confirmarea despre folosirea de date sensibile in tool-uri AI
- `Wave 2.9`:
  - `POST /api/org/profile/prefill` accepta acum si `website`, nu doar `CUI`
  - semnalele din website-ul public apar in onboarding cu provenance dedicat `site public`
  - website-ul poate sugera direct si `cookies consent`, nu doar existenta site-ului
  - `POST /api/org/profile` normalizeaza si persista `website`, iar prefill-ul stale se curata si pe aceasta cheie
- `Wave 2.10`:
  - `POST /api/org/profile/prefill` poate intoarce acum prefill si fara `CUI` / `website`, daca workspace-ul are deja `AI Compliance Pack`
  - `AI Compliance Pack` sugereaza conservator `usesAITools`, `processesPersonalData` si `aiUsesConfidentialData`
  - `POST /api/org/profile` pastreaza prefill-ul intern din pack chiar si fara chei externe de matching

Stare git confirmata pe 2026-03-20:

- `Wave 1.1`, `Wave 2.1`, `Wave 2.2`, `Wave 2.3`, `Wave 2.4`, `Wave 2.5`, `Wave 2.6`, `Wave 2.7`, `Wave 2.8`, `Wave 2.9` si `Wave 2.10` sunt tinta pe `origin/main` dupa promovarea acestui pass

Ce nu face inca acest slice:

- nu face inca ranking / arbitraj complet intre toate sursele posibile cand apar conflicte reale
- nu foloseste inca `AI Compliance Pack` pentru `hasAiPolicy`; pack-ul este folosit doar pentru semnale AI direct defensabile

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
- `Wave 2.4`:
  - `orgProfilePrefill` foloseste acelasi semnal vendor pentru runtime onboarding
  - `usesExternalVendors` poate fi sugerat cu `confidence=high` cand exista dovezi directe in e-Factura
  - heuristica generica din `requiresEfactura` ramane doar fallback, nu sursa principala
- `Wave 2.5`:
  - `orgProfilePrefill` foloseste si inventarul AI existent drept sursa reala de prefill
  - `usesAITools` poate fi sugerat cu `confidence=high` pentru sisteme confirmate si `medium` pentru detectii inca neverificate
  - `processesPersonalData` poate fi sugerat direct cand sistemele AI confirmate / detectate proceseaza date personale
- `Wave 2.6`:
  - documentele generate in platforma devin stare persistata, nu doar rezultat de UI
  - documentele generate + scanate sunt folosite pentru semnale directe despre site/cookies si contracte standard
  - documentele raman fallback pentru `usesExternalVendors`, `processesPersonalData` si `usesAITools`, fara sa suprascrie sursele mai bune deja existente
- `Wave 2.7`:
  - fiecare sugestie din `orgProfilePrefill` poarta sursa explicita, nu doar confidence + motiv
  - wizardul foloseste prag clar de auto-fill: doar `high confidence`
  - `medium` si `low` raman sugestii asistate, nu raspunsuri deja confirmate
- `Wave 2.8`:
  - modelul de prefill este extins si pe intrebarile conditionale cu impact real in findings
  - document memory si AI inventory contribuie acum si la politicile derivate, nu doar la raspunsurile decisive
  - rezumatul din wizard afiseaza doar sugestiile relevante pentru intrebarile vizibile, nu un lot generic
- `Wave 2.9`:
  - onboarding-ul primeste si `website signals` ca sursa reala, nu doar document memory despre site
  - website-ul public poate deschide prefill chiar si fara `CUI`, daca detectam semnale suficiente
  - website-ul contribuie conservator la intrebarile despre formulare, privacy policy, cookies consent si date personale
- `Wave 2.10`:
  - `AI Compliance Pack` devine sursa interna separata de onboarding, nu doar payload de dashboard
  - pack-ul poate crea seed prefill chiar si fara surse externe, apoi celelalte surse il pot imbogati
  - semnalele din pack raman limitate la raspunsuri AI pe care le putem explica usor si sustine in produs

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
