# Task Codex 2 - Control wave 1 (components only)

Data: 2026-03-15
Owner page-shell: Codex principal
Owner component-density: Codex 2
Status: pregatit pentru executie

## Context

`Dashboard`, `Checklists`, `Audit si export` si `Setari` au primit deja valuri scurte de declutter.

Urmatorul pilon dens ramas pe firul principal este `Control`.

Aici nu vrem redesign si nu vrem logic nou. Vrem doar component-level density pass, astfel incat `Control` sa citeasca mai clar:

- stare curenta
- ce trebuie confirmat
- ce este drift real
- ce este suport / detaliu

Doctrina activa:

- o pagina = o intentie dominanta
- `summary / detail / action`
- starea si urmatorul pas bat explicatia
- tabs locale, nu pseudo-produse paralele
- omul valideaza

## Scop

Fa `Control wave 1` doar la nivel de componente interne, fara sa atingi page shell-ul.

Tintim:

- `Discovery` mai usor de triat
- `Inventar` mai usor de scanat
- `Compliance Pack` mai putin greu sus
- mai putin framing repetitiv
- CTA-urile reale mai clare

## Ai voie sa modifici doar

- `components/compliscan/ai-discovery-panel.tsx`
- `components/compliscan/ai-inventory-panel.tsx`
- `components/compliscan/ai-compliance-pack-card.tsx`
- optional componente noi strict locale sub `components/compliscan/control/*`

## Nu ai voie sa atingi

- `app/dashboard/sisteme/page.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/alerte/page.tsx`
- `components/compliscan/navigation.ts`
- `components/compliscan/route-sections.tsx`
- `components/compliscan/use-cockpit.tsx`
- `components/evidence-os/*`
- `app/api/*`
- `lib/*`
- documentele canonice

## Ce trebuie sa faci concret

### 1. Discovery

In `ai-discovery-panel.tsx`:

- scoate framing-ul redundant de intrare
- lasa clar sus:
  - cate candidate cer validare
  - care este actiunea principala
- daca exista drift repetat in fiecare card, compacteaza-l
- muta contextul suport sub disclosure sau sub nivel secundar

### 2. Inventory

In `ai-inventory-panel.tsx`:

- fa lista de sisteme mai usor de scanat
- statusul si scopul sistemului sa bata explicatia lunga
- CTA-urile destructive sau rare sa nu stea la aceeasi greutate cu actiunea principala
- redu texte introductive care explica sistemul de mai multe ori

### 3. Compliance Pack

In `ai-compliance-pack-card.tsx`:

- sumarul pack-ului sa citeasca mai rapid
- campurile lipsa / confirmate / inferate sa fie mai clare decat framing-ul
- detaliul greu sa nu stea la aceeasi greutate cu verdictul de completare
- pastreaza suportul auditabil, dar coboara-l sub stratul primar

## Ce NU schimbi

- nu schimbi business logic
- nu schimbi flow-ul `Control`
- nu schimbi tabs / view mode / shell page
- nu schimbi mutatiile sau wiring-ul de state
- nu redenumesti concepte canonice

## Validare ceruta

Rulezi obligatoriu:

- `npm test`
- `npm run lint`
- `npm run build`

## Predare

La final predai exact:

1. lista fisierelor atinse
2. ce ai simplificat concret in fiecare
3. ce a ramas pentru owner-ul de page shell
4. confirmarea explicita ca:
   - nu ai schimbat business logic
   - nu ai atins `app/dashboard/sisteme/page.tsx`
   - nu ai atins `use-cockpit`, `route-sections`, `navigation`, `app/api/*`, `lib/*`
