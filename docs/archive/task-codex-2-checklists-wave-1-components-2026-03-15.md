# Task Codex 2 - Checklists wave 1 components

Data: 2026-03-15

## Context

Nu faci redesign mare.
Nu schimbi business logic.
Nu intri peste page shell si nu intri peste navigatie.

Lucrezi doar pe densitatea si ierarhia componentelor de executie din `Checklists`.

Problema pe care o rezolvi:

- `Checklists` este corecta conceptual
- dar este prea grea operational
- `RemediationBoard` si `TaskCard` cer prea multa citire inainte de actiune

## Tinta

Sa faci `Checklists` mai usor de triat si executat prin:

- compactare
- ierarhie mai dura
- progressive disclosure mai bun
- CTA primar mai dominant

## Fisiere pe care ai voie sa le atingi

- `components/compliscan/remediation-board.tsx`
- `components/compliscan/task-card.tsx`

Optional, daca chiar ai nevoie pentru a tine codul curat:

- componente noi strict locale sub:
  - `components/compliscan/checklists/*`

## Fisiere pe care NU ai voie sa le atingi

- `app/dashboard/checklists/page.tsx`
- `app/dashboard/page.tsx`
- `components/compliscan/navigation.ts`
- `components/compliscan/route-sections.tsx`
- `components/compliscan/use-cockpit.tsx`
- `components/evidence-os/*`
- `app/api/*`
- `lib/*`
- documentele canonice:
  - `public/sprinturi-maturizare-compliscan.md`
  - `public/log-sprinturi-maturizare.md`
  - `public/status-arhitectura.md`
  - `public/task-breakdown-tehnic.md`

## Ce trebuie sa schimbi

### 1. `RemediationBoard`

Tinte:

- intrare mai scurta in board
- mai putin preambul deasupra task-urilor
- filtre mai citibile
- separare vizuala mai buna intre:
  - status
  - tip remediere
  - prioritate

Nu schimbi:

- logica filtrelor
- gruparea rapida / structurala
- empty states doctrinare deja corecte

### 2. `TaskCard`

Tinte:

- partea de sus a cardului trebuie sa permita triere rapida
- contextul greu sa nu mai stea la aceeasi greutate cu actiunea
- `Valideaza si rescaneaza` sa fie clar CTA primar
- dovada sa fie secundara utila
- `Export task` sa fie clar tertiar

Tine sus, clar:

- titlu
- prioritate / severitate
- owner
- deadline
- urmatoarea actiune

Compacteaza sau coboara:

- motivarea lunga
- contextul legal detaliat
- verificarea lunga
- metadatele care nu schimba trierea rapida

## Reguli stricte

- nu schimbi wiring-ul pentru:
  - `onMarkDone`
  - `onAttachEvidence`
  - `onExport`
- nu schimbi modelul de task
- nu schimbi modelul de dovada
- nu schimbi separarea doctrinara dintre:
  - `Remediere`
  - `Audit si export`
  - `Auditor Vault`
- nu introduci efecte vizuale gratuite
- nu introduci limbaj nou de produs

## Validare

Rulezi:

- `npm test`
- `npm run lint`

Rulezi si:

- `npm run build`

doar daca atingi ceva care poate avea impact de bundle sau types.

## Predare

La final predai:

1. lista exacta de fisiere atinse
2. ce ai simplificat concret
3. ce a ramas pentru page-level owner
4. confirmarea explicita ca:
   - nu ai atins runtime shell
   - nu ai schimbat business logic
