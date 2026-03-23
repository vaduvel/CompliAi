# CompliScan - Status Arhitectura

Data actualizarii: 2026-03-14

## Verdict scurt

CompliScan nu mai este intr-o arhitectura de demo simplu. Are deja o fundatie buna pentru un MVP serios.

Acest document descrie starea de implementare si arhitectura.

Pentru evaluarea stricta de maturitate, fara optimism, vezi:

- `public/raport-maturitate-compliscan.md`
- `public/sprinturi-maturizare-compliscan.md`

Nivel estimat de maturitate arhitecturala, privit strict ca implementare curenta:

- fundatie de produs: `~80%`
- arhitectura unificata: `~77-79%`
- produs pilot-ready cu ghidaj uman: `~79%`

Verdictul strict recalibrat post-`Sprint 6` este:

- `~79%` maturitate de produs pilot-ready cu ghidaj uman
- `~64%` maturitate de platforma software serioasa
- `~61%` maturitate de motor de compliance / audit defensibil

Problema actuala nu este lipsa de features. Problema actuala este riscul de fragmentare:

- prea multe concepte similare
- naming mixt intre UI, state si roadmap
- unele flow-uri sunt mature, altele sunt inca partiale

Concluzie:

**da, trebuie armonizata arhitectura acum**

Dar:

**nu prin rewrite mare**

Ci prin:

- unificarea modelului de domeniu
- unificarea navigatiei vizibile
- unificarea severitatii, principiilor si flow-ului principal
- hardening, testare si fundatie operationala mai buna

Actualizare 2026-03-22:

- dupa QA manual real pe productie-safe flows, fundatia a primit un pass de hardening pe zonele care scadeau increderea in produs:
  - export PDF server-side
  - autodiscovery YAML / manifest
  - consistenta applicability intre prefill fiscal si messaging `SAF-T`
  - deduplicare finding-uri la rescan
  - consistenta `Response Pack`
  - feedback operational dupa confirmarea finding-urilor
  - rate limiting si pe GET-uri sensibile
- concluzia ramane aceeasi:
  - problema principala nu este lipsa de functionalitati
  - problema principala este increderea si coerenta pe fluxurile reale
- acest pass reduce exact acele fronturi de risc, fara sa deschida un rewrite nou
- a pornit si fundatia noului model `portfolio-first`, fara sa rupa runtime-ul actual:
  - `Wave 0A`: `userMode` + onboarding
  - `Wave 0B1`: `partner_manager`
  - `Wave 0B2`: `workspaceMode` + `select-workspace`
  - `Wave 1`: shell si navigatie adaptiva
  - `Wave 2`: `Portfolio Lite` real, bazat pe agregari cross-org controlate
  - `Wave 3`: cleanup runtime per-org, cu `Mod Solo` mai coerent
- starea reala acum:
  - produsul actual continua sa functioneze per-org
  - consultantul are acum si stratul `Portfolio Lite`, fara sa piarda drilldown-ul in `firma activa`
  - cleanup-ul per-org este deja pornit si livrat pentru rutele canonice principale
  - billing si claim flow raman wave-uri separate

Sprintul de maturizare activ este:

- `Sprint 7 - Operational readiness` (inchis operational)
  - trierea rapoartelor Gemini este separata acum in `public/triere-rapoarte-gemini.md`, cu distinctie explicita intre:
    - ce mai este valid
    - ce este depasit dupa Sprint 4-6
    - ce merge in backlog
  - firul paralel `Evidence OS UI` a fost auditat dupa batch-ul curent al lui Codex 2
  - integrările critice au acum timeout + retry minim unificat prin `lib/server/http-client.ts`
  - exista si verdict agregat de `release readiness`, nu doar checklist in documente:
    - `lib/server/release-readiness.ts`
    - `GET /api/release-readiness`
  - exista preflight local complet pentru release:
    - `scripts/preflight-release.mjs`
    - `npm run preflight:release`
    - include acum si `npm run verify:supabase:rls`
  - `Setari` afiseaza acum si cardul de `Release readiness`
  - gate vizual activ cand `release readiness = blocked`
  - `GET /api/health` cere acum sesiune activa, nu mai expune public diagnosticul complet
  - `release readiness` foloseste si marker-ul ultimei verificari RLS locale
  - `Setari` nu mai face fetch de `release readiness` pentru roluri fara acces
  - rutele critice au acum trasabilitate operationala minima:
    - `requestId`
    - header `x-request-id`
    - logging structurat pentru erori de route
    - warning-uri pentru retry-urile operationale

Progres deja pornit:

- `Sprint 1 - Reliability + Security baseline` este inchis operational
- fallback-urile structurale mai adanci sunt mutate explicit in sprinturile de auth si persistence
- `Sprint 2` este inchis operational cu un test harness real:
  - `vitest` instalat si configurat
  - teste unitare pe request validation, scan workflow, repo sync, drift lifecycle, drift policy si task validation
  - route tests pe scan, drift actions, scan analyze, scan extract, repo sync generic, adaptoare provider, baseline, auth si confirmarea unei detectii AI
  - route tests si pe `evidence upload`
  - fixtures oficiale in `tests/fixtures` pentru document, manifeste (`package.json`, `requirements.txt`), `compliscan.yaml`, fallback OCR si expected findings
  - teste cu fixtures pentru parser YAML, manifest autodiscovery si expected findings
  - primul test de integrare reala pe `repo-sync-executor`
  - test de integrare reala si pe fluxul document-first (`extract -> analyze`)
  - teste dedicate pentru fallback OCR pe imagine/PDF fara configurare Vision
  - teste de stabilitate pe semnalele-cheie generate de engine si manifest discovery
  - exporturile cheie au acum route tests dedicate
  - smoke flow minim pentru login, sesiune, scan si export
  - `npm test` si `npm run lint` trec
  - suita curenta are `27` fisiere de test si `85` teste verzi
- `Sprint 3` a pornit incremental:
  - exista un strat separat de detectie in `lib/compliance/signal-detection.ts`
  - `simulateFindings(...)` consuma acum semnale detectate, nu mai cauta direct si construieste verdictul in acelasi pas
  - provenance-ul finding-urilor retine acum sursa semnalului, baza verdictului si increderea semnalului
  - finding-urile au acum si `verdictConfidence` + `verdictConfidenceReason`
  - rescan-ul salveaza acum si `validationConfidence` + `validationBasis`
  - mesajele de validare explica mai bine daca verificarea s-a bazat pe semnal direct, semnal inferat sau stare operationala
  - aceste informatii sunt afisate acum si in UI-ul operational (`Remediere`) si in UI-ul de audit (`Auditor Vault`)
  - verdictul explicabil este afisat acum si direct in rezultatele scanarii:
    - `Ultimul document analizat`
    - `Findings generate din YAML`
  - mesajele de rescan au acum outcome explicit:
    - `Confirmare puternica`
    - `Confirmare partiala`
    - `Confirmare operationala`
  - task-urile de finding au acum ID normalizat, cu compatibilitate pentru stari vechi deja salvate
  - exista teste dedicate pentru semnal direct vs semnal inferat din manifest
  - exista teste dedicate si pentru confidence-ul finding-urilor
  - exista teste dedicate si pentru mesajele de rescan pe semnal direct / inferat
  - fixtures-urile de expected findings acopera acum si high-risk scoring, plus transfer / rezidenta date
  - `npm test` si `npm run lint` trec in continuare
  - suita curenta are `32` fisiere de test si `108` teste verzi
- `Sprint 4` a pornit cu primul pachet real de control de acces:
  - auth are acum roluri explicite:
    - `owner`
    - `compliance`
    - `reviewer`
    - `viewer`
  - sesiunile si userii legacy sunt normalizati fara sa rupa workspace-urile locale deja existente
  - modelul local de auth este separat acum explicit in:
    - `users`
    - `orgs`
    - `memberships`
  - relatia user -> org nu mai este doar dedusa implicit din `users.json`
  - fisierele locale derivate exista acum si in workspace:
    - `.data/orgs.json`
    - `.data/memberships.json`
  - exporturile sensibile cer acum rol:
    - `compliscan`
    - `audit-pack`
    - `audit-pack/client`
    - `audit-pack/bundle`
    - `annex-lite/client`
  - task-urile, dovezile, baseline-ul si setarile de drift au acum control minim de acces
  - `reset state` este limitat la `owner`
  - `waive drift` este limitat la `owner` / `compliance`
  - restul actiunilor de drift sunt deschise pentru `reviewer` in plus fata de rolurile administrative
  - evenimentele sensibile retin acum actorul real din sesiune in audit trail:
    - `actorId`
    - `actorLabel`
    - `actorRole`
    - `actorSource`
  - sesiunea autentificata retine acum si `membershipId`
  - evenimentele automate de drift sunt marcate separat cu actor de tip `system`
  - `Auditor Vault` si activitatea recenta afiseaza acum actorul asociat evenimentului cand acesta exista
  - exista teste noi pentru:
    - deny-path si contractul minim al rolurilor
    - persistenta separata `users / orgs / memberships`
    - migrare compatibila din `users.json` legacy
    - token legacy fara `role`
    - listarea membrilor organizatiei
    - actualizarea rolurilor prin membership API
  - `Setari` are acum UI minim pentru membri si roluri:
    - lista membrilor organizatiei
    - rolul curent al utilizatorului
    - control de schimbare rol doar pentru owner
    - protectie pentru a nu schimba propriul rol din UI
  - exista acum si strat minim de multi-org:
    - listare membership-uri pentru utilizatorul curent
    - switch de organizatie activa din sesiune
    - schimbarea organizatiei active este expusa si in `DashboardShell`
  - backend-ul protejeaza acum si ultimul owner activ:
    - ultimul owner nu poate fi retrogradat
    - schimbarea rolurilor lasa eveniment explicit in audit trail
  - `npm run build` trece dupa acest pachet si a scos la suprafata un bug de tip din Sprint 3, deja corectat
  - suita curenta este acum la:
    - `38` fisiere de test
    - `130` teste verzi
- `Sprint 5` a pornit cu primul pas real de storage maturity:
  - dovezile noi nu mai sunt gandite ca link public direct
  - upload-ul foloseste acum storage privat local in `.data/evidence-uploads`
  - accesul la dovada trece prin route controlat:
    - `GET /api/tasks/[id]/evidence/[evidenceId]`
  - `TaskEvidenceAttachment` retine acum:
    - `storageProvider`
    - `storageKey`
    - `accessPath`
  - UI-ul operational, `Auditor Vault` si `Audit Pack` folosesc acum `accessPath` cu fallback legacy pe `publicPath`
  - `Audit Pack bundle` copiaza acum dovezile din storage-ul real, nu doar din `public/`
  - exista si schema tinta de Sprint 5 pentru Supabase Auth / memberships / state / evidence:
    - `supabase/sprint5-foundation.sql`
  - a fost pornit si pasul incremental de identitate externa:
    - backend auth comutabil `local / supabase / hybrid`
    - login prin `Supabase Auth` cand backend-ul o cere
    - register prin `Supabase Auth` cand backend-ul o cere
    - legare a userului local existent la identitatea externa pe baza emailului
    - organizatiile si membership-urile raman inca locale, pana la mutarea lor in DB
  - a fost pornit si pasul incremental de tenancy in DB:
    - exista backend de date comutabil `local / supabase / hybrid`
    - `organizations`, `profiles` si `memberships` pot fi sincronizate in Supabase la:
      - register
      - link identity
      - role update
    - schema SQL de Sprint 5 foloseste `org_id` textual, compatibil cu modelul actual al aplicatiei
    - in backend `supabase`, tenancy-ul este citit acum din DB ca sursa primara pentru:
      - `organizations`
      - `memberships`
      - `profiles`
    - in backend `supabase`, scrierile sensibile de tenancy sunt tratate cloud-first:
      - `register`
      - `link identity`
      - `role update`
    - daca sincronizarea cloud esueaza in backend `supabase`, operatia este blocata explicit
  - `org_state` are acum traseu cloud mai strict:
    - `public.org_state` este citit ca sursa primara in backend `supabase`
    - daca snapshot-ul lipseste in `public.org_state`, starea initiala este creata direct acolo
    - `compliscan.app_state` ramane fallback legacy pentru modurile vechi, nu pentru traseul principal `supabase`
  - accesul la dovezile cloud este acum controlat explicit:
    - stream server-side prin `GET /api/tasks/[id]/evidence/[evidenceId]`
    - redirect securizat catre URL semnat pentru `supabase_private` cand se cere `delivery=redirect`
    - `download=1` forteaza descarcarea explicita
    - TTL-ul pentru redirect-ul semnat este configurabil
  - fundatia RLS din schema de Sprint 5 este intarita:
    - helper-ele de membership lookup sunt `SECURITY DEFINER`
    - este evitata capcana de recursie RLS pe `memberships`
    - politicile acopera si scrierea, nu doar citirea, pentru:
      - `org_state`
      - `evidence_objects`
      - `storage.objects`
  - metadata-ul dovezilor poate fi acum oglindit in `public.evidence_objects`:
    - sincronizarea foloseste `attachment_id` ca cheie stabila
    - in backend `supabase`, esecul sincronizarii blocheaza upload-ul
  - `public.evidence_objects` este acum folosit si la citire:
    - access route-ul de evidence poate hidrata metadata din registrul cloud
    - access route-ul poate face acum si lookup sigur pe `org_id + task_id + attachment_id`, nu doar pe metadata ramasa local in state
    - `Audit Pack` bundle foloseste acelasi registru pentru copierea dovezilor
  - `DashboardPayload` hidrateaza acum `taskState.attachedEvidenceMeta` din registrul cloud:
    - dashboard-ul, traceability-ul si exporturile server-side vad metadata operationala actualizata
  - `family-evidence` foloseste acum metadata hidratata din registrul cloud, nu doar copia locala ramasa in state
  - exista acum si verificare operationala interna pentru Supabase:
    - `GET /api/integrations/supabase/status`
    - vizibila si in `Setari`
    - confirma starea backend-ului auth / data / storage, a tabelelor critice, a bucket-ului privat si a politicii de fallback local
    - expune si blocajele reale pentru inchiderea Sprint 5
    - exista si runbook de verificare manuala:
      - `public/supabase-rls-verification-runbook.md`
    - exista si verificare live directa pentru proiectul Supabase:
      - script: `npm run verify:supabase:sprint5`
      - raport curent: `public/supabase-live-verification-2026-03-13.md`
  - graful de tenancy din `supabase` poate fi initializat acum din local atunci cand cloud-ul este gol:
    - `organizations`
    - `profiles`
    - `memberships`
    - dupa initializare, citirea ramane cloud-first
  - shell-ul dashboard si endpoint-urile de sesiune nu mai expun orb rolul sau org-ul din cookie:
    - sesiunea este re-hidratata din membership-ul curent
    - daca membership-ul dispare, sesiunea vizibila cade la `null`
  - si suprafetele de tenancy/admin folosesc acum sesiunea fresh:
    - `GET /api/auth/memberships`
    - `POST /api/auth/switch-org`
    - `GET|POST /api/auth/members`
    - `PATCH /api/auth/members/[membershipId]`
    - `GET /api/settings/summary`
  - exista si target state explicit pentru "100%":
    - `public/target-state-100-compliscan.md`
  - exista si checklist formal de inchidere Sprint 5:
    - `public/sprint-5-closure-checklist.md`
  - verificarea live curenta arata ca infrastructura Supabase reala nu este inca aplicata:
    - actualizare: infrastructura live Sprint 5 este acum prezenta
    - tabelele `public.organizations`, `memberships`, `profiles`, `org_state`, `evidence_objects` raspund `200`
    - bucket-ul `compliscan-evidence-private` raspunde `200`
    - actualizare: validarea RLS live trece acum prin `npm run verify:supabase:rls`
    - actualizare: preflight-ul strict trece prin `npm run verify:supabase:strict`
    - concluzie: Sprint 5 poate fi considerat inchis operational
  - exporturile si Auditor Vault au acum verificare automata explicita pentru dovezi hidratate din registrul cloud:
    - `lib/server/dashboard-response.test.ts`
    - `app/api/exports/audit-pack/client/route.test.ts`
    - `app/api/exports/audit-pack/bundle/route.test.ts`
  - exista acum si preflight strict pentru mediul `supabase`:
    - `npm run verify:supabase:strict`
    - in mediul curent acesta trece:
      - infrastructura live este prezenta
      - backend-urile aplicatiei sunt setate pe `supabase`
      - fallback-ul local este blocat explicit
  - `Sprint 5` este inchis operational
- `Sprint 6` a pornit pe zona de audit defensibility:
  - dovezile au acum evaluare minima de calitate:
    - `sufficient`
    - `weak`
  - evaluarea este salvata in modelul de evidence si sincronizata si in registrul cloud
  - `Task Card` afiseaza acum nu doar fisierul, ci si calitatea dovezii
  - `Audit Pack` retine acum:
    - `auditQualityDecision`
    - `blockedQualityGates`
    - `reviewQualityGates`
    - `auditQualityGates`
- quality gates includ acum si `pending_validation` pentru cazurile in care reuse-ul sau dovada exista, dar controlul asteapta confirmare finala
- `ComplianceTraceRecord` foloseste acum si:
  - `evidence.quality`
  - `evidence.validationBasis`
  - `evidence.validationConfidence`
- `ComplianceTraceRecord` retine acum si verdictul de audit:
  - `auditDecision`
  - `auditGateCodes`
- un control cu dovada `weak` nu mai apare ca `validated`, chiar daca a ramas `passed`
- `traceability review` blocheaza acum confirmarea pentru audit a controalelor care nu au `auditDecision=pass`
- `Auditor Vault` dezactiveaza confirmarile pe control / familie / articol cand grupul contine dovezi slabe sau validare nefinalizata
- `Auditor Vault` afiseaza acum si `gates active` pe control, plus badge de audit:
  - `gata pentru audit`
  - `review necesar`
  - `blocat`
- sumarul pe familie considera reutilizabila doar dovada venita din controale deja `validated`
- `Auditor Vault` si exportul client-facing afiseaza acum calitatea dovezii direct in traceability
  - `controlsMatrix` si `evidenceLedger` includ acum `evidenceQuality`
  - `auditReadiness` nu mai poate iesi `audit_ready` daca quality gates raman pe `review` sau `blocked`
  - `Audit Pack` client-facing afiseaza acum si:
    - decizia de audit per control (`pass / review / blocked`)
    - motivele sintetizate din `auditGateCodes`
    - aceeasi logica este afisata acum si in `traceability matrix`, nu doar in `controls matrix`
  - `family reuse` este acum mai defensiv:
    - sursa cu dovada `weak` nu mai poate fi refolosita
    - sursa validata doar pe `inferred_signal` nu mai poate fi refolosita automat
    - target-urile cu drift deschis raman separate
  - fixtures reale pentru verdicturi grele acopera acum:
    - document high-risk de recrutare
    - `compliscan.yaml` high-risk cu scoring, transfer si lipsa oversight
  - expected findings si manifest autodiscovery au teste de stabilitate si pentru aceste cazuri grele
  - `Audit Pack` are acum si test fixture-driven pentru caz high-risk fara dovezi
  - exista teste dedicate pentru:
    - `evidence-quality`
    - `audit-quality-gates`
    - propagarea calitatii dovezii prin upload si registrul cloud
    - `compliance-trace` pentru:
      - `weak evidence -> auditDecision=review`
      - `passed + drift deschis -> auditDecision=blocked`
    - `POST /api/traceability/review` pentru blocaj pe `weak evidence`, `needs_review` si familie nevalidata
  - validarea completa este verde:
    - `npm test`
    - `npm run lint`
    - `npm run build`
  - suita curenta are:
    - `60` fisiere de test
    - `213` teste verzi
- progresul executiei este jurnalizat in `public/log-sprinturi-maturizare.md`

## Checkpoint curent de implementare

Ultimul punct inchis in implementare:

- upload real de dovezi in task-uri
- proof types pe task-uri
- salvare legacy de fisiere dovezi in `public/evidence-uploads` pentru atasamente vechi
- `Mark as fixed & rescan` peste dovada reala
- `Auditor Vault` afiseaza dovada, tipul si validarea
- severitate unica in findings / alerts / drift / task-uri
- taxonomie unica de principii in model si UI
- drift-ul genereaza acum task-uri de remediere dedicate
- IA oficiala aprobata este acum:
  - `Dashboard`
  - `Scanare`
  - `Control`
  - `Dovada`
  - `Setari`
- `Scanare / Control / Dovada` raman pilonii de executie
- `Dashboard` este home/orchestrator, nu dublura de `Control`
- `Setari` este suprafata top-level de operare, nu pilon de executie
- sub-sectiunile raman tabs per zona, nu produse separate in sidebar
- drift-ul este urcat in dashboard ca semnal operational principal
- `AI Compliance Pack` comun peste documente, manifests si `compliscan.yaml`
- registru operational de evidence in DB, nu doar sync de metadata
- `AI Compliance Pack v2` cu:
  - prefill completeness score
  - field status (`confirmed / inferred / missing`)
  - source signals
  - draft `Annex IV lite`
- `AI Compliance Pack v3` cu:
  - `confidenceModel` separat de încrederea tehnică
  - `detected / inferred / confirmed_by_user`
  - rezumat unificat în UI și în audit
- `AI Compliance Pack v4` cu:
  - confidence model la nivel de câmp
  - evidence bundle summary pe fiecare sistem
  - trace summary pe fiecare sistem
  - coverage agregat pentru field confidence și bundle readiness
- `AI Compliance Pack` împins mai aproape de `Annex IV lite`, cu:
  - system scope
  - intended users and affected persons
  - risk and rights impact
  - technical dependencies
  - evidence and validation summary
  - coverage pe control și pe articol în evidence bundle
- `Annex IV lite` client-facing, separat de cardul operational:
  - export HTML printabil din browser
  - utilizabil in review operational si pregatire audit
  - inclus si in `Audit Pack` ZIP / dossier bundle
  - review checklist la inceput
  - readiness si missing fields mai clare pe fiecare sistem
  - anchors si table of contents pe fiecare sistem si sectiune
- `AI Compliance Pack` are acum editare și confirmare pe câmpuri:
  - override-uri persistate în starea de compliance
  - confirmare `confirmed_by_user` la nivel de câmp
  - regenerare unificată pentru pack, audit și export
- UX dedicat pentru câmpurile compuse din `AI Compliance Pack`:
  - editori specializați pentru `human_oversight`, `data_residency`, `retention_days`, `legal_mapping`
  - serializare mai sigură pentru mapările legale pe linii
  - confirmare mai clară pentru câmpurile care intră direct în audit și drift
- drift policy unificat pentru:
  - severitate
  - motivul severității
  - impact
  - acțiune recomandată
  - dovada cerută
  - referința de control / lege
- drift UX armonizat în:
  - Dashboard
  - Drift
  - Scanări
  - Audit si export
  - Auditor Vault
- `drift escalation matrix` este acum operațional:
  - lifecycle clar: `open / acknowledged / in_progress / resolved / waived`
  - owner și SLA vizibile în UI
  - badge pentru SLA depășit
  - evenimente dedicate în audit trail
  - închiderea prin task actualizează și lifecycle-ul drift-ului asociat
- `traceability matrix` comun:
  - finding
  - remediation task
  - drift
  - articol / control
  - snapshot / baseline
- `traceability matrix` rafinat și cu:
  - evidence required
  - coverage pe control (`covered / partial / missing`)
  - fișiere legate direct de control
- confirmare explicită pe control / articol în `traceability matrix`:
  - confirmare manuală pentru audit
  - notă opțională de justificare
  - reflectată și în exporturile client-facing
  - confirmare in grup pentru acelasi articol legal
- familii de controale reutilizabile:
  - agregare pe aceeași natură operațională
  - confirmare la nivel de familie
  - reuse de dovadă validată în aceeași familie, cu rescan ulterior
  - policy mai fină de reuse:
    - compatibilitate pe tip de dovadă
    - grup legal compatibil
    - validare tehnică compatibilă pentru familiile stricte
- `Auditor Vault` afișează traseul de control ca obiect separat
- `Audit Pack` client-facing include acum și:
  - traceability matrix
  - controale confirmate explicit pentru audit
  - note de review pe control
  - linkuri directe catre sectiunile relevante din `Annex IV lite`
  - reuse summary pe familie de controale în bundle evidence
  - lifecycle și SLA breach pentru drift-urile active
  - secțiuni explicite pentru stakeholder non-tehnic:
    - ce este deja defensibil
    - ce cere atenție înainte de audit
    - ce s-a schimbat față de baseline
    - owner action register
    - decision gates: ce poate fi semnat / distribuit / înghețat acum
    - checklist rapid pentru stakeholder
- `Audit Pack v2` exportabil din `Auditor Vault`, cu:
  - executive summary
  - system register
  - controls matrix
  - evidence ledger
  - drift register
  - validation log
  - timeline
- `Audit Pack` client-facing, printabil din browser pentru PDF, construit peste structura v2
- `Audit Pack` ZIP / dossier bundle peste structura v2
- `Audit Pack` agregă acum coverage pe articol / control, nu doar pe sistem
- `Audit Pack` client-facing are acum framing executiv mai bun:
  - cover summary
  - livrabile complementare
  - trimiteri directe catre `Annex IV lite`
- `AI Compliance Pack` precompleteaza mai agresiv sectiunile avansate din `Annex IV lite`:
  - deployment context
  - affected persons summary
  - monitoring summary
  - escalation path
- `AI Compliance Pack` are acum și controale sugerate mai fine:
  - controale derivate din task-urile reale
  - controale inferate pentru transparență, oversight, retenție, transfer, baseline review
  - prioritizare `P1 / P2 / P3`
  - dovadă și referință legală pentru fiecare control sugerat
  - context executiv per control:
    - `ownerRoute`
    - `businessImpact`
    - `bundleHint`
- `AI Compliance Pack` grupează acum controalele sugerate și pe grupuri de sisteme:
  - suport clienți
  - HR / recrutare
  - operațiuni financiare
  - marketing / analytics
  - operațiuni generale
- pagina `Sisteme` are acum și `Control package highlights`:
  - pachete dominante pe grupuri de sisteme
  - owner route
  - bundle minim de dovadă
  - impact de business
- `Auditor Vault` explică mai bine familiile de controale:
  - de ce contează
  - ce dovedește familia
  - ce surse intră în scope
  - presiunea curentă din findings și drift
- severitate drift configurabilă la nivel de workspace
- remediere separata intre:
  - remedieri rapide
  - remedieri structurale
- `AIDiscoveryPanel` arată acum doar detectiile active:
  - `detected`
  - `reviewed`
  - sistemele confirmate rămân doar în inventarul oficial
  - drift-ul nu mai este duplicat integral în fiecare card de detecție
- `Audit Pack` client-facing are acum și strat executiv clar:
  - decizii executive recomandate
  - carduri de blocaje / review / gap-uri de familie
  - trimiteri mai clare către `Annex IV lite`
- QA riguroasa + dry run (auth, manifest, baseline, compliscan.yaml, drift lifecycle, exporturi audit)
  - memo executiv de deschidere
  - register cu owneri, acțiuni și deadline-uri
- polish final pentru stakeholder non-tehnic în dosarele externe:
  - ghid clar `ce trimiți mai departe și când`
  - legendă de citire rapidă pentru statusuri
  - pachete de control recomandate pe sistem în `Audit Pack` client-facing
  - rezumat managerial per sistem în `Annex IV lite`
  - bundle / README cu ordine recomandată de citire
- sprint de QA + UX cleanup pe fluxurile cu cea mai mare densitate:
  - `Scanari` separa mai clar `flux activ` de `ultimul rezultat` (done)
  - `AIDiscoveryPanel` comprima mesajele de drift si pastreaza pagina ca work queue (done)
  - `Auditor Vault` porneste mai clar printr-un rezumat rapid si reduce numarul de trasee individuale afisate initial (done)
- micro-copy + empty states cleanup:
  - `Scanari` foloseste copy mai clar pe flux si pe starea curenta (done)
  - `Sisteme` spune mai bine ce lipseste si ce se intampla cand nu exista inventory sau drift (done)
  - `Audit si dovezi` explica mai clar ce lipseste cand nu exista snapshot, dovada, trasee sau jurnal (done)
- naming consistency pass pe suprafata vizibila:
  - subtitle de brand aliniat la produsul actual (done)
  - `Flux scanare` in loc de `Wizard scanare` (done)
  - `Remediere` in loc de `Plan de remediere` pe suprafetele principale (done)
  - `Audit si export` in loc de `Rapoarte` pe suprafetele operationale (done)
- cleanup minim si pe componente legacy ramase, ca sa nu mai pastram naming-ul vechi in codul secundar (done)
  - componentele interne nu mai folosesc nume vechi precum `Wizard`, `ChecklistsPage` sau `RapoartePage`
- `lint` si `build` trec
- `Agent Evidence OS v1` (layer de orchestrare peste motorul existent):
  - `AgentWorkspace`: UI dens, tri-col (Context / Proposals / Review) integrat în pagina `Scanări`
  - `Agent Runner`: orchestrare paralelă pentru 4 agenți (`Intake`, `Findings`, `Drift`, `Evidence`)
  - `Intake Agent`: detecție avansată (Anthropic, Local ML, RAG stacks) și clasificare risc (HR, Biometric)
  - `Findings Agent`: mapare semnale pe reguli cu verificare încrucișată (ex: Low Risk declarat vs Biometrie detectată)
  - `Drift Agent`: detecție schimbări critice (Data Residency US, Human Oversight removal) cu generare de `DriftProposal`
  - `Evidence Agent`: generare checklist audit și grupare dovezi (AI Act Annex IV, GDPR, Operațional)
  - `Human Review Gate`: flux de respingere/confirmare granulară înainte de scriere în DB
  - `Commit System`: tranzacție care transformă propunerile agenților în `DetectedSystem`, `Finding`, `DriftRecord` reale

## Ce avem deja bine

### 1. Source layer

Surse suportate:

- document
- text manual
- manifest / repo
- `compliscan.yaml`
- repo sync GitHub / GitLab / generic

### 2. Analysis layer

Exista deja:

- rule library
- legal mapping
- findings
- alerts
- AI autodiscovery
- baseline
- drift detection
- validation logic pe task-uri
- agent orchestration layer
- agent proposal types

### 3. Control layer

Exista deja:

- AI inventory
- detected / reviewed / confirmed / rejected
- snapshot history
- validated baseline
- drift records

### 4. Evidence layer

Exista deja:

- remediation task cards
- evidence upload
- proof types
- event log
- `Auditor Vault`
- export `compliscan.json`
- export `compliscan.yaml`
- export PDF / checklist demo
- export `Audit Pack v2` JSON structurat pentru audit
- export `Audit Pack` client-facing pentru stakeholderi non-tehnici
- export `Audit Pack` ZIP / dossier bundle
- export `Annex IV lite` client-facing cu ancore pe sectiuni

## Ce nu este inca armonizat

### 1. Modelul de produs in UI

In cod, produsul a convergent initial catre 3 piloni de executie:

- Scanare
- Control
- Dovada

Decizia oficiala de IA este acum un shell top-level cu:

- Dashboard
- Scanare
- Control
- Dovada
- Setari

Asta nu introduce concepte noi de produs.

Face explicita diferenta dintre:

- orientare (`Dashboard`)
- executie (`Scanare / Control / Dovada`)
- operare (`Setari`)

In implementarea curenta, inca exista pagini si etichete mostenite care expun conceptele vechi:

- Documente
- Sisteme AI
- Remediere
- Drift (ruta curenta `/dashboard/alerte`)
- Audit si export
- Asistent

Asta este mult mai bine pentru user, dar mai trebuie armonizate:

- titlurile unor pagini
- copy-ul dintre zonele top-level si sub-sectiunile lor
- relatia dintre `Dashboard` si `Control`
- relatia dintre `Remediere`, `Audit si export` si `Auditor Vault`

Progres recent pe punctul acesta:

- `DashboardShell` descrie acum top-level-urile in vocabularul oficial al produsului, nu prin shortcut-uri vechi
- pagina `/dashboard/sisteme` se prezinta acum ca workspace de `Control`
- pasul 3 din `Dashboard` trimite spre `Dovada` ca loc de executie, nu direct spre export
- `Documente` se prezinta explicit ca istoric separat de fluxul activ de scanare
- `Dovada` a fost dusa pe page governance explicit:
  - `Remediere` = executie
  - `Audit si export` = readiness + livrabil
  - `Auditor Vault` = ledger + trasabilitate
  - paginile folosesc acum `PageIntro`, `SummaryStrip`, `SectionBoundary` si `HandoffCard` pentru a separa sumarul de actiune si de livrabil
- `Setari` a fost adusa pe aceeasi schema:
  - administrare operationala
  - tabs locale clare
  - handoff explicit inapoi in `Dashboard`, `Control` si `Dovada`
  - pagina foloseste acum `PageIntro`, `SummaryStrip`, `SectionBoundary` si `HandoffCard`, fara sa schimbe wiring-ul functional
- shell-ul `dashboard` este acum marcat explicit ca zona dinamica autentificata:
  - `app/dashboard/layout.tsx` foloseste `dynamic = "force-dynamic"`
  - asta elimina ambiguitatea dintre shell autenticat si incercarile de prerender static
  - warning-urile de `dynamic server usage` nu mai polueaza build-ul pentru rutele dashboard
- `Documente` si `Asistent` nu mai stau pe `PageHeader` legacy:
  - `Documente` isi asuma clar rolul de istoric read-only si handoff spre `Scanare` sau `Dovada`
  - `Asistent` isi asuma clar rolul de utilitar global si orientare, cu validare umana explicita
  - ambele folosesc acum primitivele canonice de compozitie din `Evidence OS`
- `Drift` foloseste acum aceeasi schema canonica de pagina ca restul pilonilor:
  - `PageIntro`
  - `SummaryStrip`
  - `SectionBoundary`
  - `HandoffCard`
  - asta lasa board-ul si actiunile de drift mai jos in pagina, sub intentia dominanta, nu amestecate chiar din header
- primitivele de baza din cockpit au fost si ele aduse sub `Evidence OS`:
  - `Badge`
  - `Button`
  - `Card`
  - `Alert`
  - `Progress`
  - `ScrollArea`
  - `Sheet`
  - `Avatar`
  - `DropdownMenu`
  - `Toaster`
  - pentru `app/*`, `components/*` si `lib/compliance/*`
- `components/ui/*` nu mai este suprafata de authoring pentru runtime; a ramas doar strat de compatibilitate peste `Evidence OS`, fara logica UI concurenta
- `PageHeader` a fost eliminat din `route-sections`:
  - runtime-ul activ nu mai foloseste doua scheme paralele de compozitie pentru pagini
- hook-ul central `use-cockpit` a intrat in cleanup structural:
  - derivarile pure pentru task-uri, insights si formatare au fost extrase in `components/compliscan/cockpit-derivations.ts`
  - separarea dintre orchestrare client-side si logica pura este acum mai clara
  - comportamentul public a ramas compatibil pentru paginile existente
- efectele de browser din `use-cockpit` au fost si ele separate:
  - `components/compliscan/cockpit-browser.ts`
  - asta reduce amestecul dintre mutatii de produs si helper-ele de preview/download/share
- `use-cockpit` foloseste acum si helper-e interne de orchestrare:
  - operatiile `busy` sunt mai coerente
  - aplicarea payload-ului de dashboard este mai consistenta
  - asta reduce boilerplate-ul fara sa schimbe contractul public al cockpit-ului

### 2. Severitate si principii

Acest punct este acum in mare parte rezolvat:

- findings folosesc `critical / high / medium / low`
- alerts folosesc `critical / high / medium / low`
- drift foloseste `critical / high / medium / low`
- task-urile mostenesc aceeasi severitate

La fel si principiile:

- taxonomia unica este acum aplicata in modelul intern
- UI-ul afiseaza principii si severitate pe task-uri
- exportul snapshot consuma modelul unificat

Ce mai ramane:

- curatare de copy si etichete in cateva pagini
- impunerea aceluiasi vocabular si in navigatia finala

### 3. Drift si remediation nu sunt inca complet unite

Punctul acesta este acum avansat, dar nu complet inchis:

- drift-ul genereaza task-uri dedicate
- task-urile de drift au owner, dovada ceruta, text gata de copiat si pas clar de remediere
- inchiderea/redeschiderea task-ului poate inchide/redeschide si drift-ul asociat
- drift-ul are acum politică unificată pentru impact și acțiune
- aceeasi poveste de drift apare si in Dashboard, si in Drift, si in Audit
- densitatea operationala a fost totusi redusa:
  - `Dashboard` arata feed compact de drift, nu toate detaliile de executie
  - workspace-ul `Drift` foloseste progressive disclosure, cu detalii si actiuni doar pe elementul expandat
  - `DriftCommandCenter` selecteaza explicit drift-ul activ, in loc sa repete pachetul complet pentru toate semnalele

Ce mai ramane:

- task-uri si mai explicite pentru drift in functie de articolul afectat si dovada exacta
- polish final al reuse bundle la nivel de familie, nu doar pe control
- pachet client-facing și mai aproape de un dosar executiv extern
- sugestii și mai fine pe controale compuse / familii de controale
- UX de escaladare mai clar pentru `critical` vs `high`
- confirmare mai fină la nivel de familie mare de controale, nu doar pe articol si pe fiecare traseu din matrix

### 4. Pre-filling nu este complet

Avem:

- detectie
- review
- confirm
- `AI Compliance Pack v2` care unifica sursele, guvernanta, controalele si dovada
- `AI Compliance Pack v3` care separa:
  - încrederea tehnică (`low / medium / high`)
  - încrederea operațională (`detected / inferred / confirmed_by_user`)
- `AI Compliance Pack v4` care adaugă:
  - confidence model la nivel de câmp
  - evidence bundle pe sistem
  - trace summary pe sistem
- prefill score si field status pe fiecare sistem
- draft scurt de documentatie pentru audit (`Annex IV lite draft`)

Dar inca nu avem complet:

- confirmare si editare si mai fine pentru grupuri de câmpuri avansate
- controale sugerate si mai fine pe fiecare sistem
- UX dedicat și pentru câmpuri compuse mai avansate, nu doar pentru override-urile principale din pack
- legătura directă dintre fiecare articol / control și secțiunea exactă din dosarul client-facing extern

### 5. Audit Pack este coerent, dar nu inca final

Avem acum:

- `Audit Pack v2` cu sectiuni explicite
- legatura clara intre:
  - systems
  - controls
  - evidence
  - drift
  - validation
  - timeline
- varianta client-facing, printabila, pentru PDF din browser
- traceability matrix in JSON și în varianta client-facing
- pozitionare mai clara in `Audit si export` si `Audit si dovezi`

Ce mai ramane:

- prezentare si mai buna a dosarului pentru auditor non-tehnic
- ambalare mai bună a dosarului ca pachet client-facing pentru stakeholderi non-tehnici
- legarea fiecărui articol/control de secțiuni explicite din dosarul client-facing final, nu doar in uneltele de audit
- UX și reguli mai fine pentru confirmare/editare la nivel de câmp în `AI Compliance Pack`

## Ce lasam intentionat in urma

Aceste puncte nu sunt uitate. Sunt parcate intentionat dupa checkpoint-ul actual:

- confirmare si prefill mai fine la nivel de câmp si familie de controale
- legături și mai bune între drift și task-urile derivate
- agregare și mai fină a dovezii la nivel de control bundle și reuse policy
- PDF / ZIP mai bine ambalat pentru stakeholder non-tehnic

Ordinea recomandata cand revenim:

1. legatura mai puternica intre evidence bundle si fiecare articol / control
2. PDF / ZIP mai bine ambalat pentru stakeholder non-tehnic
3. controale sugerate si confirmari si mai fine la nivel de grup

## Arhitectura unica recomandata

Nu recomand doua arhitecturi paralele.

Recomand o singura arhitectura de domeniu, cu 5 grupuri clare:

### 1. Sources

- `Source`
- `Scan`
- `Extraction`

Tot ce intra in produs porneste de aici.

### 2. Findings

- `Finding`
- `Alert`
- `Task`

Tot ce detectam trebuie sa poata deveni actiune.

### 3. Systems

- `AISystem`
- `DetectedSystem`
- `Snapshot`
- `Baseline`
- `Drift`

Aici sta controlul operational al sistemelor AI.

### 4. Evidence

- `EvidenceAttachment`
- `Validation`
- `AuditEvent`
- `AuditPack`

Aici sta dovada reala.

### 5. Platform

- `Workspace`
- `User`
- `RepoSync`
- `Export`

Aici sta infrastructura de produs, nu logica principala.

## Fluxul unic care trebuie pastrat

Toata aplicatia trebuie sa ramana subordonata aceluiasi flux:

1. adaugi sursa
2. primesti verdict
3. primesti remediere
4. ataszi dovada
5. rulezi rescan / validare
6. exporti pentru audit

Inventar, baseline, drift si audit nu trebuie sa concureze cu fluxul asta. Trebuie sa-l sustina.

## Cel mai bun pas urmator

Cel mai bun pas urmator nu este un modul nou.

Cel mai bun pas urmator este:

## Sprint de finisare a modelului unic

### Obiectiv

Sa inchidem modelul comun dintre source, control, evidence si audit, fara sa deschidem din nou fire paralele.

### Task-uri recomandate

1. facem `drift escalation` complet operațional

- escalation matrix pe tip de drift
- owner, SLA și severitate finală
- condiții în care drift-ul blochează baseline-ul sau auditul
- dovada obligatorie pentru închidere

2. rafinăm drift-ul și mai defensibil

- diferențiere `critical` vs `high` și în UI
- UX de impact / acțiune / dovadă este deja unificat și trebuie doar rafinat
- escaladarea trebuie să intre în task-uri și în exporturile de audit

Acest bloc este acum închis.

## Urmatorul pas clar

1. intarim `family-level evidence bundle`

- reuse clar pe familie, nu doar pe control
- policy explicită per fișier și per control

Acest bloc este acum închis.

## Urmatorul pas clar

1. finalizam `AI Compliance Pack` ca model de incredere

- finding
- remediation
- drift escalation
- articol de lege
- snapshot / baseline
- `detected`
- `inferred`
- `confirmed_by_user`
- controale sugerate mai fine

2. ducem `Audit Pack` spre dosar executiv extern

- HTML / PDF client-facing și ZIP-ul sunt deja gata
- urmatorul pas este un dosar mai bun pentru stakeholder non-tehnic

## Ce NU recomand acum

- rewrite mare de state
- mutare masiva de foldere doar pentru “curatenie”
- auth / multi-tenant mare chiar acum
- ANAF real inainte de consolidare
- benchmark engine
- SDK runtime

Acestea ar creste complexitatea inainte sa fixam modelul unic.

## Rezumat executiv

Da, trebuie sa armonizam arhitectura.

Dar armonizarea corecta acum inseamna:

- un model de domeniu unic
- un flow principal unic
- severitate unica
- principii unice
- drift -> task -> evidence -> audit

Nu inseamna:

- sa aruncam ce avem
- sa rescriem tot
- sa adaugam alte 5 module

Arhitectura buna pentru CompliScan acum este:

**o singura arhitectura operationala, centrata pe sursa -> verdict -> remediere -> dovada -> audit**

## Actualizare 2026-03-15 - cockpit store cleanup inchis

- `components/compliscan/use-cockpit.tsx` foloseste acum consecvent doua reguli interne pentru mutatii:
  - `withBusyOperation(...)` pentru orchestrarea starii `busy`
  - `applyDashboardPayload(...)` pentru aplicarea uniforma a `DashboardPayload`
- nu mai exista in blocul principal de mutatii pattern-uri paralele de tip:
  - `setBusy(true) -> try/finally`
  - `setData(payload)` repetat manual in fiecare operatie
- efectul nu este doar cosmetic:
  - reduce divergenta intre mutatiile de scanare, control, dovada si drift
  - face store-ul central mai auditabil si mai usor de separat in pasi viitori
  - muta produsul din zona de "hook mare, greu de controlat" spre orchestrare mai explicita

Verdict:

- cleanup-ul structural pentru `use-cockpit` este inchis operational
- pasii urmatori pot intra deja in polish / split incremental, nu in reparatie de baza

## Actualizare 2026-03-15 - audit final PR si code-splitting pe Control

- auditul final pe branch-ul activ nu a gasit blocaje noi de `mixed intent`
- principalele reguli canonice sunt respectate in runtime:
  - `Dashboard` ramane orientare
  - `Control` ramane confirmare
  - `Dovada` ramane separata intre executie, ledger si livrabil
- riscul ramas a coborat din zona de arhitectura in zona de greutate pe suprafete client-heavy

Pas tehnic aplicat:

- `app/dashboard/sisteme/page.tsx` face acum code-splitting pentru:
  - `AIDiscoveryPanel`
  - `AIInventoryPanel`
  - `AICompliancePackSummaryCard`
  - `AICompliancePackEntriesCard`
- asta inseamna ca `Control > Sisteme` nu mai forteaza incarcarea tuturor workspace-urilor grele la intrarea initiala in pagina

Efect masurabil in build:

- `/dashboard/sisteme`
  - inainte: `17.3 kB` / `195 kB first load`
  - dupa: `9.31 kB` / `181 kB first load`

## Actualizare 2026-03-15 - `Auditor Vault` section-level loading

- `Auditor Vault` nu mai conditioneaza randarea intregii pagini de sosirea `compliancePack` si `traceabilityMatrix`
- shell-ul paginii si ledger-ul de baza pornesc acum din `core payload`
- sectiunile grele se hidrateaza separat, cu loading local:
  - `AICompliancePackSummaryCard`
  - `AICompliancePackEntriesCard`
  - `TraceabilityMatrixCard`

Asta respecta mai bine si doctrina canonica:

- `Vault` ramane ledger si vedere audit-ready
- summary-ul si handoff-urile nu mai sunt blocate de detaliul greu
- progressive disclosure functioneaza si la nivel de incarcare, nu doar de layout

Efect masurabil in build:

- `/dashboard/rapoarte/auditor-vault`
  - inainte: `17.3 kB` / `189 kB first load`
  - dupa: `9.69 kB` / `181 kB first load`

## Actualizare 2026-03-15 - `Setari` code-splitting pentru taburile grele

- `Setari` ramane pilon operational/admin, dar nu mai aduce in bundle-ul initial toate diagnosticele tehnice
- `Integrari` si `Operational` au fost extrase in componente dedicate si incarcate local prin `dynamic import`
- tipurile si helper-ele reutilizabile au fost mutate intr-un modul comun:
  - `components/compliscan/settings/settings-shared.tsx`

Asta este sanatos arhitectural pentru ca:

- pastreaza `Setari` ca shell de orchestrare, nu ca ecran monolitic
- lasa taburile usoare (`Workspace`, `Acces`, `Avansat`) sa porneasca rapid
- impinge diagnosticele grele doar in momentul in care utilizatorul intra explicit pe:
  - `Integrari`
  - `Operational`

Efect masurabil in build:

- `/dashboard/setari`
  - inainte: aproximativ `11.7 kB` / `185 kB first load`
  - dupa: `7.73 kB` / `184 kB first load`

## Actualizare 2026-03-15 - `Scanare` lazy-load pentru `Verdicts` si `Istoric`

- `Scanare` ramane pagina de executie initiala
- `flow` continua sa porneasca direct, fara sa astepte explicarea verdictului sau lista istorica
- `Verdicts` si `Istoric documente` au fost extrase in componente locale si incarcate prin `dynamic import`

Asta e sanatos arhitectural pentru ca:

- tine intentia dominanta a paginii pe executie
- muta `read-only explanation` si `lookup` in chunk-uri secundare
- respecta mai bine regula `summary / detail / action`, fara ca zonele non-initiale sa stea in bundle-ul de intrare

Efect masurabil in build:

- `/dashboard/scanari`
  - inainte: `11.2 kB` / `182 kB first load`
  - dupa: `9.12 kB` / `180 kB first load`

## Actualizare 2026-03-15 - `Audit si export` lazy-load pentru panourile suport

- `Audit si export` isi pastreaza intentia dominanta:
  - readiness de livrabil
  - snapshot curent
  - export center
- panourile suport care explica artefactele si sumarizeaza driftul nu mai stau in bundle-ul initial
- acestea au fost mutate intr-un modul separat:
  - `components/compliscan/rapoarte/reports-support-panels.tsx`

Asta este sanatos arhitectural pentru ca:

- pastreaza `Audit si export` pe finalizare si livrabil
- tine `support detail` separat de `primary action surface`
- reduce greutatea initiala fara sa schimbe workflow-ul sau business logic

Efect masurabil in build:

- `/dashboard/rapoarte`
  - inainte: `7.89 kB` / `179 kB first load`
  - dupa: `6.13 kB` / `177 kB first load`

## Actualizare 2026-03-15 - `Setari wave 1` page-shell austerity

- `Setari` nu mai foloseste un shell prea narativ pentru o pagina administrativa
- `PageIntro` este mai scurt si mai sobru
- aside-ul nu mai afiseaza `score / risk` ca un pseudo-dashboard, ci un snapshot administrativ relevant
- `SummaryStrip` este mai direct
- blocul de `Flux canonic` este comprimat fara cele 3 carduri de framing
- handoff-ul ramane clar spre produs, dar fara explicatie redundanta

Asta este sanatos arhitectural pentru ca:

- pastreaza `Setari` in rolul de admin / operational
- nu o impinge spre overview executiv
- lasa ownership-ul component-level pentru lotul separat
- aplica directiva `starea si urmatorul pas bat explicatia`

Efect masurabil in build:

- `/dashboard/setari`
  - inainte: `7.73 kB` / `184 kB first load`
  - dupa: `7.35 kB` / `183 kB first load`

## Actualizare 2026-03-15 - verdict de runtime UX

CompliScan are acum o fundatie de produs mai matura decat lasa sa se vada runtime-ul.

Verdictul corect este:

- problema dominanta nu mai este lipsa de feature-uri
- problema dominanta este ca UX-ul runtime nu are inca suficienta autoritate

Asta inseamna:

- produsul explica prea mult
- prea multe blocuri par egale in ierarhie
- executia, sumarul si proof-ul concureaza inca prea des pe aceeasi pagina

Directiva activa devine:

- starea si urmatorul pas trebuie sa bata explicatia

Implicații:

- `Checklists` este urmatorul val sanatos dupa integrare si browser audit
- `Dashboard` trebuie curatat in continuare spre orientare pura
- `Agent Evidence OS` continua doar ca layer peste produsul actual:
  - fara produs paralel
  - fara scriere directa in state final
  - cu human review obligatoriu

Sursa operationala pentru aceasta directie:

- `public/runtime-ux-declutter-directive-2026-03-15.md`

## Actualizare 2026-03-15 - `Checklists wave 1` a pornit corect

- prima taietura a fost facuta la nivel de page shell, nu de business logic
- `Remediere` a devenit mai clara ca pagina de executie:
  - board-ul urca mai sus
  - handoff-ul coboara dupa zona de lucru
  - framing-ul explicativ nu mai concureaza la acelasi nivel cu actiunea

Asta este sanatos arhitectural pentru ca:

- respecta regula `starea si urmatorul pas trebuie sa bata explicatia`
- nu schimba separarea dintre:
  - `Remediere`
  - `Audit si export`
  - `Auditor Vault`
- lotul component-level a fost inchis separat, fara sa amestece shell-ul cu cardurile

## Actualizare 2026-03-15 - `Checklists wave 1` component density pass

- `RemediationBoard` foloseste acum o ierarhie mai clara pentru filtre:
  - `Status`
  - `Tip remediere`
  - `Prioritate`
- `TaskCard` nu mai dubleaza metadata operationala in coloana de actiune
- CTA-ul primar ramane dominant:
  - `Valideaza si rescaneaza`
- dovada curenta si utilitarul de export stau acum sub disclosure local

Asta este sanatos arhitectural pentru ca:

- `Checklists` ramane pagina de executie
- actiunea bate contextul si utilitarul tertiar
- pasul nu schimba business logic, doar ierarhia de runtime

## Actualizare 2026-03-15 - `Dashboard` este mai aproape de orientare pura

- `Dashboard` nu mai consuma atata spatiu pe explicatii despre sine
- ierarhia principala este acum mai apropiata de doctrina:
  - `next action`
  - drift / blocked state
  - snapshot scurt
- ghidajul ramas este mai compact si mai utilitar

Asta este sanatos arhitectural pentru ca:

- home-ul se apropie de rolul de orientare, nu de pagina explicativa
- `Control drift` nu mai sta in plan secund cand utilizatorul cauta blocajul real
- `Unde continui` ramane util, dar nu mai concureaza cu `next action`

## Actualizare 2026-03-15 - `Dashboard` orientation hardening

- `Dashboard` a primit un al doilea pass scurt de austeritate, fara schimbare de logic
- `SummaryStrip` pune acum explicit accent pe:
  - ce este blocat
  - unde mergi
- cardul de orientare a fost compactat suplimentar:
  - `Unde continui` -> `Traseu rapid`
  - badge-ul decorativ pentru ultimul manifest a fost scos
  - descrierile pasilor sunt mai scurte si mai imperative
- cardul de stare a fost si el intarit:
  - `Snapshot rapid` -> `Stare curenta`
  - CTA-urile au fost scurtate la `Scanare` / `Control`

Asta este sanatos arhitectural pentru ca:

- home-ul se apropie si mai mult de rolul de orientare executiva
- framing-ul ramas nu mai concureaza cu blocajul si traseul
- pasul ramane strict de UX hierarchy, fara schimbare de business logic

## Actualizare 2026-03-15 - `Audit si export` component density pass

- `ExportCenter` nu mai lasa toate exporturile la aceeasi greutate
- `Raport PDF` este mai clar exportul dominant
- `audit / review` raman secundare
- zona `tehnica` este mutata sub disclosure local
- panourile suport din `reports-support-panels` sunt mai compacte si mai utile:
  - artefactele sunt grupate dupa rol
  - driftul inclus in snapshot arata mai clar:
    - de ce intra
    - de ce conteaza
    - ce urmeaza
  - contextul operational detaliat ramane disponibil, dar nu mai concureaza cu mesajul principal

Asta este sanatos arhitectural pentru ca:

- intareste doctrina `snapshot + livrabil`
- nu muta `Audit si export` spre executie
- aplica `summary / detail / action` si la nivel de componente
- nu schimba shell-ul paginii si nu schimba business logic

## Actualizare 2026-03-15 - `Auditor Vault wave 1` page-shell declutter

- `Auditor Vault` a primit un pass scurt de austeritate la nivel de shell
- `PageIntro` este mai scurt si mai orientat pe:
  - readiness real
  - gap-uri
  - handoff
- aside-ul nu mai arata scor generic, ci stare utila pentru audit:
  - `ready / review`
  - drift activ
  - gap de dovada
- `SummaryStrip` si `SectionBoundary` sunt mai dure:
  - mai putin framing
  - fara `VaultGuideCard`
- handoff-ul si bannerul de export sunt mai clare pe rol:
  - ledger intern
  - livrabil extern
  - executie in `Remediere`

Asta este sanatos arhitectural pentru ca:

- `Auditor Vault` ramane ledger + trasabilitate, nu mini-dashboard si nici export surface
- starea si urmatorul pas bat explicatia lunga
- pasul nu atinge logica de export, traceability sau business rules

## Actualizare 2026-03-15 - `Auditor Vault wave 1` component density pass

- cardurile locale din Vault au primit disclosure mai dur:
  - `EvidenceLedgerCard`
  - `LegalMatrixCard`
  - `DriftWatchCard`
  - `ValidationLedgerCard`
  - `AuditTimelineCard`
- regula aplicata este constanta:
  - verdictul si starea raman sus
  - metadata si explicatia secundara coboara sub disclosure

Asta este sanatos arhitectural pentru ca:

- intareste rolul de ledger scanabil
- pastreaza trasabilitatea fara sa o lase sa concureze cu verdictul
- nu schimba shell-ul paginii si nu schimba business logic

## Actualizare 2026-03-15 - `Setari` component austerity pass

- `Setari` a primit si lotul component-level, separat de shell-ul paginii
- taburile `Integrari` si `Operational` folosesc acum o ierarhie mai dura:
  - `stare curenta`
  - `actiune recomandata`
  - semnale active
  - detaliu tehnic sub disclosure
- `settings-shared` ofera acum primitive locale pentru:
  - `SettingsStatusBlock`
  - `SettingsSignalCard`
  - `SettingsDisclosure`

Asta este sanatos arhitectural pentru ca:

- `Setari` ramane pagina administrativa, nu mini-dashboard paralel
- statusul operational si urmatorul pas bat explicatia
- detaliul tehnic ramane disponibil, dar nu mai concureaza cu verdictul principal
- pasul nu schimba shell-ul paginii si nu schimba business logic

## Actualizare 2026-03-15 - `Control wave 1` page-shell pass

- `Control` a primit primul pass scurt de austeritate la nivel de page shell
- `PageIntro` este mai scurt si mai direct
- `Overview` nu mai tine framing-ul greu de intrare:
  - `Snapshot control` -> `Ce ceri sa confirmi acum`
  - `SectionBoundary` foloseste actiuni directe, nu carduri didactice
  - handoff-ul a ramas pe doua directii clare:
    - `Sisteme`
    - `Drift`
- `Review` a primit si el microcopy mai dura, fara sa schimbe logica

Asta este sanatos arhitectural pentru ca:

- `Control` se apropie mai clar de rolul de workspace de confirmare
- starea si traseul bat explicatia lunga
- integrarile raman in `Setari`, executia ramane in `Dovada`
- pasul nu schimba business logic si nu intra peste lotul component-level

## Actualizare 2026-03-15 - `Control wave 1` component density pass

- `AIDiscoveryPanel` a coborat sub disclosure:
  - explicatia de suport
  - sursa detectiei
  - evidenta detectiei
- `AIInventoryPanel` foloseste acum:
  - copy mai scurt in wizard
  - badge-uri rapide pentru semnalele de risc
  - `Urmatorii pasi` sub disclosure
- `AICompliancePack` pastreaza sus:
  - snapshot
  - prefill status
  - confidence model
  - suggested next step
- blocurile grele sunt acum sub disclosure local:
  - source coverage details
  - semnale si surse
  - controale + evidence bundle + trace
  - Annex IV lite

Asta este sanatos arhitectural pentru ca:

- `Control` ramane suprafata de confirmare si triere, nu document dump
- starea si urmatorul pas bat framing-ul si explicatia
- `summary / detail / action` este aplicat si la nivel de componente
- pasul nu schimba shell-ul paginii si nu schimba business logic

## Actualizare 2026-03-15 - `Dashboard` cleanup suplimentar

- `Dashboard` foloseste acum mai clar regula `blocaj + urmatorul pas`
- `SummaryStrip` a pierdut descrierea redundanta si spune direct ce cere actiune
- `Unde continui` nu mai pune toate traseele la greutate egala:
  - pasul curent este urcat primul
  - pasul curent este marcat explicit cu `acum`
- `Stare curenta` nu mai trimite generic spre `Scanare` / `Control`, ci spre actiunea dominanta din starea reala:
  - scanare lipsa
  - baseline nevalidat
  - drift deschis
  - control stabil

Asta este sanatos arhitectural pentru ca:

- `Dashboard` ramane orientare pura, nu home explicativ
- actiunea principala domina fara sa deschidem produs paralel
- `summary / detail / action` este aplicat si la nivelul home-ului operational

## Actualizare 2026-03-15 - `Checklists wave 2` signal pass

- `Checklists` foloseste acum mai direct regula `urgenta + lipsa dovezii`
- snapshot-ul de sus nu mai consuma spatiu pe semnale mai putin actionabile
- board-ul urca explicit:
  - taskurile deschise
  - `P1`
  - taskurile fara dovada

Asta este sanatos arhitectural pentru ca:

- `Remediere` ramane pagina de executie, nu mini-dashboard statistic
- blocajul de audit este vizibil mai devreme
- `summary / detail / action` este aplicat si pe partea de executie, nu doar pe orientare

## Actualizare 2026-03-15 - `doc governance pass`

- repo-ul are acum o harta explicita pentru `public/*.md`:
  - `public/doc-governance-map-2026-03-15.md`
- documentatia este separata pe tier-uri:
  - canon
  - referinte active
  - working docs conditionale
  - input / audit istoric
  - memo-uri de coordonare

Asta este sanatos arhitectural pentru ca:

- sursa de adevar ramane mai clara
- contextul incarcat in implementare devine mai mic si mai consistent
- scade riscul ca un audit istoric sau un task intern sa bata canonul operational

## Actualizare 2026-03-15 - `Scanare` micro-pass de shell

- `Scanare` lasa acum intrarea in lucru sa bata ghidajul:
  - selectorul sursei ramane imediat dupa tabs
  - fluxul activ porneste inaintea cardurilor explicative
- `ScanWorkflowGuideCard` nu mai sta in fata executiei cand utilizatorul este deja in `flow`
- `ScanFlowOverviewCard` nu mai explica generic cum se citeste pagina; spune direct unde continui dupa analiza:
  - `Control` pentru manifest / YAML
  - `Dovada` pentru document / text

Asta este sanatos arhitectural pentru ca:

- `Scanare` ramane poarta de intrare pentru executie, nu pagina care concureaza cu propriul flux
- `starea si urmatorul pas` bat explicatia redundanta
- pasul nu schimba business logic si nu introduce produs paralel

## Actualizare 2026-03-15 - administrare membri peste workspace-ul local

- `Setari / Acces` poate adauga acum utilizatori deja existenti in workspace in organizatia curenta
- pasul foloseste:
  - helper nou in `lib/server/auth.ts`
  - `POST /api/auth/members`
  - UI owner-only in `app/dashboard/setari/page.tsx`
- fiecare adaugare scrie eveniment de compliance:
  - `auth.member-added`

Asta este sanatos arhitectural pentru ca:

- inchide administrarea minima de membri peste workspace-ul local fara sa inventeze un sistem nou de invitatii
- respecta regula cloud-first:
  - utilizatorii nesincronizabili nu sunt promisi ca membri valizi in modul strict
- pastreaza separarea intre:
  - admin local de membri
  - backlogul ulterior pentru invitatii externe complete

## Actualizare 2026-03-15 - harness executabil pentru flow-ul principal

- exista acum un test dedicat pentru flow-ul principal de user nou:
  - `tests/flow-test-kit-user-nou.test.ts`
- testul foloseste kitul:
  - `public/flow-test-kit-user-nou-document-2026-03-15/`
- executie rapida:
  - `npm run test:flow-kit`

Asta este sanatos arhitectural pentru ca:

- browser auditul ramane util, dar nu mai este singura forma de verificare a flow-ului principal
- avem acum o verificare repetabila pentru:
  - `Scanare`
  - popularea state-ului
  - `Dashboard payload`
  - derivarea de `Remediere`
- scade dependenta de sesiuni locale fragile si de verificari manuale cap-coada

## Actualizare 2026-03-15 - `org_state` este singura cale cloud activa pentru state

- `lib/server/mvp-store.ts` foloseste acum `public.org_state` ca singura cale cloud activa pentru state
- `compliscan.app_state` ramane doar sursa legacy de migrare:
  - este citit doar daca `org_state` lipseste in backend `supabase`
  - dupa citire, starea este mutata in `org_state`
- runtime-ul curent nu mai scrie in `app_state`
- in backend `hybrid`, `org_state` ramane mirror de siguranta, nu sursa primara

Asta este sanatos arhitectural pentru ca:

- elimina ambiguitatea intre doua tabele cloud pentru acelasi state operational
- pastreaza compatibilitatea cu datele legacy fara sa le lase in traseul curent
- face mai clara trecerea spre RLS si spre un source of truth unic in cloud

## Actualizare 2026-03-15 - verificarea RLS live este proaspata

- `npm run verify:supabase:rls` a fost rulat din nou la:
  - `2026-03-15T18:40:34.973Z`
- verificarea confirma din nou:
  - izolare pentru `organizations`
  - izolare pentru `memberships`
  - citire izolata pentru `org_state`
  - citire izolata pentru `evidence_objects`
  - blocarea scrierii in `org_state` pentru `viewer`

Asta este sanatos arhitectural pentru ca:

- inchide operational itemul minim de RLS multi-org
- lasa `org_state` source of truth intr-o pozitie mai credibila pentru mediu cloud
- reduce diferenta dintre modelul din documente si verificarea live reala

## Actualizare 2026-03-15 - `Agent Evidence OS` cere confirmare umana explicita la commit

- `app/api/agent/commit/route.ts` accepta acum doar loturi cu:
  - `reviewState = confirmed`
  - `reviewState = partially_confirmed`
- loturile cu `reviewState = needs_review` sunt respinse
- loturile goale dupa review sunt respinse
- `lib/compliance/agent-workspace.tsx` seteaza acum explicit review state-ul final in functie de decizia umana

Asta este sanatos arhitectural pentru ca:

- pastreaza `Agent OS` ca layer de propuneri, nu writer direct in state-ul oficial
- muta regula `omul valideaza` din documente in runtime
- evita commituri accidentale cu propuneri neconfirmate

## Actualizare 2026-03-15 - auditul final pe firul canonic este inchis operational

- exista acum un harness executabil pentru firul canonic:
  - `tests/canonical-runtime-audit.test.ts`
  - `npm run test:canonical-audit`
- harnessul leaga operational:
  - autentificare locala
  - `Scanare`
  - `Dashboard core`
  - `Dashboard payload`
  - `Audit si export`
  - `Setari`
- verdictul ramas este acum mai clar:
  - `Dashboard` tine directia buna
  - `Checklists` ramane cea mai densa pagina vizibila, dar nu mai blocheaza firul canonic

Asta este sanatos arhitectural pentru ca:

- inchide auditul final intr-o forma repetabila, nu doar vizuala sau contextuala
- leaga runtime UX de payload si handoff real
- reduce dependenta de sesiuni locale fragile pentru verificarea fluxului principal

## Actualizare 2026-03-15 - `Evidence OS` este acum stratul unic de authoring vizibil

- `app/*`, `components/*` si `lib/compliance/*` nu mai importa direct `components/ui/*`
- `components/ui/*` a ramas doar alias de compatibilitate peste `components/evidence-os/*`
- `Dashboard` nu mai foloseste doar token-uri migrate; shell-ul si hero-ul principal sunt acum compuse explicit in vocabular `Evidence OS`
- exporturile client-facing (`Annex IV lite`, `Audit Pack`) folosesc si ele token-uri `eos-*`, nu vechiul vocabular separat pentru suprafete si status

Asta este sanatos arhitectural pentru ca:

- reduce la o singura poarta de intrare pentru UI-ul produsului
- elimina competitia dintre doua sisteme de authoring
- face convergenta vizibila atat in runtime, cat si in livrabilele HTML generate server-side

## Actualizare 2026-03-15 - `Checklists` primeste un pass mai dur pe autoritatea de executie

- `app/dashboard/checklists/page.tsx` nu mai foloseste `score / risk` ca signal principal de intrare
- `components/compliscan/remediation-board.tsx` ordoneaza acum board-ul `ALL` dupa:
  - blocaje de audit
  - urgente P1
  - remedieri rapide
  - remedieri structurale
- `components/compliscan/task-card.tsx` tine acum sus:
  - primul pas
  - blocajul de audit
  - CTA-ul primar
- detaliile de verificare si utilitarele raman sub disclosure

Asta este sanatos arhitectural pentru ca:

- muta `Checklists` mai aproape de un cockpit de executie, nu de o pagina de explicatii
- face dovada lipsa si urgenta P1 dominante fata de framing
- pastreaza separarea intre actiune si suport

## Actualizare 2026-03-16 - Evidence OS vizual unificat pe suprafetele legacy

- componentele legacy din `components/dashboard/*` folosesc acum exclusiv clase `eos-*`
- accentul vechi `emerald` a fost eliminat din UI-ul runtime
- layout-ul legacy nu mai concureaza vizual cu noul Evidence OS, ci il respecta

## Actualizare 2026-03-16 - Org state nu mai cade pe FK missing

- `mvp-store` creeaza automat org-ul lipsa in `public.organizations` atunci cand `org_state` esueaza pe FK
- previne blocajul runtime pentru workspace-uri locale / nou create

## Actualizare 2026-03-16 - Registru evidence vizibil in Auditor Vault

- `buildDashboardCorePayload` transporta `evidenceLedger` din `public.evidence_objects`
- `Auditor Vault` foloseste acum registrul real ca sursa vizibila, nu doar attach-urile din task-uri
- indicatorii de calitate (`verificata / slaba / neevaluata`) sunt expusi in UI
- `SummaryStrip` din Vault afiseaza starea registrului ca semnal operational
- `Audit si export` afiseaza sumarul registrului in zona de readiness
- `Audit Pack` client-facing expune raportul de dovezi verificate din registru
- `Audit Pack` JSON expune sumarul de calitate al registrului de dovezi
- `Remediere` foloseste acum semnalul de calitate a dovezii in summary strip
- `Dashboard` foloseste semnalul de calitate a dovezii in summary strip
- `Control` foloseste semnalul de calitate a dovezii in overview
- `Documente` foloseste lazy load pentru sectiunile grele (latest + recent)
- `Alerte/Drift` expune semnalul de calitate a dovezii pentru decizie rapida

## Actualizare 2026-03-16 - Dashboard cu progressive disclosure pe detalii recente

- `Dashboard` nu mai afiseaza activitatea recenta implicit
- detaliile sunt disponibile doar la cerere, prin toggle explicit
- reduce densitatea initiala si pastreaza home-ul ca orientare

## Actualizare 2026-03-16 - Remediere: verificarea separata nu concureaza cu executia

- `Remediere` afiseaza pasii de verificare doar la cerere cand exista task-uri active
- `Auditor Vault` si `Audit si export` raman disponibile, dar nu concureaza cu board-ul

## Actualizare 2026-03-16 - Audit si export: suportul nu concureaza cu livrabilul

- `Audit si export` afiseaza ghidajul si panourile suport doar la cerere
- exportul si snapshot-ul raman suprafata dominanta

## Actualizare 2026-03-16 - Control overview: ghidajul nu concureaza cu actiunile

- `Control` (overview) arata sumar + actiuni scurte ca default
- ghidajul complet apare doar la cerere

## Actualizare 2026-03-16 - Scanare: actiunea precede detaliul

- `Scanare` afiseaza fluxul activ inaintea ghidajului complet
- detaliile de handoff apar doar la cerere

## Actualizare 2026-03-16 - Verdicts/Istoric: read-only mai curat

- `Verdicts` afiseaza detaliile doar la cerere
- `Istoric` are empty state clar pentru lipsa scanarilor

## Actualizare 2026-03-16 - Micro-copy: executie vs read-only

- paginile cheie mentioneaza explicit unde se executa si unde doar se verifica
- handoff-ul este scris clar in intro-uri si descrieri scurte

## Actualizare 2026-03-16 - Spacing Evidence OS

- iconurile din badge-uri sunt aliniate la 14px conform spec
- tab-urile Evidence OS respecta paddingul standard
- micro-list items folosesc padding pe scala

## Actualizare 2026-03-16 - Evidence OS spacing + layout (pass final)

- `Tabs` folosesc container `surface-base` (bg-eos-bg) conform spec
- `DashboardShell` respecta gridul oficial (max-width `1200px`, sidebar `240px`)
- input-urile runtime au revenit la sizing-ul canonic (inaltime `36px` md, radius `md` 8px, padding standardizat)
- au fost eliminate suprascrierile legacy de radius (`rounded-3xl`, `rounded-2xl`, `rounded-xl`)
- badge-urile de SLA si mesajele de blocaj folosesc acum variantele canonice
- filtrele de remediere folosesc `Button size="sm"` fara override de radius

## Actualizare 2026-03-16 - CTA label cleanup

- `Alerte`: etichete mai scurte pe actiunile de drift
- `NextBestAction`: CTA principal scurtat
- `TaskCard`: CTA principal scurtat, starea `done` foloseste `Redeschide`

## Actualizare 2026-03-16 - Overview + TaskCard density trim

- `RiskHeader` nu mai dubleaza scorul si pasul urmator in hero
- hero-ul pastreaza un mesaj principal, scorul ramane in aside
- `TaskCard` nu mai repeta blocajul de audit in mai multe zone

## Actualizare 2026-03-16 - Drift density pass (Alerte)

- listarea drift-urilor este compacta, cu `next action` vizibil
- metrics duplicate au fost eliminate in favoarea SummaryStrip
- CTA-urile sunt limitate la maxim 3 actiuni simultane

## Actualizare 2026-03-16 - Export + Vault density pass

- `Audit si export` are hero mai scurt si copy redus
- `Auditor Vault` foloseste disclosure pentru indicatorii detaliati
- exporturile tehnice sunt ascunse by default

## Actualizare 2026-03-16 - Setari density trim

- hero si summary mai scurte
- handoff administrativ compact

## Actualizare 2026-03-16 - Floating Assistant trim

- header si empty state mai scurte
- badge-uri reduse la esential

## Actualizare 2026-03-16 - Canonizare recipes (partial)

- `GuideCard` si `MetricTile` introduse in Evidence OS
- adoptate in `Auditor Vault` pentru consistenta de recipe

## Actualizare 2026-03-16 - Canonizare dense list

- `DenseListItem` introdus pentru liste operationale
- adoptat in `DriftCommandCenter` si `Alerte`

## Actualizare 2026-03-16 - Summary + Actions recipe

- `ActionCluster` folosit pentru zone cu CTA multiple
- adoptat in `Alerte` si `Auditor Vault`

## Actualizare 2026-03-16 - ActionCluster DriftCommandCenter

- quick actions din `DriftCommandCenter` sunt canonizate cu `ActionCluster`

## Actualizare 2026-03-16 - ActionCluster Control / Sisteme

- `Control` (overview) foloseste `ActionCluster` pentru handoff

## Actualizare 2026-03-16 - DenseListItem Scanare + Control

- `Scanare` (tab-uri) si `Control / Sisteme` (drift recent) folosesc `DenseListItem`

## Actualizare 2026-03-16 - ActionCluster Setari

- actiunile de baseline folosesc `ActionCluster`

## Actualizare 2026-03-16 - GuideCard Scanare + Asistent

- `GuideCard` adoptat pentru contextul canonic in `Scanare` si `Asistent`

## Actualizare 2026-03-16 - DenseListItem RecentScans + Alerts

- `RecentScansCard` si `AlertsList` folosesc `DenseListItem` pentru liste operationale

## Actualizare 2026-03-16 - DenseListItem LatestDocumentSection

- `LatestDocumentSection` foloseste `DenseListItem` pentru findings si task-uri recente

## Actualizare 2026-03-16 - Index sursa de adevar

- `references/source-of-truth.md` defineste explicit docurile canonice

## Actualizare 2026-03-16 - DenseListItem ScanVerdictsTab

- `ScanVerdictsTab` foloseste `DenseListItem` pentru YAML findings si sistemele din manifest

## Actualizare 2026-03-16 - Drift list + ActionCluster Scanare

- `ScanVerdictsTab` foloseste `DenseListItem` pentru drifturile din verdicts
- `ScanHistoryTab` foloseste `ActionCluster` pentru handoff spre Documente

## Actualizare 2026-03-16 - Overflow / wrapping pass

- `Floating Assistant`, `Logo` si `TaskCard` trateaza corect string-uri lungi

## Actualizare 2026-03-16 - Overflow + ActionCluster sweep

- wrapping extins pe `ScanDrawer`, `TextExtractDrawer`, `Reports support panels`, `e-Factura validator`
- `Audit si export` foloseste `ActionCluster` pentru toggle-ul de detalii

## Actualizare 2026-03-16 - Control lists + Scanare toggle

- `Control / Sisteme` foloseste `DenseListItem` pentru inventarul confirmat recent
- `ScanVerdictsTab` foloseste `ActionCluster` pentru toggle-ul de detalii

## Actualizare 2026-03-16 - Dashboard action authority

- `Dashboard` foloseste acum un singur bloc dominant de actiune (`NextBestAction`)
- duplicarile de CTA si handoff concurent au fost eliminate
- pagina ramane orientare, iar actiunea dominanta este clara fara concurenta vizuala

## Actualizare 2026-03-20 - Bridge IA noua peste EOS v1

- directia canonica este acum implementata explicit ca `IA noua + UX nou + skin EOS v1`
- contractul de rutare este centralizat in `lib/compliscan/dashboard-routes.ts`
- shell-ul foloseste vocabularul nou:
  - `Acasa`
  - `Scaneaza`
  - `De rezolvat`
  - `Rapoarte`
  - `Setari`
- rutele canonice exista deja ca suprafete publice in dashboard:
  - `/dashboard/scan`
  - `/dashboard/resolve`
  - `/dashboard/reports`
  - `/dashboard/settings`
  - `/dashboard/scan/results/[scanId]`
- `scan/results/[scanId]` este acum punctul canonic de handoff dupa analiza, fara sa mai trimita utilizatorul direct in `Documente`
- starea arhitecturala ramane intentionat hibrida:
  - shell-ul si handoff-urile primare urmeaza IA noua
  - suprafetele interne `scanari/checklists/rapoarte/setari` continua temporar ca aliasuri peste runtime-ul vechi
- urmatorul pas de arhitectura nu este un rewrite vizual, ci mutarea treptata a CTA-urilor si a suprafetelor interne pe paginile canonice

## Actualizare 2026-03-20 - BP-2: proprietate canonica pe Resolve + Reports + Scan

- `/dashboard/resolve` detine acum suprafata canonica prin `components/compliscan/resolve-page.tsx`
- `/dashboard/checklists` a ramas ruta de compatibilitate si consuma aceeasi suprafata partajata
- `/dashboard/reports` detine acum suprafata canonica prin `components/compliscan/reports-page.tsx`
- `/dashboard/rapoarte` a ramas ruta de compatibilitate si consuma aceeasi suprafata partajata
- `/dashboard/scan` detine acum suprafata canonica prin `components/compliscan/scan-page.tsx`
- `/dashboard/scanari` a ramas ruta de compatibilitate si consuma aceeasi suprafata partajata
- asta reduce riscul de drift intre ruta noua si ruta veche:
  - un singur owner de UI per suprafata
  - aliasul vechi nu mai cere mentenanta paralela
- pentru scanare, inclusiv subnavigarea locala si share linkul principal folosesc acum traseul canonic

## Actualizare 2026-03-20 - BP-3: familia canonica Settings

- `/dashboard/settings` detine acum suprafata canonica prin `components/compliscan/settings-page.tsx`
- `/dashboard/setari` a ramas ruta de compatibilitate si consuma aceeasi suprafata partajata
- a fost introdus si aliasul canonic pentru billing:
  - `/dashboard/settings/abonament`
  - `/dashboard/setari/abonament` ramane compatibilitate
- pentru zona administrativa, linkurile cu impact mare folosesc acum namespace-ul canonic:
  - Stripe return URLs
  - health-check operational
  - emailurile de notificare
- asta inchide ultimul top-level owner important ramas pe pagina veche si reduce ruptura dintre shell-ul nou si handoff-urile administrative

## Actualizare 2026-03-20 - BP-3: subfamilia canonica Reports

- `/dashboard/reports` nu mai este doar pagina principala; familia canonică include acum si:
  - `/dashboard/reports/vault`
  - `/dashboard/reports/policies`
  - `/dashboard/reports/audit-log`
  - `/dashboard/reports/trust-center`
- fiecare subpagina foloseste acum owner comun in `components/compliscan/*`, iar rutele vechi raman doar aliasuri
- `ReportsTabs` ofera subnavigatia locala ceruta de blueprint pentru output-uri
- asta reduce si mai mult ruptura dintre:
  - shell-ul nou `Rapoarte`
  - URL-urile vechi mostenite din `Dovada` si `Politici`

## Actualizare 2026-03-20 - BP-3: scan archive canonic

- `/dashboard/scan/history` este acum ruta canonica pentru arhiva document-first din `Scaneaza`
- `/dashboard/documente` a ramas doar ruta de compatibilitate si consuma aceeasi suprafata partajata
- `lib/compliscan/dashboard-routes.ts` separa acum explicit:
  - `documents` -> ruta canonica noua
  - `documentsLegacy` -> aliasul vechi
- asta reduce ruptura dintre:
  - `Scaneaza` ca namespace canonic
  - vechiul handoff direct catre `/dashboard/documente`
- pagina de rezultat si subnavigarea locala folosesc acum acelasi vocabular canonic: `Istoric`

## Actualizare 2026-03-20 - BP-4: action authority pe Acasa

- `/dashboard` foloseste acum un singur bloc dominant de actiune prin `NextBestAction`
- vechiul panou `Top urgente` a fost absorbit; `Acasa` nu mai are doua centre vizuale concurente pentru actiune
- onboarding-ul de progres operational nu mai sta pe `Acasa`; el a fost mutat in `Setari`, unde apartine contextului administrativ
- `Acasa` nu mai tine si suprafete de lucru secundare:
  - `DriftCommandCenter`
  - `Snapshot & Activitate recenta`
- arhitectural, asta muta pagina mai aproape de blueprint:
  - `stare + urgenta curenta`
  - apoi `health/readiness`
  - fara feed operational concurent
- in plus, `Framework Readiness` a ramas strict informativ pe `Acasa`; handoff-urile catre alte zone nu mai sunt atașate fiecarui card
- pentru `Generator`, schimbarea curenta este de pozitionare UX, nu de arhitectura:
  - ruta ramane aceeasi
  - suprafața nu mai este branduita ca produs paralel in copy-ul principal

## Actualizare 2026-03-21 - Scan Rezultate suprafata nativa

- `/dashboard/scan/results/[scanId]` este acum suprafata nativa completa, nu bridge peste `ScanVerdictsTab`
- success banner cand analiza este finalizata
- finding-urile sunt grupate pe severitate: Critice / Ridicate / Medii / Informative
- fiecare grup este colapsibil, critical+high deschise by default
- fiecare finding row: `SeverityBadge` + titlu + framework badge + varsta + review state
- `Resolution Layer` inline la expandare finding (7 pasi din `FindingResolution`)
- CTA primar: `Adauga toate in queue` -> `/dashboard/resolve`
- actiune: `Scaneaza din nou` (nu navigare inapoi)
- `HandoffCard` explica separarea verdict vs executie

## Actualizare 2026-03-21 - De rezolvat suprafata nativa cu finding queue

- `/dashboard/resolve` are acum finding queue nativ deasupra `RemediationBoard`
- filter tabs pe framework: `Toate | GDPR | NIS2 | AI Act | Furnizori` (per blueprint §3.4)
- finding-urile sunt sortate critical-first in cadrul fiecarui filtru
- fiecare finding row este expandabil cu `Resolution Layer` inline (7 pasi)
- review state badges: `Detectat` / `In remediere`
- `RemediationBoard` ramane mai jos pentru executia task-urilor existente
- page header actualizat cu badge-uri de severitate per blueprint
- `PillarTabs` ramane ca punte spre suprafetele de dovada existente
