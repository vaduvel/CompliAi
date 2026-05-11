import { describe, expect, it } from "vitest"
import {
  applyCheckResult,
  createCertRenewalGraceAction,
  createCuiDesyncAction,
  getDueChecks,
  summarize,
} from "./anaf-pending-actions"

const NOW = "2026-05-11T10:00:00.000Z"

describe("anaf-pending-actions — constructors", () => {
  it("creează acțiune CUI desync cu nextCheck la +6h", () => {
    const a = createCuiDesyncAction({ cif: "RO123", companyName: "X SRL", nowISO: NOW })
    expect(a.type).toBe("cui_desync")
    expect(a.attemptCount).toBe(0)
    expect(a.status).toBe("pending")
    // +6h
    expect(new Date(a.nextCheckAtISO).getTime() - new Date(NOW).getTime()).toBe(6 * 3_600_000)
  })

  it("creează acțiune cert renewal cu nextCheck la +12h", () => {
    const a = createCertRenewalGraceAction({
      certFingerprint: "abc123def456",
      ownerEmail: "test@x.ro",
      nowISO: NOW,
    })
    expect(a.type).toBe("cert_renewal_grace")
    expect(new Date(a.nextCheckAtISO).getTime() - new Date(NOW).getTime()).toBe(12 * 3_600_000)
  })
})

describe("anaf-pending-actions — applyCheckResult", () => {
  it("success → status resolved + resolvedAtISO", () => {
    const a = createCuiDesyncAction({ cif: "RO1", nowISO: NOW })
    const r = applyCheckResult(a, { success: true, nowISO: "2026-05-11T16:00:00.000Z" })
    expect(r.status).toBe("resolved")
    expect(r.resolvedAtISO).toBe("2026-05-11T16:00:00.000Z")
  })

  it("failure → attemptCount++, status pending, nextCheck conform backoff", () => {
    const a = createCuiDesyncAction({ cif: "RO1", nowISO: NOW })
    const r = applyCheckResult(a, { success: false, reason: "Still not in registry", nowISO: "2026-05-11T16:00:00.000Z" })
    expect(r.status).toBe("pending")
    expect(r.attemptCount).toBe(1)
    expect(r.lastReason).toBe("Still not in registry")
    // backoff[1] = 12h
    expect(new Date(r.nextCheckAtISO).getTime() - new Date("2026-05-11T16:00:00.000Z").getTime()).toBe(12 * 3_600_000)
  })

  it("max attempts reached → status expired_unresolved", () => {
    let a = createCuiDesyncAction({ cif: "RO1", nowISO: NOW })
    // 5 failures (CUI_BACKOFF_HOURS.length = 5)
    for (let i = 0; i < 5; i++) {
      a = applyCheckResult(a, { success: false, reason: "still desync", nowISO: NOW })
    }
    expect(a.status).toBe("expired_unresolved")
    expect(a.attemptCount).toBe(5)
  })
})

describe("anaf-pending-actions — getDueChecks", () => {
  it("returnează doar acțiuni pending cu nextCheckAtISO ≤ now", () => {
    const past = createCuiDesyncAction({ cif: "RO1", nowISO: "2026-05-10T00:00:00.000Z" })
    const future = createCuiDesyncAction({ cif: "RO2", nowISO: NOW })
    const resolved = { ...createCuiDesyncAction({ cif: "RO3", nowISO: "2026-05-10T00:00:00.000Z" }), status: "resolved" as const }
    const due = getDueChecks([past, future, resolved], NOW)
    expect(due.map((d) => d.resourceId)).toEqual(["RO1"])
  })
})

describe("anaf-pending-actions — summarize", () => {
  it("agregă count + breakdown by type", () => {
    const a1 = createCuiDesyncAction({ cif: "RO1", nowISO: NOW })
    const a2 = applyCheckResult(createCuiDesyncAction({ cif: "RO2", nowISO: NOW }), {
      success: true,
      nowISO: NOW,
    })
    const a3 = createCertRenewalGraceAction({ certFingerprint: "abc", nowISO: NOW })
    const s = summarize([a1, a2, a3])
    expect(s.total).toBe(3)
    expect(s.pending).toBe(2)
    expect(s.resolved).toBe(1)
    expect(s.byType.cui_desync).toBe(2)
    expect(s.byType.cert_renewal_grace).toBe(1)
  })
})
