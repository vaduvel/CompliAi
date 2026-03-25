import { describe, expect, it } from "vitest"
import { buildDNSCReport, ATTACK_TYPE_LABELS, OPERATIONAL_IMPACT_LABELS } from "./dnsc-report"
import type { Nis2Incident } from "@/lib/server/nis2-store"

function makeIncident(overrides: Partial<Nis2Incident> = {}): Nis2Incident {
  const now = "2026-03-17T10:00:00.000Z"
  return {
    id: "nis2-test123",
    title: "Atac ransomware pe serverul ERP",
    description: "Sistemul ERP a fost criptat parțial.",
    severity: "critical",
    status: "open",
    detectedAtISO: now,
    deadline24hISO: "2026-03-18T10:00:00.000Z",
    deadline72hISO: "2026-03-20T10:00:00.000Z",
    deadlineFinalISO: "2026-04-19T10:00:00.000Z",
    affectedSystems: ["ERP", "backup server"],
    createdAtISO: now,
    updatedAtISO: now,
    ...overrides,
  }
}

describe("buildDNSCReport", () => {
  it("include titlul incidentului în raport", () => {
    const report = buildDNSCReport(makeIncident())
    expect(report).toContain("Atac ransomware pe serverul ERP")
  })

  it("include ID-ul intern al incidentului", () => {
    const report = buildDNSCReport(makeIncident())
    expect(report).toContain("nis2-test123")
  })

  it("include numele organizației când e furnizat", () => {
    const report = buildDNSCReport(makeIncident(), "SC Test SRL")
    expect(report).toContain("SC Test SRL")
  })

  it("include label-ul tipului de atac în română", () => {
    const report = buildDNSCReport(makeIncident({ attackType: "ransomware" }))
    expect(report).toContain("Ransomware")
  })

  it("include label-ul impactului operațional în română", () => {
    const report = buildDNSCReport(makeIncident({ operationalImpact: "partial" }))
    expect(report).toContain("Impact parțial (servicii degradate)")
  })

  it("include vectorul de atac când e specificat", () => {
    const report = buildDNSCReport(makeIncident({ attackVector: "email phishing cu .exe" }))
    expect(report).toContain("email phishing cu .exe")
  })

  it("include sistemele afectate", () => {
    const report = buildDNSCReport(makeIncident())
    expect(report).toContain("ERP")
    expect(report).toContain("backup server")
  })

  it("include măsurile luate când sunt specificate", () => {
    const report = buildDNSCReport(makeIncident({ measuresTaken: "Izolat serverul afectat" }))
    expect(report).toContain("Izolat serverul afectat")
  })

  it("marchează SLA 24h ca DEPĂȘIT când deadline-ul a trecut", () => {
    const pastDeadline = "2020-01-01T00:00:00.000Z"
    const report = buildDNSCReport(makeIncident({
      deadline24hISO: pastDeadline,
      deadline72hISO: pastDeadline,
    }))
    expect(report).toContain("DEPĂȘIT")
  })

  it("marchează SLA ca În termen când deadline-ul e în viitor", () => {
    const futureDeadline = "2099-01-01T00:00:00.000Z"
    const report = buildDNSCReport(makeIncident({
      deadline24hISO: futureDeadline,
      deadline72hISO: futureDeadline,
    }))
    expect(report).toContain("În termen")
  })

  it("include nota legală și adresa DNSC", () => {
    const report = buildDNSCReport(makeIncident())
    expect(report).toContain("incidents@dnsc.ro")
    expect(report).toContain("Notă legală")
  })

  it("funcționează fără câmpuri DNSC opționale (backward compatible)", () => {
    const minimalIncident = makeIncident()
    // fără attackType, attackVector, operationalImpact etc.
    expect(() => buildDNSCReport(minimalIncident)).not.toThrow()
    const report = buildDNSCReport(minimalIncident)
    expect(report).toContain("Nespecificat")
  })

  it("include header NIS2 Art. 23 și DNSC în titlu", () => {
    const report = buildDNSCReport(makeIncident())
    expect(report).toContain("NIS2")
    expect(report).toContain("DNSC")
    expect(report).toContain("Art. 23")
  })
})

describe("ATTACK_TYPE_LABELS", () => {
  it("acoperă toate tipurile de atac definite", () => {
    const expectedTypes = [
      "ransomware", "ddos", "phishing", "supply-chain", "insider",
      "unauthorized-access", "data-breach", "unknown", "other",
    ]
    expectedTypes.forEach((t) => {
      expect(ATTACK_TYPE_LABELS).toHaveProperty(t)
      expect(typeof ATTACK_TYPE_LABELS[t as keyof typeof ATTACK_TYPE_LABELS]).toBe("string")
    })
  })

  it("toate label-urile sunt în română și non-vide", () => {
    Object.values(ATTACK_TYPE_LABELS).forEach((label) => {
      expect(label.length).toBeGreaterThan(3)
    })
  })
})

describe("OPERATIONAL_IMPACT_LABELS", () => {
  it("acoperă none, partial, full", () => {
    expect(OPERATIONAL_IMPACT_LABELS).toHaveProperty("none")
    expect(OPERATIONAL_IMPACT_LABELS).toHaveProperty("partial")
    expect(OPERATIONAL_IMPACT_LABELS).toHaveProperty("full")
  })
})
