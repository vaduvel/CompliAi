# UX/UI/IA Audit — Change Log
**Audit date:** 2026-03-25
**Live la:** `compliscanag.vercel.app`
**Ultima actualizare:** 2026-03-25 (după Sprint 3, PR #84)

---

## Prioritizare implementare

### 🔴 CRITIC (C)
- [x] C1 — Onboarding: CUI field fără explicații → tooltip, exemplu, link ANAF
- [x] C2 — Scan → Findings: flow fragmentat → auto-trigger analyze + CTA inline
- [x] C3 — Dashboard home: Top 3 acțiuni (nu 1) + restructurare densitate
- [x] C4 — Settings: tab "Plan & Facturare" integrat în settings page (billing accesibil din nav)
- [x] C5 — Partner: banner context după workspace switch

### 🟡 IMPORTANT (I)
- [x] I1 — Terminologie completă: DSAR heading → "Cereri acces date (DSAR)", portfolio nav "Alerte" → "Schimbări detectate", L1/L2/L3 prietenoase
- [x] I2 — NIS2: `Nis2ProgressStepper` cu 4 pași (Clasificare/Maturitate/Incidente/Guvernanță), status real per API
- [x] I3 — Documente hub: tab "Generează" cu 5 tipuri doc ca quick links, buton Vault în header
- [x] I4 — Rute legacy: redirect sau cleanup (setari, scanari, rapoarte, audit-log, findings/[id])
- [x] I5 — Benchmark: widget pe dashboard home (API există, UI lipsea)
- [ ] I6 — Email notifications configurabile din UI (declanșatoare, frecvență) — **neimplementat**
- [x] I7 — Vendor review: în NIS2 tab "Furnizori ICT" (corect conceptual), nu duplicat în nav
- [x] I8 — Mobile nav: Calendar + Rapoarte incluse în primary nav (verificat — 6 items)

### 🟢 POLISH (P)
- [x] P1 — Microcopy: terminologie plain RO în resolve page
- [x] P2 — Empty states prietenoase: card welcome cu CTA /onboarding pentru useri noi *(Sprint 3)*
- [x] P3 — Trending scores (săgeți ▲▼) pe dashboard
- [x] P4 — "Câștiguri rapide": filtrul RAPID redenumit proeminent în remediation-board
- [x] P5 — Agent status: `AgentStatusWidget` pe dashboard home cu fetch /api/agents + link la /agents
- [x] P6 — Share token mai proeminent: `PartnerCounselPack` mutat deasupra fold în Rapoarte *(Sprint 3)*
- [ ] P7 — Whistleblowing module — Directiva EU 2019/1937, obligatorie >50 angajați — **sprint separat**
- [ ] P8 — Cookie consent auto-audit pe site scan — **neimplementat**

### 🤖 AUTOMATIZĂRI (A)
- [x] A1 — DSAR creat → auto-generate draft răspuns din org profile, returnat imediat în response *(Sprint 3)*
- [x] A2 — NIS2 incident → email alert "24h/72h deadline în X ore" în daily-digest cron *(Sprint 3)*
- [x] A3 — Politici generate → reminder expiry la 30 zile în daily-digest cron *(Sprint 3)*
- [x] A4 — e-Factura XML → live validation pe paste (onChange debounce 800ms) *(Sprint 3)*
- [ ] A5 — Scoring → live-update la orice task marcat rezolvat (nu doar la reload) — **neimplementat**
- [ ] A6 — Vendor adăugat → auto-generate vendor risk assessment imediat — **neimplementat**

---

## Backlog rămas neimplementat

### 🟡 IMPORTANT
- [ ] I6 — Email notifications configurabile din UI (declanșatoare, frecvență)

### 🤖 Automatizări
- [ ] A5 — Scoring live-update la task rezolvat (fără reload)
- [ ] A6 — Vendor adăugat → auto-generate vendor risk assessment

### 📊 Reports
- [ ] R2 — Raport executiv one-pager vizibil pe dashboard (rezumat pentru board/investitor)

### 🏗️ Structurale mari
- [ ] S1 — Bulk actions în Resolve: marcare simultană a mai multor task-uri
- [ ] S2 — DORA module (Financial sector) — gap de piață pentru fintech/banking
- [ ] P7 — Whistleblowing module — Directiva EU 2019/1937, obligatorie >50 angajați
- [ ] P8 — Cookie consent auto-audit: scanare discrepanțe cookie banner vs. cookieuri reale

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

## Sprint 2 — Implementat 2026-03-25

### I1 complet — Terminologie
- `app/dashboard/dsar/page.tsx` — heading → "Cereri acces date (DSAR)"
- `components/compliscan/navigation.ts` — portfolio "Alerte" → "Schimbări detectate"

### I2 — NIS2 Stepper
- `app/dashboard/nis2/page.tsx` — `Nis2ProgressStepper` adăugat (3 fetch-uri paralele: maturity + incidents + governance)

### I3 — Documente Hub
- `components/compliscan/documents-page.tsx` — tab "Generează" cu 5 quick links, buton Vault în header

### C4 — Settings unificat
- `components/compliscan/settings-page.tsx` — tab "Plan & Facturare" adăugat (lazy-load `SettingsBillingPageSurface`), eliminat buton redundant din PageIntro

### P4 — Quick wins
- `components/compliscan/remediation-board.tsx` — "Rapide" → "Câștiguri rapide"

### P5 — Agent status
- `app/dashboard/page.tsx` — `AgentStatusWidget` adăugat înainte de detalii conformitate

---

## Trade-off-uri gestionate

1. **Onboarding scurtat** → intake questions rămân dar se colectează progresiv în dashboard (nu eliminate)
2. **L1/L2/L3 simplificat în labels** → valorile interne rămân identice, doar afișarea e prietenoasă
3. **Dashboard Top 3** → widget-urile secundare (site scan, e-Factura, DSAR) rămân pe dashboard dar sub "Overview complet" collapsible (nu eliminate)

---

## Zero funcționalitate eliminată

Toate schimbările sunt de prezentare/navigare. API-urile, logica de business, validările și datele rămân intacte.
