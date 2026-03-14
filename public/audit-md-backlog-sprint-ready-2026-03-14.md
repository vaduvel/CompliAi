# CompliScan - Audit `.md` pentru backlog si sprint-ready

Data: 2026-03-14

## Scop

Acest audit raspunde la 3 intrebari:

1. care fisiere `.md` mai sunt sursa reala de adevar
2. ce backlog ramas este cu adevarat executabil acum
3. ce putem delega lui Codex 2 fara sa intre peste cockpitul mare si runtime-ul critic

Nu este un roadmap nou.

Este un filtru de adevar peste documentatia existenta.

## Verdict scurt

Repo-ul are multe `.md`, dar backlog-ul real ramas este mic si clar.

Fronturile care raman vii dupa audit sunt:

1. cleanup de performanta incremental
2. clarificare UX finala pe cockpitul mare ramas:
   - `Alerte` -> `Drift`
   - `Setari` pe sub-sectiuni
3. invitatii / member admin
4. parser XML robust pentru `e-Factura`
5. polish component-level sigur pe suprafata `Evidence OS`

Ce NU mai este backlog activ:

- Sprint 1-7 ca fundatie
- `Evidence OS` ca oficializare de baza
- auth minim, tenancy minim, evidence privat, release readiness minim

## 1. Fisiere care conduc executia reala

Acestea trebuie tratate drept sursa de adevar sau backlog activ:

- `public/sprinturi-maturizare-compliscan.md`
- `public/log-sprinturi-maturizare.md`
- `public/status-arhitectura.md`
- `public/task-breakdown-tehnic.md`
- `public/raport-maturitate-compliscan.md`
- `public/backlog-recheck-post-sprint7-2026-03-14.md`
- `public/polish-backlog-post-sprint7.md`
- `public/ux-ui-flow-arhitectura.md`
- `public/audit-performanta-nextjs-2026-03-14.md`
- `public/next-steps-performance-and-risk-2026-03-14.md`
- `public/review-arhitectura-implementare-2026-03-14.md`
- `public/release-readiness-checklist.md`
- `public/risk-register-operational.md`
- `public/evidence-os-oficializare-si-adoptie.md`
- `components/evidence-os/ui-audit-backlog.md`

## 2. Fisiere utile, dar care nu trebuie sa conduca executia direct

Acestea raman documente de context, referinta sau istoric:

- `feedback.md`
- `public/backlog-din-feedback.md`
- `public/roadmap-compliscan.md`
- `public/target-state-100-compliscan.md`
- `public/todo-decizii-produs.md`
- `public/rapoarte-gemini/*`
- `public/audit-cursor-dashboard-2026-03-14.md`
- `public/audit-final-evidence-os-2026-03-14.md`
- `public/audit-la-sange-compliscan-2026-03-14.md`
- `public/gpt-ux-flow-brief.md`
- `public/comanda-performance-cleanup.md`
- `public/comanda-sprint-6-inchidere.md`
- `public/delegare-gemini-codex.md`
- `public/task-gemini-curent.md`
- `public/task-codex-evidence-os-ui.md`
- `public/compliscan-evidence-os-ds-spec.md`
- fisierele root de tip:
  - `README.md`
  - `APLICATIA.md`
  - `COMPETITIVE_ANALYSIS_SCAN.md`
  - `IMPLEMENTATION_PLAN_SCAN.md`
  - `FEEDBACK_SCAN_REPORT.md`

Verdict:

- sunt bune pentru context
- nu bat logul, sprint board-ul si codul
- nu trebuie folosite ca argument pentru a redeschide fronturi deja inchise

## 3. Backlog real ramas dupa audit

### A. Sprint-ready acum si detinut de Codex principal

Acestea sunt pregatite pentru executie si nu trebuie delegate:

1. `Alerte` -> `Drift`
   - vine din `public/ux-ui-flow-arhitectura.md`
   - afecteaza navigatia, wording-ul si firul produsului
   - trebuie tinut de Codex principal

2. `Setari` pe sub-sectiuni / tabs
   - vine din `public/ux-ui-flow-arhitectura.md`
   - este validat si de `public/review-arhitectura-implementare-2026-03-14.md`
   - pagina este mare si amesteca responsabilitati

3. cleanup de performanta incremental
   - vine convergent din:
     - `public/backlog-recheck-post-sprint7-2026-03-14.md`
     - `public/audit-performanta-nextjs-2026-03-14.md`
     - `public/next-steps-performance-and-risk-2026-03-14.md`
     - `public/review-arhitectura-implementare-2026-03-14.md`
   - include:
     - split controlat pentru `useCockpit`
     - payload-uri mai mici
     - bootstrap server-first
     - loading local pe sectiuni

4. invitatii si member admin
   - apare consecvent in:
     - `public/backlog-recheck-post-sprint7-2026-03-14.md`
     - `public/raport-maturitate-compliscan.md`

5. parser XML robust pentru `e-Factura`
   - apare consecvent in:
     - `public/backlog-recheck-post-sprint7-2026-03-14.md`
     - `public/risk-register-operational.md`

### B. Sprint-ready acum si delegabil lui Codex 2

Acestea sunt executabile, dar numai pe suprafata component-level, fara cockpit mare:

1. compactare si ierarhie in:
   - `components/compliscan/task-card.tsx`
   - `components/compliscan/remediation-board.tsx`
   - `components/compliscan/next-best-action.tsx`

2. CTA hierarchy si labels mai clare in:
   - `components/compliscan/export-center.tsx`

3. overflow / wrapping / mobile safety in:
   - `components/compliscan/floating-assistant.tsx`
   - `components/evidence-os/*`

4. page recipes si disciplinare pe componente canonice in:
   - `components/evidence-os/*`

5. backlog si worklog local `Evidence OS`
   - `components/evidence-os/ui-audit-backlog.md`
   - `components/evidence-os/evidence-os-worklog.md`

Verdict:

- acestea sunt bune pentru paralelism real
- nu cer schimbari in `app/api/*`
- nu cer schimbari in `lib/server/*`
- nu cer schimbari in paginile mari din cockpit

## 4. Ce nu este sprint-ready acum

Acestea sunt intentionat parcate:

- `Policy Engine` separat
- `Event-driven core`
- enterprise GRC expansion
- schimbare de framework
- rewrite mare de store
- normalizare relationala mare facuta acum

Motiv:

- toate apar in documente ca directii bune, dar nu ca task-uri sanatoase pentru urmatorul val

## 5. Decizie de delegare

Codex principal ramane owner pe:

- `app/dashboard/alerte/page.tsx`
- `app/dashboard/setari/page.tsx`
- `app/dashboard/scanari/*`
- `app/dashboard/rapoarte/*`
- `components/compliscan/navigation.ts`
- `components/compliscan/use-cockpit.ts`
- `lib/server/*`
- `app/api/*`
- documentele oficiale de status

Codex 2 poate primi doar loturi pe:

- `components/evidence-os/*`
- `components/compliscan/task-card.tsx`
- `components/compliscan/remediation-board.tsx`
- `components/compliscan/next-best-action.tsx`
- `components/compliscan/export-center.tsx`
- `components/compliscan/floating-assistant.tsx`
- `app/dashboard/asistent/page.tsx`
- backlog/worklog local `Evidence OS`

## 6. Concluzie

Documentatia nu mai sustine un backlog mare si haotic.

Dupa filtrare, ordinea sanatoasa este:

1. Codex principal:
   - `Drift`
   - `Setari`
   - performanta
2. Codex 2:
   - component polish sigur pe suprafata `Evidence OS`
3. ramas ulterior:
   - invitatii
   - parser XML robust

Acesta este backlog-ul real si sprint-ready dupa auditul `.md`.
