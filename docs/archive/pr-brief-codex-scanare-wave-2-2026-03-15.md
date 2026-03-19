# PR Brief - `codex/scanare-wave-2`

Data: 2026-03-15

## Titlu propus de PR

`Trim secondary route weight for Scanare and Audit si export`

## Branch

- source: `codex/scanare-wave-2`
- target recomandat acum: `codex/evidence-os-agent-workspace`
- target final dupa intrarea bazei: `main`

## Summary scurt

Acest PR aduna doua valuri scurte si coerente:

- `Scanare` pastreaza `flow` ca vedere initiala si scoate `Verdicts` / `Istoric documente` din bundle-ul initial
- `Audit si export` pastreaza snapshot-ul si exportul principal in shell, dar muta panourile suport in loading local

Ambele pasi raman strict in zona de UX/performance. Nu schimba business logic si nu rescriu flow-ul canonic.

## Ce s-a schimbat tehnic

- `Scanare`:
  - porneste direct in `flow`
  - `Verdicts` este separat de zona de lucru activa
  - `Istoric documente` este separat de bundle-ul initial
  - taburile secundare sunt incarcate local prin `dynamic import`
- `Audit si export`:
  - shell-ul de readiness si `ExportCenter` raman in vederea initiala
  - `ExportArtifactsCard` si `RecentDriftCard` au fost mutate in `dynamic import`
  - panourile suport nu mai stau in bundle-ul initial
- commiturile principale ale lotului:
  - `c64aefa` `Split scan verdicts and history from initial bundle`
  - `38f6c0c` `Defer reports support panels behind local loading`

## Impact UX

- intentia dominanta ramane mai clara pe ambele pagini:
  - `Scanare = lucru activ`
  - `Audit si export = snapshot + livrabil`
- explicatia read-only si panourile suport nu mai concureaza cu prima vedere
- produsul respecta mai bine doctrina:
  - o pagina = o intentie dominanta
  - `summary / detail / action` separate
  - omul valideaza

## Validare locala

- `npm test` ✅
- `npm run lint` ✅
- `npm run build` ✅

## Efect masurabil in build

- `/dashboard/scanari`
  - inainte: `11.2 kB / 182 kB first load`
  - dupa: `9.12 kB / 180 kB first load`
- `/dashboard/rapoarte`
  - inainte: `7.89 kB / 179 kB first load`
  - dupa: `6.13 kB / 177 kB first load`

## Review focus

- `Scanare` se simte acum clar ca pagina de lucru activ
- `Verdicts` si `Istoric documente` nu mai aglomereaza intrarea in pagina
- `dynamic import` pentru taburile secundare nu introduce regressii de navigatie
- `Audit si export` ramane pagina de livrabil, nu capata ton de remediere
- separarea ramane strict UX/performance, fara schimbare de business logic

## Verdict de merge

PR-ul este `merge-ready` ca stacked follow-up peste `codex/evidence-os-agent-workspace`:

- este `0 behind / 3 ahead` fata de baza lui
- `git diff --check` pe delta fata de baza este curat
- scope mic si clar, chiar daca include doua pagini vecine
- validare completa trecuta local
- efect masurabil pozitiv pe first load pentru ambele rute
- nu schimba flow-ul canonic al produsului, doar il clarifica

## Nota de integrare

Ordinea sanatoasa este:

1. intra `codex/evidence-os-agent-workspace`
2. apoi intra `codex/scanare-wave-2`

Cat timp baza nu este inca in `main`, PR-ul pentru acest branch trebuie tratat ca stacked PR.
