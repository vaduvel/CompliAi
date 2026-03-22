# MASTER AUDIT CANONIC CompliScan

Data: `2026-03-22`
Repo: `CompliAI`
Scop: un singur document de adevar pentru starea reala a proiectului, unificat din:

- `docs/inventar-total-stare-proiect-2026-03-21.md`
- `docs/AUDIT-COMPLET-COMPLIAI.md`
- starea live din `git`, `worktree`, `main` si `production`

---

## 1. Verdict executiv

Produsul nu este in urma pe Vercel si nu sufera in primul rand de lipsa de backend.

Starea reala este:

- `main` si `production` sunt sincronizate
- shell-ul nou `Acasa / Scaneaza / De rezolvat / Rapoarte / Setari` este live
- `Evidence OS v1` este skin-ul vizual aprobat pentru runtime
- `Wave 0 / DS v2` nu este baza finala aprobata
- backend-ul si Automation Layer sunt mai avansate decat UX-ul paginilor
- multe pagini runtime sunt inca hibride: shell nou + compozitie veche + automation noua

Concluzia corecta:

- problema principala nu este ca Vercel a ramas pe cod vechi
- problema principala nu este lipsa de functionalitate
- problema principala este lipsa de aliniere intre:
  - blueprint-ul UX/IA
  - shell-ul nou
  - paginile runtime reale
  - branchurile paralele
  - vechile familii de suprafete (`Control`, `Dovada`)

---

## 2. Ordinea surselor de adevar

Ordinea canonica este:

1. `docs/final-guide-plan/04-implementation-reference-eos-v1.md`
2. `docs/final-guide-plan/02-ux-ia-blueprint.md`
3. runtime-ul vizual `Evidence OS v1`
4. `docs/inventar-total-stare-proiect-2026-03-21.md`
5. prezentul document `docs/MASTER-AUDIT-CANONIC-2026-03-22.md`
6. `docs/AUDIT-COMPLET-COMPLIAI.md` ca anexa tehnica detaliata
7. `docs/final-guide-plan/00-master-source.md`
8. `public/sprinturi-maturizare-compliscan.md`
9. `public/status-arhitectura.md`
10. `public/log-sprinturi-maturizare.md`
11. `public/task-breakdown-tehnic.md`

Regula de produs:

`CompliScan final = blueprint nou de UX/IA implementat peste UI-ul actual Evidence OS v1.`

Asta inseamna:

- `Wave 0 / DS v2` este referinta de explorare, nu canon vizual live
- `00-master-source.md` este doctrina mare de produs / automation
- `02-ux-ia-blueprint.md` este contractul pentru structura paginilor si routing

---

## 3. Starea Git corectata

### 3.1 Main

- branch activ principal: `main`
- `main` local = `origin/main`
- commit curent: `c30be91`
- mesaj: `Remove active nav chip from dashboard shell`

Istoric recent relevant pe `main`:

- `c30be91` - nav shell cleanup
- `57e67fe` - demo enrichment merge
- `ade240b` - automation + GDPR rights + incident checklists + partner/fiscal UI
- `93ff3c5` - Sprint 8
- `4029a56` - SQL migrations lipsa
- `f1e8572` - Sprint 7
- `6012fbd` - Sprint 6
- `16ec284` - Sprint 5

### 3.2 Branchuri relevante

- `main` - productia actuala
- `codex/eos-v1-blueprint-main` - branch activ de UX/IA + shell/rute canonice
- `codex/automation-layer-superprompt` - branch local separat de automation
- `wave0/ux-foundation-ds-v2` - branch de explorare DS v2, neaprobat ca baza finala
- `codex/smart-intake-integration` / `codex/smart-intake-*` - onboarding si prefill
- `feat/gdpr-rights-and-final-gaps` - istoric, deja absorbit

### 3.3 Divergente importante

La data acestui audit:

- `codex/eos-v1-blueprint-main` este `ahead 5`
- `wave0/ux-foundation-ds-v2` este `ahead 6`
- `codex/automation-layer-superprompt` este local-only la `ad44059`
- `codex/validation-levels-review-ready` este `behind 1`

Corectie fata de auditul vechi:

- `codex/eos-v1-blueprint-main` NU trebuie descris ca `arhivat`
- este branch activ, cu worktree activ

### 3.4 Worktree-uri

Total corect: `8`

Lista:

- `/Users/vaduvageorge/Desktop/CompliAI`
- `/private/tmp/compliai-eos-v1-blueprint`
- `/private/tmp/compliai-nis2-org-bootstrap`
- `/private/tmp/compliai-policy-hotfix`
- `/private/tmp/compliai-prod-main-clean-20260321`
- `/private/tmp/compliai-release-slice-check`
- `/private/tmp/compliai-security-hotfix`
- `/private/tmp/compliai-smart-intake`

Corectie fata de auditul vechi:

- nu sunt `7`
- nu sunt `toate in /tmp`
- workspace-ul principal intra si el in realitatea operationala

### 3.5 Workspace murdar

Workspace-ul principal nu este complet curat.

`git status --short` arata in prezent:

- `docs/AUDIT-COMPLET-COMPLIAI.md`
- `docs/inventar-total-stare-proiect-2026-03-21.md`
- `docs/final-guide-plan/compliscan-api-automatizare (1).md`
- `docs/final-guide-plan/compliscan-automat-vs-manual (1).md`
- `docs/final-guide-plan/compliscan-checkpoint-utilizatori (1).md`

Verdict:

- istoricul `main` este curat
- workspace-ul principal NU este complet curat

---

## 4. Vercel si production

### 4.1 Production

Production este sincronizata cu `main`.

- alias live: `https://compliscanag.vercel.app`
- deploy live curent: `compliscanag-aq2350123-danielvaduva994-5152s-projects.vercel.app`
- commit live: `c30be91666cb585f4389c5b0ea4d4d4d2f1c052d`

Concluzie:

- `production` nu este in urma fata de `main`
- daca UX-ul live arata hibrid, cauza nu este un deploy vechi
- cauza este ca `main` insusi este hibrid la nivel de pagini

### 4.2 Provenanta deploy

Semnal de urmarit:

- metadata unor deployuri recente indica `gitDirty: "1"`

Asta nu schimba commitul live, dar inseamna ca provenance-ul nu arata ca snapshot perfect curat.

### 4.3 Cron-uri

`vercel.json` contine `10` cron-uri configurate.

Aceasta cifra este compatibila cu auditul tehnic.

---

## 5. Sentry

Sentry este cablat in cod si setat pe production.

Fișiere cheie:

- `next.config.ts`
- `instrumentation.ts`
- `instrumentation-client.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `lib/server/sentry-cron.ts`

Environment variables confirmate pe production:

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_ENVIRONMENT`

Observatie:

- `SENTRY_RELEASE` nu apare explicit ca env separat
- release-ul cade pe `VERCEL_GIT_COMMIT_SHA`

Verdict:

- wiring-ul si env-urile sunt aliniate
- nu exista in acest audit dovada din UI/API Sentry ca ingest-ul live a fost inspectat manual

---

## 6. Inventar mare de cod

Numere corectate:

- `app/api/*` = `169` fisiere totale
- `app/api/*` = `113` route files reale
- `app/dashboard/*` = `46` fisiere
- `components/compliscan/*` = `60` fisiere
- `components/evidence-os/*` = `65` fisiere
- `lib/compliance + lib/server` = `210` fisiere

Concluzie:

- aplicatia nu mai este un MVP mic
- fara canon clar, proiectul produce fragmentare foarte repede

---

## 7. Design System: ce este aprobat

### 7.1 Evidence OS v1

Este sistemul vizual aprobat pentru runtime-ul live.

Semne:

- `components/evidence-os/*`
- `app/evidence-os.css`
- `app/globals.css`
- tokeni `--eos-*`
- shell-ul runtime foloseste acest stil

Caracteristici:

- dark mode
- blue-tinted grays
- accent primar blue-purple

### 7.2 Wave 0 / DS v2

Este:

- branch de explorare
- sursa de idei
- referinta istorica

Nu este:

- baza finala aprobata
- skin live aprobat

Caracteristici:

- warm graphite
- accent emerald
- semantic layers mai curate

### 7.3 Verdict DS

- `Evidence OS v1` = canon vizual live
- `Wave 0 / DS v2` = experiment

---

## 8. UX / IA: starea reala

### 8.1 Ce este corect

Shell-ul nou este live si real:

- `Acasa`
- `Scaneaza`
- `De rezolvat`
- `Rapoarte`
- `Setari`

Surse:

- `components/compliscan/dashboard-shell.tsx`
- `components/compliscan/navigation.ts`
- `lib/compliscan/dashboard-routes.ts`

### 8.2 Ce este inca hibrid

Formula corecta este:

`IA noua la nivel de shell si routing principal + pagini runtime hibride`

Cauza:

1. Wave 0 a construit pagini noi pe DS v2
2. Blueprint-ul UX/IA a definit IA corecta
3. Automation Layer a adaugat multa logica si backend
4. Paginile runtime nu au fost restructurate complet dupa blueprint

Rezultat:

- shell nou
- nav nou
- automare noua
- corpuri de pagini inca hibride

### 8.3 Evaluare pagini canonice

#### Acasa

Status: `Hibrid`

Probleme:

- onboarding/intake concureaza cu dashboardul executiv
- prea multe semnale secundare
- framework readiness si sumarul operational concureaza cu actiunea principala

#### Scaneaza

Status: `Hibrid spre bun`

Probleme:

- tabs si naming de punte inca active intern
- unele CTA-uri si copy trimit mental spre vechiul `Control`

#### De rezolvat

Status: `P0 de refacere structurala`

Probleme:

- pagina exista, dar in runtime inca arata ca board vechi de task-uri
- prea multe blocuri auxiliare
- prea multe actiuni concurente
- semnalul principal se pierde

#### Rapoarte

Status: `Bun la nivel de top-level, dar dens`

Probleme:

- snapshot + export + counsel + partner + inspector + support stau prea dens in aceeasi experienta

#### Setari

Status: `Hibrid spre administrativ corect`

Probleme:

- prea multa copie explicativa
- inca nu este suficient de scurt si administrativ

### 8.4 Ce este vechi, dar inca activ

Modelul secundar bazat pe familiile vechi este inca activ:

- `Control`
- `Dovada`

Unde se vede:

- `components/compliscan/pillar-tabs.tsx`
- diverse pagini suport
- rute extra care nu sunt absorbite in paginile canonice

### 8.5 Verdict UX/IA

- shell nou: `da`
- blueprint implementat complet in runtime: `nu`
- fundatie buna: `da`
- pagini complet curatate: `nu`

---

## 9. Routing: canon vs legacy

### 9.1 Canon nou

Canonul aprobat este:

- `/dashboard`
- `/dashboard/scan`
- `/dashboard/scan/results/[scanId]`
- `/dashboard/scan/history`
- `/dashboard/resolve`
- `/dashboard/resolve/[findingId]`
- `/dashboard/reports`
- `/dashboard/reports/vault`
- `/dashboard/reports/audit-log`
- `/dashboard/reports/policies`
- `/dashboard/reports/trust-center`
- `/dashboard/settings`
- `/dashboard/settings/abonament`

### 9.2 Extra active, dar necanonice

Aceste rute exista si explica de ce produsul se simte amestecat:

- `/dashboard/sisteme`
- `/dashboard/alerte`
- `/dashboard/nis2`
- `/dashboard/nis2/governance`
- `/dashboard/nis2/inregistrare-dnsc`
- `/dashboard/nis2/maturitate`
- `/dashboard/vendor-review`
- `/dashboard/fiscal`
- `/dashboard/agents`
- `/dashboard/generator`
- `/dashboard/asistent`
- `/dashboard/partner`
- `/dashboard/partner/[orgId]`
- `/dashboard/findings/[id]`

Acestea nu trebuie tratate ca dovada ca UX/IA este finalizata.

### 9.3 Redirecturi legacy

Aliasurile/redirecturile inca existente:

- `/dashboard/scanari` -> `/dashboard/scan`
- `/dashboard/documente` -> `/dashboard/reports/policies`
- `/dashboard/politici` -> `/dashboard/reports/policies`
- `/dashboard/audit-log` -> `/dashboard/reports/audit-log`
- `/dashboard/checklists` -> `/dashboard/resolve`
- `/dashboard/rapoarte/*` -> `/dashboard/reports/*`
- `/dashboard/setari/*` -> `/dashboard/settings/*`

Verdict:

- legacy-ul nu mai conduce shell-ul
- dar inca exista ca pod operational

---

## 10. API si backend

### 10.1 Ce este sigur real

Produsul are backend material, nu mock:

- auth si org switching
- OCR / scan / analyze
- findings / tasks / evidence
- notificari
- dashboard / reports / response pack / counsel brief
- NIS2
- e-Factura / fiscal
- cron jobs
- Stripe
- exports
- vendor review
- drift / baseline
- health / diagnostics
- partner / analytics / feedback / policies / documents

### 10.2 Cifre corecte

Inventarul de `113` route files reale este mai corect decat formularea scurta `111 total`.

Auditul tehnic vechi este util ca mapa de suprafete, dar nu trebuie folosit drept total numeric final.

### 10.3 Verdict backend

- backend-ul este substantial si matur
- Automation Layer este mult mai avansat decat UX runtime
- problema curenta nu este "nu exista functionalitate"

---

## 11. Ce pastram din auditul lui Claude

Din `docs/AUDIT-COMPLET-COMPLIAI.md` trebuie pastrate ca anexa tehnica:

- inventarul larg de API routes
- inventarul larg de pagini UI
- inventarul de componente
- comparatia `EOS v1` vs `Wave 0 / DS v2`
- inventarul functionalitate per framework
- lista de probleme structurale

Acestea sunt utile, dar nu au voie sa bata:

- starea actuala `git branch -vv`
- `git worktree list`
- `git status`
- adevarul din `main` si `production`

---

## 12. Corectii explicite fata de AUDIT-COMPLET-COMPLIAI.md

Corectii obligatorii:

1. `codex/eos-v1-blueprint-main` nu este `arhivat`
2. worktree-uri = `8`, nu `7`
3. nu sunt toate in `/tmp`
4. `API routes` reale = `113`, nu tratam `111 total` ca numar final
5. workspace-ul principal are mai multe fisiere neversionate decat lista veche
6. `production` si `main` sunt sincronizate; live-ul hibrid nu vine din deploy vechi

---

## 13. Verdict final

Acesta este adevarul operational de azi:

- `main` = `production`
- shell-ul nou este live
- `Evidence OS v1` este canonul vizual
- `Wave 0 / DS v2` ramane experiment
- backend-ul si automation-ul sunt reale si puternice
- UX/IA nu este finalizata in runtime
- paginile sunt inca hibride

Tradus simplu:

- nu mai avem problema de infrastructura
- nu mai avem problema de "nu exista produs"
- avem problema de aliniere si simplificare structurala

Acesta este documentul care trebuie folosit ca baza pentru:

- audituri viitoare
- cleanup UX runtime
- decizii de merge / branch
- mapare canon vs hybrid vs legacy

