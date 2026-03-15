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
