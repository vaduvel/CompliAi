# Task urmator pentru Codex 2 - convergenta `Agent Workspace` dupa `safe polish`

Data: 2026-03-14

## Preconditie

Nu porni acest lot pana cand batch-ul curent `codex/evidence-os-safe-polish` nu este:

- comis separat
- sau inghetat clar, fara fisiere noi adaugate peste el

Ideal:

- branch nou: `codex/evidence-os-agent-workspace`
- sau worktree separat

Nu amesteca acest lot cu commitul deja audit-ready de `safe polish`.

## Citeste intai

- `public/coordonare-paralel-codex.md`
- `public/task-codex-2-paralel-safe-2026-03-14.md`
- `public/evidence-os-design-system-v1.md`
- `components/evidence-os/evidence-os-integration-map.md`
- `components/evidence-os/evidence-os-worklog.md`

## Context

Batch-ul anterior a inchis polish-ul sigur pe:

- `TaskCard`
- `RemediationBoard`
- `NextBestAction`
- `ExportCenter`
- `FloatingAssistant`
- `app/dashboard/asistent/page.tsx`
- cateva componente canonice `Evidence OS`

Urmatorul lot nu mai este despre cockpitul mare.

Urmatorul lot este despre convergenta locala a `Agent Workspace`, astfel incat:

- layout-ul de review sa fie canonic `Evidence OS`
- cardurile de propuneri sa nu derive vizual
- panoul de decizie sa fie mai clar si mai compact
- adaptoarele runtime permise sa ramana subtiri si stabile

## Zona ta permisa

Poti modifica doar:

- `lib/compliance/agent-workspace.tsx`
- `components/compliscan/agent-workspace.tsx`
- `components/evidence-os/AgentProposalTabs.tsx`
- `components/evidence-os/AgentReviewLayout.tsx`
- `components/evidence-os/AgentStartStateCard.tsx`
- `components/evidence-os/ProposalColumnShell.tsx`
- `components/evidence-os/ReviewDecisionPanel.tsx`
- `components/evidence-os/IntakeSystemCard.tsx`
- `components/evidence-os/FindingProposalCard.tsx`
- `components/evidence-os/DriftProposalCard.tsx`
- `components/evidence-os/ui-audit-backlog.md`
- `components/evidence-os/evidence-os-worklog.md`

## Zona interzisa

Nu ai voie sa modifici:

- `app/dashboard/*`
- `components/compliscan/navigation.ts`
- `components/compliscan/route-sections.tsx`
- `components/compliscan/use-cockpit.tsx`
- `components/compliscan/ai-discovery-panel.tsx`
- `app/api/*`
- `lib/server/*`
- orice alt fisier din `lib/compliance/*` in afara celor permise explicit
- documentele oficiale:
  - `public/log-sprinturi-maturizare.md`
  - `public/status-arhitectura.md`
  - `public/task-breakdown-tehnic.md`
  - `public/sprinturi-maturizare-compliscan.md`

## Ce trebuie sa livrezi

Tintim un lot mic, dar util, fara business logic noua si fara intrare peste runtime critic.

### Batch A - audit + convergenta layout

Fisiere:

- `lib/compliance/agent-workspace.tsx`
- `components/compliscan/agent-workspace.tsx`
- `components/evidence-os/AgentReviewLayout.tsx`
- `components/evidence-os/ProposalColumnShell.tsx`
- `components/evidence-os/AgentStartStateCard.tsx`

Ce faci:

- verifici daca layout-ul actual respecta clar structura:
  - context sursa
  - propuneri
  - decizie finala
- compactezi doar unde exista zgomot vizual sau ierarhie slaba
- intaresti responsive behavior si overflow safety
- daca wrapper-ele raman re-exporturi subtiri, le lasi asa

Ce NU faci:

- nu schimbi fluxul:
  - `run`
  - `reject`
  - `commit`
- nu muti aceasta suprafata in alte pagini

### Batch B - tabs si review decision

Fisiere:

- `components/evidence-os/AgentProposalTabs.tsx`
- `components/evidence-os/ReviewDecisionPanel.tsx`

Ce faci:

- faci tabs-urile mai clare pentru review real:
  - label-uri
  - count-uri
  - wrapping
  - ierarhie activa/inactiva
- clarifici panoul de decizie:
  - sumarul ramas dupa reject-uri
  - CTA principal vs CTA secundar
  - copy mai scurt si mai executabil

Ce NU faci:

- nu introduci stare noua in runtime
- nu schimbi contractul bundle-ului

### Batch C - convergenta cardurilor canonice

Fisiere:

- `components/evidence-os/IntakeSystemCard.tsx`
- `components/evidence-os/FindingProposalCard.tsx`
- `components/evidence-os/DriftProposalCard.tsx`

Ce faci:

- verifici consistenta intre cele trei carduri:
  - titlu
  - metadata
  - semnale sursa
  - rationale
  - propunere / remediere
  - overflow safety
- reduci duplicarea de pattern-uri unde exista markup aproape identic
- folosesti primitivele canonice `Evidence OS`, nu stiluri locale paralele

Ce NU faci:

- nu rescrii cardurile complet fara nevoie
- nu adaugi badge-uri sau copy decorative care cresc densitatea

### Batch D - write-back local

Fisiere:

- `components/evidence-os/ui-audit-backlog.md`
- `components/evidence-os/evidence-os-worklog.md`

Ce faci:

- marchezi exact ce ai inchis in acest lot
- listezi ce a ramas deschis si de ce
- spui clar ce lasi pentru Codex principal

## Definition of done

Lotul este bun doar daca:

1. nu ai atins nimic din zona interzisa
2. `Agent Workspace` este mai coerent vizual si operational
3. adaptoarele runtime permise raman subtiri
4. `npm run lint` trece
5. `npm run build` trece
6. lasi un rezumat scurt cu:
   - fisiere atinse
   - ce ai inchis
   - ce a ramas legacy

## Semnal de oprire

Daca pentru a termina lotul simti ca trebuie sa atingi:

- `app/dashboard/*`
- `components/compliscan/navigation.ts`
- `components/compliscan/route-sections.tsx`
- `components/compliscan/use-cockpit.tsx`
- `app/api/*`
- `lib/server/*`

te opresti si lasi acel punct pentru Codex principal.

## Prompt scurt, gata de lipit

Lucrezi pe un lot nou, separat de `safe polish`, doar dupa ce batch-ul curent este comis sau inghetat. Tinta ta este convergenta `Agent Workspace` pe suprafata permisa: `lib/compliance/agent-workspace.tsx`, `components/compliscan/agent-workspace.tsx`, `components/evidence-os/AgentProposalTabs.tsx`, `AgentReviewLayout.tsx`, `AgentStartStateCard.tsx`, `ProposalColumnShell.tsx`, `ReviewDecisionPanel.tsx`, `IntakeSystemCard.tsx`, `FindingProposalCard.tsx`, `DriftProposalCard.tsx`, plus write-back local in `components/evidence-os/ui-audit-backlog.md` si `components/evidence-os/evidence-os-worklog.md`. Nu intri in `app/dashboard/*`, `navigation`, `route-sections`, `use-cockpit`, `app/api/*`, `lib/server/*` sau alte fisiere `lib/compliance/*`. Nu schimbi business logic si nu schimbi flow-ul de `run / reject / commit`; faci doar convergenta de layout, tabs, review decision si carduri canonice, cu overflow safety si ierarhie mai buna. Validezi cu `npm run lint` si `npm run build`, apoi predai lista exacta de fisiere atinse, ce ai inchis si ce a ramas deschis.
