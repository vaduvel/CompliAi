# Task curent pentru Codex 2 - paralelism sigur dupa auditul `.md`

Data: 2026-03-14

## Citeste intai

Lucrezi dupa:

- `public/audit-md-backlog-sprint-ready-2026-03-14.md`
- `public/evidence-os-oficializare-si-adoptie.md`
- `public/coordonare-paralel-codex.md`
- `components/evidence-os/ui-audit-backlog.md`

## Context

Auditul pe documentatie a confirmat:

- `Sprint 1-7` sunt inchise operational
- `Evidence OS` este oficializat si `Val 3` este tratat ca inchis operational
- backlog-ul ramas nu mai este pe fundatie, ci pe:
  - cockpit cleanup
  - performanta
  - member admin
  - parser XML robust
  - polish component-level sigur

Codex principal tine in continuare:

- cockpitul mare
- navigatia
- runtime-ul critic
- performanta
- documentele oficiale de status

Tu nu intri peste aceste fire.

## Branch

Lucreaza in:

- `codex/evidence-os-safe-polish`

Nu lucra direct pe `main`.

## Status dupa auditul principalului

Batch-ul curent este `inghetat si audit-ready`.

Ce inseamna asta:

- nu mai extinzi lotul curent
- nu mai adaugi fisiere noi in acest batch
- urmatorul pas pentru acest lot este:
  - commit separat
  - integrare controlata

Fisierele aprobate pentru commitul tau sunt:

- `app/dashboard/asistent/page.tsx`
- `components/compliscan/export-center.tsx`
- `components/compliscan/floating-assistant.tsx`
- `components/compliscan/next-best-action.tsx`
- `components/compliscan/remediation-board.tsx`
- `components/compliscan/task-card.tsx`
- `components/evidence-os/EmptyState.tsx`
- `components/evidence-os/ProposalBundlePanel.tsx`
- `components/evidence-os/SourceContextPanel.tsx`
- `components/evidence-os/SourceEnvelopeCard.tsx`
- `components/evidence-os/evidence-os-worklog.md`
- `components/evidence-os/ui-audit-backlog.md`

Validarea pe acest batch a fost confirmata de Codex principal:

- `npm run lint`
- `npm run build`
- `npm test`

## Zona ta permisa

Poti modifica doar:

- `components/evidence-os/*`
- `components/evidence-os/ui-audit-backlog.md`
- `components/evidence-os/evidence-os-worklog.md`
- `components/compliscan/task-card.tsx`
- `components/compliscan/remediation-board.tsx`
- `components/compliscan/next-best-action.tsx`
- `components/compliscan/export-center.tsx`
- `components/compliscan/floating-assistant.tsx`
- `app/dashboard/asistent/page.tsx`

## Zona interzisa

Nu ai voie sa modifici:

- `app/dashboard/alerte/page.tsx`
- `app/dashboard/checklists/page.tsx`
- `app/dashboard/scanari/*`
- `app/dashboard/rapoarte/*`
- `app/dashboard/setari/*`
- `components/compliscan/navigation.ts`
- `components/compliscan/use-cockpit.ts`
- `components/compliscan/route-sections.tsx`
- `components/compliscan/risk-header.tsx`
- `app/api/*`
- `lib/server/*`
- `lib/compliance/*`
- `public/log-sprinturi-maturizare.md`
- `public/status-arhitectura.md`
- `public/task-breakdown-tehnic.md`
- `public/sprinturi-maturizare-compliscan.md`

## Ce trebuie sa livrezi

Tintim doar polish component-level sigur, fara sa schimbi flow-ul produsului.

### Batch 1 - compactare `TaskCard`

Fisiere:

- `components/compliscan/task-card.tsx`
- `components/compliscan/remediation-board.tsx`
- `components/compliscan/next-best-action.tsx`

Ce faci:

- reduci dublarea dintre `summary` si `fixPreview`
- faci mai clara ierarhia:
  - rezumat principal
  - detalii secundare
  - CTA principal
  - CTA secundare
- limitezi badge noise

Ce NU faci:

- nu schimbi contractele publice de props daca nu e strict necesar
- nu introduci business logic noua
- nu muti actiuni in pagini

### Batch 2 - CTA hierarchy pentru export

Fisier:

- `components/compliscan/export-center.tsx`

Ce faci:

- separi vizual exportul principal de exporturile secundare / tehnice
- scurtezi label-urile lungi
- pastrezi toate actiunile existente

Ce NU faci:

- nu schimbi endpoint-uri
- nu schimbi wiring de export
- nu atingi `app/dashboard/rapoarte/page.tsx`

### Batch 3 - overflow / wrapping / mobile safety

Fisiere:

- `components/compliscan/floating-assistant.tsx`
- `components/evidence-os/*`

Ce faci:

- protejezi nume lungi, label-uri lungi si continut real
- rezolvi wrapping, truncation si max-width unde e fragil
- verifici focus rings si stari interactive minime

Ce NU faci:

- nu introduci stiluri globale agresive
- nu schimbi tema cockpitului mare

### Batch 4 - disciplinare pe componente canonice

Fisiere:

- `components/evidence-os/*`
- optional `app/dashboard/asistent/page.tsx`

Ce faci:

- elimini duplicate vizuale mici
- faci page recipes mai coerente in DS:
  - empty states
  - dense lists
  - action clusters
- folosesti componente canonice existente in loc de markup local repetat

Ce NU faci:

- nu extinzi `Evidence OS` in paginile mari ale dashboard-ului
- nu atingi runtime-ul critic

### Batch 5 - write-back local

Fisiere:

- `components/evidence-os/ui-audit-backlog.md`
- `components/evidence-os/evidence-os-worklog.md`

Ce faci:

- marchezi ce itemi ai inchis
- listezi ce a ramas deschis in suprafata ta si de ce
- lasi clar pentru Codex principal ce NU ai atins intentionat

## Definition of done pentru lotul tau

Lotul este bun de predat doar daca:

1. nu ai atins niciun fisier din zona interzisa
2. nu ai schimbat runtime, API sau navigatie
3. component-level UX este mai compact si mai coerent
4. `npm run lint` trece
5. lasi lista scurta cu:
   - fisiere atinse
   - ce ai inchis
   - ce a ramas legacy

## Semnal de oprire

Daca pentru orice pas simti ca trebuie sa atingi:

- `app/dashboard/*`
- `components/compliscan/navigation.ts`
- `components/compliscan/use-cockpit.ts`
- `lib/server/*`
- `app/api/*`

te opresti si lasi acel punct pentru Codex principal.

## Obiectivul corect

Nu vrem sa intri in cockpitul mare.

Vrem sa livrezi un lot mic, curat si util pe suprafata componentelor, astfel incat:

- eu sa continui `Drift`, `Setari` si cleanup-ul mare
- tu sa ridici claritatea si consistenta UI acolo unde nu ne calcam pe picioare
