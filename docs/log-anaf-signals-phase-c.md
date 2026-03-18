# ANAF Signals Phase C — Log

Data: 2026-03-18
Branch: `feat/anaf-signals-phase-a` (continuare)
Baza: `feat/v4-p0-audit-fixes` (release V4/V5)

## Ce s-a livrat

### C1 — SAF-T Hygiene (`lib/compliance/saft-hygiene.ts`)
- Hygiene score dedicat SAF-T (filtrare automată din filing records)
- 4 indicatori: completitudine, punctualitate, rectificări, consistență
- Detecție gap-uri în secvența lunară de raportare
- Detecție rectificări repetate ca problemă sistemică
- Cross-filing check: SAF-T vs D300 (TVA) — detectează discrepanțe între declarații
- Finding builder pentru hygiene critic + probleme de consistență

### C2 — Fiscal Health Check Section (`lib/compliance/health-check.ts`)
- Bloc e-TVA: discrepanțe active, overdue, urgente (≤5 zile)
- Bloc Filing Discipline: scor + status (critic/warning/ok)
- Bloc SAF-T Hygiene: scor + consistență issues
- Toate integrate în health-check existent, cu items dedicat per bloc

### C3 — Revalidation Rules + Notification-Discrepancy Linkage (`lib/compliance/fiscal-revalidation.ts`)
- Reopen findings: dacă discrepanța e-TVA e încă activă dar finding-ul e "închis" → redeschide
- Reopen filing findings: dacă declarația e încă lipsă → redeschide finding-ul
- Reminder revalidare: notifică 7 zile înainte de revalidation due date
- Escalation: dacă revalidation due date e depășit → escalare
- Stale evidence: dovezi mai vechi de 90 zile → flaggare
- Auto-link notificări ANAF → discrepanțe e-TVA (match pe perioadă + tip keywords)
- Confidence levels: high (perioadă + tip) / medium (doar perioadă)
- `runFiscalRevalidation()` agregator — rulează toate checkurile dintr-o funcție

### C4 — API CRUD
- `GET/POST/PATCH /api/fiscal/etva-discrepancies` — CRUD discrepanțe e-TVA cu tranziții de stare
- `GET/POST/PATCH /api/fiscal/filing-records` — CRUD filing records cu discipline score, remindere, SAF-T hygiene
- State extension pattern: `StateWithDiscrepancies` / `StateWithFilings` extends `ComplianceState`

### C5 — Teste dedicate
- `etva-discrepancy.test.ts` — 12 teste (severity, countdown, transitions, overdue, findings, explanation, deadline)
- `filing-discipline.test.ts` — 12 teste (score, overdue findings, reminders, consistency)
- `saft-hygiene.test.ts` — 8 teste (filtering, hygiene score, rectifications, gaps, findings, cross-filing)
- `fiscal-revalidation.test.ts` — 10 teste (reopen, reminders, stale evidence, auto-link, aggregator)

## Validare

- TypeScript: 0 erori
- Build: clean
- Tests: 544 passed (100 test files), 1 skipped — **+53 teste noi**

## Fișiere create/modificate

- `lib/compliance/saft-hygiene.ts` — NOU (C1)
- `lib/compliance/health-check.ts` — MODIFICAT (C2)
- `lib/compliance/fiscal-revalidation.ts` — NOU (C3)
- `app/api/fiscal/etva-discrepancies/route.ts` — NOU (C4)
- `app/api/fiscal/filing-records/route.ts` — NOU (C4)
- `lib/compliance/etva-discrepancy.test.ts` — NOU (C5)
- `lib/compliance/filing-discipline.test.ts` — NOU (C5)
- `lib/compliance/saft-hygiene.test.ts` — NOU (C5)
- `lib/compliance/fiscal-revalidation.test.ts` — NOU (C5)
- `docs/log-anaf-signals-phase-c.md` — NOU (acest log)
