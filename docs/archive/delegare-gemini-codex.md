# CompliScan - Delegare Gemini + Codex

Data: 2026-03-13

## Scop

Lucram in paralel fara sa rupem fundatia produsului.

Regula principala:

- Gemini produce piese izolate, usor de revizuit si usor de integrat
- Codex integreaza in arhitectura reala, adauga teste, valideaza si actualizeaza documentele

## Ce NU trebuie sa atinga Gemini direct

Fisiere critice pentru fundatia curenta:

- `lib/server/auth.ts`
- `lib/server/mvp-store.ts`
- `lib/compliance/types.ts`
- `lib/compliance/engine.ts`
- `lib/server/audit-pack.ts`
- `lib/server/audit-pack-bundle.ts`
- `lib/server/scan-workflow.ts`
- `app/api/auth/*`
- `app/api/tasks/*`
- `app/api/scan/*`

Acestea raman la Codex.

## Unde suntem acum

Sprint activ:

- `Sprint 6 - Audit defensibility`

Sprinturi:

- `Sprint 1` inchis
- `Sprint 2` inchis
- `Sprint 3` bine avansat
- `Sprint 4` inchis operational
- `Sprint 5` inchis operational
- `Sprint 6` activ

## Model bun de lucru in paralel

### Track A - Gemini inainte

Gemini lucreaza pe:

- tipuri noi izolate
- UI shell izolat
- fixtures si spec-uri
- quality gates si runbook-uri
- propuneri de state machine / proposal bundle

### Track B - Codex dupa

Codex face:

- integrare in codul existent
- compatibilitate cu `Scanare / Control / Dovada`
- compatibilitate cu auth / tenancy / audit
- teste
- build / lint / docs sync

## Taskuri bune pentru Gemini acum

Acestea sunt taskuri bune pentru paralelism real.

### Task 1 - Fundatia pentru Agent Evidence OS

Status:

- bun de facut acum

Fisiere permise:

- `lib/compliance/agent-os.ts`
- `public/agent-evidence-os-v1.md`

Ce sa livreze:

- tipuri pentru:
  - `SourceEnvelope`
  - `AgentRun`
  - `AgentProposalBundle`
  - `IntakeProposal`
  - `FindingProposal`
  - `RemediationProposal`
  - `EvidenceProposal`
  - `AuditPrepProposal`
- enum-uri pentru:
  - status run
  - proposal confidence
  - proposal outcome
  - human review state
- o schema minimala de state machine pentru `AgentRun`
- document scurt care spune:
  - ce intra
  - ce iese
  - ce valideaza omul
  - ce ramane strict suport, nu verdict final

Conditii:

- fara dependenta de UI existent
- fara endpoint-uri noi
- fara modificare de `lib/compliance/types.ts`
- fara mutari in store sau auth

### Task 2 - Agent Workspace UI shell izolat

Status:

- bun de facut acum

Fisiere permise:

- `components/agent-workspace/*`
- `app/dashboard/asistent/page.tsx` doar daca face wrapper simplu peste componente noi

Ce sa livreze:

- componente izolate pentru:
  - `AgentRunBadge`
  - `ProposalCard`
  - `ProposalBundlePanel`
  - `HumanReviewPanel`
  - `SourceEnvelopeCard`
- mock state local pentru demo
- empty states curate
- fara integrare cu auth, store sau API real

Conditii:

- nu atinge componentele critice din cockpit
- nu muta navigatia
- nu modifica flow-ul existent `Scanare / Control / Dovada`

### Task 3 - Fixtures pentru Agent OS

Status:

- bun de facut acum

Fisiere permise:

- `tests/fixtures/agent-os/*`
- `public/qa-agent-os-runbook.md`

Ce sa livreze:

- fixture `source-envelope-document.json`
- fixture `source-envelope-manifest.json`
- fixture `source-envelope-yaml.json`
- fixture `agent-run-intake.json`
- fixture `agent-run-remediation.json`
- fixture `proposal-bundle-high-risk.json`
- fixture `proposal-bundle-review.json`
- fixture `proposal-bundle-blocked.json`
- un runbook simplu de QA manual:
  - input
  - expected proposals
  - ce trebuie confirmat uman
  - ce nu trebuie sa poata face agentul singur

Conditii:

- fara a scrie teste reale in codul de productie
- doar fixture-uri si runbook

### Task 4 - Evidence-control linkage spec

Status:

- bun de facut acum

Fisiere permise:

- `public/evidence-control-linkage-spec.md`

Ce sa livreze:

- cum se leaga dovada de control, articol, finding si drift
- ce inseamna:
  - dovada atasata
  - dovada valida
  - dovada reutilizata
  - dovada care cere confirmare finala
- reguli de decizie pentru:
  - `pass`
  - `review`
  - `blocked`

Conditii:

- fara sa modifice `audit-pack.ts`
- fara sa modifice `compliance-trace.ts`
- fara sa schimbe exporturile reale

### Task 5 - Evidence quality spec

Status:

- bun de facut acum

Fisiere permise:

- `public/evidence-quality-spec.md`

Ce sa livreze:

- taxonomie pentru dovezi:
  - screenshot
  - policy text
  - log export
  - yaml evidence
  - document bundle
- reguli minime:
  - ce dovada e slaba
  - ce dovada e suficienta
  - ce trebuie asociat cu controlul
  - ce trebuie revalidat la drift

Conditii:

- document de produs / control, nu implementare directa

## Taskuri pe care le ia Codex

Acestea raman la Codex, pentru ca ating fundatia.

### Sprint 5 - Codex

- mutarea `organizations / memberships` spre source of truth in DB
- mutarea `org_state` spre source of truth final in DB
- integrarea cu `Supabase Storage` privat
- signed URL sau stream controlat
- RLS real end-to-end
- migrare incrementala fara ruperea fallback-ului local

### Sprint 6 - Codex

- quality gates reale in `Audit Pack`
- validare legata de engine si evidence
- wiring intre findings / tasks / evidence / drift
- teste reale
- traceability mai stricta intre dovada si control

### Sprint 7 - Codex

- health / retry / observability / release readiness

## Ce ordonam la Gemini acum, concret

Ordinea buna pentru Gemini este:

1. `Task 3 - Fixtures pentru Agent OS`
2. `Task 4 - Evidence-control linkage spec`
3. `Task 5 - Evidence quality spec`
4. `Task 1 - Fundatia Agent Evidence OS`
5. `Task 2 - Agent Workspace UI shell izolat`

Motiv:

- intai ne trebuie contractele
- apoi fixture-urile si runbook-ul
- apoi gates si evidence quality
- UI shell vine abia dupa ce avem obiectele clare

## Prompt scurt pentru Gemini

Poti sa-i dai ceva de genul:

> Lucreaza doar pe taskurile delegate in `public/delegare-gemini-codex.md`.
> Nu modifica `auth`, `mvp-store`, `engine`, `audit-pack`, `scan-workflow` sau route handlers critici.
> Livreaza doar fisiere izolate, usor de integrat, fara rewrite.
> Pastreaza framing-ul corect al produsului:
> aplicatia ofera suport si structura, iar omul valideaza.

## Ce face Codex dupa ce revine Gemini

La fiecare livrare Gemini:

1. citim doar diff-ul lui
2. validam daca respecta izolarea
3. integrăm doar ce e compatibil
4. adaugam teste daca acea piesa intra in runtime
5. actualizam:
   - `public/log-sprinturi-maturizare.md`
   - `public/status-arhitectura.md`
   - `public/task-breakdown-tehnic.md`

## Regula finala

Gemini nu conduce arhitectura reala.

Gemini produce:

- spec
- types
- shell-uri
- fixture-uri

Codex decide:

- ce intra
- cum intra
- cand intra
