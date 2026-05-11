import { describe, expect, it } from "vitest"

import {
  ALERT_TRIGGER_DAYS,
  buildSnapshot,
  computeStatus,
  daysUntilExpiry,
  deleteCertRecord,
  isAlertableToday,
  recomputeStatus,
  shouldSendAlert,
  upsertCertRecord,
  type CertSpvRecord,
  type CertSpvStatus,
} from "./cert-spv-tracker"

const NOW = "2026-05-11T10:00:00.000Z"

function makeRecord(over: Partial<CertSpvRecord> = {}): CertSpvRecord {
  return {
    id: "c1",
    clientCif: "RO12345678",
    clientName: "Test SRL",
    certSerial: "ABC123DEF",
    ownerName: "Ion Popescu",
    validFromISO: "2026-01-01T00:00:00.000Z",
    validUntilISO: "2027-01-01T00:00:00.000Z",
    status: "active" as CertSpvStatus,
    createdAtISO: NOW,
    updatedAtISO: NOW,
    ...over,
  }
}

describe("cert-spv-tracker — daysUntilExpiry", () => {
  it("calculează zile rămase corect", () => {
    // 2026-05-11 → 2026-05-21 = 10 zile
    expect(daysUntilExpiry("2026-05-21T10:00:00.000Z", NOW)).toBe(10)
  })

  it("returnează negativ dacă a expirat", () => {
    expect(daysUntilExpiry("2026-05-01T00:00:00.000Z", NOW)).toBeLessThan(0)
  })
})

describe("cert-spv-tracker — computeStatus", () => {
  it("active când >30 zile + SPV ok", () => {
    const r = makeRecord({ validUntilISO: "2026-12-31T00:00:00.000Z", lastSpvVerifiedOk: true })
    expect(computeStatus(r, NOW)).toBe("active")
  })

  it("expiring_soon când 8-30 zile", () => {
    const r = makeRecord({ validUntilISO: "2026-05-25T00:00:00.000Z" })
    expect(computeStatus(r, NOW)).toBe("expiring_soon")
  })

  it("expiring_critical când ≤7 zile", () => {
    const r = makeRecord({ validUntilISO: "2026-05-15T00:00:00.000Z" })
    expect(computeStatus(r, NOW)).toBe("expiring_critical")
  })

  it("expired când <0 zile", () => {
    const r = makeRecord({ validUntilISO: "2026-05-01T00:00:00.000Z" })
    expect(computeStatus(r, NOW)).toBe("expired")
  })

  it("renewed_pending: cert reînnoit ≤14 zile dar SPV nu confirmă încă", () => {
    const r = makeRecord({
      validUntilISO: "2026-12-31T00:00:00.000Z",
      lastSpvEnrollmentISO: "2026-05-05T00:00:00.000Z", // 6 zile în urmă
      lastSpvVerifiedOk: false,
    })
    expect(computeStatus(r, NOW)).toBe("renewed_pending")
  })

  it("unauthorized când SPV verified ok = false și NU e în grace period", () => {
    const r = makeRecord({
      validUntilISO: "2026-12-31T00:00:00.000Z",
      lastSpvEnrollmentISO: "2026-03-01T00:00:00.000Z", // 70+ zile
      lastSpvVerifiedOk: false,
    })
    expect(computeStatus(r, NOW)).toBe("unauthorized")
  })
})

describe("cert-spv-tracker — buildSnapshot", () => {
  it("agregă count + atRiskRecords sortate cu expired primul", () => {
    const records: CertSpvRecord[] = [
      recomputeStatus(makeRecord({ id: "1", validUntilISO: "2027-01-01T00:00:00.000Z" }), NOW), // active
      recomputeStatus(makeRecord({ id: "2", validUntilISO: "2026-05-15T00:00:00.000Z" }), NOW), // critical
      recomputeStatus(makeRecord({ id: "3", validUntilISO: "2026-04-01T00:00:00.000Z" }), NOW), // expired
      recomputeStatus(makeRecord({ id: "4", validUntilISO: "2026-05-25T00:00:00.000Z" }), NOW), // soon
    ]
    const snap = buildSnapshot(records)
    expect(snap.total).toBe(4)
    expect(snap.active).toBe(1)
    expect(snap.expired).toBe(1)
    expect(snap.expiringCritical).toBe(1)
    expect(snap.expiringSoon).toBe(1)
    expect(snap.atRiskRecords).toHaveLength(3) // expired + critical + soon
    expect(snap.atRiskRecords[0].status).toBe("expired") // sortat primul
  })
})

describe("cert-spv-tracker — alert triggers", () => {
  it("ALERT_TRIGGER_DAYS conține 30, 14, 7, 3, 1, 0", () => {
    expect(ALERT_TRIGGER_DAYS).toEqual([30, 14, 7, 3, 1, 0])
  })

  it("shouldSendAlert true pentru zile trigger", () => {
    expect(shouldSendAlert(30)).toBe(true)
    expect(shouldSendAlert(7)).toBe(true)
    expect(shouldSendAlert(0)).toBe(true)
    expect(shouldSendAlert(8)).toBe(false)
    expect(shouldSendAlert(15)).toBe(false)
  })

  it("isAlertableToday true în zilele lucrătoare", () => {
    // 2026-05-11 = Luni
    expect(isAlertableToday("2026-05-11T10:00:00.000Z")).toBe(true)
    // 2026-05-09 = Sâmbătă
    expect(isAlertableToday("2026-05-09T10:00:00.000Z")).toBe(false)
    // 2026-05-01 = sărbătoare (Ziua Muncii)
    expect(isAlertableToday("2026-05-01T10:00:00.000Z")).toBe(false)
  })
})

describe("cert-spv-tracker — state mutations", () => {
  it("upsertCertRecord adaugă nou", () => {
    const result = upsertCertRecord([], makeRecord())
    expect(result).toHaveLength(1)
  })

  it("upsertCertRecord înlocuiește existing same id", () => {
    const existing = [makeRecord({ id: "x", clientName: "Vechi" })]
    const result = upsertCertRecord(existing, makeRecord({ id: "x", clientName: "Nou" }))
    expect(result).toHaveLength(1)
    expect(result[0].clientName).toBe("Nou")
  })

  it("deleteCertRecord șterge by id", () => {
    const existing = [makeRecord({ id: "a" }), makeRecord({ id: "b" })]
    const result = deleteCertRecord(existing, "a")
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("b")
  })
})
