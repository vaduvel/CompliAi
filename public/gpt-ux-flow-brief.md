# CompliScan UX/UI Flow Brief (for GPT review)

Date: 2026-03-14

## Purpose
This brief describes the approved information architecture and target user flow in CompliScan so GPT can propose UX improvements without re-opening settled product decisions.

## Non-negotiables
- Golden path stays: source -> verdict -> remediation -> evidence -> audit/export.
- Human validation remains mandatory.
- Evidence OS stays the design language.
- Do not introduce new top-level product concepts.
- Dashboard is orientation, not an execution workspace.

## Entry & auth flow
- Entry page: `/login`.
- After successful login/register: redirect to `/dashboard`.
- Auth endpoints: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`.

## Global layout (Dashboard Shell)
- Layout wrapper: `app/dashboard/layout.tsx` -> `DashboardShell` + `CockpitProvider`.
- Left sidebar (desktop): logo + primary nav.
- Primary nav is approved as:
  - Dashboard
  - Scanare
  - Control
  - Dovada
  - Setari
- Sub-sections stay inside page tabs, not as competing pseudo-products in the sidebar.
- Top-level user/org switcher stays in sidebar footer.
- Asistent is a global utility. It may have a dedicated page for longer history, but it does not sit under Dovada.

## Approved primary navigation (sidebar)
- Dashboard -> `/dashboard`
- Scanare -> `/dashboard/scanari`
- Control -> routed today through `/dashboard/sisteme` and `/dashboard/alerte`
- Dovada -> routed today through `/dashboard/checklists`, `/dashboard/rapoarte`, `/dashboard/rapoarte/auditor-vault`
- Setari -> `/dashboard/setari`

## Approved secondary navigation (tabs per area)
- Dashboard:
  - Readiness
  - Drift feed
  - Next best action
  - Evidence quality summary
  - Audit readiness snapshot
- Scanare:
  - Adauga sursa
  - Rezultat curent
  - Istoric
- Control:
  - Overview
  - Sisteme
  - Drift
  - Review
- Sisteme sub-tabs:
  - Inventar
  - Discovery
  - Compliance Pack
  - Baseline
- Dovada:
  - Remediere
  - Dovezi
  - Audit Pack
  - Vault
- Setari:
  - Workspace
  - Integrari
  - Acces
  - Operational
  - Avansat

## Page-by-page flow summary

### 1) Dashboard
- Route today: `/dashboard`
- Role: orientation home, not execution.
- Should show:
  - readiness
  - drift feed
  - next best action
  - evidence quality summary
  - audit readiness snapshot
- Should not host:
  - discovery
  - remediation board
  - export center

### 2) Scanare
- Route today: `/dashboard/scanari`
- Target structure:
  - Adauga sursa
  - Rezultat curent
  - Istoric
- Agent mode remains on this page.

### 3) Istoric documente
- Route today: `/dashboard/documente`
- Serves the history function for Scanare.

### 4) Control
- Main execution surfaces today:
  - `/dashboard/sisteme`
  - `/dashboard/alerte`
- Target structure:
  - Overview
  - Sisteme
  - Drift
  - Review

### 5) Sisteme
- Route today: `/dashboard/sisteme`
- Must converge toward:
  - Inventar
  - Discovery
  - Compliance Pack
  - Baseline

### 6) Drift
- Route today: `/dashboard/alerte`
- This surface is conceptually Drift, not generic alerts.
- Keeps drift lifecycle actions and links to remediation.

### 7) Dovada
- Main execution surfaces today:
  - `/dashboard/checklists`
  - `/dashboard/rapoarte`
  - `/dashboard/rapoarte/auditor-vault`
- Separation must stay:
  - Remediere = execution
  - Dovezi/Vault = ledger, traceability, timeline
  - Audit Pack = final export/delivery

### 8) Setari
- Route today: `/dashboard/setari`
- Must converge toward:
  - Workspace
  - Integrari
  - Acces
  - Operational
  - Avansat

### 9) Asistent AI
- Route today: `/dashboard/asistent`
- Utility surface, not part of Dovada.

## Current UX pain points that still matter
- Scanare still carries the heaviest mixed flow.
- Control still spans multiple routes and legacy labels.
- Setari is still too dense.
- Some documents and diagrams still describe sidebar shortcuts as if they were products.

## Desired improvements from GPT
Please propose:
- clearer decomposition inside these approved top-level areas
- tab/sub-tab structures that reduce mixed intent
- minimal routing changes where possible
- short priority sequence for implementation
- no contradiction with the approved IA above
