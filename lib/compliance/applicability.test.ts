import { describe, expect, it } from "vitest"
import {
  evaluateApplicability,
  type OrgProfile,
} from "./applicability"

function makeProfile(overrides: Partial<OrgProfile> = {}): OrgProfile {
  return {
    sector: "other",
    employeeCount: "10-49",
    usesAITools: false,
    requiresEfactura: false,
    completedAtISO: "2026-03-17T00:00:00.000Z",
    ...overrides,
  }
}

describe("evaluateApplicability", () => {
  it("GDPR este întotdeauna cert, indiferent de profil", () => {
    const result = evaluateApplicability(makeProfile())
    const gdpr = result.entries.find((e) => e.tag === "gdpr")
    expect(gdpr?.certainty).toBe("certain")
    expect(result.tags).toContain("gdpr")
  })

  it("e-Factura certain când requiresEfactura=true", () => {
    const result = evaluateApplicability(makeProfile({ requiresEfactura: true }))
    const ef = result.entries.find((e) => e.tag === "efactura")
    expect(ef?.certainty).toBe("certain")
    expect(result.tags).toContain("efactura")
  })

  it("e-Factura unlikely când requiresEfactura=false", () => {
    const result = evaluateApplicability(makeProfile({ requiresEfactura: false }))
    const ef = result.entries.find((e) => e.tag === "efactura")
    expect(ef?.certainty).toBe("unlikely")
    expect(result.tags).not.toContain("efactura")
  })

  it("NIS2 certain pentru sector esential (energy)", () => {
    const result = evaluateApplicability(makeProfile({ sector: "energy", employeeCount: "1-9" }))
    const nis2 = result.entries.find((e) => e.tag === "nis2")
    expect(nis2?.certainty).toBe("certain")
    expect(result.tags).toContain("nis2")
  })

  it("NIS2 certain pentru sector esential (health)", () => {
    const result = evaluateApplicability(makeProfile({ sector: "health" }))
    const nis2 = result.entries.find((e) => e.tag === "nis2")
    expect(nis2?.certainty).toBe("certain")
  })

  it("NIS2 probable pentru sector important cu ≥50 angajați", () => {
    const result = evaluateApplicability(makeProfile({ sector: "finance", employeeCount: "50-249" }))
    const nis2 = result.entries.find((e) => e.tag === "nis2")
    expect(nis2?.certainty).toBe("probable")
    expect(result.tags).toContain("nis2")
  })

  it("NIS2 probable pentru orice sector cu 250+ angajați", () => {
    const result = evaluateApplicability(makeProfile({ sector: "retail", employeeCount: "250+" }))
    const nis2 = result.entries.find((e) => e.tag === "nis2")
    expect(nis2?.certainty).toBe("probable")
  })

  it("NIS2 unlikely pentru IMM mic din sector nerelevant", () => {
    const result = evaluateApplicability(makeProfile({ sector: "other", employeeCount: "1-9" }))
    const nis2 = result.entries.find((e) => e.tag === "nis2")
    expect(nis2?.certainty).toBe("unlikely")
    expect(result.tags).not.toContain("nis2")
  })

  it("AI Act probable când usesAITools=true", () => {
    const result = evaluateApplicability(makeProfile({ usesAITools: true }))
    const ai = result.entries.find((e) => e.tag === "ai-act")
    expect(ai?.certainty).toBe("probable")
    expect(result.tags).toContain("ai-act")
  })

  it("AI Act unlikely când usesAITools=false", () => {
    const result = evaluateApplicability(makeProfile({ usesAITools: false }))
    const ai = result.entries.find((e) => e.tag === "ai-act")
    expect(ai?.certainty).toBe("unlikely")
    expect(result.tags).not.toContain("ai-act")
  })

  it("tags conțin doar certain + probable, nu unlikely", () => {
    const result = evaluateApplicability(makeProfile({
      sector: "other",
      employeeCount: "1-9",
      usesAITools: false,
      requiresEfactura: false,
    }))
    // Only GDPR is certain/probable for a micro retail with no AI and no efactura
    expect(result.tags).toEqual(["gdpr"])
    expect(result.entries).toHaveLength(4)
  })

  it("max profile activates all 4 tags", () => {
    const result = evaluateApplicability(makeProfile({
      sector: "energy",
      employeeCount: "250+",
      usesAITools: true,
      requiresEfactura: true,
    }))
    expect(result.tags).toContain("gdpr")
    expect(result.tags).toContain("efactura")
    expect(result.tags).toContain("nis2")
    expect(result.tags).toContain("ai-act")
    expect(result.tags).toHaveLength(4)
  })

  it("entries au intotdeauna 4 intrări (unul per lege)", () => {
    const result = evaluateApplicability(makeProfile())
    expect(result.entries).toHaveLength(4)
    const tags = result.entries.map((e) => e.tag)
    expect(tags).toContain("gdpr")
    expect(tags).toContain("efactura")
    expect(tags).toContain("nis2")
    expect(tags).toContain("ai-act")
  })

  it("fiecare entry are reason non-vid", () => {
    const result = evaluateApplicability(makeProfile())
    for (const entry of result.entries) {
      expect(entry.reason.length).toBeGreaterThan(10)
    }
  })

  it("digital-infrastructure este sector esential NIS2", () => {
    const result = evaluateApplicability(makeProfile({ sector: "digital-infrastructure", employeeCount: "1-9" }))
    const nis2 = result.entries.find((e) => e.tag === "nis2")
    expect(nis2?.certainty).toBe("certain")
  })

  it("public-admin este sector esential NIS2", () => {
    const result = evaluateApplicability(makeProfile({ sector: "public-admin", employeeCount: "1-9" }))
    const nis2 = result.entries.find((e) => e.tag === "nis2")
    expect(nis2?.certainty).toBe("certain")
  })
})
