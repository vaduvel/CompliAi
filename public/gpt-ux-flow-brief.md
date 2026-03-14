# CompliScan UX/UI Flow Brief (for GPT review)

Date: 2026-03-14

## Purpose
This brief describes the current user flow, navigation, and UI hierarchy in CompliScan so GPT can propose UX improvements. Focus on reducing confusion and clarifying the flow without rewriting the product or changing the domain model.

## Non-negotiables
- Product framing stays: Scanare -> Control -> Dovada, Remediere, Audit si export.
- Human validation remains mandatory (no "automatic compliance" claims).
- Evidence OS stays the design language (no new UI system).
- Avoid new top-level product concepts.

## Entry & auth flow
- Entry page: `/login` (single page, toggles Login/Register).
- After successful login/register: redirect to `/dashboard`.
- Auth endpoints: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`.

## Global layout (Dashboard Shell)
- Layout wrapper: `app/dashboard/layout.tsx` -> `DashboardShell` + `CockpitProvider`.
- Left sidebar (desktop): logo + primary nav (Scanare, Control, Dovada).
- Sidebar note: sub-sections appear as tabs per page.
- Top-level user/org switcher in sidebar footer.
- Mobile: bottom nav + floating assistant.

## Primary navigation (sidebar)
- Scanare -> `/dashboard/scanari`
- Control -> `/dashboard`
- Dovada -> `/dashboard/checklists`

## Secondary navigation (tabs per pillar)
- Scanare: Flux scanare (`/dashboard/scanari`), Documente (`/dashboard/documente`)
- Control: Dashboard (`/dashboard`), Sisteme AI (`/dashboard/sisteme`), Alerte (`/dashboard/alerte`), Setari (`/dashboard/setari`)
- Dovada: Remediere (`/dashboard/checklists`), Audit si export (`/dashboard/rapoarte`), Asistent (`/dashboard/asistent`)

## Page-by-page flow summary

### 1) Overview (Control)
- Route: `/dashboard`
- Role: high-level summary + next best action + risk overview.

### 2) Scanare (Flow)
- Route: `/dashboard/scanari`
- Flow modes inside same page: document / text / manifest / yaml.
- Sections include: active flow, latest result, AIDiscoveryPanel for manifest/yaml.
- Agent mode toggle exists on this page.

### 3) Documente (History)
- Route: `/dashboard/documente`
- Latest document summary + recent scans list.

### 4) Sisteme AI (Control)
- Route: `/dashboard/sisteme`
- Mixed content on one page:
  - Discovery (AIDiscoveryPanel)
  - Inventory (AIInventoryPanel)
  - Compliance Pack review
  - Baseline + drift preview
  - e-Factura validator

### 5) Alerte (Drift)
- Route: `/dashboard/alerte`
- Drift lifecycle actions + tasks linked to drift.

### 6) Remediere (Tasks)
- Route: `/dashboard/checklists`
- Remediation board with task filters + evidence attachment.

### 7) Audit si export
- Route: `/dashboard/rapoarte`
- Mixed content:
  - RemediationBoard (tasks)
  - snapshot/baseline status
  - export center
  - recent drift summary

### 8) Auditor Vault
- Route: `/dashboard/rapoarte/auditor-vault`
- Audit-ready view: evidence ledger, traceability matrix, audit pack, timeline.

### 9) Setari
- Route: `/dashboard/setari`
- Dense operational page:
  - Members & roles
  - Repo sync
  - Supabase status
  - App health
  - Release readiness
  - Drift overrides
  - Reset/state actions

### 10) Asistent AI
- Route: `/dashboard/asistent`
- Chat assistant, suggestions, messages.

## UI hierarchy (typical page)
1. PageHeader (title, description, risk score)
2. Pillar tabs (secondary nav)
3. Content sections (cards/boards)

## Current UX pain points (observed)
- Scanare mixes 4 modes in one workspace; active flow and results are not clearly separated.
- Sisteme AI mixes discovery, inventory, baseline, drift, compliance pack, and e-Factura on one page.
- Audit si export mixes remediation tasks with export (two different intents).
- Setari is too dense, multiple operational areas in one page.
- Asistent sits under Dovada tab; may be confusing as a utility tool.

## Desired improvements from GPT
Please propose:
- A clearer flow with fewer mixed intents per page.
- A re-mapping of sections into tabs or sub-sections to reduce confusion.
- Minimal routing changes (prefer reorganizing content in-place or via tabs).
- A short sequence of priority changes (first 2-3 wins).
- Keep Evidence OS and product framing intact.

