# Task Codex 2 - `Scanare` PR prep + next wave audit

Data: 2026-03-15

## Context

Branchul nou pentru valul scurt este:

- `codex/scanare-wave-2`

Commitul principal deja impins:

- `c64aefa` `Split scan verdicts and history from initial bundle`

Acest lot a facut urmatorul lucru:

- `Scanare` pastreaza `flow` ca vedere initiala
- `Verdicts` si `Istoric documente` au fost scoase din bundle-ul initial
- taburile secundare sunt acum incarcate local, prin `dynamic import`

Efect masurabil:

- `/dashboard/scanari`
  - inainte: `11.2 kB / 182 kB first load`
  - dupa: `9.12 kB / 180 kB first load`

Validarea este deja trecuta:

- `npm test`
- `npm run lint`
- `npm run build`

## Ce faci tu

Tu NU faci implementare in runtime acum.

Tu faci doar doua livrabile de suport, pe documente noi:

1. PR brief pentru `codex/scanare-wave-2`
2. audit pregatitor pentru urmatorul val scurt de UX/performance

## Suprafata permisa

Poti crea doar fisiere noi in `public/`.

Nu editezi fisiere existente.

Nu atingi:

- `app/dashboard/*`
- `components/compliscan/*`
- `components/evidence-os/*`
- `app/api/*`
- `lib/*`
- `public/log-sprinturi-maturizare.md`
- `public/status-arhitectura.md`
- `public/task-breakdown-tehnic.md`

## Livrabil 1 - PR brief

Creezi:

- `public/pr-brief-codex-scanare-wave-2-2026-03-15.md`

Structura ceruta:

- titlu propus de PR
- branch source / target
- summary scurt
- ce s-a schimbat tehnic
- impact UX
- validare locala
- efect masurabil in build
- review focus
- verdict de merge

Important:

- brief-ul trebuie sa fie scurt si usor de pus direct in GitHub
- nu dublezi tot istoricul mare al produsului
- ramai strict pe lotul `Scanare`

## Livrabil 2 - audit pregatitor pentru valul urmator

Creezi:

- `public/next-wave-after-scanare-audit-2026-03-15.md`

Scop:

- alegi cea mai buna tinta pentru urmatorul val scurt dupa `Scanare`
- nu propui un val mare
- alegi un singur candidat principal

Candidate recomandate de evaluat:

- `/dashboard/rapoarte`
- `/dashboard/checklists`
- `/dashboard/asistent`

Pentru fiecare, spui foarte scurt:

- intentia dominanta a paginii
- ce pare inca greu / dens / mixed
- ce tip de pas scurt ar fi sanatos
- daca merita sau nu sa fie urmatorul val

La final, dai:

- un singur `recommended next wave`
- de ce este cel mai sanatos
- ce NU trebuie atins in acel val

## Reguli de lucru

- nu inventezi features noi
- nu propui redesign total
- ramai in doctrina canonică:
  - o pagina = o intentie dominanta
  - `summary / detail / action` separate
  - tabs locale, nu shortcut-uri concurente
  - omul valideaza

## Predare

La final predai:

- lista exacta de fisiere create
- 5-10 randuri cu concluzia
- confirmarea ca nu ai atins cod de runtime
