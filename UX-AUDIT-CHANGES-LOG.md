# UX/UI/IA Audit — Change Log
**Branch:** `claude/thirsty-bassi`
**Audit date:** 2026-03-25
**Based on:** Full UX/UI/IA/User Flow audit — CompliAI live

---

## Prioritizare implementare

### 🔴 CRITIC (C)
- [x] C1 — Onboarding: CUI field fără explicații → tooltip, exemplu, link ANAF
- [x] C2 — Scan → Findings: flow fragmentat → auto-trigger analyze + CTA inline
- [x] C3 — Dashboard home: Top 3 acțiuni (nu 1) + restructurare densitate
- [x] C5 — Partner: banner context după workspace switch

### 🟡 IMPORTANT (I)
- [x] I1 — Terminologie: DSAR → "Cerere acces date", Drift → "Schimbări detectate", L1/L2/L3 → labels prietenoase
- [x] I4 — Rute legacy: redirect sau cleanup (setari, scanari, rapoarte, audit-log, findings/[id])
- [x] I5 — Benchmark: widget pe dashboard home (API există, UI lipsea)
- [ ] I2 — NIS2: stepper intern cu progresie (planificat sprint următor)
- [ ] I3 — Documente: hub unificat (planificat sprint următor)
- [ ] I6 — Email notifications configurabile din UI (planificat sprint următor)

### 🟢 POLISH (P)
- [x] P1 — Microcopy: terminologie plain RO în resolve page
- [x] P3 — Trending scores (săgeți ▲▼) pe dashboard
- [ ] P2 — Empty states prietenoase pentru useri noi (planificat)
- [ ] P4 — "Quick wins" tab (planificat)
- [ ] P5 — Agent status pe dashboard home (planificat)

---

## Fișiere modificate

### C1 — Onboarding CUI
- `app/onboarding/page.tsx` — progress indicator, label "Pasul X din Y"
- `components/compliscan/applicability-wizard.tsx` — CUI tooltip + exemplu + link ANAF, help text sector/employees

### C2 — Scan auto-flow
- `app/dashboard/scan/page.tsx` — auto-trigger analyze după extract reușit
- `components/compliscan/scan-page.tsx` — CTA inline "X probleme găsite → Rezolvă acum"

### C3 — Dashboard home Top 3
- `app/dashboard/page.tsx` — Top 3 acțiuni, trending score, benchmark widget
- `components/compliscan/next-best-action.tsx` — extins pentru top 3 (nu doar 1)

### C5 — Partner banner
- `components/compliscan/dashboard-shell.tsx` — banner "Lucrezi pentru: [Firma X]" cu back to portfolio

### I1 — Terminologie
- `components/compliscan/remediation-board.tsx` — labels L1→"Auto", L2→"Confirmat intern", L3→"Validat expert"
- `app/dashboard/dsar/page.tsx` — DSAR → "Cereri acces date" în heading
- `components/compliscan/dashboard-shell.tsx` — "Alerte" → "Schimbări detectate" în nav

### I4 — Rute legacy
- `app/dashboard/setari/page.tsx` — redirect → /dashboard/settings
- `app/dashboard/scanari/page.tsx` — redirect → /dashboard/scan
- `app/dashboard/rapoarte/page.tsx` — redirect → /dashboard/reports
- `app/dashboard/audit-log/page.tsx` — redirect → /dashboard/reports/audit-log
- `app/dashboard/asistent/page.tsx` — redirect → /dashboard/scan
- `app/dashboard/findings/[id]/page.tsx` — redirect → /dashboard/resolve/[id]

### I5 — Benchmark widget
- `app/dashboard/page.tsx` — benchmark widget cu scor vs. sector

### P1 — Microcopy resolve
- `components/compliscan/remediation-board.tsx` — labels L1/L2/L3 prietenoase

### P3 — Trending scores
- `app/dashboard/page.tsx` — delta față de snapshot anterior

---

## Trade-off-uri gestionate

1. **Onboarding scurtat** → intake questions rămân dar se colectează progresiv în dashboard (nu eliminate)
2. **L1/L2/L3 simplificat în labels** → valorile interne rămân identice, doar afișarea e prietenoasă
3. **Dashboard Top 3** → widget-urile secundare (site scan, e-Factura, DSAR) rămân pe dashboard dar sub "Overview complet" collapsible (nu eliminate)

---

## Zero funcționalitate eliminată

Toate schimbările sunt de prezentare/navigare. API-urile, logica de business, validările și datele rămân intacte.
