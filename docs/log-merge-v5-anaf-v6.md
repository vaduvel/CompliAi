# Merge Log: V5 + ANAF Signals → V6

Data: 2026-03-18

## Ce s-a făcut

### Step 1: ANAF → Release (fast-forward)
- `feat/anaf-signals-phase-a` → `feat/v4-p0-audit-fixes`
- Fast-forward, zero conflicte
- Push: `29aaeab`

### Step 2: Release → V6 (merge cu 1 conflict)
- `feat/v4-p0-audit-fixes` → `feat/v6-agentic-engine-wip`
- 1 conflict: `components/compliscan/navigation.ts`
  - V5 adăuga `vendor-review`, V6 adăuga `agents`
  - Rezolvat: ambele entries păstrate

### Step 3: Cleanup degradare grațioasă
Acum că V5 e prezent pe V6, am eliminat hack-urile:

1. **agent-orchestrator.ts**
   - Eliminat `safeListReviews()` cu `@ts-expect-error` + dynamic import + try/catch
   - Înlocuit cu import direct: `import { listReviews } from "@/lib/server/vendor-review-store"`
   - Eliminat cast-uri de tip pe vendorReviews

2. **agent-compliance-monitor.ts**
   - Eliminat inline `VendorReview` type + `isReviewOverdue()` function
   - Înlocuit cu import canonical: `import { isReviewOverdue, type VendorReview } from "@/lib/compliance/vendor-review-engine"`

3. **response-pack test**
   - Actualizat mock-uri: `safeListReviews` → `listReviews` + `safeListReviews` (ambele exportate)
   - Adăugat mock-uri pentru modulele ANAF (efactura-signal-hardening, filing-discipline)

### Validare
- TypeScript: 0 erori
- Build: clean
- Tests: 572 passed (106 test files), 1 skipped
- Commit: `598731c`

## Starea curentă a branch-urilor

| Branch | Conține | Status |
|--------|---------|--------|
| `feat/v4-p0-audit-fixes` | V4 + V5 + ANAF A-D | Release-safe, pushed |
| `feat/v6-agentic-engine-wip` | V4 + V5 + ANAF A-D + V6 Agents (5/5) | Unified, pushed |
| `feat/anaf-signals-phase-a` | ANAF A-D (subset of release) | Poate fi șters |

## Ce urmează
- Wire V6 agents to use rail modules D1/D2/D3 (import + call)
- Test manual cu date reale (vendor reviews + ANAF signals)
- Eventual: merge V6 → main când e stabil
