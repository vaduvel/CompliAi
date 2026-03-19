# UX Wave 1 - page recipe pentru `Setari`

Data: 2026-03-14

## Scop

Acest document fixeaza reteta canonica pentru `Setari`.

Obiectivul nu este sa transformam configurarea intr-un pseudo-dashboard.

Obiectivul este:

- sa separe administrarea de executia produsului
- sa pastreze integrari, acces si operational in acelasi pilon, dar fara `mixed intent`
- sa ofere handoff clar inapoi spre `Dashboard`, `Control` sau `Dovada`
- sa foloseasca `Evidence OS` si aici ca page system, nu doar ca styling

## Rolul paginii

`Setari` este suprafata de administrare operationala.

Aici:

- fixezi contextul de lucru
- verifici integrari si stare operationala
- administrezi accesul
- controlezi politicile locale sensibile

Nu este:

- pagina de scanare
- workspace de control
- board de remediere
- pagina de export

## Structura canonica

### Primary tabs

- `Workspace`
- `Integrari`
- `Acces`
- `Operational`
- `Avansat`

## Reguli obligatorii

1. `Workspace`
   - context local de lucru
   - baseline
   - snapshot local relevant

2. `Integrari`
   - status Supabase
   - repo sync
   - trasee tehnice conectate

3. `Acces`
   - membri
   - roluri
   - separarea responsabilitatilor

4. `Operational`
   - health check
   - release readiness
   - checkpoint de operare

5. `Avansat`
   - politici locale sensibile
   - reset workspace
   - actiuni administrative rare

## Recipe blocks

### 1. `PageIntro`

Trebuie sa raspunda clar la:

- de ce intri in `Setari`
- ce NU faci aici
- unde te intorci dupa configurare

### 2. `SummaryStrip`

Trebuie sa faca vizibil:

- workspace activ
- baseline
- accesul curent
- operational readiness

### 3. `SectionBoundary`

Explica separat:

- configurarea contextului
- verificarea operarii
- handoff inapoi in produs

### 4. `HandoffCard`

Setari trebuie sa arate clar ca nu inlocuieste fluxul principal:

- `Setari` -> `Dashboard`
- `Setari` -> `Control`
- `Setari` -> `Dovada`

## Ce a fost aplicat in runtime

Suprafata atinsa in acest lot:

- `app/dashboard/setari/page.tsx`

Aplicat:

- `PageIntro`
- `SummaryStrip`
- `SectionBoundary`
- `HandoffCard`
- tabs oficiale:
  - `Workspace`
  - `Integrari`
  - `Acces`
  - `Operational`
  - `Avansat`

## Efectul cautat

- `Setari` nu mai pare pagina in care se aduna orice nu are loc in alta parte
- userul intelege mai usor:
  - unde configureaza contextul
  - unde verifica readiness-ul operational
  - unde administreaza accesul
  - unde revine dupa aceea in produs

## Pasul urmator

Dupa `Setari`:

1. convergenta completa `Evidence OS` pe toate paginile mari ramase
2. cleanup de performanta si legacy surfaces
3. review final cap-coada pe handoff, copy si consistenta vizuala
