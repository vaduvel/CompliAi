// Unit tests pentru Smart Pattern Engine.

import { describe, expect, it } from "vitest"

import {
  appendFixPatternRecord,
  buildFixPatternRecord,
  computePatternMemorySummary,
  detectRecurringPatterns,
  pruneFixPatternMemory,
  suggestFixForFinding,
  type FixPatternRecord,
} from "./smart-pattern-engine"

const NOW = "2026-05-13T10:00:00.000Z"
const ORG = "org-cabinet-diana"
const CIF_ACME = "RO12345678"

function fix(
  daysAgo: number,
  success: boolean,
  overrides: Partial<FixPatternRecord> = {},
): FixPatternRecord {
  const appliedAt = new Date(new Date(NOW).getTime() - daysAgo * 86_400_000).toISOString()
  return {
    id: `fix-${daysAgo}-${Math.random().toString(36).slice(2, 6)}`,
    orgId: ORG,
    findingTypeId: "EF-003",
    category: "E_FACTURA",
    clientCif: CIF_ACME,
    errorCode: "CUI-INVALID",
    fixApplied: "anaf_vat_lookup_update",
    fixLabel: "Verifică CUI partener cu API ANAF VAT",
    success,
    appliedAtISO: appliedAt,
    findingId: `f-${daysAgo}-${Math.random().toString(36).slice(2, 6)}`,
    ...overrides,
  }
}

// ── buildFixPatternRecord ────────────────────────────────────────────────────

describe("buildFixPatternRecord", () => {
  it("construiește record valid cu id unic + timestamp + flag success", () => {
    const record = buildFixPatternRecord({
      orgId: ORG,
      finding: { id: "f-1", findingTypeId: "EF-003", category: "E_FACTURA" },
      clientCif: CIF_ACME,
      fixApplied: "auto-fix-resubmit",
      fixLabel: "Auto-fix XML + retransmitere",
      success: true,
      nowISO: NOW,
      errorCode: "CUI-INVALID",
      context: { partener: "SC PARTENER SRL" },
    })

    expect(record.id).toMatch(/^fix-/)
    expect(record.orgId).toBe(ORG)
    expect(record.findingTypeId).toBe("EF-003")
    expect(record.appliedAtISO).toBe(NOW)
    expect(record.success).toBe(true)
    expect(record.context?.partener).toBe("SC PARTENER SRL")
  })

  it("fallback findingTypeId la 'UNKNOWN' dacă lipsește", () => {
    const record = buildFixPatternRecord({
      orgId: ORG,
      finding: { id: "f-1", category: "E_FACTURA" },
      clientCif: CIF_ACME,
      fixApplied: "manual-attest",
      fixLabel: "Manual",
      success: true,
      nowISO: NOW,
    })
    expect(record.findingTypeId).toBe("UNKNOWN")
  })
})

// ── detectRecurringPatterns ──────────────────────────────────────────────────

describe("detectRecurringPatterns", () => {
  it("returnează listă goală pentru < threshold ocurențe", () => {
    const records = [fix(1, true), fix(5, true)]
    const patterns = detectRecurringPatterns(records, NOW)
    expect(patterns).toHaveLength(0)
  })

  it("detectează pattern cu exact 3 ocurențe în 30 zile (threshold default)", () => {
    const records = [fix(1, true), fix(15, true), fix(28, false)]
    const patterns = detectRecurringPatterns(records, NOW)
    expect(patterns).toHaveLength(1)
    expect(patterns[0]?.occurrenceCount).toBe(3)
    expect(patterns[0]?.findingTypeId).toBe("EF-003")
    expect(patterns[0]?.clientCif).toBe(CIF_ACME)
  })

  it("exclude ocurențe în afara ferestrei (>30 zile)", () => {
    const records = [fix(1, true), fix(15, true), fix(40, true), fix(60, true)]
    const patterns = detectRecurringPatterns(records, NOW)
    expect(patterns).toHaveLength(0) // doar 2 în fereastră
  })

  it("severitate escalează cu occurrenceCount", () => {
    const records3 = [fix(1, true), fix(5, true), fix(10, true)]
    const records5 = [...records3, fix(15, true), fix(20, true)]
    const records8 = [...records5, fix(22, true), fix(25, true), fix(28, true)]

    expect(detectRecurringPatterns(records3, NOW)[0]?.severity).toBe("low")
    expect(detectRecurringPatterns(records5, NOW)[0]?.severity).toBe("high")
    expect(detectRecurringPatterns(records8, NOW)[0]?.severity).toBe("critical")
  })

  it("suggestedFix = cel mai recent fix de succes", () => {
    const records = [
      fix(20, false, { fixApplied: "manual-edit", fixLabel: "Edit manual" }),
      fix(10, true, { fixApplied: "anaf_vat_lookup", fixLabel: "ANAF VAT lookup" }),
      fix(2, false, { fixApplied: "skip-resubmit", fixLabel: "Skip retransmit" }),
    ]
    const patterns = detectRecurringPatterns(records, NOW)
    expect(patterns).toHaveLength(1)
    expect(patterns[0]?.suggestedFix?.fixApplied).toBe("anaf_vat_lookup")
  })

  it("suggestedFix = null dacă niciun fix de succes", () => {
    const records = [fix(1, false), fix(5, false), fix(10, false)]
    const patterns = detectRecurringPatterns(records, NOW)
    expect(patterns).toHaveLength(1)
    expect(patterns[0]?.suggestedFix).toBeNull()
  })

  it("separă pattern-uri pe (findingType, clientCif, errorCode)", () => {
    const records = [
      // Pattern 1: EF-003 / ACME / CUI-INVALID — 3x
      fix(1, true),
      fix(5, true),
      fix(10, true),
      // Pattern 2: EF-005 / ACME / XML — 3x
      fix(2, true, { findingTypeId: "EF-005", errorCode: "XML-INVALID" }),
      fix(8, true, { findingTypeId: "EF-005", errorCode: "XML-INVALID" }),
      fix(15, true, { findingTypeId: "EF-005", errorCode: "XML-INVALID" }),
    ]
    const patterns = detectRecurringPatterns(records, NOW)
    expect(patterns).toHaveLength(2)
  })

  it("threshold custom funcționează", () => {
    const records = [fix(1, true), fix(5, true)]
    const patterns = detectRecurringPatterns(records, NOW, { threshold: 2 })
    expect(patterns).toHaveLength(1)
  })
})

// ── suggestFixForFinding ─────────────────────────────────────────────────────

describe("suggestFixForFinding", () => {
  it("returnează cel mai recent fix de succes pe aceeași cheie", () => {
    const records = [
      fix(20, true, { fixApplied: "OLD-FIX" }),
      fix(5, true, { fixApplied: "NEW-FIX" }),
      fix(2, false, { fixApplied: "FAILED-FIX" }),
    ]
    const suggested = suggestFixForFinding(records, {
      findingTypeId: "EF-003",
      clientCif: CIF_ACME,
      errorCode: "CUI-INVALID",
    })
    expect(suggested?.fixApplied).toBe("NEW-FIX")
  })

  it("returnează null dacă nu există fix de succes pe cheie", () => {
    const records = [fix(5, false), fix(10, false)]
    const suggested = suggestFixForFinding(records, {
      findingTypeId: "EF-003",
      clientCif: CIF_ACME,
      errorCode: "CUI-INVALID",
    })
    expect(suggested).toBeNull()
  })

  it("returnează null dacă nu există pe altă cheie (alt client)", () => {
    const records = [fix(5, true, { clientCif: "RO99999" })]
    const suggested = suggestFixForFinding(records, {
      findingTypeId: "EF-003",
      clientCif: CIF_ACME,
      errorCode: "CUI-INVALID",
    })
    expect(suggested).toBeNull()
  })
})

// ── appendFixPatternRecord ───────────────────────────────────────────────────

describe("appendFixPatternRecord", () => {
  it("adaugă record nou", () => {
    const r1 = fix(1, true)
    const r2 = fix(2, true)
    const result = appendFixPatternRecord([r1], r2)
    expect(result).toHaveLength(2)
  })

  it("nu duplică dacă există deja (findingId, fixApplied) match", () => {
    const r1 = fix(1, true, { findingId: "f-x", fixApplied: "auto-fix" })
    const r2 = fix(2, true, { findingId: "f-x", fixApplied: "auto-fix" })
    const result = appendFixPatternRecord([r1], r2)
    expect(result).toHaveLength(1)
  })
})

// ── pruneFixPatternMemory ────────────────────────────────────────────────────

describe("pruneFixPatternMemory", () => {
  it("păstrează records în retentionDays + șterge rest", () => {
    const records = [
      fix(10, true),
      fix(50, true),
      fix(100, true),  // out (>90)
      fix(120, true),  // out
    ]
    const pruned = pruneFixPatternMemory(records, NOW, 90)
    expect(pruned).toHaveLength(2)
  })
})

// ── computePatternMemorySummary ──────────────────────────────────────────────

describe("computePatternMemorySummary", () => {
  it("calculează success rate corect", () => {
    const records = [fix(1, true), fix(2, true), fix(3, false), fix(4, false)]
    const patterns = detectRecurringPatterns(records, NOW)
    const summary = computePatternMemorySummary(records, patterns)
    expect(summary.totalFixesApplied).toBe(4)
    expect(summary.totalSuccessful).toBe(2)
    expect(summary.successRate).toBe(0.5)
  })

  it("ranking topRecurringClients descrescător după count", () => {
    const records = [
      fix(1, true, { clientCif: "A" }),
      fix(2, true, { clientCif: "A" }),
      fix(3, true, { clientCif: "A" }),
      fix(4, true, { clientCif: "B" }),
      fix(5, true, { clientCif: "B" }),
      fix(6, true, { clientCif: "B" }),
      fix(7, true, { clientCif: "B" }),
    ]
    const patterns = detectRecurringPatterns(records, NOW)
    const summary = computePatternMemorySummary(records, patterns)
    expect(summary.topRecurringClients[0]?.clientCif).toBe("B")
    expect(summary.topRecurringClients[1]?.clientCif).toBe("A")
  })
})
