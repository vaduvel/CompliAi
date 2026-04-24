# CLAUDE-FULL-SPEC-APP.md — Specificațiile complete ale aplicației CompliAI

> **Scop**: document de referință unic care mapează tot ce face aplicația CompliAI — funcționalități, API-uri, pagini, motoare, fluxuri, integrări.
>
> **Sursă de adevăr**: codul din branch `main` (= starea live `compliscanag.vercel.app`) + `preview/integration-2026-04-21` pentru features noi.
>
> **Ultima actualizare**: 2026-04-21
>
> **Cum se folosește**: hands-off la Claude, designeri, auditori, sau contributori care vor să înțeleagă aplicația din cod, nu din screenshot-uri.

---

## 0. CE ESTE COMPLIAI

CompliAI este un **workbench multi-compliance** pentru consultanți români (contabili CECCAR, DPO externi, management SME) care:

1. **Monitorizează 24/7** conformitatea cu GDPR, e-Factura, NIS2, AI Act, DORA, Pay Transparency pentru organizații gestionate.
2. **Produce dovezi audit-shaped** gata de trimis la ANSPDCP, DNSC, ANAF — nu doar scoruri de conformitate.
3. **Automatizează prin 5 agenți AI + 16 cron-uri** — detection, classification, document drafting, vendor risk re-scoring, legislative monitoring.
4. **Suportă mod Partner (portfolio multi-client)** pentru consultanți cu 10-30 clienți SRL.

**Personas**:
- **Diana** — consultant/contabil CECCAR, €149/lună, gestionează 10-30 clienți, userul primar
- **Radu** — DPO intern, firmă 50-250 angajați, focus ANSPDCP-shaped exports
- **Mihai** — patron SME, indirect prin contabilul lui

**Tech stack**: Next.js 15 App Router + Tailwind 4 + shadcn/Radix + Supabase + pdfkit + Gemini AI + Resend + Stripe + ANAF OAuth

---

## 1. What CompliAI is

CompliAI is a Romanian compliance operating system with two real working contexts:

1. `Portofoliu · triaj`
   For consultants / partner managers who supervise multiple client companies.

2. `Execuție în firmă`
   For execution inside one company workspace, where findings are analyzed, evidence is attached, documents are generated, approvals happen, and audit outputs are produced.

The app is not only a dashboard. It combines:

- intake / scan / OCR
- finding generation
- remediation tasking
- assisted document generation
- evidence collection
- approval queue
- review cycles
- drift monitoring
- dossier / audit pack exports
- specialist workspaces for GDPR, NIS2, fiscal, AI conformity, vendors, DSAR, whistleblowing, pay transparency, DORA

Core product files that express the model:

- `lib/compliscan/dashboard-routes.ts`
- `lib/compliscan/nav-config.ts`
- `lib/compliscan/onboarding-destination.ts`
- `lib/server/auth.ts`
- `lib/server/dashboard-response.ts`
- `lib/server/portfolio.ts`
- `lib/server/scan-workflow.ts`

---

## 2. Product model and user modes

### 2.1 User modes

The app explicitly supports these user modes:

- `solo`
- `partner`
- `compliance`
- `viewer`

Defined in:

- `lib/server/auth.ts`
- `lib/compliscan/onboarding-destination.ts`

### 2.2 Roles

Role layer inside organizations:

- `owner`
- `partner_manager`
- `compliance`
- `reviewer`
- `viewer`

Defined in:

- `lib/server/auth.ts`

### 2.3 Workspace modes

There are two workspace modes:

- `org`
- `portfolio`

This is important because the same authenticated user can switch between:

- portfolio supervision
- active execution inside one client company

Defined in:

- `lib/server/auth.ts`
- `lib/compliscan/nav-config.ts`
- `app/api/auth/select-workspace/route.ts`

### 2.4 Onboarding destinations

The app already routes users differently after onboarding:

- `partner` -> client-facing destination `/portfolio`, server-side destination `/dashboard/partner`
- `compliance` -> `/dashboard/actiuni/remediere`
- `viewer` -> `/dashboard`
- `solo` -> `/dashboard`

Defined in:

- `lib/compliscan/onboarding-destination.ts`

Meaning:

- partner users are intended to land in portfolio-first flows
- solo users are intended to land in dashboard overview first
- compliance users land closer to active cases

---

## 3. Canonical app surfaces

### 3.1 Public / unauthenticated surfaces

These are public entry points:

- `/` -> landing page
- `/pricing` -> pricing
- `/privacy` -> privacy policy page
- `/terms` -> terms
- `/dpa` -> DPA public page
- `/genereaza-dpa` -> public DPA generation flow
- `/genereaza-politica-gdpr` -> public privacy-policy generation flow
- `/trust` -> trust index
- `/trust/[orgId]` -> public trust profile for one org
- `/shared/[token]` -> tokenized shared page
- `/whistleblowing/[token]` -> public whistleblowing intake page
- `/demo/[scenario]` -> demo scenario pages

Related APIs:

- `/api/demo/[scenario]`
- `/api/reports/share-token`
- `/api/whistleblowing/submit`

### 3.2 Auth and identity surfaces

User identity and account flows:

- `/login`
- `/register`
- `/claim`
- `/reset-password`
- `/onboarding`
- `/onboarding/finish`
- `/account/settings`

Supporting auth APIs:

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/reset-password`
- `/api/auth/forgot-password`
- `/api/auth/me`
- `/api/auth/summary`
- `/api/auth/set-user-mode`
- `/api/auth/select-workspace`
- `/api/auth/switch-org`
- `/api/auth/members`
- `/api/auth/memberships`
- `/api/auth/claim-*`

Account privacy APIs:

- `/api/account/export-data`
- `/api/account/request-deletion`
- `/api/account/delete-data`

What this means functionally:

- local or Supabase-backed auth
- multi-org membership model
- mode selection at user level
- workspace switching at session level
- account-level data export and deletion workflows

---

## 4. Main user journeys

### 4.1 Solo company journey

Typical path:

1. register / login
2. onboarding
3. dashboard overview
4. scan a source or upload a document
5. findings are generated
6. user opens a case from dashboard or remediation queue
7. cockpit guides evidence / document generation / resolution
8. resolved outputs go to dossier / reports / audit artifacts
9. monitoring continues through drift, review cycles, and notifications

### 4.2 Partner / consultant journey

Typical path:

1. login
2. choose `partner` mode
3. land in portfolio workspace
4. see client overview, inbox alerts, tasks, vendors, reports
5. quick-add or import client companies
6. drill into a client context
7. either launch a quick action or switch into org workspace
8. resolve the case in cockpit
9. export diagnostic, audit pack, reports, or partner-facing artifacts

### 4.3 Compliance / reviewer journey

Typical path:

1. login in compliance mode
2. land near remediation queue
3. work through active findings
4. approve or reject pending actions
5. monitor review cycles, drifts, and evidence quality
6. prepare board / audit / authority-facing exports

---

## 5. Core runtime engine

### 5.1 Scan intake

The app accepts:

- manual text
- image upload in base64
- PDF upload in base64

Flow:

1. validate payload
2. extract text
3. OCR via Google Vision when configured
4. create scan record
5. analyze the extracted content

Defined in:

- `lib/server/scan-workflow.ts`
- `/api/scan`
- `/api/scan/extract`
- `/api/scan/[id]/analyze`

Important details from code:

- OCR is optional and configuration-based
- scans are deduplicated by `clientId`
- extraction status and analysis status are tracked independently
- extracted text can require human review before analysis

### 5.2 Finding generation

The app generates findings through a layered strategy:

- Gemini semantic analysis is primary
- keyword simulation / rule matching is fallback/complement
- legacy LLM supplement fills missed rule-library matches

Defined in:

- `lib/server/scan-workflow.ts`
- `lib/compliscan/finding-kernel.ts`
- `lib/compliscan/finding-cockpit.ts`
- `lib/compliscan/finding-triage.ts`

### 5.3 Remediation plan generation

From state + findings, the app builds a remediation plan:

- priorities
- owners
- effort estimates
- legal references
- evidence expectations
- related finding IDs
- related drift IDs

Consumed by:

- dashboard
- remediation queue
- cockpit
- portfolio tasks
- audit pack

### 5.4 Dashboard payload

The dashboard is not a static page. It is built from:

- normalized compliance state
- remediation plan
- org workspace context
- AI compliance pack
- traceability matrix
- evidence ledger
- DSAR summary

Defined in:

- `lib/server/dashboard-response.ts`
- `/api/dashboard`
- `/api/dashboard/core`

### 5.5 Evidence and runtime truth

The app keeps a runtime truth model that merges:

- scans
- findings
- tasks
- generated documents
- drift records
- evidence attachments
- baseline snapshots

Used by:

- cockpit resolution logic
- dossier
- audit pack
- trust center
- review cycles

---

## 6. Portfolio workspace (`Portofoliu · triaj`)

### 6.1 What portfolio is

Portfolio is a cross-client supervision workspace for users in `partner` mode.

Access is intentionally restricted to:

- `partner_manager`
- `compliance`

The code explicitly excludes `owner` from portfolio viewing, so consultants do not see their own org as part of the client portfolio.

Defined in:

- `lib/server/portfolio.ts`

### 6.2 Main portfolio pages

- `/portfolio` -> overview
- `/portfolio/alerts` -> cross-client inbox / alert triage
- `/portfolio/tasks` -> cross-client open tasks
- `/portfolio/vendors` -> aggregated vendor view
- `/portfolio/reports` -> cross-client reporting metadata
- `/portfolio/client/[orgId]` -> client context drill-in

### 6.3 Overview

Portfolio overview aggregates, per client:

- score
- risk label
- open alerts
- red alerts
- scanned documents
- GDPR progress
- critical findings
- total open tasks
- e-Factura risk count
- NIS2 rescue need
- DSAR counts
- last scan timestamp

Built in:

- `lib/server/portfolio.ts`
- `/api/portfolio/overview`
- `/api/partner/portfolio`
- `components/compliscan/portfolio-overview-client.tsx`

### 6.4 Cross-client inbox / alerts

Portfolio alerting combines:

- open alerts
- linked finding references
- severity ordering
- framework labels
- source document references

Built in:

- `lib/server/portfolio.ts`
- `/api/portfolio/inbox`
- `/api/portfolio/alerts`
- `components/compliscan/portfolio-alerts-page.tsx`

### 6.5 Cross-client tasks

Portfolio task list aggregates open remediation work across orgs:

- task title
- priority
- severity
- owner
- due date
- evidence required
- task state / validation state

Built in:

- `lib/server/portfolio.ts`
- `/api/portfolio/tasks`
- `components/compliscan/portfolio-tasks-page.tsx`

### 6.6 Cross-client vendor view

Portfolio vendor view merges vendor risk from:

- NIS2 vendor register
- vendor review workbench

It deduplicates vendors by name/CUI and keeps:

- org count
- source kinds
- highest risk
- open reviews
- total reviews
- category labels

Built in:

- `lib/server/portfolio.ts`
- `/api/portfolio/vendors`
- `components/compliscan/portfolio-vendors-page.tsx`

### 6.7 Cross-client reports

Current portfolio reports surface is metadata-first:

- score
- generated documents count
- latest generated artifact
- last scan
- alert counts

Built in:

- `lib/server/portfolio.ts`
- `/api/portfolio/reports`
- `components/compliscan/portfolio-reports-page.tsx`

### 6.8 Client context drill-in

Client context page exists to preserve portfolio perspective before a full handoff into firm execution.

It supports:

- company header / role / score
- focused finding if the user came from an inbox link
- quick actions without full workspace switch
- explicit CTA to enter org workspace
- explicit CTA to open finding in cockpit
- compact summaries for findings, NIS2, and vendor reviews

Main files:

- `/portfolio/client/[orgId]`
- `components/compliscan/client-context-panel.tsx`
- `/api/partner/clients/[orgId]`

### 6.9 Client acquisition and setup

Portfolio includes real client acquisition flows:

- quick-add client
- ANAF company lookup
- website/applicability prefill
- baseline scan setup
- CSV import preview and execute
- partner workspace setup
- white-label settings

Relevant APIs:

- `/api/partner/clients`
- `/api/partner/clients/[orgId]`
- `/api/partner/clients/quick-add`
- `/api/partner/import-csv`
- `/api/partner/import-csv/preview`
- `/api/partner/import/preview`
- `/api/partner/import/execute`
- `/api/partner/import/anaf-prefill`
- `/api/partner/import/baseline-scan`
- `/api/org/partner-workspace`
- `/api/partner/white-label`

### 6.10 Batch actions

Portfolio supports batch work:

- portfolio-wide actions
- finding batch actions
- urgency queue
- partner monthly reporting

Relevant APIs:

- `/api/portfolio/batch`
- `/api/portfolio/findings/batch`
- `/api/partner/urgency-queue`
- `/api/cron/partner-monthly-report`

---

## 7. Org execution workspace (`Execuție în firmă`)

### 7.1 Canonical org navigation

Canonical groups in code:

- `Acasă`
- `Scanează`
- `Monitorizare`
- `Acțiuni`
- `Rapoarte`
- `Setări`

Defined in:

- `components/compliscan/navigation.ts`

Important note:

The codebase still preserves backward-compatible route families such as:

- `/dashboard/resolve/*`
- `/dashboard/actiuni/remediere/*`
- `/dashboard/reports/*`
- `/dashboard/rapoarte/*`
- `/dashboard/settings/*`
- `/dashboard/setari/*`

So the app contains both canonical and legacy/compat routing layers.

### 7.2 Dashboard / home

Main route:

- `/dashboard`

Function:

- operational overview of one org
- summary score and risk
- next best action
- scan health / drift / readiness widgets
- framework status
- active cases preview
- activity feed

Main code:

- `app/dashboard/page.tsx`
- `/api/dashboard`
- `lib/server/dashboard-response.ts`

### 7.3 Scanare

Main routes:

- `/dashboard/scan`
- `/dashboard/scan/history`
- `/dashboard/scan/results/[scanId]`
- legacy `/dashboard/scanari`

What scan workspace does:

- intake text or documents
- OCR extraction
- human review of extracted text
- semantic analysis
- scan history
- verdict tab / result view

Related components:

- `components/compliscan/scan-page.tsx`
- `components/compliscan/scan-history-page.tsx`
- `components/compliscan/scanari/*`
- `components/compliscan/scan-drawer.tsx`
- `components/compliscan/text-extract-drawer.tsx`

### 7.4 Remediere queue

Main routes:

- `/dashboard/actiuni/remediere`
- `/dashboard/actiuni/remediere/support`
- legacy `/dashboard/resolve`

Purpose:

- generic queue of open findings / tasks
- filters, severity breakdown, category views
- browsing across active work when the user is not entering from a specific case

Main code:

- `components/compliscan/resolve-page.tsx`
- `app/dashboard/actiuni/remediere/page.tsx`

### 7.5 Finding cockpit

Main route:

- `/dashboard/actiuni/remediere/[findingId]`

This is the primary execution surface for one active case.

It is the deepest workflow page in the app.

It supports:

- loading one finding by ID
- status changes: open / confirmed / dismissed / resolved / under monitoring
- fix preview / why / legal basis / evidence needed
- evidence attachment
- document generation handoff
- monitoring handoff
- support routes for specialist modules
- approval-aware actions
- review cycle creation and retrieval
- post-resolution validation and scheduling

Main files:

- `app/dashboard/actiuni/remediere/[findingId]/page.tsx`
- `components/compliscan/use-cockpit.tsx`
- `components/compliscan/finding-cockpit-shared.tsx`
- `components/compliscan/cockpit-derivations.ts`
- `lib/compliscan/finding-cockpit.ts`
- `/api/findings/[id]`
- `/api/review-cycles`

### 7.6 Approvals and human-in-the-loop

Main routes:

- `/dashboard/approvals`
- `/dashboard/review`
- `/dashboard/calendar`

What this subsystem does:

- queues human approvals for risky actions
- supports approve / reject decisions
- stores audit trail on each action
- schedules or tracks review cycles
- connects follow-up reviews to findings

Approval action types in code:

- repair e-Factura
- generate document
- resolve finding
- batch action
- submit to ANAF
- vendor merge
- auto remediation
- classify AI system
- publish trust center

Main files:

- `lib/server/approval-queue.ts`
- `lib/server/review-cycle-store.ts`
- `/api/approvals`
- `/api/review-cycles`

### 7.7 Dosar / reports / outputs

Main routes:

- `/dashboard/dosar`
- `/dashboard/reports`
- `/dashboard/reports/vault`
- `/dashboard/reports/audit-log`
- `/dashboard/reports/policies`
- `/dashboard/reports/trust-center`
- `/dashboard/generator`
- `/dashboard/ropa`
- legacy `/dashboard/documente`
- legacy `/dashboard/rapoarte/*`

What this cluster does:

- central dossier for generated artifacts and evidence
- audit log
- trust-center style output
- policy pages
- AI-assisted generator
- RoPA output
- export center

Main components:

- `components/compliscan/dosar-page.tsx`
- `components/compliscan/reports-page.tsx`
- `components/compliscan/reports-vault-page.tsx`
- `components/compliscan/reports-audit-log-page.tsx`
- `components/compliscan/reports-policies-page.tsx`
- `components/compliscan/reports-trust-center-page.tsx`
- `components/compliscan/export-center.tsx`
- `components/compliscan/generator-drawer.tsx`

### 7.8 Settings and billing

Main routes:

- `/dashboard/setari`
- `/dashboard/setari/scheduled-reports`
- `/dashboard/setari/abonament`
- legacy `/dashboard/settings`

What settings include:

- workspace operational settings
- integrations tab
- billing / plan gates
- scheduled reports management
- profile and access settings

Main components:

- `components/compliscan/settings-page.tsx`
- `components/compliscan/settings-billing-page.tsx`
- `components/compliscan/scheduled-reports-manager.tsx`
- `components/compliscan/plan-gate.tsx`

---

## 8. Specialist modules

### 8.1 GDPR / policy / RoPA / DSAR

Features present:

- privacy policy generation
- cookie policy generation
- DPA generation
- retention policy generation
- RoPA generation
- DSAR request tracking

DSAR model supports:

- request types Art. 15-22
- 30-day deadline
- extension tracking
- identity verification
- draft response generated
- human review state
- response sent tracking
- evidence vault linking

Main files:

- `lib/server/dsar-store.ts`
- `/dashboard/dsar`
- `/api/dsar`
- `/api/documents/generate`
- `/api/cookie-banner/generate`

### 8.2 NIS2

Main routes:

- `/dashboard/nis2`
- `/dashboard/nis2/eligibility`
- `/dashboard/nis2/maturitate`
- `/dashboard/nis2/inregistrare-dnsc`
- plus canonical monitorizare routes under `/dashboard/monitorizare/nis2*`

What NIS2 module supports:

- eligibility check
- assessment record
- maturity assessment
- DNSC registration tracking
- incident register
- vendor register
- board/CISO training tracker
- 24h / 72h / final incident reporting structure
- ANSPDCP parallel breach-notification tracking when personal data is affected
- NIS2 package generation

Main files:

- `lib/server/nis2-store.ts`
- `/api/nis2/*`
- `components/compliscan/nis2/*`

### 8.3 Fiscal / e-Factura / SPV

Main route:

- `/dashboard/fiscal`

What fiscal module supports:

- SPV checks
- discrepancy handling
- filing records
- protocol / evidence generation
- submit to SPV / status polling
- integration status and sync

Important behavior:

- ANAF submission always creates a pending approval first
- after approval, XML is uploaded to ANAF SPV
- system polls status
- success creates evidence and can resolve linked finding
- failure can reopen linked finding with diagnostics

Main files:

- `lib/server/anaf-submit-flow.ts`
- `/api/fiscal/*`
- `/api/integrations/efactura/*`
- `components/compliscan/fiscal/*`

### 8.4 Vendor review

Main route:

- `/dashboard/vendor-review`

Vendor review supports:

- persistent review workbench
- create / list / update / delete vendor reviews
- dedupe with NIS2 vendor layer in portfolio
- trust pack export support

Main files:

- `lib/server/vendor-review-store.ts`
- `/api/vendor-review`
- `/api/vendor-review/[id]`
- `/api/vendor-review/[id]/brief`

### 8.5 AI systems and AI conformity

Main routes:

- `/dashboard/monitorizare/sisteme-ai`
- `/dashboard/monitorizare/conformitate`
- `/dashboard/sisteme`
- `/dashboard/sisteme/eu-db-wizard`

Feature set:

- AI system discovery
- detected AI systems register
- AI inventory panel
- AI conformity workspace
- Annex IV documentation support
- AI Act evidence pack
- shadow AI questionnaire
- org knowledge and prefill signals

Related APIs:

- `/api/ai-systems`
- `/api/ai-systems/discover`
- `/api/ai-conformity`
- `/api/ai-act/annex-iv`
- `/api/ai-act/prepare-submission`
- `/api/exports/ai-act-evidence-pack`

### 8.6 Pay transparency

Main route:

- `/dashboard/pay-transparency`

What it supports:

- salary record upload / save
- pay-gap calculation
- annual report generation
- approval / publishing states
- markdown output for report

Main files:

- `lib/server/pay-transparency-store.ts`
- `/api/pay-transparency`
- `/api/pay-transparency/report`
- `/api/pay-transparency/upload`

### 8.7 DORA

Main route:

- `/dashboard/dora`

Feature set from route/store names:

- DORA incidents
- TPRM tracking
- closure states
- specialist operational workflow

APIs:

- `/api/dora`
- `/api/dora/incidents/[id]`
- `/api/dora/tprm`

### 8.8 Whistleblowing

Main route:

- `/dashboard/whistleblowing`

Public route:

- `/whistleblowing/[token]`

What it supports:

- public reporting channel
- categories like fraud, corruption, safety, privacy, harassment
- anonymous or contactable reports
- internal notes
- assignee
- investigation lifecycle
- resolution / closure

Main files:

- `lib/server/whistleblowing-store.ts`
- `/api/whistleblowing`
- `/api/whistleblowing/[id]`
- `/api/whistleblowing/submit`

### 8.9 Agents and automation

Main route:

- `/dashboard/agents`

Feature set:

- run AI agents
- commit agent work
- orchestrate automations
- regulatory radar / legislation monitor cron layer

APIs:

- `/api/agent/run`
- `/api/agent/commit`
- `/api/agents`
- cron routes under `/api/cron/*`

---

## 9. Document generation and assisted outputs

### 9.1 Supported generated document types

From `lib/server/document-generator.ts`, the generator supports:

- privacy policy
- cookie policy
- DPA
- retention policy
- NIS2 incident response plan
- AI governance policy
- Annex IV documentation
- job description
- HR internal procedures
- REGES correction brief
- contract template
- NDA
- supplier contract
- deletion attestation
- pay-gap report
- RoPA

### 9.2 Generator behavior

The generator:

- uses Gemini if configured
- falls back to static skeletons if Gemini is missing
- attaches legal basis metadata
- calculates expiry dates
- calculates next review dates
- normalizes date labels inside generated content

### 9.3 Export families

Export APIs in code:

- `/api/exports/audit-pack`
- `/api/exports/audit-pack/pdf`
- `/api/exports/audit-pack/bundle`
- `/api/exports/audit-pack/client`
- `/api/exports/compliscan`
- `/api/exports/annex-lite/client`
- `/api/exports/vendor-trust-pack`
- `/api/exports/ai-act-evidence-pack`

Other report-like outputs:

- counsel brief
- response pack
- generic PDF report exports

Routes:

- `/api/reports/counsel-brief`
- `/api/reports/response-pack`
- `/api/reports/pdf`

---

## 10. Audit pack and dossier system

Audit pack is one of the core differentiators of the app.

From code, the audit pack includes:

- executive summary
- audit readiness
- baseline status
- source coverage
- system register
- controls matrix
- evidence ledger
- audit quality gates
- drift register
- validation log
- event timeline
- traceability matrix
- NIS2 report
- NIS2 package
- appendix with snapshot / validated baseline / compliance pack

Defined in:

- `lib/server/audit-pack.ts`

This means CompliAI is not only storing compliance state; it is producing structured audit-ready output.

---

## 11. Monitoring, drifts, notifications, and scheduled work

### 11.1 Drift monitoring

The app includes compliance drift tracking and alerting.

Related routes:

- `/dashboard/monitorizare/alerte`
- `/api/drifts/[id]`
- `/api/alerts/[id]/resolve`
- `/api/alerts/notify`
- `/api/alerts/preferences`

Related server modules:

- `lib/server/compliance-drift.ts`
- `lib/server/drift-trigger-engine.ts`
- `lib/server/notifications-store.ts`

### 11.2 Notifications

There is a notification subsystem with:

- bell / inbox usage in UI
- notification persistence
- per-notification APIs

Routes:

- `/api/notifications`
- `/api/notifications/[id]`

### 11.3 Scheduled and cron work

Cron families present in code:

- agent orchestrator
- regulatory radar
- audit-pack monthly
- daily digest
- drift sweep
- e-Factura SPV monthly
- inspector weekly
- legislation monitor
- monthly digest
- partner monthly report
- renewal reminder
- scheduled reports
- score snapshot
- vendor review revalidation
- vendor sync monthly
- weekly digest

This means the app supports background compliance operations, not only manual page-driven work.

---

## 12. Integrations

### 12.1 Storage / auth backends

The app supports:

- local fallback storage
- Supabase-backed storage
- local / supabase / hybrid auth backend

Main files:

- `lib/server/auth.ts`
- `lib/server/storage-adapter.ts`
- `lib/server/supabase-*`

### 12.2 Gemini

Used for:

- semantic scan analysis
- document generation
- some AI-assisted modules

Main files:

- `lib/server/gemini.ts`
- `lib/server/document-generator.ts`
- scan workflow integration

### 12.3 Google Vision

Used for:

- OCR on images and PDFs

Main file:

- `lib/server/google-vision.ts`

### 12.4 ANAF / SPV

Used for:

- company lookup
- OAuth connect / callback
- token maintenance
- e-Factura submit flow
- status polling

Routes:

- `/api/anaf/connect`
- `/api/anaf/callback`
- `/api/anaf/lookup`
- `/api/fiscal/*`
- `/api/integrations/efactura/*`

### 12.5 Repo sync

The app contains repository sync integrations for:

- GitHub
- GitLab

Routes:

- `/api/integrations/repo-sync`
- `/api/integrations/repo-sync/github`
- `/api/integrations/repo-sync/gitlab`
- `/api/integrations/repo-sync/status`

### 12.6 Stripe

Billing-related routes exist for:

- checkout
- billing portal
- webhook handling

Routes:

- `/api/stripe/checkout`
- `/api/stripe/portal`
- `/api/stripe/webhook`

---

## 13. Core domain entities

The app works with these central entity families:

- user
- organization
- membership
- workspace mode
- scan
- finding
- remediation task
- generated document
- evidence attachment
- drift record
- notification
- pending action
- review cycle
- DSAR request
- NIS2 incident
- NIS2 vendor
- vendor review
- pay-gap report
- whistleblowing report
- SPV submission
- audit pack
- traceability record

If Claude needs to reason about the product correctly, these are the nouns that matter.

---

## 14. Canonical feature inventory by area

### Public / marketing / trust

- landing
- pricing
- privacy
- terms
- DPA public surfaces
- public trust profile
- public shared links
- public whistleblowing channel
- demo scenarios

### Identity / account

- register
- login
- logout
- forgot/reset password
- claim ownership / invite acceptance
- memberships
- account settings
- account data export / deletion
- user mode selection
- workspace selection

### Portfolio / partner

- portfolio overview
- cross-client inbox / alerts
- cross-client tasks
- cross-client vendors
- cross-client reports metadata
- client drill-in
- quick-add client
- ANAF prefill
- website / applicability prefill
- baseline scan
- CSV import preview + execute
- urgency queue
- white-label setup
- batch actions

### Org execution

- dashboard overview
- scan intake
- scan history
- scan result analysis
- remediation queue
- support task queue
- finding cockpit
- approvals
- review cycles
- calendar
- dossier
- reports
- vault
- audit log
- trust center
- generator
- policies
- RoPA
- settings
- billing
- scheduled reports

### Specialist modules

- DSAR
- NIS2
- fiscal / e-Factura / SPV
- vendor review
- AI systems
- AI conformity
- pay transparency
- DORA
- whistleblowing
- agents

### Output / audit / exports

- document generation
- audit pack
- PDF export
- client export bundle
- vendor trust pack
- AI Act evidence pack
- counsel brief
- response pack
- CompliScan snapshot export

### Monitoring / automation

- alerts
- drifts
- notifications
- scheduled reviews
- background digests
- regulatory radar
- vendor revalidation
- score snapshots
- partner monthly reporting

---

## 15. Important architectural truths Claude should know

1. CompliAI is not one dashboard. It is a dual-workspace product: portfolio supervision and org execution.
2. The app already contains deep runtime logic, especially in scan, findings, cockpit, audit pack, approvals, NIS2, fiscal, and exports.
3. The routing layer contains both canonical and legacy aliases. A redesign or refactor must preserve feature parity while simplifying the user path.
4. The cockpit is the main execution surface for a single finding. It should not be collapsed into a generic dashboard card.
5. Portfolio is intended for partners and compliance operators, not for ordinary owners.
6. Evidence, approvals, and review cycles are first-class subsystems, not polish layers.
7. Audit pack / dossier / exports are core product value, not afterthoughts.
8. Many modules have storage adapters and can run with local fallback or Supabase-backed persistence.

---

## 16. Legacy and compatibility notes

The codebase currently keeps several old route families alive for backward compatibility:

- `/dashboard/resolve/*` alongside `/dashboard/actiuni/remediere/*`
- `/dashboard/reports/*` alongside `/dashboard/rapoarte/*`
- `/dashboard/settings/*` alongside `/dashboard/setari/*`
- `/dashboard/documente` alongside `/dashboard/dosar`
- `/dashboard/scanari` alongside `/dashboard/scan`

This matters because:

- screenshots may show older route labels
- live may still expose transition states
- design work should simplify flows, not accidentally break compatibility

---

## 17. What this file is for

Use this file when you need to:

- brief Claude or another model on the real application
- audit whether a mockup preserves feature parity
- understand what exists before redesigning a page
- map a route or module to the underlying subsystem
- explain to a new contributor what CompliAI actually contains

It is intentionally written as a functional spec, not a sprint note and not a marketing doc.


---

## 18. API ENDPOINT REFERENCE COMPLET

> Tabel de referință rapid. Method + path + auth minimă + ce face + răspuns cheie.

### 18.1 Auth

| M | Path | Auth | Ce face | Răspuns cheie |
|---|---|---|---|---|
| POST | `/api/auth/login` | — | Login; setează cookie sesiune | `{ destination, workspaceMode }` |
| POST | `/api/auth/register` | — | Crează user+org+trial | `{ orgId, orgName, role }` |
| POST | `/api/auth/logout` | Sesiune | Șterge cookie | `{ ok }` |
| GET | `/api/auth/me` | Sesiune | Context sesiune curentă | `{ user, org }` |
| GET | `/api/auth/summary` | Sesiune | Context complet user+org+plan | Full summary |
| POST | `/api/auth/forgot-password` | — | Trimite email reset (Resend) | `{ ok }` |
| POST | `/api/auth/reset-password` | — | Resetează parola cu token | `{ ok }` |
| POST | `/api/auth/set-user-mode` | Sesiune | Setează `userMode` (partner/compliance/solo) | `{ ok }` |
| GET | `/api/auth/memberships` | Sesiune | Lista org-uri accesibile | `{ memberships[] }` |
| POST | `/api/auth/members` | Owner | Invită membru cu rol | `{ membershipId }` |
| PATCH | `/api/auth/members/[id]` | Owner | Schimbă rolul | `{ ok }` |
| DELETE | `/api/auth/members/[id]` | Owner | Elimină din org | `{ ok }` |
| POST | `/api/auth/claim-invite` | Sesiune | Generează token claim | `{ token }` |
| POST | `/api/auth/claim-accept` | — | Acceptă claim cu token | `{ ok }` |
| GET | `/api/auth/claim-status/[orgId]` | — | Verifică dacă org e cliamed | `{ claimed }` |
| POST | `/api/auth/select-workspace` | Sesiune | Schimbă workspace (org switch) | `{ destination }` |

### 18.2 Dashboard

| M | Path | Auth | Ce face | Răspuns cheie |
|---|---|---|---|---|
| GET | `/api/dashboard` | WRITE | Starea completă org | `DashboardPayload` |
| GET | `/api/dashboard/urgency` | WRITE | Queue urgency sortat | `{ tasks[], score }` |
| GET | `/api/dashboard/calendar` | WRITE | Deadline events | `{ events[] }` |
| GET | `/api/dashboard/accumulation` | WRITE | Risk delta chart | `{ points[] }` |

### 18.3 Portfolio

| M | Path | Auth | Ce face | Răspuns cheie |
|---|---|---|---|---|
| GET | `/api/portfolio/overview` | Partner | Lista clienți cu scoruri | `{ clients[] }` |
| GET | `/api/portfolio/inbox` | Partner | Inbox cross-client agregat | `{ items[], unreadCount }` |
| GET | `/api/portfolio/alerts` | Partner | Alerte detaliate per client | `{ alerts[] }` |
| GET | `/api/portfolio/tasks` | Partner | Taskuri consolidate | `{ tasks[] }` |
| GET | `/api/portfolio/vendors` | Partner | Riscuri furnizori agregat | `{ vendors[] }` |
| GET | `/api/portfolio/reports` | Partner | Rapoarte lunare | `{ reports[] }` |
| POST | `/api/portfolio/findings/batch` | Partner | Bulk confirm/dismiss findings | `{ applied, skipped }` |
| POST | `/api/portfolio/batch` | Partner | Acțiuni batch multi-client | `{ results[] }` |

### 18.4 Clienți Partner

| M | Path | Auth | Ce face | Răspuns cheie |
|---|---|---|---|---|
| GET | `/api/partner/clients` | Partner | Lista completă clienți | `{ clients[] }` |
| POST | `/api/partner/clients/quick-add` | Partner | Add client din CUI în <30s | `{ orgId, findingsCount, score }` |
| GET | `/api/partner/clients/[orgId]` | Partner | Detalii client specific | `{ findings[], complianceSummary }` |
| POST | `/api/partner/import/execute` | Partner | Import firme din CSV (max 50) | `{ imported, failed, results[] }` |
| POST | `/api/partner/import/preview` | Partner | Preview CSV import | `{ rows[], errors[] }` |
| POST | `/api/partner/import/anaf-prefill` | Partner | Prefill ANAF batch | `{ results[] }` |
| POST | `/api/partner/import/baseline-scan` | Partner | Scan baseline org nou | `{ findingsCount, sector }` |
| GET | `/api/partner/urgency-queue` | Partner | Top 50 findings critice cross-portfolio | `{ items[] }` |
| GET/POST | `/api/partner/white-label` | Partner | White-label config (logo, culoare, tagline) | `{ config }` |
| POST | `/api/partner/org/partner-workspace` | Partner | Setup workspace cabinet (client scale, CUI) | `{ ok }` |

### 18.5 Scanare

| M | Path | Auth | Ce face | Răspuns cheie |
|---|---|---|---|---|
| POST | `/api/scan` | Sesiune | Upload + OCR + findings | `{ findings[], score }` |
| GET | `/api/scan/[jobId]` | Sesiune | Status job async | `{ status, progress, result }` |
| POST | `/api/scan/extract` | Sesiune | Extrage text fără findings | `{ text, ocrUsed }` |

### 18.6 Findings

| M | Path | Auth | Ce face | Răspuns cheie |
|---|---|---|---|---|
| PATCH | `/api/findings/[id]` | WRITE | Update stare finding | `{ finding, notificationSent }` |

### 18.7 Documente Generate

| M | Path | Auth | Ce face | Răspuns cheie |
|---|---|---|---|---|
| POST | `/api/documents/generate` | WRITE | Generează doc compliance (Gemini) | `{ document }` |
| GET | `/api/documents/[id]` | Sesiune | Citește document | `{ document }` |
| PATCH | `/api/documents/[id]` | WRITE | Editează document | `{ document }` |
| DELETE | `/api/documents/[id]` | WRITE | Soft-delete | `{ ok }` |
| POST | `/api/documents/[id]/adoption` | WRITE | Marchează adoptat | `{ ok }` |
| POST | `/api/documents/export-pdf` | WRITE | Export PDF (pdfkit) | PDF binary |

### 18.8 Taskuri și Evidențe

| M | Path | Auth | Ce face | Răspuns cheie |
|---|---|---|---|---|
| POST | `/api/tasks/[id]` | WRITE | Crează task remediere | `{ task }` |
| PATCH | `/api/tasks/[id]` | WRITE | Update stare task | `{ feedback, scoreDelta }` |
| POST | `/api/tasks/[id]/evidence` | WRITE | Atașează dovadă | `{ evidence }` |
| GET | `/api/tasks/[id]/evidence` | Sesiune | Lista dovezi | `{ evidence[] }` |
| DELETE | `/api/tasks/[id]/evidence/[id]` | WRITE | Șterge dovadă | `{ ok }` |

### 18.9 AI Sisteme + AI Act

| M | Path | Auth | Ce face | Răspuns cheie |
|---|---|---|---|---|
| POST | `/api/ai-systems` | WRITE | Înregistrează sistem AI | `{ system, findings[] }` |
| GET | `/api/ai-systems` | Sesiune | Lista sisteme AI | `{ systems[] }` |
| PATCH | `/api/ai-systems/[id]` | WRITE | Actualizează metadate | `{ system }` |
| DELETE | `/api/ai-systems/[id]` | WRITE | Dezinregistrează | `{ ok }` |
| GET | `/api/ai-systems/discover` | Sesiune | Shadow AI detection | `{ detected[] }` |
| GET | `/api/ai-conformity` | WRITE | Assessment conformitate AI Act | `{ assessment }` |
| POST | `/api/ai-act/annex-iv` | WRITE | Verificare Annex IV obligații | `{ gaps[], obligations[] }` |
| POST | `/api/ai-act/prepare-submission` | WRITE | Pachet EU AI Database | `{ submission }` |
| GET | `/api/exports/ai-act-evidence-pack` | Pro | Export ZIP AI Act evidence | ZIP |

### 18.10 NIS2

| M | Path | Auth | Ce face | Răspuns cheie |
|---|---|---|---|---|
| GET | `/api/nis2/eligibility` | Sesiune | Verifică aplicabilitate NIS2 | `{ eligible, entityType, reason }` |
| POST/GET | `/api/nis2/assessment` | WRITE/Sesiune | Completează/citește evaluare maturitate | `{ assessment, maturityScore }` |
| GET | `/api/nis2/maturity` | Sesiune | Scor maturitate pe piloni | `{ pillars[] }` |
| POST | `/api/nis2/incidents` | WRITE | Logează incident cybersecurity | `{ incident, deadlines }` |
| GET | `/api/nis2/incidents` | Sesiune | Lista incidente + status DNSC | `{ incidents[] }` |
| PATCH | `/api/nis2/incidents/[id]` | WRITE | Update incident (72h reporting) | `{ incident }` |
| POST | `/api/nis2/dnsc-correspondence` | WRITE | Trimite raport DNSC | `{ submissionId }` |
| GET | `/api/nis2/dnsc-status` | Sesiune | Status înregistrare DNSC | `{ registrationId, expires }` |
| GET/POST | `/api/nis2/governance` | WRITE/Sesiune | Framework guvernanță + RACI | `{ documents[] }` |
| GET/POST | `/api/nis2/vendors` | WRITE/Sesiune | Furnizori ICT critici (TPRM) | `{ vendors[] }` |

### 18.11 DSAR (GDPR Art. 15-22)

| M | Path | Auth | Ce face | Răspuns cheie |
|---|---|---|---|---|
| GET | `/api/dsar` | WRITE | Lista cereri cu timere | `{ requests[], processPack }` |
| POST | `/api/dsar` | WRITE | Crează cerere + draft răspuns auto | `{ request }` |
| GET | `/api/dsar/[id]` | Sesiune | Detaliu cerere | `{ request, draftResponse }` |
| PATCH | `/api/dsar/[id]` | WRITE | Update stare cerere | `{ request }` |
| POST | `/api/dsar/[id]/draft` | WRITE | Generează draft răspuns (Gemini) | `{ draft }` |

### 18.12 Fiscal / eFactura (ANAF/SPV)

| M | Path | Auth | Ce face | Răspuns cheie |
|---|---|---|---|---|
| GET/POST | `/api/anaf/lookup` | Sesiune | Lookup companie după CUI | `{ companyName, vatRegistered, efacturaRegistered, sector }` |
| GET | `/api/anaf/callback` | — | Callback OAuth ANAF | Redirect |
| POST | `/api/anaf/connect` | Sesiune | Inițiază OAuth SPV ANAF | `{ authUrl }` |
| POST | `/api/fiscal/spv-check` | WRITE | Validare pre-trimitere factură | `{ valid, errors[] }` |
| POST | `/api/fiscal/submit-spv` | WRITE | Trimite factură în SPV | `{ submissionId }` |
| GET | `/api/fiscal/filing-records` | Sesiune | Istoricul facturilor | `{ filings[] }` |
| GET | `/api/fiscal/etva-discrepancies` | Sesiune | Discrepanțe TVA | `{ discrepancies[] }` |
| POST | `/api/fiscal/protocol` | WRITE | Verificare protocol fiscal | `{ result }` |

### 18.13 Vendor Management

| M | Path | Auth | Ce face | Răspuns cheie |
|---|---|---|---|---|
| GET | `/api/vendor-review` | Sesiune | Lista review-uri furnizori | `{ reviews[] }` |
| POST | `/api/vendor-review` | Sesiune | Crează review | `{ review }` |
| GET | `/api/vendor-review/[id]` | Sesiune | Detaliu review | `{ review, riskScore, dpaStatus }` |
| PATCH | `/api/vendor-review/[id]` | WRITE | Update scor risc / DPA | `{ review }` |

### 18.14 DORA (Banking)

| M | Path | Auth | Ce face | Răspuns cheie |
|---|---|---|---|---|
| GET | `/api/dora` | Sesiune | Starea DORA completă | `{ incidents[], tprmVendors[], ictsEvents[] }` |
| POST | `/api/dora` | WRITE | Crează incident ICT | `{ incident }` |
| PATCH | `/api/dora/incidents/[id]` | WRITE | Update incident | `{ incident }` |
| POST | `/api/dora/tprm` | WRITE | Adaugă furnizor terț | `{ vendor }` |

### 18.15 Exporturi și Audit Packs

| M | Path | Auth | Format | Ce face |
|---|---|---|---|---|
| GET | `/api/exports/audit-pack` | Pro | JSON | Audit pack complet |
| GET | `/api/exports/audit-pack/pdf` | Pro | PDF | Audit pack printabil |
| POST | `/api/exports/audit-pack/bundle` | Partner | ZIP | Multi-org consolidat |
| GET | `/api/exports/audit-pack/client` | Partner | JSON | Versiune redacted client |
| POST | `/api/exports/compliscan` | WRITE | YAML | Snapshot infrastructure-as-code |
| POST | `/api/exports/annex-lite/client` | Partner | HTML | Summary client-facing |
| GET | `/api/exports/ai-act-evidence-pack` | Pro | ZIP | Evidence AI Act complet |
| POST | `/api/exports/vendor-trust-pack` | WRITE | PDF | Governance furnizori + RFx |
| GET | `/api/exports/diagnostic/[orgId]` | Partner | PDF | **preview** Diagnostic 1-pagină brand-uit |
| GET | `/api/exports/anspdcp-pack/[orgId]` | WRITE | PDF | **preview** Dosar ANSPDCP 12 secțiuni + SHA-256 |
| POST | `/api/contracts/pack` | WRITE | ZIP | DPA, NDA, SLA templates |
| POST | `/api/hr/pack` | WRITE | ZIP | Job descriptions, handbook |

### 18.16 Notificări, Alerte, Aprobări

| M | Path | Auth | Ce face |
|---|---|---|---|
| GET | `/api/notifications` | Sesiune | Lista notificări user |
| PATCH | `/api/notifications/[id]` | Sesiune | Marchează ca citit |
| GET/POST | `/api/approvals` | WRITE | Queue aprobări workflow agente |
| PATCH | `/api/approvals/[id]` | Owner | Aprobă/respinge acțiune |
| GET/POST | `/api/review-cycles` | WRITE | Review cycles periodice |
| GET/POST | `/api/reports/scheduled` | WRITE | Rapoarte programate |

### 18.17 Alte servicii

| M | Path | Auth | Ce face |
|---|---|---|---|
| GET | `/api/benchmark` | Sesiune | Scor comparativ față de mediana industriei |
| POST | `/api/chat` | Sesiune | Chat compliance AI (Gemini context-aware) |
| POST | `/api/analytics/track` | Sesiune | Track event produs |
| GET | `/api/audit-log` | Sesiune | Log imutabil evenimente conformitate |
| GET | `/api/health` | — | Health check simplu |
| POST | `/api/whistleblowing/submit` | — | Raport anonim (fără cont necesar) |
| POST | `/api/stripe/checkout` | Sesiune | Checkout Stripe upgrade plan |
| GET | `/api/stripe/portal` | Sesiune | Portal self-serve Stripe |
| POST | `/api/stripe/webhook` | Webhook | Handler eventi Stripe |
| GET | `/api/plan` | Sesiune | Status plan curent + limite |
| POST | `/api/account/export-data` | Sesiune | Export date personale GDPR |
| POST | `/api/account/request-deletion` | Sesiune | Solicitare ștergere cont |

---

## 19. CRON JOBS — REFERINȚĂ COMPLETĂ (16 jobs)

| Timp UTC | Path | Frecvență | Ce face |
|---|---|---|---|
| 06:00 | `/api/cron/agent-orchestrator` | Zilnic | Rulează toți 5 agenții AI pe fiecare org |
| 06:00 | `/api/cron/drift-sweep` | Zilnic | Detectează derive față de baseline validat |
| 06:15 | `/api/cron/efactura-spv-monthly` | Lunar (15) | Verifică facturile respinse SPV |
| 07:00 | `/api/cron/vendor-review-revalidation` | Zilnic | Re-scorează risc furnizori, tracking DPA |
| 07:00 | `/api/cron/legislation-monitor` | Zilnic | Monitorizare EUR-Lex, DNSC, ANAF |
| 07:00 | `/api/cron/agent-regulatory-radar` | Săptămânal (Mie) | Analiză profundă impact legislativ (Gemini) |
| 07:50 | `/api/cron/score-snapshot` | Zilnic | Snapshot scor pentru grafic istoric |
| 08:00 | `/api/cron/daily-digest` | Zilnic | Email zilnic cu top issues (Resend) |
| 08:00 | `/api/cron/inspector-weekly` | Săptămânal (Lun) | Raport inspecție săptămânal |
| 08:30 | `/api/cron/weekly-digest` | Săptămânal (Lun) | Summary săptămânal portofoliu |
| 09:00 | `/api/cron/renewal-reminder` | Zilnic | Alerte scadențe (certificări, DNSC, DPA) |
| 09:00 | `/api/cron/audit-pack-monthly` | Lunar (1) | Generare snapshot audit pack lunar |
| 09:00 | `/api/cron/monthly-digest` | Lunar (3) | Raport lunar org (findings, scor) |
| 09:00 | `/api/cron/partner-monthly-report` | Lunar (2) | Performanță portofoliu lunar |
| 10:00 | `/api/cron/vendor-sync-monthly` | Lunar (1) | Sincronizare date furnizori eFactura |
| 10:00 | `/api/cron/scheduled-reports` | Zilnic | Execută rapoartele configurate de user |

---

## 20. MOTOARE COMPLIANCE (lib/compliance/)

| Fișier | Ce conține |
|---|---|
| `engine.ts` | Motor principal: normalizare `ComplianceState`, calcul scor 0-100, `computeDashboardSummary`, `buildRemediationPlan` |
| `applicability.ts` | `evaluateApplicability(profile)` → determină care din GDPR/NIS2/AI_ACT/EFACTURA/DORA/PAY_TRANSPARENCY se aplică |
| `intake-engine.ts` | Chestionar 7 întrebări → `buildInitialFindings()` + `buildInitialIntakeAnswers()` |
| `agentic-engine.ts` | 5 agenți: `compliance_monitor`, `fiscal_sensor`, `document`, `vendor_risk`, `regulatory_radar` + 3-level approval |
| `efactura-validator.ts` | Validare structurală completă UBL CIUS-RO |
| `drift-policy.ts` | Politici detectare derive + override severitate |
| `drift-lifecycle.ts` | Ciclul de viață drift (open → acknowledged → closed) |
| `finding-kernel.ts` | Handoff recipes, resolve flow, specialist routing per finding |
| `vendor-review-engine.ts` | Scoring furnizori, generate review assets, DPA tracking |
| `audit-pack.ts` | Construire `AuditPackV2.1` din starea org |
| `ai-act-exporter.ts` | Export AI Act evidence pack |
| `risk-trajectory.ts` | Calculul trajectory risc (stable/improving/degrading) |
| `health-check.ts` | Sănătate sistem compliance |
| `agent-rail-routing.ts` | Routing acțiuni agenți la nivel aprobare corect |

---

## 21. STORE-URI DATE (lib/server/)

| Store | Fișier principal | Backend | Conținut |
|---|---|---|---|
| State principal | `mvp-store.ts` | Supabase sau `.data/state-{orgId}.json` | findings, alerts, scans, documents, taskState, driftRecords, snapshotHistory, events, aiSystems |
| NIS2 | `nis2-store.ts` | Adaptive | assessment, incidents, dnscStatus, governance, vendors |
| DSAR | `dsar-store.ts` | Adaptive | requests, deadlines |
| Notificări | `notifications-store.ts` | Adaptive | notifications per org/user |
| Vendor reviews | `vendor-review-store.ts` | Adaptive | questionnaires, scores |
| White-label | `white-label.ts` | Supabase | partnerName, logoUrl, brandColor, tagline |

**Adaptive storage**: Supabase primar dacă configurat, fallback `.data/*.json` local. Pe Vercel fără Supabase → filesystem read-only (EROFS silențios pe write).

---

## 22. DESIGN SYSTEM v2 (components/ui/ds/)

Primitives canonice — foundation Sprint 2 (preview):

| Component | Props cheie | Scopul |
|---|---|---|
| `Button` | variant, size | Acțiuni principale/secundare/destructive |
| `Badge` | variant (status/severity/review) | Framework labels, severitate, status |
| `Card` | variant (default/flush/tinted), tint | Container secțiuni |
| `StatusDot` | variant, size | Indicator stare real-time |
| `SeverityPill` | level (critical/high/medium/low) | Severitate findings |
| `EmptyState` | icon, title, description, action | State gol în liste/pagini |
| `LoadingState` | variant (page/section/inline), label | Loading uniform |
| `ErrorState` | title, message, action, variant | Erori uniform |
| `PageIntro` | eyebrow, title, description, actions, meta | Header canonical pagini P1 |
| `BulkActionBar` | selectedCount, noun, summary, actions, onClear | Bară flotantă multi-select |

---

## 23. SECURITATE — STATUS ACTUAL vs. PREVIEW

| Mecanism | Live (main) | Preview |
|---|---|---|
| HMAC timing-safe session verify | ❌ string comparison | ✅ `crypto.subtle.verify` + `timingSafeEqual` |
| Session cookie httpOnly | ✅ | ✅ |
| Rate limiting middleware | ✅ in-memory (risc cross-instance) | ✅ |
| AI Act export role scope | ❌ include viewer/reviewer | ✅ [owner, partner_manager, compliance] |
| Audit-pack baseline gate | ❌ emit fără baseline | ✅ 400 AUDIT_PACK_BASELINE_MISSING |
| CSRF protection | ❌ lipsă | ❌ lipsă |
| CSP headers | ❌ lipsă | ❌ lipsă |
| Session rotation | ❌ lipsă | ❌ lipsă |

---

## 24. FLUXURI PRINCIPALE CAP-COADĂ

### Diana morning ritual (9:15 AM)
1. Login → `/portfolio` (partner mode default)
2. `/portfolio/alerts` — `GET /api/portfolio/inbox` → items agregate cross-client
3. Bulk dismiss irelevante → `POST /api/portfolio/findings/batch`
4. Click critic → `/portfolio/client/[orgId]?finding=[id]`
5. Drill-in → `/dashboard/resolve/[findingId]` (Cockpit)
6. Confirmă → generează doc → `POST /api/documents/generate`
7. Atașează dovadă → `POST /api/tasks/[id]/evidence`
8. Marchează rezolvat → `PATCH /api/findings/[id]`
**Durată: 8-15 min vs. 45-60 min manual**

### Onboarding org nou
1. `/register` → `POST /api/auth/register` → user + org + trial
2. `/onboarding` → selectare mod → `POST /api/auth/set-user-mode`
3. Input CUI → `GET /api/anaf/lookup` → prefill date ANAF
4. Chestionar 7 întrebări → `evaluateApplicability()` → frameworks active
5. Redirect: partner→`/portfolio`, compliance/solo→`/dashboard`

### Import portfofolio CSV (Diana batch)
1. Click "Import CSV" → wizard 4 pași: upload → mapping → review → progress
2. `POST /api/partner/import/preview` → validate CUI-uri, detectare coloane
3. `POST /api/partner/import/execute` → crează orgs (max 50)
4. `POST /api/partner/import/anaf-prefill` → completează date ANAF
5. `POST /api/partner/import/baseline-scan` → findings per fiecare org
6. Portfolio actualizat cu toate firmele + scoruri

### Quick-add client <30s (preview)
1. Click "⚡ Adaugă firmă" → dialog 2 câmpuri (CUI + website opțional)
2. `POST /api/partner/clients/quick-add`: ANAF lookup → creare org → applicability → website scrape → findings
3. Done: "X findings, scor Y%" + "Intră în firmă →"

### NIS2 incident reporting (Radu)
1. Incident detectat → `POST /api/nis2/incidents` cu severity + systems afectate
2. Timer automat: 24h early warning + 72h raport complet
3. `POST /api/nis2/dnsc-correspondence` → trimite raport
4. Log imutabil, accesibil la audit

### eFactura workflow
1. Connect SPV: `/api/anaf/connect` → OAuth → `/api/anaf/callback` → token
2. `POST /api/fiscal/spv-check` → validare factură UBL CIUS-RO
3. `POST /api/fiscal/submit-spv` → trimitere
4. Cron `/api/cron/efactura-spv-monthly` → reconciliere lunară
5. Factură respinsă → finding automat + workflow "repair"

---

> **END CLAUDE-FULL-SPEC-APP.md** — compilat 2026-04-21 din main branch + preview/integration-2026-04-21.
> Actualizat după fiecare push live major sau sprint completat.
