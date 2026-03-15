# CompliScan - Sprinturi de maturizare

Data pornire: 2026-03-13

## Misiune

Nu mai deschidem fire paralele de feature work.

Scopul acestor sprinturi este sa ducem CompliScan din:

- MVP avansat

in:

- produs pilot-ready serios
- platforma mai defensibila
- fundatie software matura pentru iteratiile comerciale urmatoare

## Reguli pentru aceasta sesiune de sprinturi

1. Nu adaugam module noi daca nu cresc direct:
   - increderea
   - acuratetea
   - securitatea
   - testabilitatea
2. Totul se judeca prin:
   - `sursa -> verdict -> remediere -> dovada -> audit`
3. Inchidem mai intai ce este fals matur:
   - UI care pare enterprise, dar are fundatie inca de MVP
4. Ideile extrase din `feedback.md` se filtreaza prin:
   - `public/backlog-din-feedback.md`
   - nu se trag direct in sprintul activ fara sa fie mutate explicit in backlog-ul de maturizare
5. Riscurile existențiale se urmăresc explicit în:
   - `public/risk-register-brutal.md`
   - `public/risk-register-operational.md`
6. Nu schimbăm framing-ul corect deja stabilit:
   - aplicația oferă suport și structură
   - omul validează

## Sprint 1 - Reliability + Security baseline

Status: `done`

### Obiectiv

Ridicam fundatia minima de siguranta si predictibilitate pentru fluxurile critice.

### Task-uri

- validare stricta pe request-urile critice:
  - auth
  - scan
  - repo sync
  - evidence upload
  - drift actions
- standardizare coduri de eroare si raspunsuri API
- allowlist pentru fisiere de dovada:
  - extensii
  - MIME
  - size
- verificare mai stricta pentru upload:
  - respinge tipuri suspecte
  - respinge fisiere fara extensie valida
- inchidere fallback-uri periculoase pentru productie:
  - session secret obligatoriu
  - blocare mai clara pentru reset / sync in productie
- cleanup operational:
  - scoatere `.DS_Store`
  - curatare urme demo unde inca polueaza produsul

### Definition of done

- endpoint-urile critice au validare consistenta
- evidenta nu mai accepta orice tip de fisier
- fallback-urile slabe sunt eliminate sau marcate explicit ca development-only

### Progres curent

- auth hardening pornit
- evidence upload hardening pornit si trecut pe validare de extensie + MIME
- `scan`, `repo sync` si `drift actions` au acum validare structurala mai stricta
- raspunsurile de eroare sunt mai coerente pe endpoint-urile critice atinse
- etichetele de runtime nu mai imping produsul inutil in zona de `demo`
- logul de executie este tinut in `public/log-sprinturi-maturizare.md`
- `.DS_Store` a fost curatat din workspace
- `org context` se leaga acum de sesiunea autentificata cand exista

## Sprint 2 - Test harness pentru fluxurile critice

Status: `done`

### Obiectiv

Oprim regresiile si facem refactorurile urmatoare sigure.

### Task-uri

- alegem runner-ul de test (`vitest` sau echivalent)
- unit tests pentru:
  - rule library
  - drift policy
  - drift lifecycle
  - task validation
- integration tests pentru:
  - `POST /api/scan/extract`
  - `POST /api/scan`
  - `POST /api/integrations/repo-sync`
  - `POST /api/state/baseline`
  - `POST /api/tasks/[id]/evidence`
  - exporturile cheie
- fixtures oficiale pentru:
  - documente text
  - PDF OCR
  - manifests
  - `compliscan.yaml`
- smoke e2e pe:
  - login
  - scan document
  - confirm system
  - export audit

### Definition of done

- avem o suita minima care ruleaza local
- putem schimba motorul fara sa mergem orbeste

### Progres curent

- `vitest` este instalat si configurat
- exista primele teste unitare pentru validare request, scan workflow, repo sync si drift lifecycle
- exista primele route tests pentru drift actions si scan analyze
- exista route tests si pentru:
  - `repo-sync`
  - `auth/login`
  - `auth/register`
  - `auth/me`
  - `repo-sync/github`
  - `repo-sync/gitlab`
  - `state/baseline`
  - `scan/extract`
- exista fixtures oficiale in `tests/fixtures` pentru:
  - document text
  - manifest `package.json`
  - `compliscan.yaml`
- exista fixtures OCR in `tests/fixtures` pentru:
  - PDF base64 minimal
  - imagine base64 minimală
- exista fixtures `expected findings` pentru:
  - document tracking
  - `compliscan.yaml`
- exista teste bazate pe fixtures pentru parser YAML si manifest autodiscovery
- exista primul test de integrare reala pentru `repo-sync-executor` peste fixtures reale
- exista test de integrare reala si pentru fluxul document-first:
  - `createExtractedScan`
  - `analyzeExtractedScan`
- exista teste de fallback OCR pentru:
  - `pdfBase64`
  - `imageBase64`
- exista teste de stabilitate pe semnalele-cheie pentru:
  - `simulateFindings`
  - `manifest autodiscovery`
- exista route tests si pentru exporturile cheie:
  - `audit-pack`
  - `compliscan export`
- exista route tests si pentru `evidence upload`
- exista route tests si pentru `scan`
- exista smoke flow minim pentru:
  - `login -> session -> scan -> export -> logout`
- exista unit tests si pentru:
  - `drift-policy`
  - `task-validation`
- exista fixture manifest suplimentar pentru:
  - `requirements.txt`
- exista route test si pentru:
  - confirmarea unei detectii AI in inventarul oficial
- `npm test` ruleaza si trece
- `npm run lint` trece dupa adaugarea testelor
- suita curenta are:
  - `27` fisiere de test
  - `85` teste verzi

Verdict:

- Sprint 2 este inchis operational.
- Avem acum o suita minima suficienta pentru a intra in Sprint 3 fara sa schimbam motorul orbeste.

## Sprint 3 - Analysis engine hardening

Status: `closed operationally`

### Obiectiv

Mutam verdictul din zona "util, dar euristic" spre "mai defensibil".

### Task-uri

- [x] separare explicita intre:
  - semnal detectat
  - inferenta
  - verdict
- [x] confidence model si pentru findings, nu doar pentru pack fields
- [~] reducere dependenta de `simulateFindings(...)` ca punct unic de verdict
- [~] fixtures cu documente reale si expected findings
- [~] validare mai buna pentru `Mark as fixed & rescan`
- [~] explicatie mai clara in UI cand un verdict este inferat, nu confirmat

### Definition of done

- verdictul este mai explicabil
- confidence-ul este vizibil si coerent
- rescan-ul nu mai pare "magic"

### Progres curent

- exista acum un strat separat de detectie in `lib/compliance/signal-detection.ts`
- `simulateFindings(...)` consuma semnalele detectate si nu mai face direct toata logica intr-un singur pas
- provenance-ul finding-urilor retine acum:
  - sursa semnalului (`keyword` / `manifest`)
  - baza verdictului (`direct_signal` / `inferred_signal`)
  - increderea semnalului (`high` / `medium`)
- finding-urile retin acum si:
  - `verdictConfidence`
  - `verdictConfidenceReason`
- task-urile validate prin rescan retin acum si:
  - `validationConfidence`
  - `validationBasis`
- mesajele de validare spun mai clar daca verdictul s-a bazat pe:
  - semnal direct
  - semnal inferat
  - stare operationala
- UI-ul afiseaza acum aceste informatii in:
  - `Remediere / TaskCard`
  - `Auditor Vault / Validation ledger`
  - `Scanari / Ultimul document analizat`
  - `Scanari / Findings generate din YAML`
- mesajele de rescan au acum prefix clar pe outcome:
  - `Confirmare puternica`
  - `Confirmare partiala`
  - `Confirmare operationala`
  - respectiv variante dedicate pentru `failed` si `needs_review`
- task-urile de finding folosesc acum un ID normalizat, cu compatibilitate pastrata pentru cheile vechi din `taskState`
- exista teste dedicate pentru:
  - keyword match direct
  - manifest match inferat
  - propagarea provenance-ului nou in finding-uri
  - confidence-ul si reason-ul finding-urilor
  - mesajele de rescan pentru semnal direct si semnal inferat
- fixtures `expected findings` acopera acum:
  - tracking
  - `compliscan.yaml`
  - high-risk scoring
  - data residency / transfer
- suita curenta are:
  - `32` fisiere de test
  - `108` teste verzi
- `Agent Evidence OS v1` a fost implementat ca strat de interfață pentru analiză:
  - permite utilizatorului să ruleze o analiză "agentic" (mai lentă, dar explicativă)
  - separă clar propunerile (Draft) de starea reală (Commit)
  - crește defensibilitatea prin `Drift Agent` care explică "de ce" s-a schimbat severitatea
  - `Evidence Agent` mapează dinamic lipsurile pe categoriile legale (Annex IV, GDPR)

## Sprint 4 - Auth, roles, org model

Status: `done operational`

### Obiectiv

Facem produsul utilizabil de mai mult de un singur owner local.

### Task-uri

- [x] separare locala explicita intre:
  - user
  - organizatie
  - membership
- [~] model minim de roluri:
  - owner
  - compliance
  - reviewer
  - viewer
- [~] restrictii de actiuni:
  - export
  - waive drift
  - validate evidence
  - reset state
- [~] audit trail mai clar pentru actiuni sensibile
- [~] administrare explicita membri / roluri in UI si API

### Definition of done

- exista control real pe actiuni
- relatia user -> org este explicita si persistata separat
- sesiunile si datele legacy se normalizeaza fara sa rupa workspace-urile deja create

### Progres curent

- modelul de auth cunoaste acum roluri explicite:
  - `owner`
  - `compliance`
  - `reviewer`
  - `viewer`
- utilizatorii legacy si sesiunile legacy sunt normalizate cu fallback sigur la `owner`, ca sa nu rupem workspace-urile locale existente
- modelul local de auth este separat acum in fisiere dedicate:
  - `.data/users.json`
  - `.data/orgs.json`
  - `.data/memberships.json`
- relatia user -> org nu mai este doar implicita in `users.json`
- payload-ul de sesiune contine acum:
  - `role`
  - `membershipId`
- endpoint-urile de auth expun acum si `role` in raspuns:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `GET /api/auth/me`
- `GET /api/auth/me` expune acum si `membershipId`
- exista acum API minim pentru membri si roluri:
  - `GET /api/auth/members`
  - `PATCH /api/auth/members/[membershipId]`
- exista acum si API minim pentru multi-org:
  - `GET /api/auth/memberships`
  - `POST /api/auth/switch-org`
- `Setari` afiseaza acum lista membrilor organizatiei si permite owner-ului sa schimbe rolurile
- utilizatorul autentificat este marcat explicit in lista, iar rolul propriu nu poate fi schimbat din UI
- backend-ul protejeaza acum si ultimul `owner` activ:
  - ultimul owner nu poate fi retrogradat la alt rol
- schimbarea rolurilor este trecuta acum si in audit trail
- `DashboardShell` afiseaza acum organizatiile active din care face parte utilizatorul si permite schimbarea organizatiei active
- au fost introduse guard-uri minime de rol pentru actiuni sensibile:
  - exporturi:
    - `GET /api/exports/compliscan`
    - `GET /api/exports/audit-pack`
    - `GET /api/exports/audit-pack/client`
    - `GET /api/exports/audit-pack/bundle`
    - `GET /api/exports/annex-lite/client`
  - drift lifecycle:
    - `waive` doar pentru `owner` / `compliance`
    - restul tranzitiilor pentru `owner` / `compliance` / `reviewer`
  - task-uri de remediere:
    - `PATCH /api/tasks/[id]` pentru `owner` / `compliance` / `reviewer`
    - `POST /api/tasks/[id]/evidence` pentru `owner` / `compliance` / `reviewer`
  - control state:
    - `POST /api/state/baseline` pentru `owner` / `compliance`
    - `POST /api/state/drift-settings` pentru `owner` / `compliance`
    - `POST /api/state/reset` doar pentru `owner`
- erorile de autorizare sunt mapate controlat prin `AuthzError` + coduri consistente
- evenimentele sensibile retin acum actorul real cand exista sesiune:
  - `actorId`
  - `actorLabel`
  - `actorRole`
  - `actorSource`
- actorul real este propagat acum in audit/event log pentru actiuni umane cheie:
  - drift lifecycle
  - task update + rescan
  - evidence upload
  - baseline set / clear
  - reset state
  - traceability review
  - family evidence reuse
  - AI system create / confirm / review / edit / reject
  - AI Compliance Pack field overrides
  - scan create / analyze
  - e-Factura validate / sync
  - alert resolve
- evenimentele automate de drift generate din snapshot sunt marcate explicit cu actor de tip `system`
- `Auditor Vault` si activitatea recenta afiseaza acum actorul pentru evenimentele care il au
- au fost adaugate teste dedicate pentru:
  - register cu persistenta separata pe `users / orgs / memberships`
  - migrare compatibila din `users.json` legacy
  - rezolvare membership din structura noua
  - token legacy fara `role`
  - `requireRole` pentru deny path real
- keepalive-ul Supabase este acum operational prin Storage:
  - bucket `compliscan-heartbeat`
  - obiect `cron/last-ping.txt`
  - endpoint `GET/POST /api/integrations/supabase/keepalive`
  - cheie dedicata sau fallback la `COMPLISCAN_RESET_KEY`
- a fost confirmat si un gap real pentru Sprint 5:
  - schema `compliscan` nu este expusa in PostgREST
  - persistența `app_state` ramane deci partial blocata pe cloud
  - keepalive-ul rezolva activitatea proiectului, nu storage maturity complet
- test harness-ul a fost extins pentru Sprint 4:
- test harness-ul a fost extins pentru Sprint 4:
  - teste actualizate pentru `auth/login`, `auth/register`, `auth/me`
  - route tests actualizate pentru export, drift, evidence si baseline
  - route tests noi pentru:
    - `PATCH /api/tasks/[id]`
    - `POST /api/state/reset`
    - `POST /api/state/drift-settings`
    - `GET /api/auth/members`
    - `PATCH /api/auth/members/[membershipId]`
    - `GET /api/auth/memberships`
    - `POST /api/auth/switch-org`
    - `GET/POST /api/integrations/supabase/keepalive`
- in timpul build-ului a fost prins si reparat un bug de tip ramas din Sprint 3:
  - `FindingProvenance` era apelat incomplet din `engine.ts`
  - dupa corectie, `test`, `lint` si `build` trec impreuna
- suita curenta dupa pornirea Sprintului 4 are:
  - `38` fisiere de test
  - `130` teste verzi

Verdict:

- Sprint 4 este inchis operational.
- Fluxul de invitare membri poate ramane backlog ulterior, dar nu mai blocheaza fundatia de auth / roles / org model.

## Sprint 5 - Persistence si storage maturity

Status: `in progress`

### Obiectiv

Starea si dovezile trebuie sa stea pe o fundatie mai solida.

### Task-uri

- schema de date curata si stabila
- poveste clara de migratii
- clarificare: Supabase devine store principal, nu fallback optional vag
- migrare identitate spre `Supabase Auth`
- tabele explicite pentru:
  - `organizations`
  - `memberships`
  - eventual `profiles`
- schema `compliscan` expusa corect pentru REST sau mutare controlata in `public`
- storage controlat pentru dovezi
- bucket privat pentru evidence
- signed URLs sau stream controlat pentru acces la dovadă
- RLS minim pe datele multi-org
- acces controlat la fisiere
- backup / restore minim si flux de reset mai sigur

### Definition of done

- starea nu mai depinde de fallback-uri locale pentru functionarea serioasa
- dovezile sunt tratate ca artefacte controlate, nu ca fisiere publice brute
- identitatea reală nu mai depinde de `.data/users.json`
- organizatiile sunt izolate prin control de acces la nivel de date, nu doar prin UI

### Progres curent

- dovezile noi nu mai sunt gandite ca fisiere publice directe:
  - upload-ul scrie acum in storage privat local (`.data/evidence-uploads`)
  - accesul se face prin route controlat:
    - `GET /api/tasks/[id]/evidence/[evidenceId]`
- `TaskEvidenceAttachment` retine acum si:
  - `storageProvider`
  - `storageKey`
  - `accessPath`
- UI-ul operational si de audit prefera acum `accessPath`, cu fallback compatibil pe `publicPath`
- `Audit Pack bundle` copiaza acum dovezile din storage-ul real, nu doar din `public/`
- exista route test pentru deschiderea controlata a dovezii
- a fost adaugata schema tinta pentru Supabase:
  - `supabase/sprint5-foundation.sql`
- a fost adaugat si documentul executabil pentru acest sprint:
  - `public/sprint-5-supabase-foundation.md`
- identitatea poate fi acum mutata incremental spre `Supabase Auth`:
  - exista backend comutabil:
    - `local`
    - `supabase`
    - `hybrid`
  - login-ul poate autentifica prin `Supabase Auth`
  - register-ul poate crea identitatea in `Supabase Auth`
  - dupa autentificare, userul poate fi legat la identitatea externa dupa email
  - membership-urile si organizatiile raman inca locale pana la mutarea lor in DB
- organizations si memberships pot fi acum oglindite incremental in Supabase:
  - exista backend de date comutabil:
    - `local`
    - `supabase`
    - `hybrid`
  - la `register`, `link identity` si `role update`, organizatiile / profile-urile / membership-urile pot fi sincronizate in DB
  - schema SQL de Sprint 5 foloseste acum `org_id` textual, compatibil cu modelul curent al aplicatiei
  - in backend `supabase`, tenancy-ul este citit acum din DB ca sursa primara pentru:
    - `organizations`
    - `memberships`
    - `profiles`
  - in backend `supabase`, operatiile sensibile de tenancy sunt tratate cloud-first:
    - `register`
    - `link identity`
    - `role update`
  - daca sincronizarea cloud esueaza in backend `supabase`, operatia este blocata explicit
- `org_state` are acum helper dedicat pentru cloud state:
  - `lib/server/supabase-org-state.ts`
  - citire din `public.org_state` cand backend-ul de date este `supabase`
  - oglindire in `public.org_state` cand backend-ul de date este `supabase` sau `hybrid`
  - daca nu exista inca snapshot in `public.org_state`, starea initiala este creata direct acolo
- `mvp-store` respecta acum semantica noua de backend:
  - `local`:
    - local-first
  - `hybrid`:
    - local-first
    - mirror in cloud pentru `org_state`
  - `supabase`:
    - cloud-first pe `public.org_state`
    - initializare automata in `public.org_state` daca snapshot-ul lipseste
    - fallback final pe disk doar daca storage-ul cloud nu este disponibil
- `compliscan.app_state` ramane fallback legacy pentru modurile vechi, nu pentru traseul principal `supabase`
- accesul la dovezile cloud are acum doua semantici clare:
  - stream server-side prin route controlat
  - redirect securizat catre URL semnat cand se cere explicit `delivery=redirect`
- `GET /api/tasks/[id]/evidence/[evidenceId]?download=1` forteaza download explicit
- TTL-ul redirect-ului semnat este controlat prin `COMPLISCAN_EVIDENCE_SIGNED_URL_TTL_SECONDS`
- fundatia RLS din `supabase/sprint5-foundation.sql` este acum mai robusta:
  - helper-ele de membership lookup sunt `SECURITY DEFINER`
  - este evitata recursia RLS pe `memberships`
  - politicile acopera `insert/update/delete` pe:
    - `org_state`
    - `evidence_objects`
    - `storage.objects`
- metadata-ul dovezilor poate fi acum sincronizat in `public.evidence_objects`:
  - sincronizarea foloseste `attachment_id` ca cheie stabila de upsert
  - in backend `supabase`, upload-ul esueaza explicit daca metadata-ul nu poate fi sincronizat
- `public.evidence_objects` este acum si consumat ca registru operational:
  - route-ul de citire a dovezii poate hidrata metadata din cloud inainte de stream sau redirect semnat
  - route-ul poate face acum si lookup sigur pe `org_id + task_id + attachment_id` cand metadata locala lipseste
  - `Audit Pack` bundle foloseste acelasi registru pe traseul de copiere
- `DashboardPayload` hidrateaza acum `taskState.attachedEvidenceMeta` din `public.evidence_objects`:
  - UI-ul si exporturile server-side care pornesc din payload vad metadata de evidence actualizata din DB
- traseele specializate de traceability folosesc acum mai clar registrul cloud:
  - `family-evidence` reutilizeaza dovada din `payload.state`, nu doar din state local brut
  - asta reduce riscul ca reuse-ul sa copieze metadata invechita cand registrul cloud are forma operationala corecta
- exista acum si verificare operationala interna pentru Supabase:
  - helper nou:
    - `lib/server/supabase-status.ts`
  - endpoint nou:
    - `GET /api/integrations/supabase/status`
  - pagina `Setari` afiseaza acum:
    - backend auth
    - backend data
    - configurarea REST / Storage
    - starea tabelelor critice pentru Sprint 5
    - starea bucket-ului privat pentru evidence
    - politica de fallback local (`permis` / `blocat`)
    - blocajele reale pentru inchiderea Sprint 5
  - exista si runbook de verificare manuala:
    - `public/supabase-rls-verification-runbook.md`
  - exista si verificare live explicita pentru proiectul Supabase real:
    - script:
      - `npm run verify:supabase:sprint5`
    - raport curent:
      - `public/supabase-live-verification-2026-03-13.md`
- graful de tenancy poate fi acum seed-uit controlat in backend `supabase`:
  - daca `organizations / profiles / memberships` nu exista in cloud, aplicatia le poate impinge din local
  - dupa seed, citirea revine pe cloud-first
- shell-ul dashboard si sumarul de sesiune folosesc acum membership-ul curent ca refresh:
  - `auth/me`
  - `auth/summary`
  - `app/dashboard/layout.tsx`
  - asta reduce riscul de rol sau org stale dupa schimbari de membership in backend
- suita curenta dupa verificarea operationala Supabase este acum la:
  - `54` fisiere de test
  - `186` teste verzi
- verificarea RLS live trece acum:
  - script:
    - `npm run verify:supabase:rls`
  - confirma:
    - izolare corecta pentru `organizations`
    - izolare corecta pentru `memberships`
    - citire izolata pentru `org_state`
    - citire izolata pentru `evidence_objects`
    - `viewer` nu poate modifica `org_state`
  - observatie:
    - pentru un update blocat de RLS, PostgREST poate intoarce `200` cu `[]`
    - scriptul trateaza acum corect cazul

Verdict final Sprint 5:

- fundatia cloud-first pentru:
  - identitate
  - tenancy
  - org state
  - evidence
  este acum suficient de matura pentru piloturi reale
- Sprint 5 poate fi considerat `inchis operational`

Verdict curent:

- Sprint 5 a fost inchis operational si are:
  - auth extern incremental
  - mirror tenancy in DB
  - evidence private path
  - org state cloud path
- ce ramane dupa inchidere este backlog de rafinare:
  - observabilitate operationala mai adanca
  - curatarea treptata a fallback-urilor legacy strict pentru development
  - extinderea verificarilor cloud in sprinturile urmatoare

## Sprint 6 - Audit defensibility

Status: `in progress`

### Obiectiv

Ridicam pachetul de audit din "bun pentru demo si review" in "bun pentru pilot serios".

### Task-uri

- evidence quality checks
- marcarea clara a gap-urilor de dovada
- unificare mai stricta intre:
  - finding
  - drift
  - task
  - evidence
  - law coverage
- exporturi mai stricte si mai verificabile
- validare pe bundle / family reuse cu reguli mai defensive
- fixtures reale pentru cazurile cu risc de verdict fals
- clarificare si mai stricta a diferentei dintre:
  - `semnal`
  - `inferenta`
  - `verdict`
  - `confirmare umana`

### Definition of done

- Audit Pack este mai greu de contestat
- dovezile sunt mai bine explicate si mai bine controlate

### Progres curent

- exista acum o specificatie explicita pentru calitatea dovezilor:
  - `public/evidence-quality-spec.md`
- exista acum si document dedicat pentru quality gates:
  - `public/sprint-6-audit-quality-gates.md`
- dovezile incarcate primesc acum o evaluare minima de calitate:
  - `sufficient`
  - `weak`
- evaluarea de calitate este salvata in:
  - `TaskEvidenceAttachment`
  - `public.evidence_objects`
  - starea hidratata din dashboard
- `Task Card` afiseaza acum calitatea dovezii si rezumatul ei, nu doar prezenta fisierului
- `Audit Pack` retine acum:
  - `auditQualityDecision`
  - `blockedQualityGates`
  - `reviewQualityGates`
  - lista completa `auditQualityGates`
- `controlsMatrix` si `evidenceLedger` includ acum si `evidenceQuality`
- quality gates active acum:
  - `missing_evidence`
  - `pending_validation`
  - `weak_evidence`
  - `stale_evidence`
  - `unresolved_drift`
  - `inferred_only_finding`
- `family reuse` este acum mai defensiv:
  - reuse-ul este blocat daca dovada sursa este `weak`
  - reuse-ul este blocat daca sursa a fost validata doar pe `inferred_signal`
  - reuse-ul este blocat pentru target-uri cu drift-uri deschise
- fixtures reale pentru verdicturi grele acopera acum:
  - document high-risk de recrutare cu scoring, lipsa review uman, date personale, retentie si transfer
  - `compliscan.yaml` high-risk cu scoring, `human_oversight.required=false`, `personal_data_processed=true` si `us-east-1`
- testele de stabilitate pe `expected findings` si `manifest autodiscovery` includ acum si aceste cazuri grele
- `Audit Pack` are acum si test fixture-driven pentru pachet high-risk fara dovezi atasate
- `auditReadiness` nu mai poate iesi `audit_ready` daca quality gates nu sunt pe `pass`
- `traceability` trateaza acum mai strict dovada la nivel de control:
  - un control cu `validationStatus=passed`, dar dovada `weak`, nu mai apare ca `validated`
  - `bundleCoverageStatus` cade la `partial` cand dovada exista, dar calitatea ei ramane slaba
  - `nextStep` prefera sumarul de calitate al dovezii cand acesta blocheaza controlul
- `traceability review` blocheaza acum explicit confirmarea pentru audit daca:
  - controlul nu este `validated`
  - dovada este slaba
  - validarea este inca nefinalizata
- `traceability` retine acum si verdict de audit explicit la nivel de control:
  - `auditDecision`
  - `auditGateCodes`
- confirmarea din `Auditor Vault` urmareste acum `auditDecision = pass`, nu doar `traceStatus = validated`
- `Auditor Vault` dezactiveaza acum butoanele de confirmare pentru:
  - control individual
  - familie
  - articol legal
  cand grupul contine controale nevalidate
- `Auditor Vault` afiseaza acum si:
  - status de audit per control (`gata pentru audit` / `review necesar` / `blocat`)
  - `gates active` pe control, pentru motivele concrete de review / blocare
- sumarul pe familie trateaza drept reutilizabila doar dovada provenita din controale deja `validated`
- `Auditor Vault` si exportul client-facing afiseaza acum si:
  - calitatea dovezii
  - baza validarii
  - increderea validarii, unde exista
- `Audit Pack` client-facing afiseaza acum explicit pe fiecare control:
  - decizia de audit (`gata pentru audit` / `review necesar` / `blocat`)
  - motivele sintetizate din `auditGateCodes`
- `Audit Pack` client-facing afiseaza acum aceeasi logica si in `traceability matrix`:
  - verdictul de audit
  - `gates active`
- exista teste noi pentru:
  - heuristica de `evidence quality`
  - `audit quality gates`
  - propagarea calitatii dovezii prin upload si registrul cloud
  - `compliance trace` pentru cazurile:
    - dovada slaba + passed => `action_required`
    - dovada suficienta + passed => `validated`
    - passed + drift deschis => `auditDecision=blocked`
  - `POST /api/traceability/review` pentru:
    - blocaj pe `weak evidence`
    - blocaj pe `needs_review`
    - blocaj pe familie cu controale nevalidate
    - confirmare permisa doar pentru controale validate
- a fost adaugata si trierea rapoartelor Gemini:
  - `public/triere-rapoarte-gemini.md`
- validarea completa este din nou verde:
  - `npm test`
  - `npm run lint`
  - `npm run build`
- suita curenta are:
  - `60` fisiere de test
  - `213` teste verzi
- reevaluarea stricta post-`Sprint 6` este acum actualizata in:
  - `public/raport-maturitate-compliscan.md`
  Verdictul curent este:
  - `~79%` maturitate de produs pilot-ready cu ghidaj uman
  - `~64%` maturitate de platforma software serioasa
  - `~61%` maturitate de motor de compliance / audit defensibil

## Sprint 7 - Operational readiness

Status: `done`

### Obiectiv

Punem produsul pe picioare ca sistem software responsabil.

### Task-uri

- health checks si observabilitate minima
- logging operational minim cu `requestId`
- timeouts si retry discipline pentru integrari
- document de release readiness
- checklist de pilot onboarding

### Definition of done

- produsul poate fi operat mai linistit
- riscurile tehnice curente sunt mai bine vazute si gestionate

### Progres curent

- exista acum helper de health unificat:
  - `lib/server/app-health.ts`
- exista endpoint operational:
  - `GET /api/health`
  - cere sesiune activa, nu mai expune public diagnosticul complet
- `Setari` afiseaza acum:
  - `Status operational Supabase`
  - `Health check aplicatie`
  - lista de membri si roluri
- `Setari` afiseaza acum si:
  - card dedicat de `Release readiness`
  - gate vizual cand starea este `blocked`
  - verdict de release readiness este vizibil si actionabil
- exista documentele de readiness:
  - `public/release-readiness-checklist.md`
  - `public/pilot-onboarding-checklist.md`
  - `public/incident-runbook-minim.md`
- exista helper comun pentru fetch operational:
  - `lib/server/http-client.ts`
- Vision, Supabase REST, Supabase Storage si Supabase Auth folosesc acum timeout + retry minim controlat
- exista verdict agregat de release readiness:
  - `lib/server/release-readiness.ts`
  - `GET /api/release-readiness`
  - include si marker-ul ultimei verificari RLS locale
- exista preflight local complet pentru release:
  - `scripts/preflight-release.mjs`
  - `npm run preflight:release`
  - ruleaza acum si `npm run verify:supabase:rls`
- exista acum si logging operational minim:
  - `lib/server/request-context.ts`
  - `lib/server/operational-logger.ts`
  - `x-request-id` pe rutele critice
  - `requestId` in payload-urile JSON de eroare
  - warning-uri operationale pentru retry-urile din `lib/server/http-client.ts`
- checkpoint separat:
  - auditul dedicat pe firul `Evidence OS UI` este facut
  - `Setari` nu mai cere `release readiness` pentru roluri fara acces

## Ordinea corecta

Ordinea nu trebuie schimbata mult:

1. Sprint 1 - Reliability + Security baseline
2. Sprint 2 - Test harness
3. Sprint 3 - Analysis engine hardening
4. Sprint 4 - Auth, roles, org model
5. Sprint 5 - Persistence si storage maturity
6. Sprint 6 - Audit defensibility
7. Sprint 7 - Operational readiness

Motivul:

- fara Sprint 1 si 2, restul se construieste pe nisip
- fara Sprint 3, produsul pare mai sigur decat este
- fara Sprint 4 si 5, produsul nu poate fi numit matur ca platforma

## Ce inseamna "produs cu barba"

Vom spune ca produsul a intrat intr-o zona serioasa cand sunt adevarate simultan urmatoarele:

- testele critice ruleaza si tin regresiile jos
- auth si org access nu mai sunt locale si minimale
- evidence upload este hardenuit
- store-ul principal este clar si stabil
- findings / drift / rescan au un confidence model mai defensibil
- Audit Pack este sustinut de dovezi si controale mai solide

## Sprintul activ acum

Lucram in:

### Sprint 7 - Operational readiness

Acesta este sprintul corect acum, pentru ca:

- Sprint 4, 5 si 6 au ridicat deja fundatia de auth, cloud si defensibilitate de audit
- urmatorul risc real nu mai este doar "daca merge", ci "cat de linistit se poate opera"
- avem nevoie de health, readiness, onboarding si incident discipline inainte de un polish mare

## Front post Sprint 7 in curs

Dupa inchiderea operationala a Sprintului 7, frontul sanatos activ este:

- convergenta UX / UI / functionalitate prin `Evidence OS` ca page system

Aplicat deja:

- `Dashboard` ca orientare
- `Scanare` ca poarta de intrare
- `Control` ca workspace de confirmare
- `Dovada` separata explicit intre executie, ledger si livrabil
- `Setari` ca suprafata de administrare operationala

Doctrina canonica folosita acum ca sursa de adevar:

- `Progressive Disclosure`
- `Trust Through Transparency`
- `Role-Aware Surfaces`
- `Tab-based sub-navigation`
- `Summary / Detail / Action separation`
- `One dominant page intent`

Scopul nu este sa adaugam feature-uri noi.

Scopul este sa inchidem produsul pe claritate si convergenta.

Actualizare 2026-03-15:

- frontul post Sprint 7 a inchis si cleanup-ul structural pentru store-ul central de cockpit
- asta inseamna ca:
  - `Evidence OS` domina deja pagina si compozitia suprafetelor mari
  - `use-cockpit` nu mai are doua stiluri concurente de mutatii
  - riscul principal ramas nu mai este de arhitectura de baza, ci de polish final si performanta

Verdict de etapa:

- Sprinturile 1-7 raman inchise operational
- frontul activ valid ramane:
  - convergenta UX / UI / functionalitate
  - hardening operational incremental

Actualizare suplimentara 2026-03-15:

- `Audit si export` a primit si component-level density pass, separat de shell:
  - export dominant mai clar
  - suport pentru audit mai compact
  - detaliul tehnic coborat sub disclosure
- pasul este sanatos pentru ca:
  - nu introduce logic nou
  - nu muta pagina spre executie
  - intareste rolul de `snapshot + livrabil`

Actualizare suplimentara 2026-03-15:

- `Setari` a primit primul pass de `page-shell austerity`
- asta inseamna:
  - mai putin framing
  - ton mai sobru
  - mai putin sentiment de mini-dashboard paralel
- ownership-ul ramas:
  - Codex principal = shell si compozitie de pagina
  - Codex 2 = densitate in componentele interne din `Setari`

Actualizare suplimentara 2026-03-15:

- `Setari` a primit si component-level austerity pass pe lot stacked
- asta inseamna:
  - verdictul operational urca mai sus
  - actiunea recomandata este mai clara
  - semnalele active sunt separate de detaliul tehnic
  - disclosure-ul local tine suportul tehnic jos, fara sa-l ascunda
- pasul este sanatos pentru ca:
  - nu schimba logic nou
  - nu schimba shell-ul de pagina
  - intareste rolul de suprafata administrativa sobra

Actualizare suplimentara 2026-03-15:

- `Control` a pornit cu `wave 1` la nivel de page shell
- asta inseamna:
  - mai putin framing doctrinar in overview
  - traseu mai clar spre `Sisteme`, `Drift` si `Setari`
  - mai putin spatiu ocupat de suportul didactic
- pasul este sanatos pentru ca:
  - nu schimba logic nou
  - nu muta `Control` spre executie
  - intareste rolul de workspace de confirmare

Actualizare suplimentara 2026-03-15:

- `Control` a primit si lotul component-level pentru `wave 1`
- asta inseamna:
  - `Discovery` arata mai clar:
    - ce e activ
    - ce cere validare
    - detaliul detectiei sub disclosure
  - `Inventar` e mai usor de triat:
    - semnalele operationale urca in badge-uri
    - `Urmatorii pasi` coboara sub disclosure
  - `Compliance Pack` tine sus:
    - snapshot
    - prefill status
    - confidence
    - next step
  - blocurile grele coboara sub disclosure:
    - source coverage
    - source signals
    - controls + bundle + trace
    - Annex IV lite
- pasul este sanatos pentru ca:
  - nu schimba logic nou
  - nu schimba shell-ul paginii
  - reduce densitatea fara sa piarda trasabilitatea

Actualizare suplimentara 2026-03-15:

- `Auditor Vault` a primit `wave 1` la nivel de page shell
- asta inseamna:
  - intro mai scurt
  - statusul de audit mai sus
  - mai putin ghidaj redundant
  - handoff mai clar intre:
    - ledger intern
    - executie
    - livrabil
- pasul este sanatos pentru ca:
  - nu schimba logic nou
  - nu schimba traceability sau export
  - intareste rolul de `ledger + trasabilitate`

Actualizare suplimentara 2026-03-15:

- `Checklists wave 1` este inchis si la nivel component-level
- asta inseamna:
  - filtre mai clare in board
  - CTA primar mai dominant in `TaskCard`
  - dovada si exportul nu mai concureaza cu executia
- pasul este sanatos pentru ca:
  - nu schimba logic nou
  - nu schimba shell-ul paginii
  - intareste rolul de `Remediere = executie`

Actualizare suplimentara 2026-03-15:

- `Auditor Vault` a primit si lotul component-level pentru `wave 1`
- asta inseamna:
  - verdictul ramane sus in carduri
  - metadata lunga coboara sub disclosure
  - driftul, validarea si timeline-ul raman scanabile
- pasul este sanatos pentru ca:
  - nu schimba logic nou
  - nu schimba shell-ul paginii
  - intareste regula `starea bate explicatia`

- `Dashboard` a primit si un al doilea pass scurt de austeritate pe home:
  - `Traseu rapid` mai scurt si mai dur
  - `Stare curenta` in loc de `Snapshot rapid`
  - CTA-uri scurtate la `Scanare` / `Control`
  - mai putin framing decorativ
- pasul este sanatos pentru ca:
  - nu schimba modelul de produs
  - nu muta home-ul spre executie
  - intareste rolul de orientare pura

Actualizare suplimentara 2026-03-15:

- `Dashboard cleanup suplimentar` este inchis
- asta inseamna:
  - `Unde continui` ridica pasul curent si il marcheaza explicit
  - `Stare curenta` trimite spre actiunea corecta pentru blocajul real
  - descrierea redundanta din `SummaryStrip` a fost eliminata
- pasul este sanatos pentru ca:
  - nu schimba logic nou
  - nu schimba modelul de produs
  - intareste rolul de `Dashboard = orientare pura`

Actualizare suplimentara 2026-03-15:

- `Checklists wave 2` a primit un signal pass scurt
- asta inseamna:
  - semnalul `P1` urca in snapshotul de executie
  - lipsa dovezii urca explicit ca blocaj operational
  - header-ul board-ului pierde count-urile mai putin actionabile
- pasul este sanatos pentru ca:
  - nu schimba logic nou
  - nu schimba wiring-ul taskurilor
  - intareste regula `executia bate framing-ul`

Actualizare suplimentara 2026-03-15:

- a fost facut un `doc governance pass` pentru `public/*.md`
- asta inseamna:
  - exista o singura harta de clasificare a documentelor
  - canonul si documentele active sunt separate explicit de audituri istorice si memo-uri interne
  - incarcam mai putin context inutil in sesiunile de implementare
- pasul este sanatos pentru ca:
  - nu schimba logic nou
  - nu schimba modelul de produs
  - reduce haosul operational si costul de context

Actualizare suplimentara 2026-03-15:

- `Scanare` a primit un micro-pass de shell
- asta inseamna:
  - selectorul sursei ramane sus, langa intrarea reala in lucru
  - ghidajul lung coboara dupa fluxul activ
  - sumarul spune direct unde continui dupa analiza:
    - `Control`
    - `Dovada`
- pasul este sanatos pentru ca:
  - nu schimba logic nou
  - nu schimba modelul de produs
  - intareste regula `executia bate framing-ul`

Actualizare suplimentara 2026-03-15:

- `Setari / Acces` poate administra acum membri existenti din workspace
- asta inseamna:
  - owner-ul poate adauga un utilizator deja existent in workspace in organizatia curenta
  - rolul este ales direct la intrare
  - fiecare adaugare intra in event log ca `auth.member-added`
- pasul este sanatos pentru ca:
  - nu schimba modelul de auth
  - nu promite invitatii externe complete
  - inchide administrarea minima peste workspace-ul local

Actualizare suplimentara 2026-03-15:

- exista acum un harness executabil pentru flow-ul principal de user nou
- asta inseamna:
  - kitul de test nu mai este doar documentatie
  - `npm run test:flow-kit` valideaza direct:
    - `Scanare`
    - state populat
    - `Dashboard payload`
    - `Remediere` derivata
- pasul este sanatos pentru ca:
  - nu schimba logic nou
  - nu depinde de browser sau sesiuni locale fragile
  - accelereaza auditul repetabil pe flow-ul canonic

Actualizare suplimentara 2026-03-15:

- traseul cloud pentru state este acum clarificat final:
  - `public.org_state` este singura cale cloud activa
  - `compliscan.app_state` ramane doar sursa legacy de migrare
- in backend `supabase`, daca `org_state` lipseste, legacy-ul este migrat in `org_state`
- runtime-ul curent nu mai scrie in `app_state`
- asta inchide ambiguitatea ramasa din Sprint 5 fara sa rupa compatibilitatea cu datele vechi

Actualizare suplimentara 2026-03-15:

- verificarea live RLS a fost rulata din nou si trece:
  - `npm run verify:supabase:rls`
  - timestamp:
    - `2026-03-15T18:40:34.973Z`
- confirma operational:
  - izolare pe `organizations`
  - izolare pe `memberships`
  - citire izolata pentru `org_state`
  - citire izolata pentru `evidence_objects`
  - `viewer` nu poate modifica `org_state`

Actualizare suplimentara 2026-03-15:

- `Agent Evidence OS` nu mai poate face commit fara confirmare umana explicita
- runtime-ul accepta acum doar:
  - `confirmed`
  - `partially_confirmed`
- lotul gol dupa review este respins
- asta tine directia corecta:
  - layer peste produsul actual
  - fara produs paralel
  - fara intrare directa in starea oficiala fara review

Actualizare suplimentara 2026-03-15:

- auditul final pe firul canonic este inchis operational
- exista acum:
  - `tests/canonical-runtime-audit.test.ts`
  - `npm run test:canonical-audit`
- verdictul actual:
  - `Dashboard` tine directia buna
  - `Checklists` ramane cea mai densa pagina vizibila
  - densitatea ramasa nu mai blocheaza firul canonic

Actualizare suplimentara 2026-03-15:

- `Checklists wave 3` a impins pagina spre un cockpit de executie mai dur
- asta inseamna:
  - `Blocaje de audit` urca primele in board
  - `Urgente P1` raman imediat dupa ele
  - `TaskCard` tine sus primul pas si blocajul curent
  - utilitarele si rationale-ul raman sub disclosure
