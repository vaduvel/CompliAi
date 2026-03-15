# Task Codex 2 - `Checklists` audit-only

Data: 2026-03-15

## Context

Ordinea sanatoasa a fost:

- clarificare arhitecturala mare
- val scurt pe `Scanare`
- val scurt pe `Audit si export`

Urmatoarea tinta probabila dupa merge si browser audit este:

- `/dashboard/checklists`

Dar deocamdata tu NU implementezi nimic.

## Ce faci tu

Tu faci doar audit pregatitor, pe documente noi.

Nu modifici runtime, nu modifici componente, nu modifici loguri oficiale.

## Suprafata permisa

Poti doar:

- citi:
  - `app/dashboard/checklists/page.tsx`
  - `components/compliscan/remediation-board.tsx`
  - `components/compliscan/task-card.tsx`
  - `public/ux-ui-flow-arhitectura.md`
  - `public/status-arhitectura.md`
  - `public/task-breakdown-tehnic.md`
- crea:
  - `public/checklists-next-wave-audit-2026-03-15.md`

Nu atingi:

- `app/dashboard/*` prin editare
- `components/compliscan/*` prin editare
- `components/evidence-os/*`
- `app/api/*`
- `lib/*`
- `public/log-sprinturi-maturizare.md`
- `public/status-arhitectura.md`
- `public/task-breakdown-tehnic.md`

## Ce trebuie sa livrezi

In `public/checklists-next-wave-audit-2026-03-15.md` scrii:

### 1. Intentia dominanta

- ce intentie dominanta are azi `Checklists`
- daca se simte clar sau doar partial clar

### 2. Unde mai exista densitate

Foarte concret:

- filtre
- handoff
- summary
- board
- task card

### 3. Care ar fi un val scurt sanatos

Fara redesign mare.

Doar:

- 3-5 schimbari mici care ar clarifica pagina
- fara mutari de logic
- fara schimbari de IA mare

### 4. Ce NU trebuie atins

Listezi explicit ce nu trebuie atins in acel val.

### 5. Verdict

Un verdict scurt:

- merita sa fie urmatorul val
- sau nu merita inca

## Reguli

- ramai in doctrina canonica:
  - o pagina = o intentie dominanta
  - `summary / detail / action` separate
  - tabs locale, nu shortcut-uri concurente
  - omul valideaza
- nu propui rescriere
- nu propui noi feature-uri
- nu propui mutari mari intre pagini

## Predare

La final predai:

- fisierul creat
- concluzia in 5-10 randuri
- confirmarea ca nu ai atins cod de runtime
