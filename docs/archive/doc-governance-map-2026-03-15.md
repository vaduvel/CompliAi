# CompliScan - Doc Governance Map

Data actualizarii: 2026-03-15

## Scop

Acest fisier reduce context noise-ul din `public/*.md`.

El spune clar:

- ce documente sunt canonice
- ce documente sunt active si utile in executie
- ce documente sunt doar input / memorie / audit istoric
- ce NU trebuie incarcat implicit in sesiunile normale de lucru

## Regula de lucru

Ordinea default pentru orice sesiune de implementare in repo:

1. `public/sprinturi-maturizare-compliscan.md`
2. `public/status-arhitectura.md`
3. `public/log-sprinturi-maturizare.md`
4. `public/task-breakdown-tehnic.md`

Optional, doar daca taskul o cere:

5. `public/raport-maturitate-compliscan.md`
6. documentele active din `Tier 1` / `Tier 2`

Nu incarcam implicit audituri istorice, PR brief-uri, task-uri delegate sau memo-uri brute.

## Tier 0 - Canon oficial

Acestea sunt sursa de adevar operationala:

- `public/sprinturi-maturizare-compliscan.md`
- `public/status-arhitectura.md`
- `public/log-sprinturi-maturizare.md`
- `public/task-breakdown-tehnic.md`
- `public/raport-maturitate-compliscan.md`

## Tier 1 - Referinte active de produs si runtime

Acestea se citesc doar cand taskul atinge direct arhitectura UX / UI / governance:

- `public/ux-ui-flow-arhitectura.md`
- `public/gpt-ux-flow-brief.md`
- `public/evidence-os-design-system-v1.md`
- `public/harta-navigare-trasee-user-2026-03-14.md`
- `public/cockpit-authority-execution-map-2026-03-15.md`
- `public/browser-audit-checklist-post-merge-2026-03-15.md`
- `public/ghid-engineering-compliscan.md`
- `public/risk-register-brutal.md`
- `public/risk-register-operational.md`
- `public/release-readiness-checklist.md`
- `public/incident-runbook-minim.md`
- `public/pilot-onboarding-checklist.md`

## Tier 2 - Working docs active, dar conditionale

Acestea sunt utile doar pentru taskuri specifice:

- `public/page-recipes-dashboard-scanare-2026-03-14.md`
- `public/page-recipes-control-2026-03-14.md`
- `public/page-recipes-dovada-2026-03-14.md`
- `public/page-recipes-setari-2026-03-14.md`
- `public/checklists-wave-1-execution-brief-2026-03-15.md`
- `public/checklists-next-wave-audit-2026-03-15.md`
- `public/merge-order-and-browser-audit-2026-03-15.md`
- `public/next-wave-after-scanare-audit-2026-03-15.md`
- `public/maturity-snapshot-2026-03-14.md`
- `public/performance-wave-closure-2026-03-14.md`
- `public/review-arhitectura-implementare-2026-03-14.md`
- `public/audit-performanta-nextjs-2026-03-14.md`
- `public/legacy-dashboard-ui-map-2026-03-14.md`
- `public/evidence-os-oficializare-si-adoptie.md`
- `public/compliscan-evidence-os-ds-spec.md`
- `public/evidence-quality-spec.md`
- `public/functionalitati-aplicatie.md`
- `public/roadmap-compliscan.md`
- `public/target-state-100-compliscan.md`

## Tier 3 - Input, audit istoric, backlog auxiliar

Acestea NU sunt sursa de adevar. Se citesc doar cand exista nevoie explicita:

- `public/audit-cursor-dashboard-2026-03-14.md`
- `public/audit-final-evidence-os-2026-03-14.md`
- `public/audit-la-sange-compliscan-2026-03-14.md`
- `public/audit-md-backlog-sprint-ready-2026-03-14.md`
- `public/backlog-din-feedback.md`
- `public/backlog-recheck-post-sprint7-2026-03-14.md`
- `public/next-steps-performance-and-risk-2026-03-14.md`
- `public/polish-backlog-post-sprint7.md`
- `public/risk-register-brutal.md`
- `public/risk-register-operational.md`
- `public/sprint-5-closure-checklist.md`
- `public/sprint-5-supabase-foundation.md`
- `public/sprint-6-audit-quality-gates.md`
- `public/supabase-live-verification-2026-03-13.md`
- `public/supabase-rls-verification-runbook.md`
- `public/supabase-sql-editor-pasi-scurti.md`
- `public/ux-corpus-si-plan-recuperare-2026-03-14.md`

## Tier 4 - Delegare, coordonare, memo-uri interne

Acestea nu se incarca implicit si nu se folosesc ca baza de implementare:

- `public/coordonare-paralel-codex.md`
- `public/delegare-gemini-codex.md`
- `public/task-codex-2-agent-workspace-safe-2026-03-14.md`
- `public/task-codex-2-checklists-wave-1-components-2026-03-15.md`
- `public/task-codex-2-paralel-safe-2026-03-14.md`
- `public/task-codex-2-ux-wave-1-page-recipes-2026-03-14.md`
- `public/task-codex-evidence-os-ui.md`
- `public/task-gemini-curent.md`
- `public/triere-rapoarte-gemini.md`
- `public/todo-decizii-produs.md`
- `public/pr-brief-codex-evidence-os-agent-workspace-2026-03-14.md`
- `public/pr-brief-codex-scanare-wave-2-2026-03-15.md`
- `public/comanda-performance-cleanup.md`
- `public/comanda-sprint-6-inchidere.md`

## Reguli simple de incarcare

- Pentru implementare runtime:
  - `Tier 0` + maxim `1-3` documente din `Tier 1` / `Tier 2`
- Pentru audit arhitectural:
  - `Tier 0` + `Tier 1`
- Pentru backlog din feedback:
  - `Tier 0` + `feedback.md` + documentele relevante din `Tier 3`
- Pentru PR / integrare:
  - `Tier 0` + brief-ul specific + diff-ul de cod

## Ce nu mai facem

- nu mai folosim `public/*.md` ca dump uniform
- nu mai tratam task-urile delegate ca sursa de adevar
- nu mai incarcam PR brief-uri si audituri istorice in sesiunile normale de implementare
- nu mai lasam un document vechi sa bata codul sau canonul

## Verdict

Din acest moment:

- `Tier 0` conduce
- `Tier 1` si `Tier 2` ajuta doar contextual
- `Tier 3` si `Tier 4` sunt memorie de lucru, nu baza de executie
