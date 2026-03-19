# Task curent pentru Codex secundar - Evidence OS UI

Status: `deprecated dupa auditul .md din 2026-03-14`

Nu mai folosi acest fisier ca instructiune curenta.

Delegarea activa a fost mutata in:

- `public/task-codex-2-paralel-safe-2026-03-14.md`

Data: 2026-03-14

## Context

Tu lucrezi doar pe integrarea design system-ului din:

- `public/evidence-os-design-system-v1.md`

Codex principal a închis operațional `Sprint 7` și ține acum:

- integrarea finală
- auditul de diff
- runtime critic
- `Audit Pack`
- `traceability`
- backend și API

Nu trebuie să existe interferență între cele două fire.

## Zona ta permisă

Poți modifica doar:

- `public/evidence-os-design-system-v1.md`
- `app/evidence-os.css`
- `components/evidence-os/*`
- `app/dashboard/asistent/page.tsx`
- `components/compliscan/risk-header.tsx`
- `components/compliscan/route-sections.tsx`
- `components/compliscan/task-card.tsx`
- `components/compliscan/next-best-action.tsx`
- `components/compliscan/floating-assistant.tsx`
- `components/compliscan/remediation-board.tsx`
- `components/compliscan/export-center.tsx`

Și acum, în plus, poți modifica și adaptorii de runtime pentru `Agent Evidence OS`:

- `lib/compliance/agent-workspace.tsx`
- `lib/compliance/IntakeSystemCard.tsx`
- `lib/compliance/FindingProposalCard.tsx`
- `lib/compliance/DriftProposalCard.tsx`
- `components/compliscan/agent-workspace.tsx`

Opțional:

- `app/globals.css`, dar doar dacă:
  - adaugi import pentru `evidence-os.css`
  - sau adaugi variabile CSS izolate pentru `Evidence OS`
  - fără să schimbi stilurile globale ale cockpit-ului principal

## Zona interzisă

Nu ai voie să modifici:

- `app/api/*`
- `lib/server/*`
- `lib/compliance/*` critice, în afară de adaptorii enumerați mai sus
- `app/dashboard/rapoarte/*`
- `app/dashboard/scanari/*`
- `app/dashboard/setari/*`
- `public/log-sprinturi-maturizare.md`
- `public/status-arhitectura.md`
- `public/task-breakdown-tehnic.md`
- `public/sprinturi-maturizare-compliscan.md`

## Ce trebuie să livrezi

### Ținta curentă: `Val 2` la 100% pe suprafața aprobată

Lucrezi după planul oficial din:

- `public/evidence-os-oficializare-si-adoptie.md`

`Val 1` este tratat ca închis și stabil. În faza curentă nu împingem `Evidence OS` peste tot în produs.

Ținta ta este:

- să păstrezi `Val 1` stabil, fără regresii
- să aduci suprafața deja aprobată din `Val 2` la nivel de canonizare completă
- să reduci cât se poate de mult folosirea directă a `components/ui/*` pe suprafața aprobată, atunci când există primitive canonice `Evidence OS`
- să lași motive explicite doar pentru ce trebuie să rămână încă legacy
- să aduci componentele canonice și adaptorii runtime la o stare coerentă, fără dublă mentenanță inutilă

Suprafața aprobată în batch-ul curent înseamnă:

- `components/evidence-os/*`
- `app/dashboard/asistent/page.tsx`
- `components/compliscan/risk-header.tsx`
- `components/compliscan/route-sections.tsx`
- `components/compliscan/task-card.tsx`
- `components/compliscan/next-best-action.tsx`
- `components/compliscan/floating-assistant.tsx`
- `components/compliscan/remediation-board.tsx`
- `components/compliscan/export-center.tsx`
- adaptorii runtime enumerați mai jos

Nu înseamnă încă:

- `Alerte`
- `app/dashboard/scanari/*`
- `app/dashboard/rapoarte/*`
- `app/dashboard/setari/*`

### Definiția de "gata" pentru lotul tău

Lotul tău este gata când:

1. `Val 1` rămâne închis vizual și structural:
   - `components/evidence-os/*` este biblioteca canonică stabilă
   - `app/dashboard/asistent/page.tsx` folosește coerent `Evidence OS`
   - adaptorii runtime nu mai au styling propriu și nu dublează UI
2. suprafața aprobată din `Val 2` nu mai este doar aliniată vizual, ci folosește pe cât posibil stratul canonic `Evidence OS`:
   - badge semantics
   - spacing
   - CTA hierarchy
   - Romanian-first
   - empty/loading states curate
   - primitive canonice acolo unde există alternativă clară
   - fără pierdere de semnal operațional critic în compactare
3. nu introduci componente concurente noi în afara bibliotecii canonice
4. nu extinzi `Evidence OS` în `Val 3`
5. lași listă scurtă cu:
   - ce ai închis
   - ce a rămas legacy în suprafața permisă și de ce
   - ce ai amânat intenționat pentru Codex principal

### Batch 0

1. lucrezi pe branch separat:
   - `codex/evidence-os-ds-finish`
2. nu lucrezi direct pe `main`
3. la final lași:
   - diff curat
   - listă scurtă cu ce ai atins
   - ce a rămas neintegrat

### Batch 1

1. normalizează token-urile din `Evidence OS`
2. mapează token-urile în:
   - `Badge`
   - `Button`
   - `Card`
   - `Tabs`
3. fă `ProposalBundlePanel`, `ProposalCard`, `HumanReviewPanel`, `ReviewPolicyCard`, `CommitSummaryCard`, `AgentRunBadge` coerente vizual între ele

### Batch 2

1. elimină conflictele dintre stilurile `Evidence OS` și cockpit-ul principal
2. păstrează stilurile `Evidence OS` namespaced sau clar izolate
3. evită stiluri globale agresive

### Batch 3

1. curăță inconsistențele vizuale rămase
2. nu adăuga logică de business nouă
3. nu adăuga wiring API nou

### Batch 4

1. convertește adaptorii runtime către componentele canonice:
   - `lib/compliance/IntakeSystemCard.tsx`
   - `lib/compliance/FindingProposalCard.tsx`
   - `lib/compliance/DriftProposalCard.tsx`
2. acești adaptori trebuie să devină:
   - fie re-exporturi directe
   - fie wrappere foarte subțiri peste `components/evidence-os/*`
3. nu schimba tipurile de date și nu muta logica de business în UI

### Batch 5

1. integrează pattern-urile canonice în `lib/compliance/agent-workspace.tsx`
2. folosește, unde se potrivește fără schimbare de contract:
   - `AgentReviewLayout`
   - `SourceContextPanel`
   - `ProposalSectionHeader`
   - `AgentStartStateCard`
   - `EvidenceReadinessCard`
3. păstrează exact aceleași props publice pentru `AgentWorkspace`
4. nu modifica:
   - fetch-uri
   - commit logic
   - headers
   - sesiune
   - wiring API

### Batch 6

1. finalizează experiența `Evidence OS` din:
   - `app/dashboard/asistent/page.tsx`
2. folosește doar componentele canonice deja create
3. curăță:
   - empty states
   - spacing
   - heading hierarchy
   - responsive layout
4. nu atinge:
   - route handlers
   - store
   - auth
   - exporturi

### Batch 7

1. fă audit de suprafață pe `components/evidence-os/*`
2. caută:
   - butoane inconsistente
   - badge-uri duplicate
   - props opționale neprotejate
   - text care iese din carduri
3. rezolvă doar probleme de UI/component safety
4. nu adăuga business logic

### Batch 8

1. folosește `components/evidence-os/ui-audit-backlog.md` doar ca listă de lucru pentru suprafața aprobată
2. poți implementa din acel backlog doar itemii care ating:
   - `app/dashboard/asistent/page.tsx`
   - `components/evidence-os/*`
   - `components/compliscan/risk-header.tsx`
   - `components/compliscan/route-sections.tsx`
   - `components/compliscan/task-card.tsx`
   - `components/compliscan/next-best-action.tsx`
   - `components/compliscan/floating-assistant.tsx`
   - `components/compliscan/remediation-board.tsx`
   - `components/compliscan/export-center.tsx`
3. nu implementa încă itemii care cer lucru în:
   - `app/dashboard/alerte/page.tsx`
   - `components/compliscan/logo.tsx`
   - `app/dashboard/rapoarte/*`
   - `app/dashboard/setari/*`
   - `app/dashboard/scanari/*`

### Batch 9

1. închide convergența UI pe `Asistent` și pe cardurile canonice
2. urmărește explicit:
   - responsive layout
   - wrapping / overflow safety
   - empty states curate
   - ierarhie vizuală clară
   - labels română-first
3. dacă pentru un pas simți că trebuie să intri în cockpit-ul mare, te oprești și îl lași pentru Codex principal

### Batch 10

1. tratează `public/evidence-os-oficializare-si-adoptie.md` ca regulă de livrare, nu doar context
2. închide explicit:
   - `Val 1`
   - suprafața aprobată din `Val 2`
3. nu începe `Val 3`
4. nu extinde `Evidence OS` în paginile mari din dashboard

## Cum să lucrezi

1. Lucrează în batch-uri mici.
2. Nu modifica runtime-ul.
3. Poți atinge doar runtime-ul UI al `Agent Workspace`, nu runtime-ul operațional al produsului.
4. Nu schimba contracte TypeScript care sunt folosite de backend.
5. Nu adăuga side effects.
6. Nu modifica:
   - `app/dashboard/scanari/page.tsx`
   - niciun endpoint din `app/api/*`
7. `components/evidence-os/ui-audit-backlog.md` este backlog local, nu autorizație să extinzi zona permisă
7. Dacă simți nevoia să atingi backend sau route handlers, te oprești și lași pasul pentru Codex principal.

## Cum livrezi

La final:

- lași doar fișierele din zona permisă
- nu actualizezi documentele de sprint
- nu rulezi integrare peste `Audit Pack` sau `traceability`
- nu schimbi fluxurile principale ale cockpit-ului

Codex principal va face:

- audit pe diff
- integrare finală
- `test`
- `lint`
- `build`
- update în documentele de control
- închiderea `Val 2` pe restul suprafețelor sensibile
- `Val 3`
- polish final Sprint 1-7
- backlog recheck
- architecture + implementation review

## Prompt scurt

> Lucrează doar pe `public/evidence-os-design-system-v1.md`, `app/evidence-os.css`, `components/evidence-os/*` și adaptorii runtime enumerați în `public/task-codex-evidence-os-ui.md`.
> Poți intra și în `app/dashboard/asistent/page.tsx`, dar nu modifica `app/api/*`, `lib/server/*`, `app/dashboard/scanari/*` sau documentele de sprint.
> Convertește `Agent Evidence OS` spre componentele canonice din `components/evidence-os/*`, fără logică de business nouă și fără schimbarea contractelor publice.
> Dacă ai nevoie de backend, API sau schimbări în paginile principale, oprește-te și lasă pasul pentru Codex principal.
