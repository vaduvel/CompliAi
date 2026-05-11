import { describe, expect, it } from "vitest"

import {
  buildSnapshot,
  computeDaysUntilDeadline,
  computeUrgency,
  inferPfaCnpScope,
  isCnpFormat,
  PFA_FORM082_DEADLINE_ISO,
  updatePfaStatus,
  upsertPfaClient,
  type PfaClientRecord,
} from "./pfa-form082-tracker"

const NOW = "2026-05-11T10:00:00.000Z"

function makeClient(overrides: Partial<PfaClientRecord> = {}): PfaClientRecord {
  return {
    id: "c1",
    taxId: "RO12345678",
    name: "PFA Test",
    status: "unknown",
    createdAtISO: NOW,
    updatedAtISO: NOW,
    ...overrides,
  }
}

describe("pfa-form082-tracker — deadline + urgency", () => {
  it("computeDaysUntilDeadline calculează corect zilele rămase", () => {
    // 2026-05-11 10:00 → 2026-05-26 23:59:59 ≈ 15.6 zile → ceil = 16
    expect(computeDaysUntilDeadline(NOW)).toBe(16)
  })

  it("computeDaysUntilDeadline e negativ după deadline", () => {
    expect(computeDaysUntilDeadline("2026-06-01T10:00:00.000Z")).toBeLessThan(0)
  })

  it("urgency critical când deadline ≤3 zile și există neînregistrați", () => {
    expect(computeUrgency(3, 1, 10)).toBe("critical")
    expect(computeUrgency(2, 5, 10)).toBe("critical")
  })

  it("urgency passed după deadline", () => {
    expect(computeUrgency(-1, 5, 10)).toBe("passed")
  })

  it("urgency low când toți sunt registered", () => {
    expect(computeUrgency(15, 0, 10)).toBe("low")
  })

  it("urgency high pentru >50% neînregistrați chiar și fără presiune deadline", () => {
    expect(computeUrgency(30, 6, 10)).toBe("high")
  })
})

describe("pfa-form082-tracker — CNP detection", () => {
  it("detectează CNP valid (13 cifre, prefix 1-6)", () => {
    expect(isCnpFormat("1980101080011")).toBe(true)
    expect(isCnpFormat("2900215080023")).toBe(true)
    expect(isCnpFormat("5980101080011")).toBe(true)
  })

  it("respinge CNP cu prefix invalid", () => {
    expect(isCnpFormat("9980101080011")).toBe(false)
    expect(isCnpFormat("0980101080011")).toBe(false)
  })

  it("respinge non-CNP", () => {
    expect(isCnpFormat("RO12345678")).toBe(false)
    expect(isCnpFormat("12345678")).toBe(false)
  })

  it("inferPfaCnpScope returnează cnp pentru CNP, cif_company pentru CIF", () => {
    expect(inferPfaCnpScope("1980101080011")).toBe("cnp")
    expect(inferPfaCnpScope("RO12345678")).toBe("cif_company")
    expect(inferPfaCnpScope("xyz")).toBe("unknown")
  })
})

describe("pfa-form082-tracker — snapshot aggregation", () => {
  it("agregă counter-ele corect pe statusuri", () => {
    const clients = [
      makeClient({ id: "1", status: "registered" }),
      makeClient({ id: "2", status: "registered" }),
      makeClient({ id: "3", status: "form_submitted" }),
      makeClient({ id: "4", status: "not_registered" }),
      makeClient({ id: "5", status: "unknown" }),
      makeClient({ id: "6", status: "exempt" }),
    ]
    const snap = buildSnapshot(clients, NOW)
    expect(snap.totalClients).toBe(6)
    expect(snap.registered).toBe(2)
    expect(snap.formSubmitted).toBe(1)
    expect(snap.notRegistered).toBe(1)
    expect(snap.unknown).toBe(1)
    expect(snap.exempt).toBe(1)
    expect(snap.atRiskClients).toHaveLength(3) // not_registered + unknown + form_submitted
  })

  it("snapshot gol pentru portofoliu gol", () => {
    const snap = buildSnapshot([], NOW)
    expect(snap.totalClients).toBe(0)
    expect(snap.urgency).toBe("low")
  })
})

describe("pfa-form082-tracker — state mutations", () => {
  it("upsertPfaClient adaugă client nou", () => {
    const existing: PfaClientRecord[] = []
    const added = makeClient({ id: "new" })
    const result = upsertPfaClient(existing, added)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(added)
  })

  it("upsertPfaClient înlocuiește client existent (same id)", () => {
    const existing = [makeClient({ id: "x", name: "Vechi" })]
    const updated = makeClient({ id: "x", name: "Nou" })
    const result = upsertPfaClient(existing, updated)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Nou")
  })

  it("updatePfaStatus actualizează status + setează form082SubmittedAtISO", () => {
    const existing = [makeClient({ id: "x", status: "not_registered" })]
    const result = updatePfaStatus(existing, "x", "form_submitted", "2026-05-15T10:00:00.000Z")
    expect(result[0].status).toBe("form_submitted")
    expect(result[0].form082SubmittedAtISO).toBe("2026-05-15T10:00:00.000Z")
  })

  it("updatePfaStatus setează confirmationAtISO la status=registered", () => {
    const existing = [makeClient({ id: "x", status: "form_submitted" })]
    const result = updatePfaStatus(existing, "x", "registered", "2026-05-20T10:00:00.000Z")
    expect(result[0].confirmationAtISO).toBe("2026-05-20T10:00:00.000Z")
  })

  it("updatePfaStatus nu afectează alți clienți", () => {
    const existing = [
      makeClient({ id: "a", status: "registered" }),
      makeClient({ id: "b", status: "not_registered" }),
    ]
    const result = updatePfaStatus(existing, "b", "registered", NOW)
    expect(result[0].status).toBe("registered")
    expect(result[1].status).toBe("registered")
  })
})

describe("pfa-form082-tracker — constants", () => {
  it("PFA_FORM082_DEADLINE_ISO este 26 mai 2026", () => {
    expect(PFA_FORM082_DEADLINE_ISO).toBe("2026-05-26T23:59:59.000Z")
  })
})
