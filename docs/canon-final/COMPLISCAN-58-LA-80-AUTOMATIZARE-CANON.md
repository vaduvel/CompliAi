# CompliScan — De la 58% la 80% Automatizare (varianta canonizata)

Status: `execution handoff`
Date: `2026-03-23`
Repo: `CompliAI`
Baza: `cod real + COMPLISCAN-CLAUDE-WEB-FULL-SPEC.md + comparatie cu COMPLISCAN-58-LA-80-AUTOMATIZARE.md`

## 1. Ce este acest document

Acest document nu inlocuieste spec-ul mare al produsului.

Rolul lui este mai ingust:

- normalizeaza backlog-ul de automatizare astfel incat sa foloseasca conceptele reale din cod
- elimina afirmatiile care nu mai sunt adevarate in runtime
- lasa un plan pe care Claude Web il poate urma fara sa inventeze structuri paralele

Documentul original din Downloads este util ca directie, dar contine cateva simplificari prea agresive.
Aceasta varianta este cea sigura de folosit daca vrem implementare, nu doar brainstorming.

## 2. Corectii obligatorii fata de varianta veche

### 2.1 Agent OS nu mai este "placeholder pur"

In cod exista deja implementari reale pentru:

- `runIntakeAgent`
- `runFindingsAgent`
- `runDriftAgent`
- `runEvidenceAgent`

Fisiere relevante:

- `lib/compliance/agent-runner.ts`
- `lib/compliance/route.ts`
- `app/api/agent/commit/route.ts`

Ce este inca incomplet:

- comentariile din `lib/compliance/route.ts` spun inca `Placeholder` pentru drift/evidence
- `drift` este in mare parte euristic si foloseste adesea comparatii presupuse, nu baseline-ul validat din stare
- `evidence` produce un `EvidenceProposal`, dar commit-ul Agent OS nu persista aceasta zona in task/evidence ledger

Concluzie:

- Agent OS este functional
- dar nu este inca matur end-to-end pentru drift defensibil si evidence orchestration completa

### 2.2 Scoring-ul canonic exista deja

Nu este corect sa spunem ca scorul traieste doar inline in dashboard.

Sursa canonica actuala este:

- `lib/compliance/engine.ts`
  - `normalizeComplianceState`
  - `computeDashboardSummary`

Consumatori reali:

- `app/api/cron/score-snapshot/route.ts`
- `lib/server/dashboard-response.ts`
- `app/api/reports/*`
- `app/api/partner/clients/[orgId]/route.ts`
- multe suprafete UI care consuma `data.summary.score`

Ce este inca imperfect:

- unele derivate folosesc in continuare proxy-uri partiale, de exemplu `app/api/benchmark/route.ts` foloseste `state.gdprProgress`
- nu exista o disciplina unica pentru toate scorurile derivate si pentru toti triggerii de recalcul semantic

Concluzie:

- problema reala nu este lipsa totala a scoring-ului canonic
- problema este convergenta incompleta in jurul acelui scor canonic

### 2.3 NIS2 assessment nu este "18 intrebari complet manuale"

In codul actual:

- modelul NIS2 are `20` intrebari, nu `18`
- store-ul dedicat este separat de `ComplianceState`

Fisiere relevante:

- `lib/compliance/nis2-rules.ts`
- `app/api/nis2/assessment/route.ts`
- `lib/server/nis2-store.ts`
- `app/dashboard/nis2/page.tsx`

Concluzie:

- backlog-ul bun aici nu trebuie sa promita `13/18` fara audit punctual
- trebuie sa vorbeasca despre `prefill cu confidence pentru subsetul de intrebari care au sursa reala`

### 2.4 DNSC Wizard nu este complet manual dupa pasul 1

Exista deja:

- eligibilitate bazata pe `applicability`
- prefill in pasul de verificare pentru:
  - nume organizatie
  - CUI
  - sector
  - dimensiune companie
- generare draft markdown prin `buildDNSCNotificationDraft`

Fisiere relevante:

- `app/dashboard/nis2/inregistrare-dnsc/page.tsx`
- `lib/compliance/dnsc-wizard.ts`

Ce ramane manual:

- adresa sediu
- judet
- persoana responsabila securitate
- email + telefon responsabil
- trimiterea efectiva pe platforma DNSC

### 2.5 Finding -> document generation exista deja partial

Nu este corect sa spunem ca generatorul este complet separat de findings.

In codul actual:

- confirmarea unui finding poate genera automat draft de document daca exista `suggestedDocumentType`
- acest lucru se intampla in `app/api/findings/[id]/route.ts`

Tipuri deja suportate in ruta:

- `privacy-policy`
- `cookie-policy`
- `dpa`
- `nis2-incident-response`
- `ai-governance`

Gap-ul real:

- legatura este mai mult backend-driven decat UX-driven
- lipseste un flow clar `generate -> preview -> approve -> attach as evidence`

## 3. Cum trebuie citit procentul de automatizare

`58% -> 80%` trebuie tratat ca indicator de produs, nu ca metrica exacta verificata automat in cod.

Este util pentru prioritizare, dar nu trebuie prezentat ca:

- scor auditabil
- KPI calculat in runtime
- adevar matematic stabil

Pentru implementare, valorile sigure sunt:

- impact mare / mediu / mic
- complexitate mica / medie / mare
- zile estimate

## 4. Cele 7 initiative, rescrise pe runtime real

### 4.1 Agent OS hardening: drift si evidence conectate la baseline si execution layer

**Stare actuala reala**

- cele patru functii Agent OS exista in `lib/compliance/agent-runner.ts`
- `runDriftAgent` genereaza propuneri utile, dar multe comparatii sunt fata de un baseline presupus "safe"
- `runEvidenceAgent` intoarce `auditReadiness`, `missingEvidence` si checklist, dar `app/api/agent/commit/route.ts` nu persista zona de evidence
- `lib/compliance/route.ts` are comentarii stale care inca spun `Placeholder`

**Ce trebuie facut**

- leaga drift-ul de `validatedBaselineSnapshotId`, `snapshotHistory` si helper-ele din:
  - `lib/server/compliance-drift.ts`
  - `app/api/state/baseline/route.ts`
  - `lib/server/mvp-store.ts`
- transforma `EvidenceProposal` in una sau ambele forme:
  - sugestii de task/evidence upload in `De rezolvat`
  - intrari reutilizabile pentru traceability/evidence reuse
- curata comentariile stale din `lib/compliance/route.ts`
- adauga persistenta minima pentru run-uri/bundle-uri daca vrem review repetabil, nu doar return JSON direct

**Nu trebuie facut**

- nu descrie Agent OS ca autonomie completa fara review uman
- nu inchide task-uri sau drifts automat pe baza unui proposal de evidence

**Estimare**

- `4-5 zile`

**Impact**

- `mare`

### 4.2 Audit Pack Monthly: reminder -> generare automata pentru planuri eligibile

**Stare actuala reala**

- `app/api/cron/audit-pack-monthly/route.ts` trimite email cu link spre Vault
- `lib/server/audit-pack.ts` si exporturile dedicate exista deja

**Ce trebuie facut**

- pentru org-uri `pro` / `partner`, cron-ul sa genereze automat audit pack-ul
- salveaza rezultatul in Vault / export registry
- trimite owner-ului:
  - pack gata de review
  - sau lista clara de gaps daca pachetul este incomplet

**Fisiere de atins**

- `app/api/cron/audit-pack-monthly/route.ts`
- `lib/server/audit-pack.ts`
- `lib/server/audit-pack-bundle.ts`
- eventual `app/api/exports/audit-pack/*`

**Regula de produs**

- generare automata da
- validare finala tot umana

**Estimare**

- `2-3 zile`

**Impact**

- `mare`

### 4.3 NIS2 assessment: prefill cu confidence pentru intrebarile care au sursa reala

**Stare actuala reala**

- assessment-ul este salvat prin `app/api/nis2/assessment/route.ts`
- intrebarile sunt definite in `lib/compliance/nis2-rules.ts`
- datele candidate stau in principal in:
  - `orgProfile`
  - `nis2.vendors`
  - `vendorReviews`
  - `nis2.boardMembers`
  - eventual documente deja generate sau scanate

**Ce trebuie facut**

- adauga un strat nou de `assessment prefill` care propune raspunsuri doar pentru intrebari cu sursa clara
- fiecare raspuns propus trebuie sa vina cu:
  - `source`
  - `confidence`
  - explicatie scurta
- utilizatorul confirma sau suprascrie manual

**Exemple de intrebari care pot avea prefill partial**

- supply-chain din `nis2.vendors` si `vendorReviews`
- training management din `boardMembers`
- dimensiune/sector din `orgProfile`
- anumite semnale de continuitate sau incident response doar daca exista dovada explicita, nu prin presupunere

**Nu trebuie facut**

- nu promite `13/18` sau alta cifra fixa fara audit dedicat
- nu marca drept `yes` o intrebare doar pentru ca exista activitate operationala vag corelata

**Fisiere de atins**

- `lib/compliance/nis2-rules.ts`
- `app/api/nis2/assessment/route.ts`
- `lib/server/nis2-store.ts`
- `app/dashboard/nis2/page.tsx`

**Estimare**

- `3-4 zile`

**Impact**

- `mare`

### 4.4 DNSC Wizard enrichment: mai mult prefill, nu reinventare

**Stare actuala reala**

- wizard-ul exista si este bun
- pasul `data-check` arata deja ce este disponibil
- draft-ul markdown se genereaza din `lib/compliance/dnsc-wizard.ts`

**Ce trebuie facut**

- extinde datele pre-completate folosind sursele deja existente:
  - `orgProfile`
  - prefill de organizatie
  - semnale ANAF daca sunt pastrate in profil/prefill
- adauga affordance de productivitate:
  - copy per camp
  - checklist mai clar pentru campurile obligatoriu manuale
  - semnalizarea campurilor lipsa inainte de draft

**Ajustare importanta**

- documentul vechi spunea ca pasii `2-4` sunt complet manuali
- asta nu mai este adevarat si nu trebuie repetat

**Fisiere de atins**

- `app/dashboard/nis2/inregistrare-dnsc/page.tsx`
- `lib/compliance/dnsc-wizard.ts`
- `app/api/org/profile/prefill/route.ts`
- `lib/server/anaf-company-lookup.ts`

**Estimare**

- `2 zile`

**Impact**

- `mediu`

### 4.5 Scoring convergence: acelasi scor canonic peste toate suprafetele

**Stare actuala reala**

- `computeDashboardSummary` este scorul canonic operational
- cron-ul de score snapshot il foloseste deja
- multe exporturi si dashboard-uri il folosesc deja

**Gap real**

- unele suprafete folosesc inca derivate partiale, de exemplu benchmark-ul porneste din `gdprProgress`
- nu exista o fatada foarte explicita pentru "scor canonic + status + explicatie"

**Ce trebuie facut**

- pastreaza `computeDashboardSummary` drept sursa principala
- extrage optional un wrapper/fatada mica doar daca ajuta la disciplina, nu o rescriere
- aliniaza consumatorii care inca folosesc derivate partiale:
  - `app/api/benchmark/route.ts`
  - orice alte locuri unde `gdprProgress` este folosit in loc de scorul global

**Nu trebuie facut**

- nu crea un al doilea sistem de scoring paralel
- nu muta formula intr-un fisier nou doar de dragul "centralizarii"

**Fisiere de atins**

- `lib/compliance/engine.ts`
- `app/api/benchmark/route.ts`
- `app/api/cron/score-snapshot/route.ts`
- `lib/score-snapshot.ts`

**Estimare**

- `1-2 zile`

**Impact**

- `mediu`, dar foarte bun ca fundatie

### 4.6 Portfolio batch draft actions: draft-uri si notificari cross-client

**Stare actuala reala**

- portofoliul agregheaza bine:
  - alerte
  - task-uri
  - furnizori
- dar actiunea reala este in continuare "drilldown pe firma"

Fisiere relevante:

- `components/compliscan/portfolio-alerts-page.tsx`
- `components/compliscan/portfolio-vendors-page.tsx`
- `components/compliscan/portfolio-tasks-page.tsx`
- `lib/server/portfolio.ts`

**Ce trebuie facut**

- adauga batch actions sigure, limitate la:
  - generare drafturi
  - trimitere notificari
  - creare cozi de lucru pe mai multe org-uri

Exemple bune:

- "Genereaza draft DPA pentru toate org-urile afectate"
- "Trimite digest catre clientii afectati"
- "Deschide un lot de revizuiri vendor"

**Nu trebuie facut**

- fara bulk destructive actions
- fara bulk submit la autoritati
- fara schimbare de ownership sau inchidere automata cross-client

**Estimare**

- `4 zile`

**Impact**

- `mare`, mai ales pentru `partner`

### 4.7 Findings -> documents -> evidence: flow vizibil, nu doar hook backend

**Stare actuala reala**

- la confirmarea unui finding, `app/api/findings/[id]/route.ts` poate genera document automat
- generatorul dedicat exista in `app/dashboard/generator/page.tsx`
- upload-ul de evidenta exista prin `app/api/tasks/[id]/evidence/route.ts`

**Gap real**

- flow-ul exista fragmentat
- utilizatorul nu primeste in UI un traseu clar:
  - confirma finding
  - vede draftul
  - aproba/editeaza
  - il ataseaza ca dovada

**Ce trebuie facut**

- adauga CTA si stare vizibila in `De rezolvat`
- leaga documentul generat de task-ul rezultat sau de finding-ul confirmat
- ofera un shortcut explicit `attach as evidence` dupa generare
- extinde mapping-ul pentru top finding-uri actionabile doar unde exista document type valid

**Fisiere de atins**

- `components/compliscan/resolve-page.tsx`
- `app/api/findings/[id]/route.ts`
- `app/dashboard/generator/page.tsx`
- `app/api/documents/generate/route.ts`
- `app/api/tasks/[id]/evidence/route.ts`

**Estimare**

- `3 zile`

**Impact**

- `mare`

## 5. Ordinea recomandata de implementare

### Sprint 1 — Fundatie si flux vizibil

1. Scoring convergence
2. Findings -> documents -> evidence

### Sprint 2 — NIS2 si Agent OS

3. NIS2 assessment prefill cu confidence
4. Agent OS hardening

### Sprint 3 — Consultant leverage si reporting

5. Portfolio batch draft actions
6. DNSC Wizard enrichment
7. Audit Pack Monthly auto-generation

## 6. Rezumat executiv

Pentru a duce CompliScan spre un nivel perceput de automatizare mult mai mare, nu trebuie inventat un produs nou.

Trebuie facute 7 lucruri, dar in forma corecta:

- maturizare pe ceea ce exista deja
- conectare intre module care sunt deja implementate partial
- reducerea gap-urilor dintre proposal, execution si evidence

Cele mai importante corectii de perspectiva sunt:

- Agent OS exista deja, dar trebuie legat mai bine de baseline si evidence execution
- scoring-ul canonic exista deja, dar nu este consumat uniform peste tot
- NIS2 si DNSC au deja fundatie buna, deci backlog-ul trebuie formulat ca enrichment, nu ca rebuild
- findings pot deja porni generare de document, deci valoarea mare vine din UX si evidence loop

Daca acest document este dat lui Claude Web, regula corecta este:

- foloseste `COMPLISCAN-CLAUDE-WEB-FULL-SPEC.md` pentru intelegerea produsului
- foloseste acest document pentru backlog-ul de automatizare, nu pentru redefinirea arhitecturii
