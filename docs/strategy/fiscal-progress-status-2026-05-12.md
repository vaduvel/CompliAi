# Fiscal Module — Progress Status

**Data:** 2026-05-12 (sfârșit sesiune compactare)
**Branch:** `v3-unified`
**Worktree:** `.claude/worktrees/fiscal-mature/`
**Total commits sesiune:** 21 pe v3-unified peste origin/main

---

## Status fază cu fază

| Fază | Cod TS clean | Browser verify | Endpoints toate exist | 100% gata |
|---|---|---|---|---|
| **Faza 0** — cleanup cabinet-fiscal critical | ✅ | ✅ (Mircea register → /portfolio direct, 0 GDPR mențiuni) | ✅ | **DA** |
| **Faza 1.5** — Setup-fiscal page + routing guard | ✅ | ✅ (routing guard /portfolio + /dashboard → setup-fiscal) | ✅ | **DA** structural |
| **Faza 2** — Scan orchestrator SSE | ✅ | ⏳ | ✅ | **DA cod**, verify cap-coadă deferat |
| **Faza 3.1-3.4** — Resolve Cockpit + 9 patterns | ✅ | ⏳ | ✅ (după Faza 3.5) | **DA cod** + endpoints |
| **Faza 3.5** — Endpoints critice + Pattern D fix | ✅ | ⏳ | ✅ | **DA cod** |
| **Faza 4-7** — Audit Trail + Smart Pattern + PDF + Monitoring | — | — | — | **NU** — pending |

---

## Commit map

```
Faza 0 (6 commits):
  c8bfc73 middleware redirect /dashboard → /dashboard/fiscal
  e66fd9e applicability + activity feed scoping
  b8f17bd risk-trajectory iminent risks scoped
  b0d0018 skip onboarding role-selection when icp= URL
  5c9e82a auto-submit onboarding Pas 2
  a81e1d8 propagate ?icp= to /onboarding

Faza 1 (4 commits — superseded by 1.5):
  8c0b06b OnboardingWalkthrough (dropped)
  6c12cd1 empty state 4 căi
  b0fe1c5 wire walkthrough trigger
  f450758 drop manual 1-CUI (3 căi)

Faza 1.5 (3 commits):
  558fd2f /onboarding/setup-fiscal page secvențială (3 pași)
  d3bcef2 routing guard SSR /portfolio + /dashboard
  1cc9eb8 drop OnboardingWalkthrough modal final

Faza 2 (1 commit):
  fcdc64e /api/portfolio/fiscal-scan SSE orchestrator

Faza 3 (5 commits):
  632d99a Faza 3.1 — Resolve Cockpit skeleton + Pattern A
  1998023 Faza 3.2 — Pattern G + B + I
  2c4adc1 Faza 3.3 — Pattern E + F
  ac360a6 Faza 3.4 — Pattern D + H + C
  [bdb3f1f] Faza 3.5a-e — 5 endpoints critice
  7e21bbe Faza 3.5f — Pattern D fix POST + adapter
```

Last commit: `7e21bbe` (Pattern D fix).

---

## Patterns acoperite (9/9 + dispatcher dual EF-004)

| Pattern | Finding types | Componenta | Status |
|---|---|---|---|
| A — Auto-Approve | EF-003, EF-006 | `PatternAAutoApprove` | ✅ Cod complet, chain validate→submit→confirm→save |
| B — Manual-Input | D300-LINE-ERROR, SAFT-ACCOUNTS-INVALID | `PatternBManualInput` | ✅ Form dynamic config per type |
| C — Skip-Wait | EF-004 (<72h) | `PatternCSkipWait` | ✅ Timer countdown + check status |
| D — Search-Lookup | EF-SEQUENCE, EF-CPV-MISSING | `PatternDSearchLookup` | ✅ POST + shape adapter |
| E — Compare-Decide | ETVA-GAP, ERP-SPV-MISMATCH, BANK-SPV-MISMATCH, EF-DUPLICATE, FREQUENCY-MISMATCH | `PatternECompareDecide` | ✅ Diff table + A/B scenariu |
| F — Generate-Doc | ETVA-LATE, D300-MISSING, PFA-FORM082 | `PatternFGenerateDoc` | ✅ AI generator + edit + PDF |
| G — Upload-Evidence | CERT-EXPIRING, CERT-EXPIRED, CERT-AUTH-FAILED, SAFT-DEADLINE | `PatternGUpload` | ✅ Drag-drop + extra fields |
| H — External-Contact | EMPUTERNICIRE-MISSING | `PatternHExternalContact` | ✅ 3-step + template PDF |
| I — Retransmit | EF-005, EF-004 (≥72h) | `PatternIRetransmit` | ✅ Chain validate→submit→save |
| Fallback | EF-OCR-FAILED, EF-BULK-INVALID, EF-CROSSBORDER, SAFT-HYGIENE-LOW, SAFT-XML-ERROR + necunoscute | `PatternFallback` | ✅ Deep-link la workflow + mark manual |

**Total acoperite: 25/27 finding types** + EF-GENERIC fallback robust.

---

## Endpoint-uri create în Faza 3.5

| Endpoint | Method | Folosit de | Status |
|---|---|---|---|
| `/api/findings/[id]/resolve` | POST | TOATE pattern-urile | ✅ Audit log + closure evidence |
| `/api/findings/[id]/xml` | GET | Pattern A + I | ✅ Lookup în validations / evidence |
| `/api/findings/[id]/reminder` | POST | Pattern C | ✅ Schedule event + nextMonitoringDate |
| `/api/findings/[id]/imputernicire-pdf` | POST | Pattern H | ✅ PDFKit generator cu CUI auto-fill |
| `/api/findings/[id]/doc-pdf` | GET | Pattern F | ✅ PDFKit din draft event saved |

---

## Pending pentru next session

### Browser verify cap-coadă (1-2h)
Necesită setup Mircea cu ANAF sandbox token real:
1. Login `mircea-setup-fiscal-2026-05-12@test.test` / `TestPass123!`
2. Setup-fiscal complet:
   - CSV import 1 client (cu CUI sandbox `RO45758405`)
   - ANAF SPV OAuth real (token valid 90 zile)
   - Scan orchestrator → finding EF-003 detect real
3. Click finding → Fiscal Resolve Cockpit → Pattern A
4. Verify chain: repair → submit → status → resolve → audit log
5. Verify alte pattern-uri pe finding-uri seed (G, E, F separate)

### Backend extensions opționale (4h)
- `state.efacturaValidations` — adaug `rawXml?: string` câmp pentru Pattern A complet
- `etva-discrepancies?format=compare` — adapter pe Pattern E
- `pdf-generator.test.ts` — tests pentru noile generatoare PDF

### Faza 4 — Audit Trail Timeline per Client (8h estimat)

Vedere agregată `/dashboard/dosar?clientId=X` cu:
- Timeline cronologic invers toate operațiunile pe client
- Filter pe tip operațiune (auto-fix / retransmit / upload / etc.)
- Per entry: timestamp + actor + decizie + bază legală + link finding
- Export PDF cu signature cabinet + hash chain

### Faza 5 — Smart Pattern Engine V1 (15h estimat) — WEDGE differentiator

Storage `fix_pattern_memory` în Supabase:
- error_code + client_cui + fix_applied + success + applied_at
- Recurring issue detector (≥3 oară în 30 zile)
- Preventive suggestions ("Vrei să generez email cu instrucțiuni client?")
- UI integration: preselect fix anterior + badge "RECURRING ISSUE"

### Faza 6 — Raport lunar PDF per client (6h)

`lib/server/monthly-client-report.ts`:
- PDFKit generator cu brand cabinet
- Activitate fiscală lunară per client
- Cron auto-generate 1 a lunii următoare
- Email automat opt-in la client

### Faza 7 — Monitoring dashboard agent fiscal AI (4h)

`/dashboard/fiscal/agent-fiscal-ai`:
- Cron status + ultima/următoarea rulare
- Live activity log
- Agent decisions log

---

## Decizii lock-uite pentru next session

1. **Branch:** continue pe `v3-unified` (worktree `fiscal-mature`)
2. **PDF lib:** pdfkit (reuse pattern din lib/server/pdf-generator)
3. **Storage:** Supabase direct (skip local writes pentru Smart Pattern Engine)
4. **Cron:** Vercel Cron (există config pentru efactura-spv-monthly)
5. **Commit cadence:** per task, fără batch mare
6. **TS clean threshold:** zero errors pe new code (existing pre-existing errors tolerate)
7. **Disclaimer CECCAR Art. 14:** obligatoriu pe orice auto-fix patternat

---

## Open items secundare (low priority)

- ANAF rate limit handling — backoff exponential (folosim resumable-batch existent)
- Mobile responsive resolve cockpit (Pattern blocks responsive deja)
- i18n (RO-only, Anglo amânat)
- Tests E2E Playwright pentru pattern dispatch (vitest unit deja există structural)

---

**Status:** Fazele 0-3 + 3.5 cod-complete, endpoints chain complete, TS clean.
Browser verify cap-coadă cu ANAF sandbox real = pending next session focused testing.
Fazele 4-7 = pending implementation.

**Total LOC adăugate sesiune:** ~5.500 cod + ~2.500 docs strategie.
