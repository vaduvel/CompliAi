# Audit pregatitor - urmatorul val scurt dupa `Scanare`

Data: 2026-03-15

## Status

Recomandarea din acest audit a fost absorbita pe acelasi branch.

- recommended next wave: `/dashboard/rapoarte`
- executat prin:
  - `38f6c0c` `Defer reports support panels behind local loading`

## Scop

Alegerea unui singur candidat sanatos pentru urmatorul val scurt de UX/performance, imediat dupa `Scanare`, fara redesign mare si fara deschidere de front nou.

## Evaluare candidati

### 1. `/dashboard/rapoarte`

- intentie dominanta:
  - snapshot de `Dovada`, readiness si export
- ce pare inca greu / dens / mixed:
  - amesteca prea usor status executiv, snapshot si actiuni de livrare
  - ramane suprafata cu claritate `medie`, nu `buna`
  - este vecina directa a fluxului `Dovada`, deci orice ambiguitate aici strica handoff-ul dupa remediere
- ce pas scurt ar fi sanatos:
  - intarire de `page intro`
  - separare stricta `summary / detail / action`
  - un singur cluster clar de export, fara ton de remediere in pagina
  - folosire mai stricta a recipe-urilor `Evidence OS`, nu markup bespoke
- merita sau nu sa fie urmatorul val:
  - `da`

### 2. `/dashboard/checklists`

- intentie dominanta:
  - executie task-uri si atasare dovada
- ce pare inca greu / dens / mixed:
  - board-ul poate deveni dens cand cresc filtrele si starile
  - handoff-ul spre `Vault` si `Audit si export` poate fi inca compactat
  - dar intentia principala este deja clara
- ce pas scurt ar fi sanatos:
  - compactare de filtre, empty states si handoff cards
  - fara schimbare de wiring sau de board logic
- merita sau nu sa fie urmatorul val:
  - `nu`, pentru ca pagina este deja mai clara decat celelalte candidate

### 3. `/dashboard/asistent`

- intentie dominanta:
  - utilitar global de clarificare si orientare
- ce pare inca greu / dens / mixed:
  - este mai mult o suprafata de suport decat una de executie critica
  - castigul de UX ar fi mai degraba microcopy si history polish, nu clarificare structurala mare
- ce pas scurt ar fi sanatos:
  - compactare de intro, sugestii rapide si handoff inapoi in pagina activa
  - fara schimbare de rol in IA
- merita sau nu sa fie urmatorul val:
  - `nu`, pentru ca leverage-ul este mai mic decat in `Rapoarte`

## Recommended next wave

`/dashboard/rapoarte`

## De ce este cel mai sanatos

- este urmatorul pas natural dupa clarificarea `Scanare`
- este o singura pagina, cu scope scurt si impact real in lantul `Dovada`
- claritatea ei este inca doar `medie`, deci exista castig vizibil fara val mare
- `Checklists` este deja mai clar, iar `Asistent` este utilitar, nu punct critic al flow-ului principal
- se potriveste perfect doctrinei canonice:
  - o pagina = o intentie dominanta
  - `summary / detail / action` separate
  - tabs locale, nu shortcut-uri concurente
  - omul valideaza

## Ce NU trebuie atins in acel val

- nu se re-deschide `Scanare`
- nu se muta `Remediere` inapoi in `Rapoarte`
- nu se atinge `/dashboard/rapoarte/auditor-vault`
- nu se ating `app/api/*`, `lib/*`, exporturile sau generarea de pachete
- nu se schimba navigatia mare sau IA oficiala a produsului
