# Task pentru Codex 2 - UX Wave 1 / `Evidence OS` page recipes

Data: 2026-03-14

## Context

Verdictul nou este clar:

- `Evidence OS` este DS oficial
- UX-ul produsului mare este inca prea greu
- problema nu mai este lipsa de primitive
- problema este lipsa unui `page system` suficient de clar peste cockpitul mare

Codex principal va tine:

- arhitectura UX pe paginile mari
- wiring-ul real in `app/dashboard/*`
- navigatia
- `useCockpit`
- API si server runtime
- documentele oficiale de control

Tu accelerezi fundatia de `Evidence OS` necesara pentru refacerea UX-ului.

## Scopul lotului tau

Nu faci polish decorativ.

Faci baza reutilizabila pentru UX Wave 1:

1. `Evidence OS` sa poata fi folosit ca `page system`, nu doar ca librarie de componente
2. sa avem primitive si recipes canonice pentru:
   - page intro
   - summary strip
   - section boundary
   - action cluster
   - handoff / next step
3. sa izolam clar zona legacy `components/dashboard/*` ca sa nu mai concureze mental cu runtime-ul real

## Ce citesti intai

- `public/ux-corpus-si-plan-recuperare-2026-03-14.md`
- `public/evidence-os-design-system-v1.md`
- `public/evidence-os-oficializare-si-adoptie.md`
- `public/coordonare-paralel-codex.md`
- `components/evidence-os/ui-audit-backlog.md`
- `components/evidence-os/evidence-os-worklog.md`

## Zona ta permisa

Poti modifica doar:

- `components/evidence-os/*`
- `app/evidence-os.css`
- `public/evidence-os-design-system-v1.md`
- `components/evidence-os/ui-audit-backlog.md`
- `components/evidence-os/evidence-os-worklog.md`
- `public/legacy-dashboard-ui-map-2026-03-14.md` (nou)

Optional, doar daca este strict util pentru documentare:

- `components/dashboard/*`
  - dar numai pentru comentarii sau markeri expliciti de legacy
  - fara redesign
  - fara refactor

## Zona interzisa

Nu ai voie sa modifici:

- `app/dashboard/*`
- `components/compliscan/navigation.ts`
- `components/compliscan/dashboard-shell.tsx`
- `components/compliscan/route-sections.tsx`
- `components/compliscan/use-cockpit.tsx`
- `components/compliscan/ai-discovery-panel.tsx`
- `app/api/*`
- `lib/server/*`
- orice fisier de runtime critic din `lib/compliance/*`
- documentele oficiale:
  - `public/log-sprinturi-maturizare.md`
  - `public/status-arhitectura.md`
  - `public/task-breakdown-tehnic.md`
  - `public/sprinturi-maturizare-compliscan.md`

## Ce trebuie sa livrezi

### Batch A - primitive de page recipe in `Evidence OS`

Poti crea sau extinde, doar daca au sens real, componente canonice precum:

- `PageIntroCard`
- `SummaryStrip`
- `ActionClusterCard`
- `WorkflowHandoffCard`
- `SectionBoundaryCard`

Numele exacte nu sunt obligatorii.

Important este sa rezolvi pattern-urile lipsa, nu sa inventezi componente decorative.

Ce trebuie sa reuseasca aceste primitive:

- sa dea structura clara pentru page-level UX
- sa suporte:
  - heading
  - description
  - badges
  - summary metrics
  - CTA principal
  - CTA secundare
  - handoff catre pagina urmatoare
- sa fie robuste la wrapping si mobil

### Batch B - recipes canonice in DS

Actualizezi `public/evidence-os-design-system-v1.md` cu o sectiune noua sau extinsa despre:

- cum arata un page recipe in `Evidence OS`
- ce structura au paginile de tip:
  - orientare
  - execution
  - audit-ready
  - settings / operational

Nu redesenezi intreg documentul.

Doar adaugi partea care lipseste:

- `Evidence OS` ca sistem de compozitie de pagina

### Batch C - legacy quarantine map

Creezi:

- `public/legacy-dashboard-ui-map-2026-03-14.md`

Continut minim:

- lista `components/dashboard/*`
- ce reprezinta
- de ce sunt legacy
- regula:
  - nu se mai folosesc ca sursa pentru UI nou
  - runtime-ul real ramane in:
    - `components/compliscan/*`
    - `components/evidence-os/*`

### Batch D - write-back local

Actualizezi:

- `components/evidence-os/ui-audit-backlog.md`
- `components/evidence-os/evidence-os-worklog.md`

Spui clar:

- ce primitive / recipes ai inchis
- ce a ramas deschis
- ce lasi pentru Codex principal sa integreze in paginile mari

## Ce NU faci

- nu intri in paginile mari
- nu schimbi flow-uri reale de produs
- nu umbli la tabs/navigatie in cockpit
- nu pui `Evidence OS` direct peste `Dashboard`, `Scanare`, `Control`, `Dovada`, `Setari`
- nu creezi primitive generice fara sens concret de page recipe

## Definition of done

Lotul tau este bun doar daca:

1. `Evidence OS` are baza mai clara pentru page-level UX
2. exista document clar pentru zona legacy `components/dashboard/*`
3. nu ai atins cockpitul mare
4. `npm run lint` trece
5. `npm run build` trece
6. predai lista exacta de fisiere atinse si ce a ramas pentru principal

## Prompt scurt, gata de lipit

Lucrezi pe `UX Wave 1` pentru `Evidence OS`, dar NU intri in paginile mari. Tinta ta este sa faci `Evidence OS` capabil sa functioneze ca `page system`, nu doar ca librarie de primitive. Poti modifica doar `components/evidence-os/*`, `app/evidence-os.css`, `public/evidence-os-design-system-v1.md`, `components/evidence-os/ui-audit-backlog.md`, `components/evidence-os/evidence-os-worklog.md` si sa creezi `public/legacy-dashboard-ui-map-2026-03-14.md`. Creezi sau extinzi doar primitive utile de page recipe (page intro, summary strip, action cluster, handoff, section boundary), actualizezi DS-ul cu reguli de compozitie de pagina si documentezi clar de ce `components/dashboard/*` este legacy. Nu intri in `app/dashboard/*`, `navigation`, `route-sections`, `use-cockpit`, `app/api/*`, `lib/server/*` sau runtime critic. Validezi cu `npm run lint` si `npm run build`, apoi predai lista exacta de fisiere atinse, ce ai inchis si ce a ramas pentru Codex principal.
