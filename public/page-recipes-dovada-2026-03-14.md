# UX Wave 1 - page recipe pentru `Dovada`

Data: 2026-03-14

## Scop

Acest document fixeaza reteta canonica pentru `Dovada`.

Obiectivul nu este sa adunam toate artefactele intr-o singura pagina.

Obiectivul este:

- sa separam clar executia de ledger si de livrabil
- sa folosim `Evidence OS` ca page system, nu doar ca librarie de carduri
- sa facem handoff-ul dintre paginile din `Dovada` explicit si usor de inteles
- sa scoatem `mixed intent` din cele mai dense suprafete de audit

## Rolul pilonului

`Dovada` este pilonul in care:

- executi remedierea reala
- verifici dovada si trasabilitatea
- pregatesti livrabilul audit-ready

Nu este:

- un dashboard paralel
- un panou de discovery
- un shell in care exportul, executia si ledger-ul concureaza pe acelasi ecran

## Intentii dominante

### `Remediere`

Rol:

- executie
- inchidere de task
- atasare de dovada
- rescan / validare

Nu este:

- ledger complet
- pagina de export

### `Audit si export`

Rol:

- snapshot de readiness
- verificare finala a livrabilului
- generare de artefacte

Nu este:

- board de lucru
- locul in care inchizi task-uri
- ledger complet de audit

### `Auditor Vault`

Rol:

- ledger complet
- trasabilitate
- explicarea relatiei dintre sistem, control, drift, task si dovada

Nu este:

- board de remediere
- pagina principala de export

## Structura canonica

### 1. `PageIntro`

Fiecare pagina trebuie sa raspunda clar la:

- ce intentie domina aici
- ce NU faci aici
- unde continui dupa

### 2. `PillarTabs`

Navigatia secundara ramane in pilonul `Dovada`, nu in sidebar global.

### 3. `SummaryStrip`

Fiecare pagina expune doar sumarul relevant intentiei sale:

- `Remediere`
  - task-uri deschise
  - task-uri inchise
  - dovezi atasate
- `Audit si export`
  - readiness
  - drift activ
  - baseline
  - starea snapshot-ului
- `Vault`
  - audit readiness
  - baseline
  - gap-uri de dovada
  - drift activ

### 4. `SectionBoundary`

Fiecare pagina explica:

- de ce exista separat
- ce ramane in alta pagina
- cum arata fluxul canonic

### 5. `HandoffCard`

Fiecare pagina trebuie sa arate urmatorul pas sanatos:

- `Remediere` -> `Auditor Vault` / `Audit si export`
- `Audit si export` -> `Remediere` / `Auditor Vault`
- `Auditor Vault` -> `Remediere` / `Audit si export`

## Regula obligatorie

In `Dovada`, regula canonica este:

- `summary / execution / export` nu se amesteca pe aceeasi pagina ca intentii egale

Adica:

- daca executi, ramai in `Remediere`
- daca pregatesti livrabilul, ramai in `Audit si export`
- daca verifici ledger-ul complet, ramai in `Auditor Vault`

## Ce a fost aplicat in runtime

Suprafete atinse in acest lot:

- `app/dashboard/checklists/page.tsx`
- `app/dashboard/rapoarte/page.tsx`
- `app/dashboard/rapoarte/auditor-vault/page.tsx`

Aplicat:

- `PageIntro`
- `SummaryStrip`
- `SectionBoundary`
- `HandoffCard`
- separare explicita intre:
  - executie
  - livrabil
  - ledger audit-ready

## Efectul cautat

- `Remediere` se simte locul in care lucrezi efectiv
- `Audit si export` se simte locul in care verifici si livrezi
- `Auditor Vault` se simte locul in care poti sustine povestea completa a dovezii
- userul nu mai trebuie sa deduca singur unde incepe, unde verifica si unde iese spre livrabil

## Pasul urmator

Dupa `Dovada`:

1. recipe pentru `Setari`
2. convergenta completa `Evidence OS` pe toate paginile mari
3. cleanup structural si de performanta in hook-uri si payload-uri mari
