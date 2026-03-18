# ANAF Signals Phase D — Log

Data: 2026-03-18
Branch: `feat/anaf-signals-phase-a` (continuare)
Baza: `feat/v4-p0-audit-fixes` (release V4/V5)

## Ce s-a livrat

Phase D = Agent Rails — module standalone (pure functions) care procesează semnalele ANAF
pentru agenții V6. Nu depind de fișierele V6 — se conectează la merge.

### D1 — Fiscal Sensor Rail (`lib/compliance/agent-rail-fiscal-sensor.ts`)
Pornește din: rejected invoices, pending invoices, vendor repeated issues.
- Urgency rescoring batch — semnale peste threshold (70) sunt re-examine
- Reopen findings — semnale active dar finding rezolvat → redeschidere
- Work items — vendori cu ≥3 respingeri repetate, facturi blocate >48h
- Partner alerts — situații critice (vendori cu respingeri + urgență ridicată)
- Output structurat: `FiscalSensorOutput` cu contoare + summary

### D2 — Compliance Monitor Rail (`lib/compliance/agent-rail-compliance-monitor.ts`)
Pornește din: e-TVA discrepancy, filing discipline, overdue responses, SAF-T hygiene.
- Reminders — discrepanțe e-TVA cu termen ≤7 zile + filing reminders
- Stale signals — notificări ANAF fără acțiune de ≥14 zile
- Escalation — discrepanțe overdue, filing discipline <40, SAF-T hygiene <50
- Response Pack refresh trigger — automat când sunt discrepanțe overdue sau scor <60
- Output structurat: `ComplianceMonitorOutput` cu contoare + refresh flag

### D3 — Routing / Prioritization Agent Rail (`lib/compliance/agent-rail-routing.ts`)
Pornește din: sector risk, org profile, findings severity, discrepancies, filing discipline.
- Priority scoring (0-100) — 4 factori cu greutăți: sector risk (20), findings (30), discrepanțe (25), filing (20)
- Urgency tiers: critical/high/medium/low
- Next best action — acțiunea cu cea mai mare prioritate sugerată automat
- Queue placement: urgent/standard/monitoring
- Batch prioritization — sortează mai mulți clienți descrescător după urgență

### Teste Phase D
- `agent-rail-fiscal-sensor.test.ts` — 6 teste (rescore, reopen, work items, partner alerts, pending)
- `agent-rail-compliance-monitor.test.ts` — 6 teste (escalation, reminders, filing, stale, SAF-T)
- `agent-rail-routing.test.ts` — 6 teste (priority, sector, accumulation, queue, batch, next action)

## Validare

- TypeScript: 0 erori
- Build: clean
- Tests: 564 passed (103 test files), 1 skipped — **+20 teste noi**

## Cum se conectează la V6

La merge ANAF → V6, agenții existenți importă rail modules:
- `agent-fiscal-sensor.ts` → importă `runFiscalSensorRail()`
- `agent-compliance-monitor.ts` → importă `runComplianceMonitorRail()`
- `agent-orchestrator.ts` → importă `computeClientPriority()` + `determineQueuePlacement()`
- Niciun cod V6 nu trebuie rescris — doar adăugare importuri + apeluri

## Fișiere create

- `lib/compliance/agent-rail-fiscal-sensor.ts` — NOU (D1)
- `lib/compliance/agent-rail-compliance-monitor.ts` — NOU (D2)
- `lib/compliance/agent-rail-routing.ts` — NOU (D3)
- `lib/compliance/agent-rail-fiscal-sensor.test.ts` — NOU
- `lib/compliance/agent-rail-compliance-monitor.test.ts` — NOU
- `lib/compliance/agent-rail-routing.test.ts` — NOU
- `docs/log-anaf-signals-phase-d.md` — NOU (acest log)
