# CompliScan - Task Breakdown Tehnic

Acest document transforma roadmap-ul de produs in task-uri tehnice concrete.

## Status real - 2026-03-13

Checkpoint-ul curent din implementare:

- [x] upload real de dovezi pe task-uri
- [x] proof types pe task-uri (`screenshot`, `policy_text`, `log_export`, `yaml_evidence`, `document_bundle`)
- [x] `Mark as fixed & rescan` cu validation logic real
- [x] `Auditor Vault` cu evidence ledger, validation ledger si timeline
- [x] `Auditor Vault` explică familiile de controale într-un limbaj executiv:
  - de ce contează
  - ce dovedește familia
  - ce surse și ce presiune curentă intră în review
- [x] `Audit Pack v2` cu sectiuni explicite:
  - executive summary
  - system register
  - controls matrix
  - evidence ledger
  - drift register
  - validation log
- [x] `Audit Pack` client-facing, printabil din browser pentru PDF
- [x] polish final pentru stakeholder non-tehnic:
  - ghid de distribuire externă
  - legendă de statusuri
  - pachete de control recomandate pe sistem
  - rezumat managerial per sistem în `Annex IV lite`
- [x] `AI Compliance Pack v2` cu:
  - prefill completeness score
  - field status (`confirmed / inferred / missing`)
  - source signals
  - draft `Annex IV lite`
- [x] `AI Compliance Pack v3` cu:
  - confidence model separat de încrederea tehnică
  - `detected / inferred / confirmed_by_user`
  - rezumat unificat în UI și audit
- [x] drift policy unificat:
  - severity reason
  - impact summary
  - next action
  - evidence required
  - law reference
- [x] drift UX unificat în Dashboard / Alerte / Scanări / Audit si export / Audit si dovezi
- [x] `drift escalation matrix` operațional:
  - lifecycle `open / acknowledged / in_progress / resolved / waived`
  - owner + SLA + deadline
  - SLA breach vizibil în UI și audit
  - auto-resolve / reopen prin task-uri
- [x] traceability matrix comun:
  - finding
  - remediation task
  - drift
  - articol / control
  - snapshot / baseline
- [x] traceability matrix rafinat cu:
  - evidence required pe control
  - coverage `covered / partial / missing`
  - fișiere legate direct de control
- [x] `compliscan.yaml` ca sursa dedicata de scanare
- [x] repo sync generic + adaptoare GitHub / GitLab
- [x] separare in UI si model intre:
  - remedieri rapide
  - remedieri structurale
- [x] sprint scurt de QA + UX cleanup pe flow-urile cele mai dense:
  - `Scanari`: separare clara intre `flux activ` si `ultimul rezultat`
  - `AIDiscoveryPanel`: drift comprimat, fara repetitie grea pe fiecare card
  - `Auditor Vault`: quick-start clar si limitare initiala a traseelor individuale
  - `Dovada`: separare clara intre `Remediere`, `Auditor Vault` si `Audit si export`
- [x] micro-copy si empty states cleanup pe paginile cheie:
  - `Scanari`
  - `Sisteme`
  - `Auditor Vault`
- [x] naming consistency pass pe suprafata vizibila:
  - `Flux scanare`
  - `Remediere`
  - `Audit si export`
  - subtitle de brand aliniat cu pozitionarea curenta
- [x] cleanup minim pe componente legacy pentru etichetele vechi ramase in cod
  - tipuri si componente interne curate (`InventoryFlowStep`, `RemediationPage`, `AuditExportPage`)
- [x] `UX Wave 1` page governance aplicat in runtime:
  - `Dashboard` ca orientare
  - `Scanare` ca poarta de intrare
  - `Control` ca workspace de confirmare
  - `Dovada` separata explicit intre:
    - `Remediere`
    - `Audit si export`
    - `Auditor Vault`
  - `Evidence OS` foloseste acum primitive de compozitie de pagina:
    - `PageIntro`
    - `SummaryStrip`
    - `SectionBoundary`
    - `HandoffCard`
- [x] `Setari` aliniata la acelasi sistem:
  - administrare operationala clara
  - tabs oficiale de produs
  - handoff explicit inapoi in fluxurile reale
- [x] ultimele suprafete utilitare / istoric vizibile au iesit din zona hibrida:
  - `Documente` ca istoric read-only
  - `Asistent` ca utilitar global de orientare
- [x] `Drift` a fost aliniat la aceeasi compozitie canonica de pagina
- [x] helper-ul legacy `PageHeader` a fost eliminat din runtime-ul activ
- [x] primul cleanup structural pe cockpit client:
  - derivarile pure mutate din `use-cockpit` in modul separat
  - compatibilitate publica pastrata pentru consumatorii existenti
- [x] helper-ele de browser/export mutate din `use-cockpit` in modul separat
- [x] boilerplate-ul principal din `use-cockpit` a fost redus prin helper-e locale de orchestrare
- [x] QA riguroasa + dry run (auth, manifest, baseline, compliscan.yaml, drift lifecycle, exporturi audit)

Observatie:

- documentul acesta a fost actualizat dupa starea reala a codului
- unde un item nu este complet, dar exista implementare serioasa, este marcat ca `partial`
- sprinturile de maturizare active sunt definite separat in `public/sprinturi-maturizare-compliscan.md`
- verdictul strict de maturitate este documentat in `public/raport-maturitate-compliscan.md`
- riscurile existențiale sunt documentate in:
  - `public/risk-register-brutal.md`
  - `public/risk-register-operational.md`

## Sesiune de maturizare activa

Sprint activ:

- `Sprint 7 - Operational readiness` (inchis operational)

Fronturile active acum:

- [x] auth cu roluri minime in modelul de sesiune
- [x] restrictii pe actiuni sensibile in API
- [x] actor identity real in audit/event log pentru actiunile sensibile
- [x] compatibilitate intre modelul nou de roluri si store-ul local actual
- [x] fundatie pentru membership / org model real
- [x] membership multi-org si administrare explicita minima membri/roluri
- [x] API minim pentru listare membri si schimbare rol
- [x] UI minim in `Setari` pentru lista membri si schimbare rol de catre owner
- [x] protectie backend pentru ultimul `owner` activ
- [x] audit trail pentru schimbarea rolurilor
- [x] membership multi-org minim:
  - listare membership-uri pentru userul curent
  - switch de organizatie activa din sesiune
- [x] stabilizare controlata pentru firul paralel `Agent Evidence OS`, fara sa rupa runtime-ul principal
- [x] administrare membri peste workspace-ul local
  - owner-ul poate adauga acum utilizatori existenti in workspace in organizatia curenta
  - rolul se seteaza la intrare, in acelasi flux cu administrarea rolurilor
  - flow-ul ramane explicit local-first; invitatiile externe complete raman pas separat
- [x] tenancy citit din DB ca sursa primara in backend `supabase`:
  - `organizations`
  - `memberships`
  - `profiles`
- [x] scrieri sensibile de tenancy tratate cloud-first in backend `supabase`:
  - `register`
  - `link identity`
  - `role update`
- [x] operatiile de tenancy esueaza explicit cand sincronizarea cloud nu reuseste in backend `supabase`
- [x] `org_state` in backend `supabase`:
  - citire primara din `public.org_state`
  - initializare directa in `public.org_state` cand snapshot-ul lipseste
  - fara fallback operational implicit la `compliscan.app_state`
- [~] storage privat real in `Supabase Storage`
  - backend-ul `supabase` / `hybrid` poate urca deja evidence nou in bucket privat
  - metadata-ul dovezii poate fi sincronizat acum si in `public.evidence_objects`
  - route-ul de acces si `Audit Pack` bundle pot consuma acum registrul `public.evidence_objects`
  - mai ramane mutarea finala a traseului operational complet pe cloud
- [x] signed URL sau stream controlat pentru evidence cloud
  - route-ul controlat exista acum:
    - `GET /api/tasks/[id]/evidence/[evidenceId]`
  - `delivery=redirect` emite redirect securizat pentru `supabase_private`
  - `download=1` forteaza descarcare explicita
- [x] RLS real pe tenancy si evidence objects
  - fundatia SQL este acum intarita:
    - helper-ele de membership lookup sunt `SECURITY DEFINER`
    - este evitata recursia RLS pe `memberships`
    - exista politici de `insert/update/delete` pe `org_state`, `evidence_objects` si `storage.objects`
  - exista acum si endpoint de verificare operationala:
    - `GET /api/integrations/supabase/status`
    - vizibil si in `Setari`
  - exista si runbook de verificare manuala:
    - `public/supabase-rls-verification-runbook.md`
  - verificarea operationala live in proiectul Supabase real trece prin:
    - `npm run verify:supabase:rls`
- [~] registru operational evidence in DB
  - `public.evidence_objects` este deja populat si consumat pe traseul de acces / bundle
  - `DashboardPayload` hidrateaza acum metadata de evidence din registrul cloud
  - route-ul controlat de access la dovada face acum lookup sigur si prin `org_id + task_id + attachment_id` cand metadata locala lipseste sau este invechita
  - mai ramane extinderea consumului in UI / traceability / views specializate care nu pornesc deja din payload-ul server-side
- [~] source of truth cloud pentru tenancy
  - backend-ul `supabase` poate seed-ui acum graful cloud din local daca proiectul cloud este gol
  - dupa seed, citirea revine pe `organizations / profiles / memberships` din DB
  - fallback-ul local este acum controlat explicit prin:
    - `COMPLISCAN_ALLOW_LOCAL_FALLBACK`
  - shell-ul dashboard si endpoint-urile de sesiune (`auth/me`, `auth/summary`) re-hidrateaza acum rolul si organizatia din membership-ul curent, nu doar din cookie
  - in productie, traseul cloud poate fi fortat fara degradare tacuta
- [x] health check unificat pentru aplicatie
  - helper dedicat:
    - `lib/server/app-health.ts`
  - endpoint dedicat:
    - `GET /api/health`
  - UI vizibil in `Setari`
- [x] status operational Supabase vizibil in `Setari`
- [x] checklist-uri operationale minime:
  - `public/release-readiness-checklist.md`
  - `public/pilot-onboarding-checklist.md`
  - `public/incident-runbook-minim.md`
- [x] timeout si retry discipline minima pentru integrari critice:
  - `lib/server/http-client.ts`
  - aplicat pe:
    - Google Vision
    - Supabase REST
    - Supabase Storage
    - Supabase Auth
- [x] verdict agregat de release readiness:
  - `lib/server/release-readiness.ts`
  - `GET /api/release-readiness`
  - compune:
    - `app health`
    - strict supabase preflight
    - blocker-ele operationale active
- [x] preflight local complet pentru release:
  - `scripts/preflight-release.mjs`
  - `npm run preflight:release`
  - include si `npm run verify:supabase:rls`
- [x] card dedicat pentru `Release readiness` in `Setari`
- [x] gate vizual de blocare cand `release readiness = blocked`
- [x] `GET /api/health` cere sesiune activa
- [x] `release readiness` ia in calcul si ultima verificare RLS locala
- [x] `Setari` nu mai cere `release readiness` pentru roluri fara acces
- [x] logging operational minim:
  - `lib/server/request-context.ts`
  - `lib/server/operational-logger.ts`
  - `x-request-id` pe rutele critice
  - `requestId` in payload-urile JSON de eroare
  - logare structurata minima pe:
    - `health`
    - `release-readiness`
    - `scan`
    - `evidence upload`
    - `audit-pack client`
    - `agent run`
    - `agent commit`
- [x] audit de integrare pentru firul paralel `Evidence OS UI`
  - batch-ul lui Codex 2 a fost verificat
  - nu au fost gasite blocaje, doar fix minim de siguranta
  - auditul final se face dupa ce inchide batch-ul curent

Verdict Sprint 4:

- [x] Sprint 4 poate fi considerat inchis operational
- [x] administrare membri peste workspace-ul local nu mai este blocaj pentru Sprint 5
  - invitatiile externe complete raman backlog ulterior

Verdict Sprint 7:

- [x] health / readiness / onboarding au fundatie operationala minima coerenta
- [~] timeout / retry discipline minima este pusa pe traseele externe critice
- [x] logging operational minim pe rutele critice
- [x] timeouts si retry discipline pentru integrari externe critice
- [x] audit final pe batch-ul `Evidence OS UI`

Sprint 2 inchis operational:

- `vitest` este configurat si ruleaza local prin `npm test`
- exista teste unitare pentru:
  - `request-validation`
  - `scan-workflow`
  - `repo-sync`
  - `drift-lifecycle`
  - `drift-policy`
  - `task-validation`
- exista route tests pentru:
  - `POST /api/scan`
  - `PATCH /api/ai-systems/detected/[id]`
  - `PATCH /api/drifts/[id]`
  - `POST /api/scan/[id]/analyze`
  - `POST /api/scan/extract`
  - `POST /api/integrations/repo-sync`
  - `POST /api/integrations/repo-sync/github`
  - `POST /api/integrations/repo-sync/gitlab`
  - `POST /api/state/baseline`
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `GET /api/auth/me`
- exista fixture-uri oficiale in `tests/fixtures` pentru:
  - document text
  - manifest `package.json`
  - manifest `requirements.txt`
  - `compliscan.yaml`
- exista fixtures OCR in `tests/fixtures` pentru:
  - PDF base64 minimal
  - imagine base64 minimală
- exista fixtures `expected findings` pentru:
  - document tracking
  - `compliscan.yaml`
- exista teste cu fixtures pentru parserul YAML si manifest autodiscovery
- exista teste de stabilitate pe semnalele-cheie pentru:
  - `simulateFindings`
  - `manifest autodiscovery`
- exista primul test de integrare reala pentru `repo-sync-executor`
- exista test de integrare reala si pentru fluxul document-first:
  - `document -> extract -> analyze`
- exista teste de fallback OCR pentru:
  - `pdfBase64`
  - `imageBase64`
- exista route tests pentru exporturile cheie:
  - `GET /api/exports/audit-pack`
  - `GET /api/exports/compliscan`
- exista route tests pentru:
  - `POST /api/tasks/[id]/evidence`
  - `POST /api/scan`
- exista smoke flow minim pentru:
  - `login -> session -> scan -> export -> logout`
- suita curenta are:
  - `27` fisiere de test
  - `85` teste verzi
- `npm run lint` trece dupa adaugarea testelor
- logul de executie continua in `public/log-sprinturi-maturizare.md`

Sprint 3 pornit:

- [x] strat separat de `signal detection`
- [x] provenance extins pe findings cu:
  - `signalSource`
  - `verdictBasis`
  - `signalConfidence`
- [x] confidence model minim pe findings:
  - `verdictConfidence`
  - `verdictConfidenceReason`
- [~] rescan validation mai explicabila:
  - `validationConfidence`
  - `validationBasis`
  - mesaj contextual pentru baza validarii
  - afisare in `TaskCard` si `Validation ledger`
  - prefix de outcome:
    - `Confirmare puternica`
    - `Confirmare partiala`
    - `Confirmare operationala`
- [~] verdict explicabil si in rezultate:
  - afisare in `Ultimul document analizat`
  - afisare in `Findings generate din YAML`
- [x] normalizare task IDs pentru findings + compatibilitate pe chei vechi din `taskState`
- [x] `simulateFindings(...)` refolosit peste semnalele detectate
- [x] teste pentru:
  - semnal direct din keyword
  - semnal inferat din manifest
  - propagarea provenance-ului in findings
- [x] teste pentru confidence si reason pe findings
- [~] fixtures extinse pentru verdict:
  - tracking
  - `compliscan.yaml`
  - high-risk scoring
  - data residency / transfer
- suita curenta dupa pornirea Sprintului 4 are:
  - `32` fisiere de test
  - `108` teste verzi

Sprint 4 pornit:

- [x] `UserRole` introdus in auth:
  - `owner`
  - `compliance`
  - `reviewer`
  - `viewer`
- [x] sesiunea include acum `role`
- [x] compatibilitate pentru useri si sesiuni legacy prin fallback controlat la `owner`
- [x] guard-uri de rol pe:
  - `GET /api/exports/compliscan`
  - `GET /api/exports/audit-pack`
  - `GET /api/exports/audit-pack/client`
  - `GET /api/exports/audit-pack/bundle`
  - `GET /api/exports/annex-lite/client`
  - `PATCH /api/drifts/[id]`
  - `PATCH /api/tasks/[id]`
  - `POST /api/tasks/[id]/evidence`
  - `POST /api/state/baseline`
  - `POST /api/state/drift-settings`
  - `POST /api/state/reset`
- [x] regula de permisiune pentru drift:
  - `waive` doar pentru `owner` / `compliance`
  - tranzitiile standard pentru `owner` / `compliance` / `reviewer`
- [x] actor identity real in audit trail:
  - helper comun pentru actor de tip `session / workspace / system`
  - actor propagat in evenimente pentru:
    - drift lifecycle
    - task update + rescan
    - evidence upload
    - baseline / reset
    - traceability review
    - family evidence reuse
    - AI systems create / confirm / edit / review / reject
    - pack field overrides
    - scan create / analyze
    - e-Factura validate / sync
    - alert resolve
  - timeline-ul din `Auditor Vault` si `Activitate recenta` afiseaza acum actorul
- [x] teste noi pentru deny-path si actiuni sensibile:
  - `PATCH /api/tasks/[id]`
  - `POST /api/state/reset`
  - `POST /api/state/drift-settings`
- [x] `npm run build` trece dupa pachetul Sprint 4, inclusiv dupa fixul de tip ramas din `engine.ts`
- [x] membership real intre user si organizatie:
  - persistenta separata in `users / orgs / memberships`
  - migrare compatibila din `users.json` legacy
  - sesiune cu `membershipId`
- [x] teste dedicate pentru noul model de auth:
  - persistenta separata la `register`
  - migrare legacy
  - rezolvare membership nou
  - token legacy fara rol
  - `requireRole` deny path
- [x] keepalive operational pentru Supabase Storage:
  - bucket `compliscan-heartbeat`
  - endpoint `GET/POST /api/integrations/supabase/keepalive`
  - cheie dedicata sau fallback la `COMPLISCAN_RESET_KEY`
- [x] API membri / roluri:
  - `GET /api/auth/members`
  - `PATCH /api/auth/members/[membershipId]`
- [x] API membership-uri / switch org:
  - `GET /api/auth/memberships`
  - `POST /api/auth/switch-org`
- [x] UI minim pentru membri si roluri in `Setari`
- [x] org switcher minim in `DashboardShell`
- [x] protectie `LAST_OWNER_REQUIRED` pentru retrogradarea ultimului owner
- [x] schimbarea rolului lasa eveniment in audit trail
- [~] persistența `app_state` direct in Supabase:
  - schema `compliscan` nu este inca expusa in PostgREST
- [x] suita curenta dupa pachetul de membri / roluri are:
  - `38` fisiere de test
  - `130` teste verzi

Sprint 5 trebuie sa atace direct riscurile:

- [~] mutare useri spre `Supabase Auth`
  - backend auth comutabil exista acum:
    - `local`
    - `supabase`
    - `hybrid`
  - login/register pot folosi acum `Supabase Auth`
  - exista si legare a userului local existent la identitatea externa
  - mai ramane mutarea completa a sesiunii si a source-of-truth-ului de identitate
- [~] `organizations` + `memberships` in DB, nu doar local
  - exista acum mirror controlat spre Supabase pentru:
    - `organizations`
    - `profiles`
    - `memberships`
  - sync-ul se leaga de:
    - `register`
    - `link identity`
    - `role update`
  - mai ramane mutarea citirii si a source-of-truth-ului final in DB
- [~] `org_state` in DB ca traseu real de productie
  - exista helper dedicat pentru `public.org_state`
  - in backend `supabase`, `public.org_state` poate fi citit ca sursa primara
  - in backend `hybrid`, `public.org_state` este oglindit la scriere, dar local ramane sursa principala
- `compliscan.app_state` ramane doar sursa legacy de migrare, nu traseu operational curent
- `Agent Evidence OS` este acum stabilizat minimal:
  - tipuri reale in `lib/compliance/agent-os.ts`
  - endpoint-uri corecte in `/api/agent/run` si `/api/agent/commit`
  - `Scanari` foloseste un singur hook coerent pentru agent flow
  - workspace-ul agentilor nu mai blocheaza `test + lint + build`
- [x] RLS minim pentru datele multi-org
  - verificarea live trece din nou la data:
    - `2026-03-15T18:40:34.973Z`
  - confirma:
    - izolare pentru `organizations`
    - izolare pentru `memberships`
    - citire izolata pentru `org_state`
    - citire izolata pentru `evidence_objects`
    - `viewer` nu poate modifica `org_state`
  - script:
    - `npm run verify:supabase:rls`
- [~] dovezi mutate din `public/evidence-uploads` in storage privat
  - upload-urile noi sunt acum in `.data/evidence-uploads`
  - accesul se face prin route controlat
  - backend-ul `supabase` / `hybrid` poate urca deja evidence nou in bucket privat
- [x] acces prin signed URLs sau route controlat
  - route-ul controlat exista acum:
    - `GET /api/tasks/[id]/evidence/[evidenceId]`
  - `delivery=redirect` emite redirect securizat pentru `supabase_private`
  - `download=1` forteaza descarcare explicita
- [x] clarificare finala pentru `app_state` cloud ca source of truth
  - `public.org_state` este acum singura cale cloud activa pentru state
  - `compliscan.app_state` mai este citit doar pentru migrare legacy in `org_state`
  - runtime-ul curent nu mai scrie in `app_state`
  - in `hybrid`, `org_state` ramane doar mirror, iar local ramane sursa primara
  - in `supabase`, lipsa sau eroarea pe `org_state` ramane blocanta in mod strict
  - validare dupa pas:
    - `npm test`
    - `npm run lint`
    - `npm run build`
- [x] consum operational mai larg pentru `public.evidence_objects`
  - `DashboardPayload` hidrateaza metadata din registrul cloud
  - `family-evidence` reutilizeaza acum dovada din starea hidratata, nu doar din state local brut
- [x] inchidere formala Sprint 5
  - checklist-ul este in `public/sprint-5-closure-checklist.md`
  - exista acum si verificare live directa:
    - `npm run verify:supabase:sprint5`
  - exista si panou operational in `Setari` care afiseaza:
    - schema lipsa
    - bucket lipsa
    - blocajele reale ramase
  - verdictul live actual este documentat in:
    - `public/supabase-live-verification-2026-03-13.md`
  - infrastructura live de baza este acum prezenta:
    - tabelele Sprint 5 raspund `200`
    - bucket-ul privat raspunde `200`
  - exporturile si Auditor Vault au acum acoperire automata pentru dovezi din registrul cloud:
    - `lib/server/dashboard-response.test.ts`
    - `app/api/exports/audit-pack/client/route.test.ts`
    - `app/api/exports/audit-pack/bundle/route.test.ts`
  - exista acum si preflight strict pentru mediul `supabase`:
    - `npm run verify:supabase:strict`
    - verdict curent:
      - infrastructura live este buna
      - `.env.local` este acum pe traseu strict:
        - `COMPLISCAN_AUTH_BACKEND=supabase`
        - `COMPLISCAN_DATA_BACKEND=supabase`
        - `COMPLISCAN_ALLOW_LOCAL_FALLBACK=false`
  - mai ramane:
    - verificarea manuala RLS
- [x] suita curenta dupa stabilizarea pachetului Sprint 5:
  - `50` fisiere de test
  - `177` teste verzi

Sprint 6 trebuie sa atace direct riscurile:

- [x] evidence quality checks
  - `TaskEvidenceAttachment` retine acum evaluarea:
    - `sufficient`
    - `weak`
  - evaluarea este scrisa si in `public.evidence_objects`
- [x] fixtures reale pentru verdicturi grele
- [x] test fixture-driven pentru `Audit Pack` pe caz high-risk fara dovezi
- [x] quality gates pentru `Audit Pack`
  - `missing_evidence`
  - `pending_validation`
  - `weak_evidence`
  - `stale_evidence`
  - `unresolved_drift`
  - `inferred_only_finding`
  - `auditReadiness` tine acum cont si de aceste gates
- [x] reguli mai defensive pentru `family reuse`
  - reuse blocat pentru dovada sursa `weak`
  - reuse blocat cand sursa ramane validata doar pe `inferred_signal`
  - reuse blocat pe target-uri care au drift deschis
- [~] clarificare și mai strictă între:
  - `semnal`
  - `inferență`
  - `verdict`
  - `confirmare umană`
  - actualizare:
    - Sprint 5 este inchis operational
    - Sprint 6 expune acum explicit cand dovada este slaba sau cand controlul ramane bazat doar pe inferenta
- [x] traceability mai strict pentru dovada si control
  - `ComplianceTraceRecord` include acum:
    - `evidence.quality`
    - `evidence.validationBasis`
    - `evidence.validationConfidence`
    - `auditDecision`
    - `auditGateCodes`
  - un control cu `validationStatus=passed`, dar dovada `weak`, nu mai apare `validated`
  - `bundleCoverageStatus` cade la `partial` daca dovada este slaba
  - `nextStep` foloseste sumarul de calitate al dovezii cand acesta este motivul real de blocaj
- [x] blocaj explicit pe confirmarea de audit cand controlul nu are `auditDecision=pass`
  - `POST /api/traceability/review` respinge acum:
    - `weak evidence`
    - `needs_review`
    - familii cu controale nevalidate
    - controale cu drift deschis chiar daca rescan-ul a iesit `passed`
- [x] vizibilitate mai buna in UI / export pentru traceability
  - `Auditor Vault` afiseaza:
    - calitatea dovezii
    - baza validarii
    - increderea validarii
    - statusul de audit per control
    - `gates active`
  - `Audit Pack` client-facing afiseaza acum si sumarul de calitate al dovezii in traceability matrix
  - `Audit Pack` client-facing afiseaza acum si:
    - decizia de audit per control
    - motivele sintetizate din `auditGateCodes`
  - `traceability matrix` din varianta client-facing foloseste acum aceeasi logica de audit:
    - verdict per control
    - `gates active`
  - butoanele de confirmare sunt dezactivate pe control / familie / articol cand grupul nu este complet validat
- [x] documentatie Sprint 6:
  - `public/evidence-quality-spec.md`
  - `public/sprint-6-audit-quality-gates.md`
  - `public/triere-rapoarte-gemini.md`
- [x] fixtures Sprint 6:
  - `tests/fixtures/documents/recruitment-high-risk-bundle.txt`
  - `tests/fixtures/yaml/compliscan-recruitment-high-risk.yaml`
  - `tests/fixtures/expected-findings/recruitment-high-risk-bundle.json`
  - `tests/fixtures/expected-findings/compliscan-recruitment-high-risk.json`
- [x] suita curenta dupa pornirea Sprint 6:
  - `60` fisiere de test
  - `213` teste verzi
- [~] UI de administrare roluri / membri

## Epic 1 - Claritate produs si navigatie

### Obiectiv

Produsul trebuie sa fie usor de inteles in 30 de secunde.

### Task-uri

- [x] audit complet al navigatiei curente
- [x] definire nav primar pe 3 piloni:
  - Scanare
  - Control
  - Dovada
- [x] simplificare copy in dashboard, scanari, sisteme, rapoarte
- [x] aliniere naming intre nav, titluri de pagina si subtitle de brand
- [x] adaugare mesaje standard pe fiecare pagina:
  - ce vad
  - ce fac acum
  - ce se intampla dupa
- [x] drift surface in dashboard ca element vizibil de zi cu zi
- [x] reducere sectiuni care par produse separate:
  - nav secundar mutat in tabs per pilon
  - sidebar ramane doar pe fluxul principal

### Livrabil tehnic

- layout si route structure curate
- componente shared pentru guide cards / action cards / status cards

## Sprint 2 - Test harness activ

Status:

- `done`

Progres:

- [x] alegem runner-ul de test (`vitest`)
- [x] scripturi de test in `package.json`
- [x] configurare alias pentru runner
- [x] primele unit tests pentru:
  - `request-validation`
  - `scan-workflow`
  - `repo-sync`
  - `drift-lifecycle`
- [x] unit tests pentru:
  - `drift-policy`
  - `task-validation`
- [x] route tests pentru endpoint-urile critice:
  - `PATCH /api/drifts/[id]`
  - `PATCH /api/ai-systems/detected/[id]`
  - `POST /api/scan/[id]/analyze`
  - `POST /api/scan/extract`
  - `POST /api/integrations/repo-sync`
  - `POST /api/integrations/repo-sync/github`
  - `POST /api/integrations/repo-sync/gitlab`
  - `POST /api/state/baseline`
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `GET /api/auth/me`
  - `POST /api/tasks/[id]/evidence`
- [x] exporturile cheie au route tests:
  - `GET /api/exports/audit-pack`
  - `GET /api/exports/compliscan`
- [x] fixture-uri oficiale pentru scan / manifests / YAML
- [x] integration tests pe fluxurile cheie

## Epic 2 - Libraria de Reguli + Legal Mapping

### Obiectiv

Semnalele tehnice trebuie legate clar de reguli si de output actionabil.

### Task-uri

- [x] extragere reguli din `engine.ts` intr-o librarie separata
- [x] adaugare `legalMappings` pe findings
- [x] adaugare `ownerSuggestion`
- [x] adaugare `evidenceRequired`
- [x] adaugare `rescanHint`
- [x] conectare librarie de reguli la findings generate
- [x] conectare partiala la remediation si task output
- [x] extindere rule library cu reguli noi:
  - GDPR retention
  - transparency / notice
  - AI human oversight
  - data residency
  - purpose drift
- [x] definire taxonomie de principii:
  - oversight
  - robustness
  - privacy_data_governance
  - transparency
  - fairness
  - accountability
- [x] standardizare severitate:
  - critical
  - high
  - medium
  - low

### Livrabil tehnic

- `lib/compliance/rule-library.ts`
- findings mai bogate si mai utile pentru UI / export

## Epic 3 - Remediation Engine

### Obiectiv

Fiecare finding important trebuie sa spuna ce faci concret.

### Task-uri

- [x] standardizare output remediation:
  - problema
  - de ce conteaza
  - articol afectat
  - owner
  - dovada ceruta
  - text recomandat
  - moment de rescan
- [x] UI pentru legal mapping in task card
- [x] UI pentru evidence required in task card
- [x] UI pentru rescan hint in task card
- [x] suport pentru task-uri derivate din findings si din drift
- [x] separare intre remediation rapida si remediation structurala in model, board si task cards

### Livrabil tehnic

- task cards mai actionabile
- remediation board mai clar
- workflow distinct pentru fix rapid vs schimbare structurala

## Epic 4 - compliscan.yaml

### Obiectiv

Introducem sursa de adevar pentru sistemele AI.

### Task-uri

- [x] definire schema `compliscan.yaml`
- [x] parser pentru YAML
- [x] validare structurala si erori de input
- [x] mapare la modelul intern:
  - provider
  - model
  - risk_class
  - personal_data_processed
  - human_oversight.required
  - data_residency
- [x] suport in `Scanari` pentru upload / paste `compliscan.yaml`
- [x] export compatibil in `compliscan.yaml`

### Livrabil tehnic

- sursa noua de scanare si control

## Epic 5 - Baseline si Drift Detection

### Obiectiv

Drift-ul trebuie sa arate clar ce s-a schimbat si de ce conteaza.

### Task-uri

- [x] comparatie clară intre snapshot si baseline validat
- [x] drift pe campuri-cheie:
  - provider_added
  - provider_changed
  - model_changed
  - framework_added
  - personal_data_detected
  - human_review_removed
  - risk_class_changed
  - purpose_changed
- [x] severitate configurabila pe drift
- [x] remediation derivata din drift
- [x] UI drift:
  - ce s-a schimbat
  - de ce conteaza
  - ce faci acum
  - ce dovada trebuie pastrata

### Livrabil tehnic

- drift clar, comparabil si actionabil

## Epic 6 - Pre-filling

### Obiectiv

Userul nu trebuie sa porneasca de la pagina goala.

### Task-uri

- [x] model comun `AI Compliance Pack`
- [x] pre-fill pentru AI systems din:
  - documente
  - manifests
  - compliscan.yaml
- [x] pre-fill pentru:
  - provider
  - model
  - purpose
  - risk class sugerat
  - data used
  - human oversight
- [x] UI de confirm / edit / reject
- [x] UX dedicat pentru câmpuri compuse:
  - `human_oversight`
  - `data_residency`
  - `retention_days`
  - `legal_mapping`
- [x] `AI Compliance Pack v2`:
  - completeness score
  - field status
  - source signals
  - draft `Annex IV lite`
- [x] confidence model:
  - detected
  - inferred
  - confirmed_by_user
- [x] `AI Compliance Pack v4/v5`:
  - confidence model la nivel de câmp
  - evidence bundle pe sistem
  - trace summary pe sistem
  - secțiuni `Annex IV lite` mai complete
  - coverage pe control și pe articol
  - controale sugerate mai explicite pe grupuri de sisteme
  - `ownerRoute`, `businessImpact`, `bundleHint`
- [x] pre-fill mai agresiv pentru câmpurile avansate din `Annex IV lite`:
  - deployment context
  - affected persons summary
  - monitoring summary
  - escalation path
- [x] `Annex IV lite` client-facing:
  - export HTML printabil din browser
  - legat direct de `AI Compliance Pack`
  - inclus in `Audit Pack` ZIP / dossier bundle
  - review checklist si readiness mai clare in documentul client-facing
  - table of contents și ancore pe sistem / secțiune

### Livrabil tehnic

- inventory confirm flow mai rapid si mai credibil
- baza comuna pentru `Audit Pack`
- draft de documentatie care reduce frica paginii goale
- livrabil client-facing separat pentru review operational si audit

## Epic 7 - Auditor Vault

### Obiectiv

Construim o vedere reala de audit-ready evidence.

### Task-uri

- [x] model pentru dovezi atașate
- [x] relationare intre:
  - finding
  - remediation
  - drift
  - articol de lege
  - snapshot / baseline
- [x] pagină dedicata Auditor Vault
- [x] timeline cronologic
- [x] export `Audit Pack v2` JSON structurat
- [x] export `Audit Pack` client-facing HTML / PDF
- [x] traceability matrix în `Auditor Vault` și în exportul client-facing
- [x] export `Audit Pack` ZIP / dossier bundle
- [x] confirmare explicită pe control / articol în `traceability matrix`
- [x] confirmare la nivel de grup de controale / articol
- [x] confirmare la nivel de familie de controale
- [x] reuse de dovadă validată în aceeași familie de controale
- [x] note de review reflectate în `Auditor Vault` și în `Audit Pack` client-facing
- [x] linkuri directe din audit catre sectiunea relevantă din `Annex IV lite`
- [x] executive summary
- [x] system register
- [x] controls matrix
- [x] evidence ledger
- [x] drift register
- [x] validation log
- [x] agregare coverage pe articol / control în `Audit Pack`

### Livrabil tehnic

- dovada defensibila, nu doar jurnal brut
- dosar JSON coerent + versiune client-facing printabila

## Epic 8 - Repo Integrations controlate

### Obiectiv

Conectam produsul la schimbari reale din cod fara sa incarcam UX-ul.

### Task-uri

- [x] webhook GitHub pentru fisiere relevante
- [x] webhook GitLab pentru fisiere relevante
- [x] comparație automata pe:
  - manifests
  - compliscan.yaml
- [x] creare snapshot nou la schimbari relevante
- [x] drift alert automat
- [x] workflow de ownership pentru drift:
  - owner preia drift-ul
  - owner îl trece în lucru
  - owner îl rezolvă sau îl marchează waived
  - toate evenimentele intră în audit trail

### Livrabil tehnic

- monitorizare mai aproape de real-time, dar controlata

## Task-uri imediate recomandate

### Acum

- [x] roadmap produs
- [x] task breakdown tehnic
- [x] inceput Libraria de Reguli

### Ultimele 5 task-uri inchise

- [x] `Annex IV lite` client-facing cu anchors și table of contents pe sistem / secțiune
- [x] linkuri directe din `Audit Pack` client-facing către secțiunea relevantă din `Annex IV lite`
- [x] confirmare la nivel de grup de controale / articol în `Traceability Matrix`
- [x] familie de controale cu:
  - confirmare la nivel de familie
  - reuse de dovadă validată
  - summary în `Audit Pack` client-facing
- [x] pre-fill avansat pentru `AI Compliance Pack`:
  - deployment context
  - affected persons summary
  - monitoring summary
  - escalation path
- [x] framing executiv mai bun pentru `Audit Pack` client-facing
- [x] reuse policy mai fină pentru familii de controale:
  - tip de dovadă compatibil
  - grup legal compatibil
  - validare tehnică compatibilă în familiile stricte
- [x] `Audit Pack` client-facing mai clar pentru stakeholder non-tehnic:
  - ce este deja defensibil
  - ce cere atenție înainte de audit
  - ce s-a schimbat față de baseline
- [x] polish executiv pentru `Audit Pack` client-facing:
  - memo executiv de deschidere
  - decision gates pentru semnare / distribuire / baseline
  - owner action register
  - checklist rapid pentru stakeholder
- [x] controale sugerate mai fine în `AI Compliance Pack`:
  - controale derivate din task-uri
  - controale inferate per risc / date / rezidență / oversight
  - prioritate, dovadă și referință legală

### Urmatoarele 5 task-uri concrete recomandate

- [x] implementează `drift escalation matrix`:
  - owner implicit pe tip de drift
  - SLA / due date
  - blocant vs non-blocant pentru baseline / audit
  - dovadă obligatorie pentru rezolvare
- [x] rafinează escaladarea drift `critical` vs `high` în UI și în task-uri
- [x] leagă drift escalation de:
  - remediation task
  - Auditor Vault
  - Audit Pack
- [x] family-level evidence bundle mai puternic:
  - mai multe controale sub aceeași obligație
  - pachet de dovadă reutilizabil cu reguli clare
- [x] conectează fiecare articol/control și în dosarul client-facing final, nu doar în uneltele de audit
- [x] controale sugerate și mai fine pe grupuri de sisteme / familii de controale
- [x] îmbunătățește reuse bundle la nivel de familie cu policy explicită per fișier și per control
- [x] du `Audit Pack` client-facing spre format de dosar executiv extern (cover + anexă + decizii)

### Actualizare 2026-03-15 - cockpit cleanup

- [x] toate mutatiile ramase din `use-cockpit` au fost trecute pe helper-ele comune:
  - `withBusyOperation`
  - `applyDashboardPayload`
- [x] au fost inchise mutatiile pentru:
  - sisteme detectate
  - baseline
  - drift severity / drift lifecycle
  - compliance pack
  - traceability review
  - family evidence reuse
  - reset workspace
  - validare XML e-Factura
- [x] validare completa dupa cleanup:
  - `npm test`
  - `npm run lint`
  - `npm run build`

### Actualizare 2026-03-15 - audit PR + performance

- [x] audit final pe branch pentru:
  - `UX clarity`
  - `mixed intent`
- [x] fara blocaje noi la nivel de intentie de pagina
- [x] code-splitting pe `Control > Sisteme` pentru panourile grele:
  - `AIDiscoveryPanel`
  - `AIInventoryPanel`
  - `AICompliancePackSummaryCard`
  - `AICompliancePackEntriesCard`
- [x] efect confirmat in build:
  - `/dashboard/sisteme` a coborat la `9.31 kB / 181 kB first load`

- [x] `Auditor Vault` nu mai asteapta full-page `heavy payload`
  - shell-ul porneste din `core payload`
  - `Compliance Pack` si `traceability` se incarca separat
- [x] code-splitting pe `Auditor Vault` pentru:
  - `AICompliancePackSummaryCard`
  - `AICompliancePackEntriesCard`
  - `TraceabilityMatrixCard`
- [x] efect confirmat in build:
  - `/dashboard/rapoarte/auditor-vault` a coborat la `9.69 kB / 181 kB first load`

- [x] `Setari` nu mai tine `Integrari` si `Operational` in bundle-ul initial
  - shell-ul de pagina ramane in `app/dashboard/setari/page.tsx`
  - taburile grele au fost mutate in:
    - `components/compliscan/settings/settings-integrations-tab.tsx`
    - `components/compliscan/settings/settings-operational-tab.tsx`
- [x] helper-ele si tipurile comune pentru `Setari` au fost extrase in:
  - `components/compliscan/settings/settings-shared.tsx`
- [x] efect confirmat in build:
  - `/dashboard/setari` a coborat la `7.73 kB / 184 kB first load`
- [x] validare completa dupa pas:
  - `npm test`
  - `npm run lint`
  - `npm run build`

- [x] `Scanare` nu mai tine `Verdicts` si `Istoric` in bundle-ul initial
  - `flow` ramane vederea initiala de executie
  - taburile secundare au fost mutate in:
    - `components/compliscan/scanari/scan-verdicts-tab.tsx`
    - `components/compliscan/scanari/scan-history-tab.tsx`
- [x] efect confirmat in build:
  - `/dashboard/scanari` a coborat la `9.12 kB / 180 kB first load`
- [x] validare completa dupa pas:
  - `npm test`
  - `npm run lint`
  - `npm run build`

- [x] `Audit si export` nu mai tine panourile suport in bundle-ul initial
  - panourile mutate in:
    - `components/compliscan/rapoarte/reports-support-panels.tsx`
  - lazy-load pentru:
    - `ExportArtifactsCard`
    - `RecentDriftCard`
- [x] efect confirmat in build:
  - `/dashboard/rapoarte` a coborat la `6.13 kB / 177 kB first load`
- [x] validare completa dupa pas:
  - `npm test`
  - `npm run lint`
  - `npm run build`

### Actualizare 2026-03-15 - urmatorul val dupa integrare

- [x] directiva de runtime UX a fost fixata explicit:
  - `public/runtime-ux-declutter-directive-2026-03-15.md`
- [x] concluzia curenta este:
  - produsul nu cere feature noi
  - produsul cere ierarhie mai dura in runtime
- [x] `Browser audit` pe firul canonic dupa merge:
  - `Dashboard`
  - `Scanare`
  - `Control`
  - `Dovada / Remediere`
  - `Dovada / Audit si export`
  - `Dovada / Auditor Vault`
  - `Setari`
  - audit runtime local partial rulat pe org temporar autentificat
  - empty-state si stare populata prin `scan` real au fost verificate la nivel de payload + route shell
  - exista acum si kit local de test pentru flow-ul principal de user nou:
    - `public/flow-test-kit-user-nou-document-2026-03-15/`
  - exista acum si audit executabil pentru flow-ul principal:
    - `tests/flow-test-kit-user-nou.test.ts`
    - `npm run test:flow-kit`
  - exista acum si harness executabil pentru firul canonic:
    - `tests/canonical-runtime-audit.test.ts`
    - `npm run test:canonical-audit`
  - acopera operational:
    - autentificare locala
    - `Scanare`
    - `Dashboard core`
    - `Dashboard payload`
    - `Audit si export`
    - `Setari`
  - verdict curent:
    - `Dashboard` tine directia buna
    - `Checklists` ramane cea mai densa pagina vizibila
    - densitatea ramasa nu mai este blocanta pentru firul canonic
- [x] `Doc governance pass` pentru `public/*.md`
  - exista acum harta explicita:
    - `public/doc-governance-map-2026-03-15.md`
  - `Tier 0` / `Tier 1` / `Tier 2` / `Tier 3` / `Tier 4` separa:
    - canonul
    - referintele active
    - working docs conditionale
    - auditul istoric
    - delegarea / memo-urile interne
  - scopul este reducerea context noise-ului si a incarcarii inutile in sesiuni lungi
- [x] `Checklists wave 1`
  - compactare a zonei de deasupra board-ului
  - ierarhie mai clara pentru filtre
  - `TaskCard` mai usor de scanat
  - CTA primar mai dominant
- [x] `Dashboard` cleanup suplimentar
  - orientare pura
  - blocaj + urmatorul pas dominante
  - fara competitie cu proof si panouri suport
  - `Unde continui` ridica si marcheaza pasul curent
  - `Stare curenta` trimite spre actiunea dominanta, nu generic spre aceleasi doua zone
- [x] `Checklists wave 2` signal pass
  - `Snapshot de executie` spune acum mai direct ce inchizi acum
  - sumarul urca:
    - `Task-uri deschise`
    - `P1 deschise`
    - `Fara dovada`
  - header-ul board-ului reduce zgomotul si tine sus:
    - `deschise`
    - `P1`
    - `fara dovada`
- [x] `Checklists wave 3` authority pass
  - `Remediere` porneste acum din blocajul real, nu din `score / risk`
  - board-ul `ALL` ordoneaza acum:
    - `Blocaje de audit`
    - `Urgente P1`
    - `Remedieri rapide`
    - `Remedieri structurale`
  - `TaskCard` tine sus:
    - primul pas
    - blocajul de audit
    - CTA-ul primar
  - detaliile de verificare si utilitarele raman sub disclosure
  - efect confirmat in build:
    - `/dashboard/checklists` ramane in zona `7.52 kB / 179 kB first load`
  - validare completa dupa pas:
    - `npm test`
    - `npm run lint`
    - `npm run build`
- [x] orice pas nou pe `Agent Evidence OS` ramane sub regula:
  - layer peste produsul actual
  - fara produs paralel
  - fara concurenta cu declutter-ul de runtime
  - `commit` cere acum confirmare explicita de review uman:
    - `confirmed`
    - `partially_confirmed`
  - `needs_review` nu mai poate intra in starea oficiala
  - lotul gol dupa review nu mai poate fi commit-uit

### Actualizare 2026-03-15 - execution split pentru sprintul scurt

- [x] a fost fixata harta de executie pentru sprintul de `cockpit declutter si autoritate operationala`:
  - `public/cockpit-authority-execution-map-2026-03-15.md`
- [x] ownership-ul este separat explicit:
  - Codex principal = page-level governance + integrare + runtime shell
  - Codex 2 = densitate si ierarhie in componentele operationale din `Checklists`
- [x] lotul serios permis pentru Codex 2 este documentat in:
  - `public/task-codex-2-checklists-wave-1-components-2026-03-15.md`
- [x] executie efectiva dupa merge:
  - `Checklists wave 1`
  - `Dashboard` executive declutter

### Actualizare 2026-03-15 - `Checklists wave 1` pornit la nivel de page shell

- [x] `app/dashboard/checklists/page.tsx` nu mai tine board-ul sub prea mult framing de intrare
- [x] `PageIntro` este mai scurt si mai orientat pe executie
- [x] `SummaryStrip` nu mai concureaza cu board-ul prin ton doctrinar
- [x] blocul mare de `Flux canonic` a fost scos din zona de deasupra board-ului
- [x] handoff-ul spre `Auditor Vault` si `Audit si export` a fost coborat dupa zona de lucru
- [x] component-level density pass inchis pentru:
  - `components/compliscan/remediation-board.tsx`
    - filtre mai clare pe:
      - `Status`
      - `Tip remediere`
      - `Prioritate`
  - `components/compliscan/task-card.tsx`
    - metadata duplicata scoasa din coloana de actiune
    - dovada curenta si `Export task` mutate sub disclosure
- [x] efect confirmat in build:
  - `/dashboard/checklists` ramane in zona `7.17 kB / 179 kB first load`
- [x] validare completa dupa pas:
  - `npm test`
  - `npm run lint`
  - `npm run build`

### Actualizare 2026-03-15 - `Dashboard` executive declutter pornit

- [x] `Dashboard` nu mai foloseste bannerul didactic care concura cu starea operationala
- [x] `NextBestAction` si `Control drift` au urcat in ierarhia principala a paginii
- [x] blocul de orientare a fost comprimat:
  - `Flux principal` -> `Unde continui`
  - descrieri mai scurte
  - orientare mai dura spre pagina potrivita
- [x] `Snapshot` foloseste acum limbaj mai direct:
  - `Urmatoarele actiuni`
  - `Drift deschis`
  - `Baseline`
- [x] al doilea pass scurt de austeritate pe orientare:
  - `Unde continui` -> `Traseu rapid`
  - badge-ul decorativ pentru ultimul manifest a fost scos
  - `Snapshot rapid` -> `Stare curenta`
  - CTA-urile secundare au fost scurtate la `Scanare` / `Control`
- [x] browser audit final pe `Dashboard` dupa ce intra si lotul component-level pentru `Checklists`
  - inchis operational prin:
    - pass-urile de declutter deja integrate
    - `tests/canonical-runtime-audit.test.ts`

- [x] `Audit si export` component density pass
  - `Raport PDF` este clar exportul principal
  - `audit / review` raman secundare
  - `tehnic` sta sub disclosure local
  - `ExportArtifactsCard` este grupat pe rolul artefactului
  - `RecentDriftCard` separa mai clar:
    - ce intra in snapshot
    - de ce conteaza
    - ce urmeaza
- [x] pasul nu schimba:
  - shell-ul paginii
  - business logic
  - wiring-ul exporturilor
- [x] validare completa dupa pas:
  - `npm test`
  - `npm run lint`
  - `npm run build`

- [x] `Setari wave 1` page-shell austerity
  - `PageIntro` scurt si admin-first
  - `admin snapshot` in aside, nu `score / risk`
  - `SummaryStrip` mai direct
  - blocul de `Flux canonic` comprimat fara cardurile de framing
  - descrierile taburilor comprimate pentru scanare mai rapida
- [x] `Setari` component-level austerity pass
  - `Integrari` foloseste:
    - `stare curenta`
    - `actiune recomandata`
    - semnale active
    - detaliu tehnic sub disclosure
  - `Operational` foloseste aceeasi ierarhie pentru:
    - `health`
    - `release readiness`
  - `settings-shared` are primitive locale noi pentru compozitie si disclosure
- [x] efect confirmat in build:
  - `/dashboard/setari` ramane in zona `7.75 kB / 183 kB first load` pe lotul stacked curent
- [x] validare completa dupa pas:
  - `npm test`
  - `npm run lint`
  - `npm run build`

- [x] `Control wave 1` page-shell pass
  - `PageIntro` mai scurt si mai direct
  - `Overview` mai clar orientat pe confirmare
  - `SectionBoundary` fara suportul didactic greu
  - handoff redus la directiile reale:
    - `Sisteme`
    - `Drift`
    - `Setari`
- [x] efect confirmat in build:
  - `/dashboard/sisteme` a coborat la `9.28 kB / 179 kB first load`
- [x] validare completa dupa pas:
  - `npm test`
  - `npm run lint`
  - `npm run build`

- [x] `Control wave 1` component density pass
  - `AIDiscoveryPanel`
    - contextul de suport si evidenta detectiei coboara sub disclosure
    - lista activa ramane mai scanabila
  - `AIInventoryPanel`
    - wizard cu copy mai scurt
    - semnale rapide ca badge-uri
    - `Urmatorii pasi` sub disclosure
  - `AICompliancePack`
    - snapshot si prefill status raman sus
    - `coverage`, `sources`, `controls + trace`, `Annex IV lite` coboara sub disclosure
- [x] efect confirmat in build:
  - `/dashboard/sisteme` ramane la `9.28 kB / 179 kB first load`
- [x] validare completa dupa pas:
  - `npm test`
  - `npm run lint`
  - `npm run build`

- [x] `Auditor Vault wave 1` page-shell declutter
  - `PageIntro` mai scurt si mai dur
  - aside orientat pe readiness, drift si gap de dovada
  - `SummaryStrip` cu focus pe ce sustii acum in audit
  - `SectionBoundary` fara `VaultGuideCard`
  - handoff si export banner cu copy mai clar pe rol
- [x] efect confirmat in build:
  - `/dashboard/rapoarte/auditor-vault` a coborat la `7.74 kB / 181 kB first load`
- [x] validare completa dupa pas:
  - `npm test`
  - `npm run lint`
  - `npm run build`

- [x] `Auditor Vault wave 1` component density pass
  - `EvidenceLedgerCard`, `LegalMatrixCard`, `DriftWatchCard`, `ValidationLedgerCard`, `AuditTimelineCard`
  - verdictul si starea raman sus
  - metadata si explicatia coboara sub disclosure
- [x] build stabil dupa pas:
  - `/dashboard/rapoarte/auditor-vault` ramane in zona `181 kB first load`
- [x] validare completa dupa pas:
  - `npm test`
  - `npm run lint`
  - `npm run build`

- [x] `Scanare` micro-pass de shell
  - selectorul sursei si fluxul activ urca inaintea ghidajului lung
  - `ScanWorkflowGuideCard` coboara dupa zona de lucru si ramane doar ca handoff / clarificare
  - `ScanFlowOverviewCard` spune acum direct unde continui dupa analiza:
    - `Control`
    - `Dovada`
  - pasul nu schimba business logic si nu adauga concepte noi
- [x] efect confirmat in build:
  - `/dashboard/scanari` a coborat la `8.53 kB / 179 kB first load`
- [x] validare completa dupa pas:
  - `npm test`
  - `npm run lint`
  - `npm run build`

- [x] `Setari / Acces` poate adauga membri existenti din workspace
  - `POST /api/auth/members` adauga un utilizator deja existent in workspace in organizatia curenta
  - owner-ul alege rolul direct din `Setari`
  - evenimentul intra in jurnalul de compliance:
    - `auth.member-added`
  - pasul nu promite invitatii externe complete si nu schimba modelul de auth
- [x] efect confirmat in build:
  - `/dashboard/setari` urca controlat la `8.14 kB / 184 kB first load`
- [x] validare completa dupa pas:
  - `npm test`
  - `npm run lint`
  - `npm run build`

- [x] harness executabil pentru flow-ul principal de user nou
  - test dedicat:
    - `tests/flow-test-kit-user-nou.test.ts`
  - script dedicat:
    - `npm run test:flow-kit`
  - acopera:
    - `Scanare`
    - populare state
    - `Dashboard payload`
    - `Remediere` derivata din findings
- [x] validare dupa pas:
  - `npm run test:flow-kit`
  - `npm test`
  - `npm run lint`
