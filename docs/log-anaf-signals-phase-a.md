# ANAF Signals Phase A — Sprint Log

Branch: `feat/anaf-signals-phase-a`
Baza: `feat/v4-p0-audit-fixes` (release stabil)
Data start: 2026-03-18

---

## Scope Phase A (P0 fiscal)

### A1. e-Factura Signal Hardening
- [x] Vendor repeated rejection tracking (vendorRejectionHistory)
- [x] Pending-too-long rule (>48h → finding)
- [x] Urgency score per signal (0-100)
- [x] Reopen-until-confirmed logic
- [x] Extend health-check cu secțiune fiscală

### A2. Notification Inbox Foundation
- [x] Tip ANAF notification cu due date + owner + status lifecycle
- [x] Status: primit → analiză → răspuns trimis → overdue
- [x] Extend notifications-store cu câmpuri noi
- [x] CRUD lifecycle: createAnafNotification, updateAnafNotificationStatus, listAnafNotifications, listOverdueAnafNotifications

### A3. Sector Risk Mode
- [x] ANAF targeted sectors list (retail, manufacturing, professional-services = high; digital-infrastructure, transport, energy = elevated)
- [x] Vigilance level pe org profile (normal/elevated/high)
- [x] Severity boost pe findings din sectoare țintite
- [x] Dashboard vigilance strip data helper

---

## Implementare

### Session 1 — 2026-03-18

#### A1: e-Factura Signal Hardening — DONE
- Fișier nou: `lib/compliance/efactura-signal-hardening.ts` (~270 linii)
  - `computeSignalUrgency()` — scor 0-100 bazat pe: status, sumă, vendor tech, vârstă, respingeri repetate
  - `computeBatchUrgency()` — batch urgency scoring
  - `buildVendorRejectionHistory()` — tracking respingeri per vendor
  - `detectRepeatedRejectionFindings()` — findings pentru vendori cu ≥2 respingeri
  - `detectPendingTooLong()` — findings pentru facturi blocate >48h
  - `checkReopenSignals()` — reopen logic (finding rămâne deschis până la confirmare ANAF)
  - `buildFiscalSummary()` — sumar agregat cu fiscalHealthLabel
- Extins: `lib/compliance/health-check.ts`
  - Secțiune nouă #7: "Fiscal signals health" — integrează buildFiscalSummary

#### A2: Notification Inbox Foundation — DONE
- Extins: `lib/server/notifications-store.ts`
  - 3 tipuri noi: `anaf_signal`, `anaf_deadline`, `fiscal_alert`
  - Tip `AnafNotificationStatus`: primit → in_analiza → raspuns_trimis → overdue → inchis
  - Câmpuri noi pe AppNotification: dueAtISO, ownerId, anafStatus, anafStatusUpdatedAtISO, sourceSignalId
  - Funcții noi: `createAnafNotification()`, `updateAnafNotificationStatus()`, `listAnafNotifications()`, `listOverdueAnafNotifications()`

#### A3: Sector Risk Mode — DONE
- Fișier nou: `lib/compliance/sector-risk.ts` (~150 linii)
  - `evaluateSectorRisk()` — determină vigilance level per sector
  - `boostFiscalSeverity()` — bump severity pe findings fiscale din sectoare țintite
  - `getVigilanceStrip()` — date pentru dashboard vigilance strip
  - Constante: ANAF_HIGH_VIGILANCE_SECTORS, ANAF_ELEVATED_VIGILANCE_SECTORS
  - Labels + colors per vigilance level

#### Validare
- tsc: 0 errors
- next build: clean
- Branch: nu atinge release-ul sau V6

#### Fișiere modificate/create
| Fișier | Tip | Linii |
|--------|-----|-------|
| `lib/compliance/efactura-signal-hardening.ts` | NOU | ~270 |
| `lib/compliance/sector-risk.ts` | NOU | ~150 |
| `lib/compliance/health-check.ts` | MODIFICAT | +30 (secțiune fiscală) |
| `lib/server/notifications-store.ts` | MODIFICAT | +80 (ANAF lifecycle) |
| `docs/log-anaf-signals-phase-a.md` | NOU | log |
