# CompliScan - corpus UX si plan de recuperare

Data: 2026-03-14

## Verdict scurt

Da, problema este reala:

- UX-ul este inca prea greu
- paginile mari sunt prea amestecate
- `Evidence OS` exista si este oficial, dar nu controleaza inca suficient de clar arhitectura fiecarei pagini

Pe scurt:

- nu avem o problema de "lipsa de design system"
- avem o problema de "design system oficial + arhitectura de pagini inca partial hibrida"

Decizia sanatoasa este:

- **da, trebuie sa terminam adoptia `Evidence OS` peste produsul mare**
- **dar nu ca repaint cosmetic**
- **ci ca sistem de page recipes + ierarhie + progressive disclosure + deprecarea suprafetelor legacy**

## Raspuns direct la intrebare

### Ofera `Evidence OS` claritate de UX?

Da, dar doar partial in starea actuala.

`Evidence OS` ofera deja:

- primitive canonice
- semantica buna pentru:
  - status
  - severitate
  - review
  - dovada
- layout-uri bune pe suprafata agentica
- progressive disclosure in design

Ce NU ofera inca complet, pentru ca produsul nu a ajuns pana acolo:

- control cap-coada asupra tuturor paginilor mari
- page recipes unice pentru:
  - `Dashboard`
  - `Scanare`
  - `Control`
  - `Dovada`
  - `Setari`
- eliminarea completa a suprafetelor hibride si a mostenirilor de demo / cockpit vechi

Concluzie:

- `Evidence OS` este baza corecta
- dar nu este inca aplicat suficient de sus in arhitectura UX

## Ce spun documentele, puse cap la cap

### 1. Surse canonice de control

Acestea spun ce este voie sa schimbam si care este adevarul oficial:

- `public/sprinturi-maturizare-compliscan.md`
- `public/status-arhitectura.md`
- `public/log-sprinturi-maturizare.md`
- `public/task-breakdown-tehnic.md`

Mesajul lor comun:

- firul produsului este bun
- problema este fragmentarea si greutatea locala
- nu trebuie rewrite mare
- trebuie coerenta UI + decompozitie controlata

### 2. Surse canonice pentru UX / IA

- `public/ux-ui-flow-arhitectura.md`
- `public/gpt-ux-flow-brief.md`
- `public/harta-navigare-trasee-user-2026-03-14.md`

Mesajul lor comun:

- IA aprobata este:
  - `Dashboard`
  - `Scanare`
  - `Control`
  - `Dovada`
  - `Setari`
- problema reala este `mixed intent`
- `Dashboard` trebuie sa orienteze, nu sa execute
- sub-sectiunile trebuie tinute in tabs per pilon, nu ca pseudo-produse paralele

### 3. Surse canonice pentru `Evidence OS`

- `public/evidence-os-design-system-v1.md`
- `public/evidence-os-oficializare-si-adoptie.md`
- `public/audit-final-evidence-os-2026-03-14.md`
- `components/evidence-os/evidence-os-integration-map.md`
- `components/evidence-os/ui-audit-backlog.md`
- `components/evidence-os/evidence-os-worklog.md`
- `components/evidence-os/qa-agent-os-runbook.md`

Mesajul lor comun:

- `Evidence OS` este DS oficial
- primitivele sunt canonice
- suprafata agentica este buna
- adoptia peste cockpit este reala, dar nu suficient de "guvernatoare"

### 4. Audituri care arata unde se rupe UX-ul

- `public/review-arhitectura-implementare-2026-03-14.md`
- `public/audit-cursor-dashboard-2026-03-14.md`
- `public/audit-la-sange-compliscan-2026-03-14.md`
- `public/audit-md-backlog-sprint-ready-2026-03-14.md`
- `public/polish-backlog-post-sprint7.md`

Mesajul lor comun:

- `useCockpit` este prea mare
- paginile mari combina prea multe responsabilitati
- exista inca suprafete hibride
- `components/dashboard/*` ramane legacy periculos pentru claritate

## Fisiere UX care trebuie tratate drept corpus activ

### A. Arhitectura si IA

- `public/ux-ui-flow-arhitectura.md`
- `public/gpt-ux-flow-brief.md`
- `public/harta-navigare-trasee-user-2026-03-14.md`

### B. `Evidence OS`

- `public/evidence-os-design-system-v1.md`
- `public/evidence-os-oficializare-si-adoptie.md`
- `public/audit-final-evidence-os-2026-03-14.md`
- `components/evidence-os/evidence-os-integration-map.md`
- `components/evidence-os/ui-audit-backlog.md`
- `components/evidence-os/evidence-os-worklog.md`

### C. Audituri de presiune UX

- `public/review-arhitectura-implementare-2026-03-14.md`
- `public/audit-cursor-dashboard-2026-03-14.md`
- `public/audit-la-sange-compliscan-2026-03-14.md`
- `public/polish-backlog-post-sprint7.md`
- `public/audit-md-backlog-sprint-ready-2026-03-14.md`

### D. Suprafete runtime care definesc UX-ul real

- `app/dashboard/page.tsx`
- `app/dashboard/scanari/page.tsx`
- `app/dashboard/documente/page.tsx`
- `app/dashboard/sisteme/page.tsx`
- `app/dashboard/alerte/page.tsx`
- `app/dashboard/checklists/page.tsx`
- `app/dashboard/rapoarte/page.tsx`
- `app/dashboard/rapoarte/auditor-vault/page.tsx`
- `app/dashboard/setari/page.tsx`
- `app/dashboard/asistent/page.tsx`
- `components/compliscan/dashboard-shell.tsx`
- `components/compliscan/navigation.ts`
- `components/compliscan/route-sections.tsx`
- `components/compliscan/use-cockpit.tsx`

### E. Legacy care trebuie vazut explicit, nu ignorat

- `components/dashboard/DashboardShell.tsx`
- `components/dashboard/DashboardCards.tsx`
- `components/dashboard/DashboardHeader.tsx`
- `components/dashboard/RiskScoreCircle.tsx`
- `components/dashboard/SidebarNav.tsx`
- `components/dashboard/ActionBar.tsx`
- `components/dashboard/DashboardFooterDisclaimer.tsx`
- `components/dashboard/BrandMark.tsx`

Acestea nu trebuie tratate ca "neimportante".

Ele sunt periculoase pentru claritate tocmai pentru ca:

- exista in repo
- seamana cu produsul
- dar nu sunt sursa reala de runtime

## Diagnosticul real

### Ce merge

- IA top-level este acum buna
- `Dovada` este deja mult mai coerenta decat inainte
- `Drift` incepe sa fie mai clar
- `Evidence OS` are limbaj vizual coerent

### Ce nu merge

- multe pagini inca arata ca "summary + explanation + board + utility + next steps" in acelasi loc
- userul nou nu intelege usor:
  - unde incepe
  - unde executa
  - unde doar verifica
  - unde doar exporta
- `Evidence OS` este folosit ca librarie, dar nu inca suficient ca regula de compozitie

### Formula problemei

Problema nu este:

- "nu avem componente frumoase"

Problema este:

- avem prea multe responsabilitati simultan pe aceeasi pagina
- avem page-level UX incomplet guvernat
- avem inca mosteniri de cockpit vechi si de spike-uri demo

## Decizia recomandata

### Da, terminam `Evidence OS` peste tot

Dar inseamna asta:

1. `Evidence OS` devine sursa unica pentru:
   - shell semantics
   - page intro
   - tabs
   - section dividers
   - status semantics
   - action clusters
   - empty states
   - loading states

2. fiecare pagina mare capata un recipe clar:
   - ce este summary
   - ce este execution
   - ce este review
   - ce este export

3. suprafetele legacy sunt:
   - marcate explicit ca legacy
   - scoase din orice discutie despre UI nou

### Nu recomand

- repaint global rapid
- "bagam Evidence OS peste tot" fara decompozitie de responsabilitati
- inlocuire haotica de componente fara reguli de page architecture

## Plan de recuperare UX

### Faza 1 - inghetam adevarul UX

Obiectiv:

- nu mai lucram dupa fisiere contradictorii

Actiuni:

1. tratam drept canonice:
   - `public/ux-ui-flow-arhitectura.md`
   - `public/gpt-ux-flow-brief.md`
   - `public/evidence-os-design-system-v1.md`
2. tratam `components/dashboard/*` drept legacy explicit
3. interzicem noi suprafete UI in afara `components/evidence-os/*` si `components/compliscan/*`

### Faza 2 - `Evidence OS` devine page system, nu doar component library

Obiectiv:

- acelasi limbaj de compozitie peste toate paginile mari

Actiuni:

1. recipe pentru `Dashboard`
2. recipe pentru `Scanare`
3. recipe pentru `Control`
4. recipe pentru `Dovada`
5. recipe pentru `Setari`

Aceste recipes trebuie sa defineasca:

- header
- tabs
- summary block
- action block
- detail blocks
- handoff block

### Faza 3 - atacam paginile in ordinea durerii UX

Ordinea recomandata:

1. `Dashboard`
   - sa devina orientare pura
2. `Scanari`
   - sa nu mai fie 7 lucruri in acelasi loc
3. `Control / Sisteme`
   - sa fie workspace clar, nu centru comercial de carduri
4. `Setari`
   - sa ramana operational, nu pagina monstru
5. `Auditor Vault`
   - decompozitie controlata dupa ce firul principal e clar

### Faza 4 - cleanup structural dupa clarificarea UX

Doar dupa ce page recipes sunt clare:

1. split controlat pentru `useCockpit`
2. payload-uri mai mici
3. extragere de sectiuni mari in componente mai curate

## Ce trebuie sa spunem foarte clar

Putem spune simultan doua lucruri adevarate:

1. `Evidence OS` este oficial si bun
2. UX-ul produsului mare este inca insuficient de clar

Nu se bat cap in cap.

Inseamna doar ca:

- DS-ul este mai matur decat compozitia finala a produsului

## Verdict final

Aplicatia nu mai este "haos total", dar este inca prea grea si prea amestecata pentru un user nou.

Da, trebuie sa terminam `Evidence OS` peste tot.

Dar forma corecta este:

- `Evidence OS` ca sistem complet de pagini si flow
- nu doar ca set de badge-uri, carduri si tabs

Abia atunci produsul nu va mai arata "ca un brad de craciun", ci ca un cockpit serios si controlat.
