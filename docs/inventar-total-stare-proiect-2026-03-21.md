# CompliScan — Inventar Total Stare Proiect

Data: `2026-03-21`
Repo: `CompliAI`
Scop: un singur document de adevar pentru starea reala a aplicatiei, ca sa putem analiza coerent unde nu se pupa codul, UX/IA, runtime-ul live si ramurile.

## 1. Verdict executiv

Produsul nu este "rupt", dar este intr-o stare hibrida:

- `main` si `production` sunt sincronizate
- shell-ul nou `Acasa / Scaneaza / De rezolvat / Rapoarte / Setari` este live
- backend-ul si Automation Layer sunt mult mai avansate decat UX-ul paginilor
- multe pagini din runtime sunt inca amestec intre:
  - shell nou
  - compozitie Wave 0
  - wiring vechi
  - automare noua

Concluzia reala:

- problema principala nu este lipsa de backend
- problema principala nu este Vercel ramas in urma
- problema principala este lipsa de aliniere intre:
  - blueprint-ul UX/IA
  - shell-ul nou
  - paginile runtime reale
  - ramurile paralele care au mers in directii diferite

## 2. Canonul real

Ordinea reala a surselor de adevar, conform codului si documentelor active:

1. `docs/final-guide-plan/04-implementation-reference-eos-v1.md`
2. `docs/final-guide-plan/02-ux-ia-blueprint.md`
3. runtime-ul vizual `Evidence OS v1`
4. `docs/final-guide-plan/01-guide-map.md`
5. `docs/final-guide-plan/00-master-source.md`
6. `public/sprinturi-maturizare-compliscan.md`
7. `public/status-arhitectura.md`
8. `public/log-sprinturi-maturizare.md`
9. `public/task-breakdown-tehnic.md`

Regula cheie confirmata de `04-implementation-reference-eos-v1.md`:

`CompliScan final = blueprint nou de IA/UX, implementat peste UI-ul actual Evidence OS v1.`

Asta inseamna:

- `Wave 0 / DS v2` nu este sursa vizuala principala
- `Evidence OS v1` este skin-ul aprobat
- `00-master-source.md` este doctrina mare de produs / automation
- `02-ux-ia-blueprint.md` este contractul pentru structura paginilor si routing

## 3. Git — stare reala

### 3.1 Main

- `main` local = `origin/main`
- commit curent: `c30be91`
- mesaj: `Remove active nav chip from dashboard shell`

Istoric recent relevant pe `origin/main`:

- `c30be91` — remove active nav chip din nav
- `57e67fe` — merge enriched demo scenarios
- `ade240b` — merge Sprint 2-8 automation + GDPR rights + incident checklists + partner/fiscal UI
- `93ff3c5` — Sprint 8
- `4029a56` — SQL migrations lipsa
- `f1e8572` — Sprint 7
- `6012fbd` — Sprint 6
- `16ec284` — Sprint 5

### 3.2 Branchuri relevante

- `main` — productia actuala
- `codex/eos-v1-blueprint-main` — branch UX/IA + shell/route canonice noi
- `codex/automation-layer-superprompt` — branch separat de automation nou
- `wave0/ux-foundation-ds-v2` — branch de explorare DS v2, neaprobat ca baza finala
- `codex/smart-intake-integration` / `codex/smart-intake-*` — onboarding si prefill
- `feat/gdpr-rights-and-final-gaps` — istoric, deja absorbit

### 3.3 Divergente importante

- `codex/eos-v1-blueprint-main` local `efae590` este `ahead 5` fata de remote
- `wave0/ux-foundation-ds-v2` local `140eeb0` este `ahead 6`
- `codex/automation-layer-superprompt` este local-only la `ad44059`
- `codex/validation-levels-review-ready` local este `behind 1`

### 3.4 Worktree-uri

Total: `8`

Worktree-uri curate:

- `/private/tmp/compliai-eos-v1-blueprint`
- `/private/tmp/compliai-nis2-org-bootstrap`
- `/private/tmp/compliai-policy-hotfix`
- `/private/tmp/compliai-prod-main-clean-20260321`
- `/private/tmp/compliai-security-hotfix`
- `/private/tmp/compliai-smart-intake`

Worktree-uri murdare:

- `/Users/vaduvageorge/Desktop/CompliAI`
  - are 3 docs noi necomise in `docs/final-guide-plan/`
- `/private/tmp/compliai-release-slice-check`
  - are modificari tracked locale

### 3.5 Ce e murdar acum in repo principal

`git status --short` pe workspace-ul principal:

- `docs/final-guide-plan/compliscan-api-automatizare (1).md`
- `docs/final-guide-plan/compliscan-automat-vs-manual (1).md`
- `docs/final-guide-plan/compliscan-checkpoint-utilizatori (1).md`

Verdict:

- istoricul `main` este curat
- workspace-ul principal nu este complet curat

## 4. Vercel + production

### 4.1 Production curenta

Production este sincronizata cu `main`.

- alias live: `https://compliscanag.vercel.app`
- deploy live curent: `compliscanag-aq2350123-danielvaduva994-5152s-projects.vercel.app`
- commit live: `c30be91666cb585f4389c5b0ea4d4d4d2f1c052d`

Concluzie:

- `production` nu este in urma fata de `main`
- daca UX-ul live arata hibrid, nu e din cauza ca Vercel a ramas pe cod vechi
- este pentru ca `main` insusi este hibrid la nivel de pagini

### 4.2 Provenanta deploy

Semnal de urmarit:

- metadata deployurilor recente arata `gitDirty: "1"`

Asta nu schimba faptul ca buildul live pointeaza la commitul corect, dar inseamna ca deploy provenance-ul nu arata ca "snapshot strict curat" in metadata Vercel.

## 5. Sentry

### 5.1 Wiring in cod

Integrarea Sentry este prezenta:

- `next.config.ts`
- `instrumentation.ts`
- `instrumentation-client.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `lib/server/sentry-cron.ts`

### 5.2 Production env

Pe production exista:

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_ENVIRONMENT`

Lipseste explicit:

- `SENTRY_RELEASE` ca env separat

Dar codul cade pe `VERCEL_GIT_COMMIT_SHA`, deci release-ul ar trebui derivat automat.

### 5.3 Verdict

- Sentry este cablat si setat pe production
- preview/dev nu au aceleasi env-uri
- nu am dovada in acest audit de ingest live direct din Sentry UI/API
- dar la nivel de wiring + env-uri, production este aliniata

## 6. Hartă mare a codului

Numere utile:

- `app/api/*` = `169` fisiere totale (inclusiv teste)
- `app/api/*` = `113` route files reale
- `app/dashboard/*` = `46` fisiere
- `components/compliscan/*` = `60` fisiere
- `components/evidence-os/*` = `65` fisiere
- `lib/compliance + lib/server` = `210` fisiere

Concluzie:

- aplicatia nu mai este MVP mic
- este suficient de mare incat fara canon clar produce haos foarte repede

## 7. UX / IA / UI / DS — starea reala

### 7.1 Ce este aprobat

Formula aprobata:

- `UX/IA` noua din `02-ux-ia-blueprint.md`
- `UI vizual` din runtime-ul `Evidence OS v1`

### 7.2 Ce nu este aprobat

Nu este directie finala:

- `wave0/ux-foundation-ds-v2`
- `compliscan-ui-prompt.md` ca sursa vizuala primara
- `03-ux-wireframe-prototype.jsx` ca implementare

### 7.3 De ce e amestecat acum

Cronologia reala:

1. Wave 0 a construit pagini noi pe DS v2
2. Blueprint-ul UX/IA a definit IA corecta
3. Automation Layer a adaugat multa logica si backend
4. Paginile runtime nu au fost restructurate complet dupa blueprint

Rezultat:

- shell nou
- nav nou
- automare noua
- dar corpuri de pagini inca hibride

### 7.4 Shell-ul live

Shell-ul nou este live si real:

- `Acasa`
- `Scaneaza`
- `De rezolvat`
- `Rapoarte`
- `Setari`

Surse:

- `components/compliscan/dashboard-shell.tsx`
- `components/compliscan/navigation.ts`

Contractul de rute care il sustine este in:

- `lib/compliscan/dashboard-routes.ts`

### 7.5 Evaluare pagini canonice

#### Acasa

Status: `Hibrid`

Ce are bun:

- shell corect
- legal framing
- next action
- health / readiness

Probleme:

- onboarding/intake sta in aceeasi suprafata cu dashboardul executiv
- prea multe semnale secundare
- framework readiness si sumarul operational concureaza cu actiunea principala

#### Scaneaza

Status: `Hibrid spre bun`

Ce are bun:

- `scan` este ruta canonica
- `scan/results/[scanId]` exista
- `scan/history` exista
- flow-ul activ este separabil de istoric

Probleme:

- intern inca exista tabs si naming de punte:
  - `Verdicts`
  - `Istoric documente`
  - componente de tip `PillarTabs`
- pentru `manifest` / `yaml`, unele CTA-uri si copy inca trimit mental spre vechiul `Control`

#### De rezolvat

Status: `P0 de refacere structurala`

Ce are bun:

- pagina canonica exista: `/dashboard/resolve`
- ruta de detaliu exista: `/dashboard/resolve/[findingId]`
- exista tabs pe framework
- exista queue + task/finding surfaces

Probleme:

- in runtime inca arata ca board vechi de task-uri, nu ca `finding queue + resolution inline`
- prea multe blocuri auxiliare
- prea multe actiuni concurente
- semnalul principal se pierde
- desi exista queue si intent nou, pagina inca mai poarta semnale de punte spre `Vault / Rapoarte`

#### Rapoarte

Status: `Bun la nivel de top-level, dar dens`

Ce are bun:

- ruta canonica exista
- sub-rute exista:
  - `reports/vault`
  - `reports/audit-log`
  - `reports/policies`
  - `reports/trust-center`

Probleme:

- snapshot + export + counsel + partner + inspector + support sunt prea dense intr-o singura experienta
- `Vault` mai poarta copy de mostenire din familia veche `Dovada`

#### Setari

Status: `Hibrid spre administrativ corect`

Ce are bun:

- tabs administrative exista
- `settings` este ruta canonica noua

Probleme:

- prea multa copie explicativa / handoff
- inca nu este un ecran scurt, administrativ, strict operational
- exista si devieri de recipe prin tabs extra, de ex. `Notificari`

### 7.6 Verdict UX/IA

Stare reala:

- shell nou: `da`
- blueprint implementat complet in runtime: `nu`
- fundatie buna: `da`
- pagini complet curatate: `nu`

Formula corecta:

`IA noua la nivel de shell si routing principal + pagini runtime hibride`

### 7.7 Ce este inca vechi, dar activ

Modelul secundar de navigatie pe pilonii vechi este inca activ in runtime:

- `Control`
- `Dovada`

Unde se vede:

- `components/compliscan/pillar-tabs.tsx`
- `components/compliscan/navigation.ts` pe zonele secundare
- pagini suport precum:
  - `app/dashboard/sisteme/page.tsx`
  - `app/dashboard/alerte/page.tsx`
  - `app/dashboard/documente/page.tsx`
  - `app/dashboard/asistent/page.tsx`

Concluzie:

- shell-ul nou este real
- dar interiorul produsului continua sa ruleze ca bridge peste vechile familii `Control / Dovada`

## 8. Evidence OS v1 vs Wave 0 / DS v2

### Evidence OS v1

Este sistemul vizual aprobat pentru runtime-ul final.

Semne clare:

- `components/evidence-os/*`
- `eos-*` classes / tokens
- `DashboardShell` si shell runtime aliniat la acest stil

Rol:

- skin-ul final aprobat

### Wave 0 / DS v2

Este:

- branch de explorare
- sandbox
- sursa optionala de idei

Nu este:

- baza finala de UI
- baza live aprobata

Rol:

- referinta istorica
- nu se promoveaza automat

### Verdict

- `Evidence OS v1` = canon vizual runtime
- `Wave 0` = experiment

## 9. Routing: canon vs legacy

### Canon nou

Canonul aprobat:

- `/dashboard`
- `/dashboard/scan`
- `/dashboard/scan/results/[scanId]`
- `/dashboard/resolve`
- `/dashboard/resolve/[findingId]`
- `/dashboard/reports`
- `/dashboard/reports/vault`
- `/dashboard/reports/audit-log`
- `/dashboard/reports/policies`
- `/dashboard/settings`

### Legacy inca prezent in repo

Mai exista rute / punți istorice:

- `/dashboard/scanari`
- `/dashboard/checklists`
- `/dashboard/rapoarte`
- `/dashboard/setari`
- `/dashboard/politici`
- `/dashboard/audit-log`
- plus alte suprafete vechi:
  - `alerte`
  - `asistent`
  - `documente`
  - `conformitate`
  - `sisteme`

Verdict:

- routingul nou exista
- legacy-ul nu a disparut complet
- o parte este intentional pastrata ca punte
- o parte inca polueaza claritatea produsului

Observatie importanta:

- aliasurile vechi de top-level nu mai detin propriul UI; multe sunt redirecturi simple
- dar familiile vechi de lucru continua sa existe ca suprafete reale sub shell-ul nou

## 10. Automation Layer

### 10.1 Ce este pe `main`

`main` contine deja foarte mult din Automation Layer:

- Sprint 5, 6, 7, 8 din seria noua sunt in istoricul principal
- `origin/main` include:
  - `f1e8572` Sprint 7
  - `93ff3c5` Sprint 8
  - plus merge-ul `ade240b`

### 10.2 Ce exista in cod

Cronuri noi existente:

- `app/api/cron/score-snapshot/route.ts`
- `app/api/cron/daily-digest/route.ts`
- `app/api/cron/audit-pack-monthly/route.ts`
- `app/api/cron/inspector-weekly/route.ts`
- `app/api/cron/vendor-sync-monthly/route.ts`
- `app/api/cron/legislation-monitor/route.ts`
- `app/api/cron/partner-monthly-report/route.ts`
- `app/api/cron/vendor-review-revalidation/route.ts`

Module de automation existente:

- `lib/score-snapshot.ts`
- `lib/legislation-monitor.ts`
- `lib/compliance/task-auto-apply.ts`
- `lib/compliance/vendor-prefill.ts`
- `lib/compliance/evidence-quality.ts`
- `lib/compliance/efactura-prefill-inference.ts`
- `lib/compliance/nis2-tool-importer.ts`
- `lib/compliance/one-page-report.ts`
- `lib/compliance/response-pack.ts`

### 10.3 Ce este real vs partial

Real:

- `10` cron jobs declarate in `vercel.json`
- `agent-orchestrator` ruleaza familii reale de agenti:
  - `compliance_monitor`
  - `fiscal_sensor`
  - `document`
  - `vendor_risk`
  - `regulatory_radar`
- exista manual:
  - `agent run`
  - `agent commit`
  - run history persistat
- release readiness, app health, Supabase strict preflight si RLS verification sunt reale

Partial:

- `Agent OS` nu este complet autonom:
  - `runDriftAgent`
  - `runEvidenceAgent`
  sunt inca placeholder / incomplet legate
- e-Factura automation nu este complet end-to-end
- `audit-pack-monthly` trimite reminder, nu livreaza autonom un pachet complet
- `partner-monthly-report` si unele flow-uri partner raman euristice
- unele documente vorbesc despre `hybrid` mai mult decat face codul efectiv

Lipsa / slab reprezentat:

- nu exista dovada in acest audit pentru un flux live complet `ANAF OAuth + polling + download + persist`
- parity intre analytics cod si schema nu este demonstrata complet

### 10.4 Smart intake / prefill

Documentul `docs/smart-intake-prefill-wave-plan.md` spune explicit:

- `Wave 1.1` si `Wave 2.1 -> 2.10` sunt live pe `origin/main`

Asta inseamna ca onboardingul inteligent si prefill-ul au intrat mult mai departe decat impresia initiala.

### 10.5 Verdict

- backend-ul si automarea sunt avansate
- problema nu este lipsa de motor
- problema este ca paginile nu au fost simplificate pe masura cresterii motorului

## 11. Backend / API / infrastructura

### 11.1 Ce e puternic deja

- Auth local + Supabase/hybrid
- tenancy si memberships
- evidence private storage
- audit pack / response pack / exports
- NIS2 incidents + maturity + vendor review
- e-Factura integration
- AI inventory + AI compliance pack
- OCR cu Google Vision
- cron orchestration
- release readiness + app health

### 11.2 Suprafata API

Suprafata API este mare si reala:

- `113` route files sub `app/api`

Clustere mari:

- `auth` = `11`
- `nis2` = `11`
- `cron` = `10`
- `integrations` = `8`
- `exports` = `5`
- `reports` = `5`

Principalele familii:

- identitate / tenancy
- scan / OCR / findings / tasks / drifts
- AI systems / AI conformity / traceability
- NIS2 / vendor review / fiscal / e-Factura
- partner / reports / exports
- ops / health / release-readiness / analytics / notifications

### 11.2 Ce inseamna asta

Produsul are fundatie de platforma mai matura decat pare la prima vedere.

Haosul perceput vine in mare din:

- naming mixt
- route sprawl
- pages composition sprawl
- docs sprawl

Nu din lipsa de backend.

### 11.3 Infrastructura integrata

Supabase:

- tenancy, auth, org state, evidence objects, plan state, notifications, vendor reviews, `nis2_state`
- storage privat
- status checks, keepalive, strict preflight, RLS verification

Resend:

- onboarding
- alerts
- daily/weekly digest
- score drop
- privacy deletion request

Vision:

- OCR in scan workflow prin Google Cloud Vision

Gemini:

- analiza semantica
- assistant/chat

Stripe:

- checkout
- portal
- webhook
- plan/trial persistence

Sentry:

- instrumentare client/server/edge
- cron telemetry

### 11.4 Persistenta si state

State principal per org:

- `orgProfile`
- `applicability`
- `orgProfilePrefill`
- `intakeAnswers`
- `findings`
- `tasks`
- `alerts`
- `generatedDocuments`
- `events`
- `snapshots`
- `drift settings / records`
- `compliance streak`

State specializat:

- AI systems
- detected AI systems
- conformity overrides
- traceability reviews
- vendor review
- NIS2 incidents / maturity / governance
- fiscal / e-Factura signals
- notifications
- policy acknowledgments
- plan / billing state
- agent run history
- score snapshots
- legislation hashes

Observatie:

- exista simultan suprafata cloud si locala
- cloud-primary este real
- dar compatibilitatea locala inca exista prin `.data/*` si legacy stores

## 12. Mismatch-urile mari

### M1 — Shell nou, corpuri vechi/hybride

Avem shell nou, dar paginile nu au fost curatate complet.

### M2 — Blueprint scris, dar neaplicat complet

`02-ux-ia-blueprint.md` spune clar ce trebuie sa fie fiecare pagina, dar runtime-ul actual nu respecta inca aceasta disciplina pagina cu pagina.

### M2b — Documentatia publica si runtime-ul nu mai spun acelasi lucru

Mai exista documente publice care descriu:

- vechiul shell `Dashboard / Scanare / Control / Dovada / Setari`
- pagini sau componente care nu mai exista
- trasee care au fost deja remapate in noul canon

Exemple de drift:

- `public/gpt-ux-flow-brief.md`
- `public/ux-ui-flow-arhitectura.md`
- `public/evidence-os-design-system-v1.md`
- `public/page-recipes-dashboard-scanare-2026-03-14.md`
- `public/page-recipes-setari-2026-03-14.md`

### M3 — Main si production sunt curate ca istoric, dar experienta e tot haotica

Asta demonstreaza ca problema nu este deploy-ul, ci produsul live actual.

### M4 — Prea multe suprafete istorice

Avem simultan:

- canon nou
- rute bridge
- pagini vechi
- worktree-uri active
- branchuri exploratorii

### M5 — Docs sprawl

Exista prea multe documente paralele:

- public canon vechi
- final-guide-plan
- wave plans
- archive
- docs noi necomise

### M6 — Runtime-ul actual nu este "vechi", este "hibrid"

Este important sa nu confundam lucrurile:

- nu avem doar pagini vechi nedeployate
- nu avem doar cache prost in browser
- avem runtime nou la shell + runtime mixt in pagini

De aceea userul percepe corect haosul chiar daca `production = main`.

## 13. Ce este curat vs murdar

### Curat

- `main` vs `origin/main`
- `production` vs `main`
- `codex/eos-v1-blueprint-main` worktree-ul lui este curat
- Sentry wiring in cod

### Murdar

- workspace-ul principal are docs untracked
- `release-slice-check` worktree e murdar
- branch sprawl in jurul `wave0`, `eos-v1`, `automation`, `smart-intake`
- runtime-ul UX este hibrid

## 14. Ce este canonic acum

Canonic:

- `main`
- `production`
- `02-ux-ia-blueprint.md`
- `04-implementation-reference-eos-v1.md`
- `Evidence OS v1`

Ne-canonic / secundar:

- `wave0/ux-foundation-ds-v2`
- prototipurile `03-*`
- DS v2 ca directie finala

## 15. Ce trebuie analizat dupa acest document

Nu trebuie sa mai analizam "ce credem ca e produsul".
Trebuie sa analizam numai:

1. ce pagini raman canonice
2. ce rute vechi devin doar punte
3. ce blocuri se taie din:
   - `Acasa`
   - `De rezolvat`
   - `Rapoarte`
   - `Setari`
4. ce worktree/branch se arhiveaza sau se separa
5. ce docs devin:
   - canon
   - istoric
   - junk de sters

## 16. Rezumat final

Realitatea proiectului la `2026-03-21` este:

- avem un motor de produs mai matur decat arata UI-ul
- avem un shell UX/IA nou live
- avem pagini care nu au fost refacute complet dupa blueprint
- avem ramuri si worktree-uri care au mers in paralel si au amestecat perceptia

Formularea cea mai precisa:

`CompliScan are motor nou + shell nou + runtime de pagini inca hibrid.`

Acest document exista ca sa oprim orice discutie vaga de tip:

- "cred ca e vechi"
- "cred ca e nou"
- "cred ca Vercel e in urma"

Nu.

Starea reala este:

- `production = main`
- `main = hibrid`
- `canonul exista`
- `runtime-ul final inca nu e curatat complet dupa canon`
