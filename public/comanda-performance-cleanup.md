# CompliScan - Comanda Performance Cleanup (post Sprint 7)

Data: 2026-03-14
Status tinta: sprint nou, incrementari controlate

## Context
- Sprint 7 este inchis operational.
- Evidence OS este DS oficial; nu refacem UI, doar reducem greutatea cockpit-ului.
- Audituri relevante: audit-performanta-nextjs-2026-03-14.md, next-steps-performance-and-risk-2026-03-14.md, review-arhitectura-implementare-2026-03-14.md.

## Principii
- Fara rewrite de framework sau model de domeniu.
- Pastram firul produsului: Scanare -> Control -> Dovada, Remediere, Audit si export.
- Performance = maturizare, nu rescriere.

## Scop
1. Reducem loading full-page repetat pe dashboard.
2. Reducem payload si fetch-uri inutile la mount.
3. Pastram stabilitatea UX si logica curenta.

## Guardrails (hard)
- Nu schimbam modelul de domeniu.
- Nu introducem concepte noi de produs.
- Nu inlocuim Evidence OS.
- Nu rupem flow-urile: scanare, remediere, audit, auth/org switching.

## Plan incremental

### Val A - Quick wins (risc mic)
- A1. Loading local pe sectiuni (fara full-page LoadingScreen in paginile mari).
- A2. Reducere fetch-uri paralele in Setari (agregare sau secventiere).
- A3. Bootstrap server-first pentru user/org/memberships in app/dashboard/layout.tsx.

### Val B - Structura (risc mediu, controlat)
- B1. Split intern pentru useCockpit (data vs mutations vs hook-uri tematice).
- B2. Payload-uri specializate in paralel cu /api/dashboard (fara a rupe compatibilitatea).

### Val C - Server-first (risc mediu)
- C1. Bootstrapping server-first pentru paginile cele mai grele.
- C2. loading.tsx pe segmente unde ajuta.

## Ordine recomandata
1. Val A1
2. Val A2
3. Val A3
4. Val B1
5. Val B2
6. Val C1/C2

## Definition of Done (per val)
- Val A: shell stabil intre navigari, mai putine full-page loadings.
- Val B: chunk-uri dashboard mai mici, rerendering mai local.
- Val C: server-first initial data pe paginile grele fara regresii.

## Criterii de succes globale
- Scade numarul de ecrane full-page de incarcare.
- Scad request-urile la mount in shell si Setari.
- Nu exista regresii functionale in:
  - scanare
  - remediere
  - audit
  - auth/org switching

## Validare
- Pentru fiecare val: npm test + npm run lint + npm run build

## Reporting (dupa fiecare val)
- public/log-sprinturi-maturizare.md
- public/sprinturi-maturizare-compliscan.md
- public/status-arhitectura.md
- public/task-breakdown-tehnic.md
