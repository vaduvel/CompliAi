# Legacy Dashboard UI Map

Data: 2026-03-14

## Scop

Acest document marcheaza explicit de ce `components/dashboard/*` este legacy si de ce nu trebuie tratat ca baza pentru `Evidence OS`.

Scopul lui nu este sa spuna "stergeti imediat tot", ci sa opreasca reutilizarea accidentala a unui strat demo care concureaza mental cu runtime-ul real.

## Verdict

`components/dashboard/*` este un layer demo / mock.

Nu este:

- shell-ul runtime actual
- sursa de adevar pentru IA aprobata
- sursa de adevar pentru `Evidence OS`
- baza corecta pentru pagini noi sau pentru convergenta UX

## De ce este legacy

### 1. Foloseste mock-uri si placeholder actions

Exemple:

- `DashboardCards.tsx` afiseaza carduri demo cu valori fixe
- `ActionBar.tsx` deschide toast-uri de tip "In curand"
- `SidebarNav.tsx` are itemi marcati `comingSoon`
- `DashboardHeader.tsx` are date hardcodate precum user, badge si scor

Consecinta:

- arata "real", dar nu reprezinta produsul real
- daca este folosit ca inspiratie pentru runtime, introduce drift de produs

### 2. Este construit pe `components/ui/*`, nu pe `components/evidence-os/*`

Exemple:

- `DashboardShell.tsx`
- `DashboardCards.tsx`
- `DashboardHeader.tsx`
- `SidebarNav.tsx`

Consecinta:

- nu urmeaza stratul canonic `Evidence OS`
- mentine in viata o a doua familie de shell-uri si pattern-uri

### 3. Nu urmeaza IA aprobata curenta

IA aprobata pentru produs este:

- `Dashboard`
- `Scanare`
- `Control`
- `Dovada`
- `Setari`

Layer-ul legacy are:

- itemi incompleti
- rute "in curand"
- shortcut-uri demo
- o structura mai apropiata de o prezentare decat de un cockpit operational

Consecinta:

- daca este confundat cu produsul real, userul intelege gresit ce poate face aplicatia

### 4. Nu este shell-ul runtime activ

Runtime-ul actual foloseste shell-uri si adaptoare din:

- `components/compliscan/*`
- `components/evidence-os/*`
- `app/dashboard/*`

`components/dashboard/*` nu este sursa activa a paginilor mari actuale.

Consecinta:

- mentinerea lui in repo este tolerabila doar daca este clar etichetat ca legacy

## Harta fisierelor legacy

| Fisier | Rol vechi | De ce este legacy |
|---|---|---|
| `components/dashboard/DashboardShell.tsx` | shell demo complet | foloseste piese demo, nu runtime real |
| `components/dashboard/SidebarNav.tsx` | sidebar demo | are itemi `comingSoon` si navigatie partiala |
| `components/dashboard/DashboardHeader.tsx` | header demo | contine identitate hardcodata si scor mock |
| `components/dashboard/DashboardCards.tsx` | overview demo | carduri si valori fixe, fara model real |
| `components/dashboard/ActionBar.tsx` | CTA bar demo | actiuni placeholder bazate pe toast |
| `components/dashboard/DashboardFooterDisclaimer.tsx` | disclaimer demo | accesoriu pentru shell-ul demo |
| `components/dashboard/RiskScoreCircle.tsx` | indicator vizual demo | ramane legat de header-ul mock |
| `components/dashboard/BrandMark.tsx` | brand element demo | util doar in shell-ul legacy |

## Reguli pentru echipa

- nu mai compunem pagini noi din `components/dashboard/*`
- nu mai copiem stiluri sau layout-uri din aceste fisiere in runtime
- daca avem nevoie de shell, intro, summary, boundary, handoff sau action cluster, folosim `components/evidence-os/*`
- daca avem nevoie de adaptori runtime, lucram in `components/compliscan/*` sau in paginile reale

## Ce ramane de facut

Pentru Codex principal:

1. sa izoleze clar `components/dashboard/*` ca legacy in procesul de migrare
2. sa evite orice nou import din aceasta zona
3. sa continue convergenta paginilor mari spre recipe-urile canonice `Evidence OS`

## Concluzie

`components/dashboard/*` nu este "o alta varianta de dashboard".

Este un rest de UI demo care trebuie tratat explicit ca legacy, ca sa nu mai concureze cu `Evidence OS` si cu runtime-ul real.
