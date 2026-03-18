# Audit CompliAI — Bug Log & Gaps
**Data audit:** 2026-03-18
**Auditor:** Claude (audit automat + manual)
**Scope:** Tot codul implementat V1→V3 — API routes, lib/, components/

---

## Stare curentă
- TypeScript: ✅ 0 erori
- Vitest: ✅ 463 passed, 1 skipped (93 fișiere test)
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

## CHANGELOG

| Data | Fix | Status |
|------|-----|--------|
| 2026-03-18 | BUG-001: POST /api/ai-systems + requireRole(WRITE_ROLES) | ✅ |
| 2026-03-18 | BUG-002: DELETE /api/ai-systems + throw non-AuthzError | ✅ |
| 2026-03-18 | BUG-003: Teste health-check, inspector, shadow-ai routes | ✅ |
| 2026-03-18 | BUG-004: ai-systems test + RBAC mock + viewer blocked test | ✅ |
