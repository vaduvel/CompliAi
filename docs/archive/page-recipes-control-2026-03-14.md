# UX Wave 1 - page recipe pentru `Control`

Data: 2026-03-14

## Scop

Acest document fixeaza reteta canonica pentru `Control`.

Obiectivul nu este sa facem pagina mai frumoasa.

Obiectivul este:

- o intentie dominanta clara
- tabs locale curate
- separare intre confirmare, drift si review
- scoaterea `Integrari` din competitia vizuala cu `Control`

## Rolul paginii

`Control` este workspace-ul de confirmare umana.

Aici:

- candidatele devin sisteme asumate
- baseline-ul devine reper validat
- drift-ul ramane separat de inventar
- review-ul ramane explicit

Nu este:

- pagina de remediere
- pagina de export
- pagina de integrari operationale

## Structura canonica

### Primary tabs

- `Overview`
- `Sisteme`
- `Drift`
- `Review`

### Sub-tabs in `Sisteme`

- `Discovery`
- `Inventar`
- `Baseline`
- `Compliance Pack`

## Reguli obligatorii

1. `Overview`
   - doar snapshot si handoff
   - nu gazduieste work queue-ul complet

2. `Sisteme`
   - tine fluxul de confirmare:
     - candidate
     - inventar
     - baseline
     - pack

3. `Drift`
   - trateaza schimbarea fata de baseline separat
   - nu se amesteca cu discovery sau inventar

4. `Review`
   - centralizeaza ce cere validare umana
   - nu devine export surface

5. `Integrari`
   - nu mai concureaza cu `Control`
   - se muta conceptual in `Setari`

## Recipe blocks

### 1. Page intro

Trebuie sa raspunda clar la:

- ce confirmi aici
- ce NU faci aici
- unde continui dupa

### 2. Primary tabs cu descriere

Taburile nu sunt doar etichete.

Fiecare trebuie sa comunice intentia dominanta.

### 3. Summary strip

Trebuie sa faca vizibil:

- confirmat
- in review
- baseline
- drift
- queue-ul de validare

### 4. Section boundary / local handoff

Fiecare tab trebuie sa explice:

- de ce exista
- unde continua fluxul dupa
- ce ramane in alta pagina

### 5. Handoff explicit

Exemple:

- `Control` -> `Dovada` pentru remediere / audit
- `Control` -> `Setari` pentru integrari si operational
- `Control` -> `Scanare` pentru surse noi

## Ce a fost aplicat in runtime

Suprafata atinsa in acest lot:

- `app/dashboard/sisteme/page.tsx`

Aplicat:

- `PageIntro`
- `SummaryStrip`
- `SectionBoundary`
- `HandoffCard`
- primary tabs canonice:
  - `Overview`
  - `Sisteme`
  - `Drift`
  - `Review`
- sub-tabs pentru `Sisteme`:
  - `Discovery`
  - `Inventar`
  - `Baseline`
  - `Compliance Pack`
- `Integrari` scoase din structura principala de `Control`

## Efectul cautat

- `Control` nu mai pare o pagina monstru care amesteca 6 intentii diferite
- userul intelege mai usor:
  - unde confirma
  - unde investigheaza drift
  - unde face review
  - unde iese catre `Dovada` sau `Setari`

## Pasul urmator

Dupa `Control`:

1. recipe pentru `Dovada`
2. recipe pentru `Setari`
3. abia apoi cleanup structural mai agresiv si split-uri de hook-uri / payload-uri
