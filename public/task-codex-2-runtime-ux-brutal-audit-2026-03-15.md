# Task Codex 2 - runtime UX brutal audit

Data: 2026-03-15

## Context

Nu faci implementare in runtime.

Faci doar un audit dur, util, executabil, pe baza directiei noi:

- produsul este mai bun decat pare
- problema principala nu mai este lipsa de feature-uri
- problema principala este ca runtime UX-ul explica prea mult si lasa prea multe blocuri la greutate similara
- starea si urmatorul pas trebuie sa bata explicatia
- omul valideaza

## Ce citesti

- `public/runtime-ux-declutter-directive-2026-03-15.md`
- `public/ux-ui-flow-arhitectura.md`
- `public/status-arhitectura.md`
- `public/harta-navigare-trasee-user-2026-03-14.md`
- `app/dashboard/page.tsx`
- `app/dashboard/scanari/page.tsx`
- `app/dashboard/checklists/page.tsx`
- `app/dashboard/rapoarte/page.tsx`
- `app/dashboard/rapoarte/auditor-vault/page.tsx`
- `components/compliscan/route-sections.tsx`
- `components/compliscan/remediation-board.tsx`
- `components/compliscan/task-card.tsx`

## Ce livrezi

Creezi un singur fisier nou:

- `public/runtime-ux-brutal-review-2026-03-15.md`

## Format obligatoriu

### 1. Ce este excelent

Doar lucrurile care chiar se tin bine in runtime.
Nu lauda gratuit.

### 2. Ce este mediocru

Zonele care functioneaza, dar sub-vand produsul.
Aici vrem sinceritate.

### 3. Ce trebuie taiat fara mila

- framing redundant
- blocuri prea sus
- explicatii duplicate
- zone care concureaza cu actiunea primara
- orice micro-produs care distrage de la cockpit

### 4. Top 5 schimbari cu cel mai mare impact

Conditii:

- mici sau medii
- fara redesign mare
- fara rescriere de business logic
- fara produs nou

### 5. Verdict final

Raspunde scurt si dur:

- care este cea mai sub-vanduta pagina
- care este pagina cea mai aproape de claritate executiva
- ce trebuie atacat imediat dupa merge

## Reguli stricte

- nu modifici codul
- nu editezi fisiere existente
- nu atingi `app/api/*`
- nu atingi `lib/*`
- nu atingi `components/evidence-os/*`
- nu atingi logurile oficiale
- nu propui produs paralel pentru agenti
- ramai in doctrina:
  - o pagina = o intentie dominanta
  - `summary / detail / action` separate
  - starea si urmatorul pas bat explicatia
  - omul valideaza

## Predare

La final predai:

1. fisierul nou creat
2. un rezumat de 5-10 randuri in chat
3. confirmarea explicita ca nu ai atins cod de runtime
