# Checklists wave 1 - execution brief

Data: 2026-03-15

## Rolul acestui val

Acest val nu este redesign.

Este primul val de runtime declutter dupa integrarea:

- `codex/evidence-os-agent-workspace`
- `codex/scanare-wave-2`

Scopul este simplu:

- `Checklists` trebuie sa devina mai rapid de triat
- `Checklists` trebuie sa devina mai rapid de executat
- actiunea trebuie sa bata explicatia

## Intentia dominanta

`Checklists` ramane:

- pagina de `Remediere`
- pagina de executie reala
- locul in care omul inchide task-uri, ataseaza dovada si valideaza

Nu devine:

- pagina de audit
- pagina de raportare
- pagina de explicatii lungi

## Schimbari tintite

### 1. Zona de deasupra board-ului

Tinta:

- mai putin preambul
- board-ul sa urce mai sus
- `SummaryStrip` si suportul doctrinar sa nu impinga executia prea jos

### 2. Intrarea in `RemediationBoard`

Tinta:

- header mai scurt
- mai putin text suport inainte de task-uri
- gruparea `rapid / structural` pastrata, dar cu mai putin zgomot

### 3. Filtre

Tinta:

- logica ramane aceeasi
- separare vizuala mai buna intre:
  - status
  - tip de remediere
  - prioritate

### 4. `TaskCard`

Tinta:

- triere rapida mai buna in partea de sus a cardului
- `context / motivare / verificare` mai compacte vizual
- CTA primar mai dominant

Ordinea dorita in card:

1. ce este
2. cat de urgent este
3. ce trebuie facut acum
4. abia apoi context si dovada detaliata

### 5. Cluster de actiune

Tinta:

- `Valideaza si rescaneaza` ramane actiunea primara
- dovada ramane actiunea secundara utila
- `Export task` devine clar tertiar

## Ce nu atingem

- business logic
- wiring-ul pentru:
  - `onMarkDone`
  - `onAttachEvidence`
  - `onExport`
- modelul de task / dovada / validare
- `app/api/*`
- `lib/*`
- separarea doctrinara dintre:
  - `Remediere`
  - `Audit si export`
  - `Auditor Vault`

## Criteriul de succes

La final, un operator nou trebuie sa poata:

- intelege repede ce are de facut
- gasi repede task-ul important
- vedea clar actiunea primara
- fara sa fie oprit de prea mult framing inainte de executie
