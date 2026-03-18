# ANAF Signals Phase B — Log

Data: 2026-03-18
Branch: `feat/anaf-signals-phase-a` (continuare)
Baza: `feat/v4-p0-audit-fixes` (release V4/V5)

## Ce s-a livrat

### B1 — e-TVA Discrepancy Workflow (`lib/compliance/etva-discrepancy.ts`)
- 6 tipuri de discrepanțe (sum_mismatch, missing_invoice, duplicate_invoice, period_mismatch, vat_rate_error, conformity_notice)
- Lifecycle complet: detected → acknowledged → explanation_drafted → response_sent → awaiting_anaf → resolved | overdue
- Severity classification (critical/high/medium) bazată pe tip + sumă
- Countdown logic cu urgency labels (expirat/urgent/atenție/ok)
- Explanation draft builder (scrisoare template către ANAF)
- Finding builder integrat cu ScanFinding + FindingResolution
- Overdue detection automată
- State transitions imutabile (applyDiscrepancyTransition)

### B2 — Filing Discipline Layer (`lib/compliance/filing-discipline.ts`)
- 6 tipuri de declarații (D300 TVA, D390, D394, SAF-T D406, e-Factura lunar, RO e-TVA)
- Filing discipline score (0-100) cu categorii: excelent/bun/acceptabil/slab/critic
- Scoring: on_time=100%, late=50%, rectified=60%, missing=0%
- Penalizare pentru rectificări repetate
- Overdue filing findings generate automat (cu referință Cod Fiscal Art. 336-338)
- Reminder logic cu 3 nivele escalare (reminder 14d, warning 7d, escalation 3d)
- Consistency checker (detectează rectificări repetate, gaps în secvență)

### B3 — Response Pack Enrichment (`lib/compliance/response-pack.ts` + `app/api/reports/response-pack/route.ts`)
- Nou tip `ResponsePackFiscalStatus` cu 12 câmpuri fiscale
- Secțiune HTML completă "Status fiscal — ANAF / e-Factura / RO e-TVA"
- Grid cards pentru discrepanțe e-TVA + disciplină declarații
- Integrare automată în endpoint-ul POST `/api/reports/response-pack`
- Extrage date din state: efacturaSignals, etvaDiscrepancies, filingRecords
- Degradare grațioasă: secțiunea apare doar dacă există date fiscale

## Validare

- TypeScript: 0 erori
- Build: clean
- Tests: 491 passed, 1 skipped

## Fișiere modificate/create

- `lib/compliance/etva-discrepancy.ts` — NOU
- `lib/compliance/filing-discipline.ts` — NOU
- `lib/compliance/response-pack.ts` — MODIFICAT (fiscal section)
- `app/api/reports/response-pack/route.ts` — MODIFICAT (fiscal enrichment)
- `docs/log-anaf-signals-phase-b.md` — NOU (acest log)
