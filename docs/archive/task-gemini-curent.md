# Task curent pentru Gemini

Data: 2026-03-13

## Context

CompliScan este in `Sprint 6 - Audit defensibility`.

Codex lucreaza acum pe miezul critic al produsului:

- `Audit Pack`
- traceability
- evidence quality
- quality gates
- family reuse defensiv
- fixtures grele
- teste

Ca sa nu existe coliziuni, Gemini trebuie sa lucreze doar pe piese izolate, care pot fi integrate dupa review.

## Regula principala

Nu modifica fisierele care tin de fundatia operationala curenta.

### Nu ai voie sa atingi

- `lib/server/auth.ts`
- `lib/server/mvp-store.ts`
- `lib/compliance/types.ts`
- `lib/compliance/engine.ts`
- `lib/server/audit-pack.ts`
- `lib/server/compliance-trace.ts`
- `lib/compliance/audit-quality-gates.ts`
- `lib/server/audit-pack-bundle.ts`
- `lib/server/audit-pack-client.ts`
- `lib/server/scan-workflow.ts`
- `app/api/auth/*`
- `app/api/scan/*`
- `app/api/tasks/*`
- `app/api/exports/*`
- `app/api/drifts/*`

### Poti modifica doar fisierele delegate

- `lib/compliance/agent-os.ts`
- `public/agent-evidence-os-v1.md`
- `tests/fixtures/agent-os/*`
- `public/qa-agent-os-runbook.md`
- `public/sprint-6-audit-quality-gates.md`
- `public/evidence-quality-spec.md`
- `components/agent-workspace/*`
- optional `app/dashboard/asistent/page.tsx`, dar doar ca wrapper simplu peste componente noi

## Batch-ul curent de lucru

Fa taskurile in ordinea asta.

### Task 1 - Fixtures suplimentare pentru Agent OS

Livreaza:

- `tests/fixtures/agent-os/source-envelope-yaml.json`
- `tests/fixtures/agent-os/proposal-bundle-review.json`
- `tests/fixtures/agent-os/proposal-bundle-blocked.json`
- update in `public/qa-agent-os-runbook.md`

Conditii:

- fara a scrie teste reale in codul de productie
- doar fixture-uri si runbook
- trebuie sa existe clar:
  - caz `pass`
  - caz `review`
  - caz `blocked`

### Task 2 - Fundatia Agent Evidence OS

Livreaza:

- `lib/compliance/agent-os.ts`
- `public/agent-evidence-os-v1.md`

In `agent-os.ts` defineste doar:

- `SourceEnvelope`
- `AgentRun`
- `AgentProposalBundle`
- `IntakeProposal`
- `FindingProposal`
- `RemediationProposal`
- `EvidenceProposal`
- `AuditPrepProposal`

Adauga si enum-uri / union types pentru:

- `AgentRunStatus`
- `AgentProposalStatus`
- `AgentProposalConfidence`
- `HumanReviewState`
- `AgentKind`

Conditii:

- fara endpoint-uri
- fara store
- fara auth
- fara side effects
- doar tipuri curate si helperi simpli de normalizare, daca e nevoie

### Task 3 - Evidence-control linkage spec

Livreaza:

- `public/evidence-control-linkage-spec.md`

Defineste clar:

- cum se leaga dovada de:
  - control
  - articol / referinta legala
  - finding
  - drift
- ce inseamna:
  - dovada atasata
  - dovada valida
  - dovada reutilizata
  - dovada care cere confirmare finala
- cand un control trebuie sa ramana:
  - `review`
  - `blocked`

Conditii:

- fara sa atingi runtime-ul
- fara sa modifici `audit-pack.ts`
- fara sa modifici `compliance-trace.ts`

### Task 4 - Agent Workspace UI shell izolat

### Task 5 - Evidence quality spec

Livreaza:

- `public/evidence-quality-spec.md`

Defineste:

- tipuri de dovezi
- ce dovada este slaba
- ce dovada este suficienta
- ce dovada trebuie revalidata la drift
- cum se leaga de control / articol / task

Livreaza:

- `components/agent-workspace/AgentRunBadge.tsx`
- `components/agent-workspace/ProposalCard.tsx`
- `components/agent-workspace/ProposalBundlePanel.tsx`
- `components/agent-workspace/HumanReviewPanel.tsx`
- `components/agent-workspace/SourceEnvelopeCard.tsx`
- optional `components/agent-workspace/ProposalStatusLegend.tsx`

Optional:

- update minim in `app/dashboard/asistent/page.tsx`

Conditii:

- mock state local
- fara API real
- fara integrare cu auth
- fara integrare cu store
- fara sa mute navigatia sau structura cockpit-ului

## Cum sa lucrezi

1. Lucreaza in batch-uri mici.
2. Nu modifica fisiere in afara listei permise.
3. Nu redenumi fisiere existente din produs.
4. Nu schimba `Scanare / Control / Dovada`.
5. Nu schimba framing-ul produsului:
   - aplicatia ofera suport si structura
   - omul valideaza
6. Daca ai nevoie de integrare cu runtime-ul existent, te opresti si lasi acel pas pentru Codex.
7. Daca propui ceva nou, pune-l in documentul de spec, nu direct in fundatia reala.

## Cum sa livrezi

La finalul fiecarui batch:

- lasa doar fisierele izolate cerute
- nu atinge logurile si sprinturile proiectului
- nu actualiza documentele de status global
- nu modifica testele existente ale produsului

Codex va face:

- review
- integrare
- teste
- `lint`
- `build`
- update in:
  - `public/log-sprinturi-maturizare.md`
  - `public/status-arhitectura.md`
  - `public/task-breakdown-tehnic.md`

## Prompt scurt pentru Gemini

> Lucreaza doar pe batch-ul curent din `public/task-gemini-curent.md`.
> Nu modifica auth, mvp-store, engine, audit-pack, compliance-trace, audit-quality-gates, scan-workflow sau route handlers critici.
> Livreaza doar fisiere izolate, usor de integrat, fara rewrite.
> Pastreaza framing-ul corect al produsului: aplicatia ofera suport si structura, iar omul valideaza.

## Ce urmeaza dupa livrare

Dupa ce Gemini livreaza:

1. Codex verifica diff-ul
2. Codex decide ce intra
3. Codex leaga piesele de runtime daca merita
4. Codex actualizeaza documentele de control

## Nota finala

Gemini nu conduce arhitectura de runtime.

Gemini produce:

- types
- fixtures
- spec
- UI shell izolat

Codex integreaza in produsul real.
