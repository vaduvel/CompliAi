# Final Implementation Reference

Acest fisier este contractul scurt de implementare pentru directia curenta.

Scopul lui este sa opreasca confuzia dintre:
- blueprint-ul de produs
- prototipul vizual
- Wave 0
- UI-ul actual din Evidence OS v1

## 1. Decizia finala

Implementam aplicatia astfel:

- `IA` noua din `02-ux-ia-blueprint.md`
- `UX` nou din `02-ux-ia-blueprint.md`
- `UI vizual` din runtime-ul actual `Evidence OS v1`

Formula scurta este:

`Blueprint nou + skin EOS v1 + componente noi scrise in stil EOS v1`

Nu continuam executia vizuala pe stilul din `Wave 0` ca directie principala.

## 2. Ce pastram

Pastram ca sursa de adevar pentru arhitectura de produs:
- `docs/final-guide-plan/02-ux-ia-blueprint.md`

Pastram ca doctrina mare de produs:
- `docs/final-guide-plan/00-master-source.md`
- `docs/final-guide-plan/01-guide-map.md`

Pastram ca sursa de stil si compozitie vizuala:
- `components/compliscan/dashboard-shell.tsx`
- `components/compliscan/navigation.ts`
- `components/evidence-os/*`
- paginile runtime care arata deja bine in `EOS v1`

Pastram din `Wave 0` doar daca o bucata merita refolosita punctual.
`Wave 0` nu este sursa principala de adevar pentru UI.

## 3. Ce NU folosim ca sursa principala

Nu folosim ca sursa principala pentru implementare:
- `docs/final-guide-plan/03-ux-wireframe-prototype.jsx`
- `docs/final-guide-plan/compliscan-ux-wireframe.jsx`
- `docs/final-guide-plan/compliscan-ui-prompt.md`
- branchul `wave0/ux-foundation-ds-v2`

Explicatie:
- `03-*` este prototip vizual, nu cod de productie
- `compliscan-ui-prompt.md` este util pentru inspiratie si constrangeri de claritate, dar nu mai este contractul vizual principal
- `Wave 0` este experiment valid de explorare, nu fundatia aprobata pentru look-and-feel

## 4. Ordinea surselor de adevar

Cand exista dubii, urmam aceasta ordine:

1. `04-implementation-reference-eos-v1.md`
2. `02-ux-ia-blueprint.md`
3. runtime-ul `Evidence OS v1`
4. `01-guide-map.md`
5. `00-master-source.md`
6. `03-ux-wireframe-prototype.jsx` doar ca referinta spatiala
7. `Wave 0` doar ca referinta secundara

## 5. Reguli simple de implementare

### IA si routing

Introducem arhitectura noua:
- `Acasa`
- `Scaneaza`
- `De rezolvat`
- `Rapoarte`
- `Setari`

Dar vizual le construim in shell-ul si limbajul `EOS v1`.

### UI

Folosim:
- token-urile si clasele `eos-*`
- primitivele din `components/evidence-os/*`
- compozitia paginilor deja matura din produs

Nu introducem un al doilea limbaj vizual concurent.

### Componente noi

Daca blueprint-ul cere o componenta inexistenta, o cream noua, dar in stil `EOS v1`.

Componente candidate:
- `PrimaryActionCard`
- `ScoreRing`
- `FrameworkReadinessGrid`
- `FindingRow`
- `ResolutionLayer`
- `ScanResultGroup`
- `ReportsActionCard`

Regula:
- componenta noua, stil vechi
- UX nou, skin existent

## 6. Ce facem cu Wave 0

`Wave 0`:
- nu este pe `main`
- nu este in productie
- nu este live in `Vercel`

Deci:
- nu este o problema de productie
- nu trebuie sters agresiv
- nu trebuie folosit ca baza obligatorie

Il tratam ca:
- referinta
- sandbox de explorare
- sursa optionala de idei mici reutilizabile

Nu il promovam automat.

## 7. Ordinea reala de implementare

Implementam in aceasta ordine:

1. `DashboardShell` si navigatia principala trec la noua IA, dar raman vizual in `EOS v1`
2. cream rutele canonice noi:
   - `/dashboard/scan`
   - `/dashboard/scan/results/[scanId]`
   - `/dashboard/resolve`
   - `/dashboard/reports`
3. remapam sau pastram paginile vechi ca punte temporara, fara breaking changes inutile
4. construim componentele noi lipsa in stil `EOS v1`
5. mutam wiring-ul functional pe noile suprafete
6. abia dupa aceea inchidem sau simplificam traseele vechi

## 8. Ce inseamna done pentru fiecare slice

Un slice este considerat bun doar daca:
- respecta `02-ux-ia-blueprint.md`
- arata vizual ca `Evidence OS v1`
- nu introduce un nou dialect de UI
- trece `lint`
- trece `build`
- nu rupe rutele existente fara punte clara

## 9. Reguli de siguranta

Nu facem:
- rewrite mare de design system
- push pe `main` doar pentru ca arata nou
- amestec intre `Wave 0` si `EOS v1` fara motiv clar

Facem:
- patch-uri mici
- branch curat din `main`
- validare dupa fiecare pas important

## 10. Rezumat executiv

Daca apare iar confuzie, revenim la regula asta:

`CompliScan final = blueprint nou de IA/UX, implementat peste UI-ul actual Evidence OS v1.`

Atat.
