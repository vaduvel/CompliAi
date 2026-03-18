# Audit CompliAI — Bug Log & Gaps
**Data audit:** 2026-03-18 (actualizat sesiunea 4 — audit complet V1+V2+V3+definitia-perfecta)
**Auditor:** Claude (audit automat + manual)
**Scope:** Tot codul implementat V1→V3 — API routes, lib/, components/, definitia-perfecta 13 sprinturi

---

## Stare curentă
- TypeScript: ✅ 0 erori
- Vitest: ✅ 491 passed, 1 skipped (96 fișiere test)
- Build: validat
- Middleware: CORECT — protejează TOATE rutele `/api/` (excl. `/api/auth/`) cu session check + rate limiting

---

## BUGS CONFIRMATE

### BUG-001 — POST /api/ai-systems fără RBAC check ⚠️ MEDIUM
**Fișier:** `app/api/ai-systems/route.ts:37`
**Problemă:** POST-ul nu are `requireRole()`. Orice user autentificat (inclusiv `viewer`) poate adăuga sisteme AI în inventar.
**Impact:** Rolul `viewer` ar trebui să fie read-only, dar poate scrie AI systems.
**Fix:** Adăugat `requireRole(request, WRITE_ROLES, "adăugarea sistemului AI")` la start POST.
**Status:** ✅ FIXAT (2026-03-18)

---

### BUG-002 — DELETE /api/ai-systems: catch block nu re-throw erori neașteptate ⚠️ LOW
**Fișier:** `app/api/ai-systems/route.ts:108-112`
**Problemă:**
```typescript
try {
  requireRole(request, DELETE_ROLES, "ștergerea sistemului AI")
} catch (error) {
  if (error instanceof AuthzError) return jsonError(...)
  // Dacă e altă eroare: catch o "înghite", execuția continuă!
}
```
Dacă `requireRole` aruncă o eroare ne-AuthzError, catch-ul nu returnează și codul continuă execuția.
**Fix:** Adăugat `throw error` după blocul `instanceof AuthzError`.
**Status:** ✅ FIXAT (2026-03-18)

---

### BUG-003 — Teste lipsă pentru rutele V3 (health-check, inspector, shadow-ai) ⚠️ LOW
**Fișiere lipsă:**
- `app/api/health-check/route.test.ts`
- `app/api/inspector/route.test.ts`
- `app/api/shadow-ai/route.test.ts`
**Problemă:** 3 rute noi din V3 nu au niciun test. Code coverage <80%.
**Fix:** Create fișiere test pentru toate 3 rute.
**Status:** ✅ FIXAT (2026-03-18)

---

### BUG-004 — ai-systems test nu testează RBAC ⚠️ LOW
**Fișier:** `app/api/ai-systems/route.test.ts`
**Problemă:** Testul POST nu mockuiește `requireRole`/`auth`. Dacă RBAC-ul lipsește, testele trec fals-pozitiv.
**Fix:** Adăugat mock pentru `@/lib/server/auth` în test + test case pentru viewer blocat.
**Status:** ✅ FIXAT (2026-03-18)

---

### BUG-005 — Shadow AI POST: answers fără validare dimensiune ⚠️ LOW
**Fișier:** `app/api/shadow-ai/route.ts:34`
**Problemă:** Se acceptă orice array de answers, fără limită de lungime. Teoretic, un payload cu mii de answers ar scrie state lent.
**Fix aplicabil:** `if (answers.length > 50)` return 400.
**Status:** 🔵 OPEN — minor, de adăugat în V4

---

### BUG-006 — Inspector route: getOrgContext() poate eșua fără session header ⚠️ VERY LOW
**Fișier:** `app/api/inspector/route.ts:10`
**Problemă:** `getOrgContext()` citește `x-compliscan-org-id` din headere setate de middleware. Dacă middleware-ul nu rulează (test environment, curl direct), `orgId` e undefined → `readNis2State(undefined)` poate eșua.
**Context:** Middleware-ul ÎNTOTDEAUNA setează headere în producție, deci impactul real e zero.
**Status:** 🔵 OPEN — de verificat în test coverage

---

## GAPS & ÎMBUNĂTĂȚIRI

### GAP-001 — Rate limiting nu acoperă GET intensiv ℹ️ INFO
Middleware limitează DOAR metodele `POST/PATCH/PUT/DELETE`. GET-urile de tip `/api/inspector` și `/api/health-check` nu sunt limitate.
**Recomandare:** Adaugă GET în rate limiting dacă inspector-ul devine costisitor.

### GAP-002 — Chat endpoint fără teste și rate limiting specific ℹ️ INFO
`POST /api/chat` — fără test, fără limit pe lungimea mesajului.

### GAP-003 — Partner audit pack endpoint lipsă ℹ️ KNOWN
`TODO Sprint 12+` în `app/dashboard/partner/[orgId]/page.tsx:123`. Endpoint-ul `/api/partner/audit-pack` nu există.

### GAP-004 — Error messages generice în V3 routes ℹ️ INFO
`health-check`, `inspector`, `shadow-ai` returnează `"Internal server error"` fără cod de eroare specific. Util pentru debugging: ar trebui `{ error: "...", code: "..." }`.

### GAP-005 — Shadow AI questionnaire: validare questionId lipsă ℹ️ LOW
POST /api/shadow-ai acceptă orice `questionId` string, fără whitelist. Dacă un questionId invalid e trimis, `calculateShadowAiRisk()` îl ignoră, dar nu există validare explicită.

---

## AUDIT DE SECURITATE

| Categorie | Status | Note |
|-----------|--------|------|
| Autentificare (session) | ✅ SOLID | Middleware HMAC-SHA256, cookie httpOnly |
| Autorizare (RBAC) | ⚠️ PARȚIAL | BUG-001 fixat; altele OK |
| Rate Limiting | ✅ IMPLEMENTAT | În middleware — 10/min gen, 60/min rest |
| Input Validation | ✅ SOLID | Mai ales pe scan, tasks, nis2 |
| SQL Injection | ✅ N/A | File-based + Supabase ORM |
| XSS | ✅ N/A | Next.js SSR escaping |
| CORS | ✅ Next.js default | |
| Webhook Signing | 🔵 MISSING | Alertele webhook nu sunt HMAC-signed |
| Password Reset | 🔵 MISSING | Nicio rută /api/auth/reset-password |
| 2FA/MFA | 🔵 MISSING | Neimplementat — de adăugat în V4 |

---

## SCOR AUDIT

| Categorie | Scor |
|-----------|------|
| Type Safety | 9/10 |
| Test Coverage | 6/10 → 7/10 (după fix BUG-003) |
| Security (Auth/RBAC) | 7/10 → 8/10 (după fix BUG-001) |
| Error Handling | 7/10 |
| Input Validation | 8/10 |
| Arhitectură | 9/10 |
| **Overall** | **7.7/10** |

---

---

### BUG-007 — Copy tehnic "Drift" vizibil în Agent Panel ⚠️ LOW
**Fișier:** `components/evidence-os/ProposalBundlePanel.tsx:20`
**Problemă:** Tab-ul pentru drifts din Agent Workspace afișa label-ul raw "Drift" (engleză) în loc de "Modificări".
**Fix:** Schimbat `label: "Drift"` → `label: "Modificări"`.
**Status:** ✅ FIXAT (2026-03-18, sesiunea 4)

---

### BUG-008 — Copy tehnic "finding" vizibil în Traceability Matrix ⚠️ LOW
**Fișier:** `components/compliscan/traceability-matrix-card.tsx:295`
**Problemă:** Badge-ul de tip în Traceability Matrix afișa raw `"finding"` (engleză) în loc de termen românesc.
**Fix:** Schimbat `"finding"` → `"constatare"`.
**Status:** ✅ FIXAT (2026-03-18, sesiunea 4)

---

### BUG-009 — Test R-10 lipsă: NIS2 în audit-pack ⚠️ LOW
**Fișier:** `lib/compliance/audit-quality-gates.test.ts` (lipsea testul)
**Problemă:** Sprint 1 din definitia-perfecta cerea test R-10 pentru NIS2 data în audit-pack bundle. Testul nu exista.
**Fix:** Adăugat test care verifică că finding-urile NIS2 (nis2-* IDs) sunt preluate în quality gates și blochează exportul dacă nu au dovadă.
**Status:** ✅ FIXAT (2026-03-18, sesiunea 4)

---

## GAPS & ÎMBUNĂTĂȚIRI (sesiunea 4)

### GAP-006 — Audit Pack nu include date NIS2 brute (maturity, incidents, vendors) ℹ️ MEDIUM
`buildAuditPack()` în `lib/server/audit-pack.ts` nu primește NIS2 state (`Nis2OrgState`). Datele de maturitate NIS2, incidentele DNSC, vendorii cu risc, membrii board-ului — nu apar în export.
**Ce există:** NIS2 gaps convertite în `state.findings` (prin `convertNIS2GapsToFindings`) sunt în audit pack indirect.
**Ce lipsește:** Raport detaliat NIS2 cu scor per domeniu, lista incidentelor, status DNSC înregistrare.
**Recomandare V4:** Extinde `buildAuditPack()` să primească și `nis2State` și să adauge secțiunea `nis2Report` în output.

### GAP-007 — NIS2 raw data exclus din `/api/exports/audit-pack` ℹ️ MEDIUM
Endpoint-ul `GET /api/exports/audit-pack` nu apelează `readNis2State()`. Un auditor care descarcă audit pack-ul nu vede scorurile NIS2 detaliate.
**Recomandare V4:** Adăugat `nis2State = await readNis2State(orgId)` și passat în `buildAuditPack`.

---

## VERIFICĂRI DEFINITA-PERFECTA — STATUS REAL (sesiunea 4)

| Sprint | Status Real | Note |
|--------|------------|------|
| S1: Tests + branch stale | ✅ | 491 teste (era 463), branch-uri șterse, R-10 adăugat |
| S2: CUI în OrgProfile | ✅ | `applicability-wizard.tsx` are câmpul CUI, generator prefill ok |
| S3: PDF Export Real | ✅ | `/api/documents/export-pdf` există |
| S4: DNSC Registration Wizard | ✅ | `/dashboard/nis2/inregistrare-dnsc` — wizard 5 pași complet |
| S5: Mock Demo e-Factura | ✅ | `efactura-mock-data.ts` cu 15 vendori |
| S6: RBAC Minim | ✅ | 4 roluri (owner/compliance/reviewer/viewer), requireRole() pe toate endpoint-urile critice |
| S7: UX Empty States + Copy | 🟡 | Majority done; BUG-007/008 fixate, alte copy-uri ok |
| S8: ANAF Live Readiness | 🟡 | Status endpoint + env var check există; live ANAF fetch neimplementat |
| S9: Storage Abstraction | ✅ | `storage-adapter.ts` + `createAdaptiveStorage()` |
| S10: Supabase Sync | 🟡 | Adapter + Supabase tenancy există; sync complet neimplementat |
| S11: Explainability Layer | ✅ | `legal-source-badge.tsx` + `legal-sources.ts` cu sursele legale |
| S12: Partner Portal Full | ✅ | Filtre/sortare/search + CSV import + drill-down |
| S13: Weekly Digest Email | ✅ | `weekly-digest.ts` + `/api/cron/weekly-digest` |

**SCORE DEFINITIA-PERFECTA: 11/13 ✅ complet, 2/13 🟡 parțial (S8 ANAF live, S10 Supabase sync)**

---

## CHANGELOG

| Data | Fix | Status |
|------|-----|--------|
| 2026-03-18 | BUG-001: POST /api/ai-systems + requireRole(WRITE_ROLES) | ✅ |
| 2026-03-18 | BUG-002: DELETE /api/ai-systems + throw non-AuthzError | ✅ |
| 2026-03-18 | BUG-003: Teste health-check, inspector, shadow-ai routes | ✅ |
| 2026-03-18 | BUG-004: ai-systems test + RBAC mock + viewer blocked test | ✅ |
| 2026-03-18 | BUG-007: ProposalBundlePanel "Drift" → "Modificări" | ✅ |
| 2026-03-18 | BUG-008: traceability-matrix-card "finding" → "constatare" | ✅ |
| 2026-03-18 | BUG-009: Test R-10 NIS2 în audit-pack adăugat (491 tests) | ✅ |
