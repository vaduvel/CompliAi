# UX Wave 1 - page recipes pentru `Dashboard` si `Scanare`

Data: 2026-03-14

## Scop

Acest document fixeaza primul lot canonic de `page recipes` pentru produsul mare:

- `Dashboard`
- `Scanare`

Obiectivul nu este cosmetica.

Obiectivul este:

- claritate de intent
- handoff explicit intre pagini
- reducerea `mixed intent`
- folosirea `Evidence OS` ca limbaj de compozitie, nu doar ca set de componente

## Recipe - `Dashboard`

### Rol

`Dashboard` este pagina de orientare operationala.

Nu este:

- workspace de executie
- pagina de export
- panou de discovery
- board de remediere

### Blocuri obligatorii

1. `top / readiness`
   - scor
   - risc
   - ultimul semnal relevant
   - disclaimer clar: omul valideaza, nu aplicatia

2. `summary strip`
   - readiness
   - task-uri active
   - drift deschis
   - dovezi / surse disponibile
   - audit readiness

3. `next action + principal flow handoff`
   - un singur `next best action`
   - harta simpla:
     - `Scanare`
     - `Control`
     - `Dovada`

4. `drift focus`
   - doar semnalele active
   - impact
   - urmatorul pas
   - link clar spre workspace-ul de drift

5. `snapshot / recent activity`
   - baseline
   - ultimele surse
   - activitate recenta

### Ce NU intra aici

- `ExportCenter`
- `RemediationBoard`
- autodiscovery detaliat
- formulare mari
- setari
- flux complet de document scan

### Handoff-uri oficiale

- daca vrei sa pornesti analiza:
  - mergi in `Scanare`
- daca vrei baseline / sisteme / drift:
  - mergi in `Control`
- daca vrei inchidere, dovada sau livrabil:
  - mergi in `Dovada`

## Recipe - `Scanare`

### Rol

`Scanare` este poarta de intrare pentru surse.

Pagina trebuie sa raspunda clar la:

- ce adaugi
- ce executi aici
- unde vezi rezultatul
- unde continui dupa

### Structura canonica

1. `page intro`
   - explica rolul paginii:
     - aici pornesti analiza
     - `Verdicts` este read-only
     - istoricul complet ramane separat

2. `pillar tabs`
   - navigatia secundara din pilonul `Scanare`

3. `view tabs`
   - `Flux scanare`
   - `Verdicts`
   - `Istoric documente`
   - fiecare tab are descriere, nu doar eticheta

4. `workflow guide / handoff`
   - ce faci in tabul curent
   - ce NU faci aici
   - unde continui dupa

5. `active content`
   - in `Flux scanare`:
     - alegi sursa
     - extragi
     - revizuiesti
     - analizezi
   - in `Verdicts`:
     - citesti ultimul rezultat confirmat
   - in `Istoric documente`:
     - cauti rapid sursa relevanta

### Regula de handoff

- `document` / `text`
  - dupa rezultat continui in `Dovada`
- `manifest` / `compliscan.yaml`
  - dupa rezultat continui in `Control`
- `Istoric documente`
  - te duce spre `Documente` pentru lista completa

### Ce NU intra aici

- export final
- baseline management complet
- audit pack
- setari
- remedieri complexe in aceeasi pagina

## De ce este primul lot sanatos

`Dashboard` si `Scanare` sunt primele doua retete pentru ca aici se simte cel mai puternic confuzia de intent:

- `Dashboard` tinde sa vrea sa fie si overview, si executie
- `Scanare` tinde sa vrea sa fie si input, si explainability, si istoric complet

Prin acest lot:

- `Dashboard` ramane orientare
- `Scanare` ramane intrare de flux
- handoff-ul catre `Control` si `Dovada` devine explicit

## Implementare initiala in runtime

Suprafete atinse in acest lot:

- `app/dashboard/page.tsx`
- `app/dashboard/scanari/page.tsx`
- `components/compliscan/route-sections.tsx`

## Pasul urmator

Dupa acest lot:

1. recipe pentru `Control`
2. recipe pentru `Dovada`
3. recipe pentru `Setari`
4. abia apoi cleanup structural mai agresiv in `useCockpit`
