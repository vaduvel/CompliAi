# CompliScan — Audit Vercel vs main vs handoff Claude

Status: `live surface audit`
Date: `2026-03-23`
Scope: productie Vercel, `main`, comparatie cu documentul de handoff pentru Claude.

## 1. Ce am comparat

Am comparat trei surse:

- `main` local si `origin/main`
- productia din Vercel pentru proiectul `compliscanag`
- documentul de handoff: `docs/canon-final/COMPLISCAN-CLAUDE-WEB-FULL-SPEC.md`

Important:

- in lipsa unui transcript separat din Claude Web, comparatia reala se face cu documentul pe care urmeaza sa i-l dam lui Claude

## 2. Ce este confirmat in Vercel

### 2.1 Proiectul si aliasul live

Confirmat in Vercel:

- proiect: `compliscanag`
- alias public productie: `https://compliscanag.vercel.app`
- alias secundar: `https://compliscanag-danielvaduva994-5152s-projects.vercel.app`
- domenii custom atasate in acest scope Vercel: `0`

Observatie importanta:

- URL-ul brut al deployment-ului de productie poate raspunde `401` la nivel de Vercel
- aliasul `compliscanag.vercel.app` este public si este adevarul operational verificat in acest audit

### 2.2 Productia este chiar din `main`

Confirmat in metadata Vercel:

- branch live: `main`
- commit live: `878274882220e8647853383057923fed7254f977`
- short SHA: `8782748`
- mesaj commit live: `Fix onboarding continuation via session user mode fallback`
- deployment creat la: `2026-03-23 07:58:49 EET`

Confirmat local:

- `HEAD`
- `main`
- `origin/main`

toate indica acelasi commit `8782748`.

Verdict:

- ce este live in Vercel este aliniat cu `main` in momentul acestui audit

### 2.3 Cron-urile live

Inspectia JSON a deployment-ului de productie confirma exact cron-urile din `vercel.json`:

- `/api/cron/agent-orchestrator` -> `0 6 * * *`
- `/api/cron/vendor-review-revalidation` -> `0 7 * * *`
- `/api/cron/legislation-monitor` -> `0 7 * * *`
- `/api/cron/score-snapshot` -> `50 7 * * *`
- `/api/cron/daily-digest` -> `0 8 * * *`
- `/api/cron/inspector-weekly` -> `0 8 * * 1`
- `/api/cron/weekly-digest` -> `30 8 * * 1`
- `/api/cron/audit-pack-monthly` -> `0 9 1 * *`
- `/api/cron/vendor-sync-monthly` -> `0 10 1 * *`
- `/api/cron/partner-monthly-report` -> `0 9 2 * *`

Verdict:

- productia Vercel este aliniata cu `vercel.json`

## 3. Ce functionalitati sunt confirmate live

### 3.1 Public si accesibil pe aliasul live

Rute confirmate cu raspuns `200`:

- `/`
- `/pricing`
- `/login`
- `/reset-password`
- `/claim`
- `/demo/imm`
- `/terms`
- `/privacy`
- `/dpa`
- `/genereaza-dpa`
- `/genereaza-politica-gdpr`

Ce inseamna asta:

- landing si pricing sunt live public
- auth entry points sunt live public
- flow-urile publice de claim, demo si generatoare publice sunt live public
- paginile legale sunt live public

### 3.2 Exista in productia build-uita, dar nu sunt publice fara sesiune

Rute confirmate cu redirect `307` spre `/login`:

- `/onboarding`
- `/dashboard`
- `/portfolio`

Ce inseamna asta:

- aceste suprafete sunt live si build-uite, dar nu trebuie descrise ca publice
- pentru audit functional real pe aceste zone este nevoie de sesiune valida

### 3.3 Exista in build-ul de productie

Inspectia build-ului de productie confirma ca sunt generate in runtime si aceste suprafete:

- shell-ul modern `/dashboard`, `/dashboard/scan`, `/dashboard/resolve`, `/dashboard/reports`, `/dashboard/settings`
- suprafete avansate sau legacy precum:
  - `/dashboard/agents`
  - `/dashboard/alerte`
  - `/dashboard/asistent`
  - `/dashboard/checklists`
  - `/dashboard/conformitate`
  - `/dashboard/documente`
  - `/dashboard/fiscal`
  - `/dashboard/generator`
  - `/dashboard/nis2`
  - `/dashboard/nis2/governance`
  - `/dashboard/nis2/inregistrare-dnsc`
  - `/dashboard/nis2/maturitate`
  - `/dashboard/vendor-review`
  - `/dashboard/scan/history`
  - `/dashboard/scan/results/[scanId]`
- portfolio:
  - `/portfolio`
  - `/portfolio/alerts`
  - `/portfolio/reports`
  - `/portfolio/tasks`
  - `/portfolio/vendors`
- trust:
  - `/trust/[orgId]`

Verdict:

- documentatia care spune ca shell-ul e simplificat dar runtime-ul contine si rute avansate este corecta

## 4. Comparatie cu documentul pentru Claude

### 4.1 Ce era corect

Documentul de handoff era corect pe:

- produsul live este mare si real, nu un mock
- exista separarea `org` vs `portfolio`
- exista shell canonic simplificat si rute legacy/avansate in paralel
- NIS2, vendor review, reports, trust, claim si demo exista in runtime
- cron-urile trebuie citite din `vercel.json`, nu din comentarii vechi

### 4.2 Ce era prea vag

Documentul era prea vag pe productie:

- spunea prudent ca nu trebuie afirmat un singur domeniu live verificat
- acum avem confirmare concreta pentru aliasul Vercel `https://compliscanag.vercel.app`

Corectia buna:

- putem afirma aliasul Vercel ca productie confirmata
- nu putem afirma din acest audit un domeniu brand custom, pentru ca in Vercel sunt `0` domenii custom atasate in acest scope

### 4.3 Ce era gresit

Gap-ul real din document:

- `/onboarding` fusese listat ca ruta publica principala

Realitatea live:

- `/onboarding` exista, dar fara sesiune face redirect `307` spre `/login`

Verdict:

- `onboarding` este live, dar nu este public

## 5. Gaps reale intre live si handoff

### Gap 1

- handoff-ul spunea implicit ca nu avem productie verificata
- auditul Vercel confirma productie verificata pe aliasul `compliscanag.vercel.app`

### Gap 2

- handoff-ul lista `/onboarding` in shell public
- live-ul il trateaza ca session-gated

### Gap 3

- handoff-ul era prudent cu domeniile brand, dar nu spunea explicit ca in Vercel nu exista domenii custom atasate in acest scope
- auditul live confirma `0` domenii custom

## 6. Verdict final

Aplicatia live din Vercel este aliniata cu `main` si cu mare parte din documentul de handoff pentru Claude.

Nu ii dam lui Claude "jumatai" daca folosim forma corectata a documentatiei, dar trebuie tinute minte doua lucruri:

- adevarul live confirmat este `https://compliscanag.vercel.app`
- `/onboarding` nu este public, ci session-gated

## 7. Ce trebuie dat mai departe

Pentru un handoff sigur:

- `docs/canon-final/COMPLISCAN-CLAUDE-WEB-FULL-SPEC.md`
- `docs/canon-final/COMPLISCAN-58-LA-80-AUTOMATIZARE-CANON.md`
- `docs/canon-final/COMPLISCAN-VERCEL-MAIN-LIVE-AUDIT-2026-03-23.md`

Rolurile lor:

- `FULL-SPEC` = ce este produsul
- `58-LA-80` = ce vrem sa imbunatatim
- `VERCEL-MAIN-LIVE-AUDIT` = ce este confirmat live acum si unde documentatia trebuia ajustata
