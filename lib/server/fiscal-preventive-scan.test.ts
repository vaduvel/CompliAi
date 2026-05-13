// Unit test for the unified preventive fiscal scan runner.

import { describe, expect, it } from "vitest"

import {
  buildCertExpiryFindings,
  buildFrequencyMismatchFindings,
  mergePreventiveFindings,
  runPreventiveScan,
} from "./fiscal-preventive-scan"
import type { ComplianceState, ScanFinding } from "@/lib/compliance/types"
import type { CertSpvRecord } from "@/lib/compliance/cert-spv-tracker"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"

const NOW = "2026-05-13T10:00:00.000Z"

function createBaseState(
  overrides?: Partial<ComplianceState> & {
    filingRecords?: FilingRecord[]
    certSpvRecords?: CertSpvRecord[]
  },
): ComplianceState & { filingRecords?: FilingRecord[]; certSpvRecords?: CertSpvRecord[] } {
  return {
    highRisk: 0,
    lowRisk: 0,
    gdprProgress: 0,
    efacturaSyncedAtISO: "",
    efacturaConnected: false,
    efacturaSignalsCount: 0,
    scannedDocuments: 0,
    alerts: [],
    findings: [],
    scans: [],
    chat: [],
    taskState: {},
    aiComplianceFieldOverrides: {},
    traceabilityReviews: {},
    aiSystems: [],
    detectedAISystems: [],
    efacturaValidations: [],
    driftRecords: [],
    driftSettings: { severityOverrides: {} },
    snapshotHistory: [],
    events: [],
    generatedDocuments: [],
    ...overrides,
  }
}

describe("runPreventiveScan", () => {
  it("returnează rezultat empty pe state gol", () => {
    const state = createBaseState()
    const result = runPreventiveScan({ state, nowISO: NOW })

    expect(result.newFindings).toEqual([])
    expect(result.summary.criticalCount).toBe(0)
    expect(result.summary.warningCount).toBe(0)
    expect(result.expectedFrequency.frequency).toBe("unknown")
    expect(result.certSnapshot).toBe(null)
  })

  it("detectează declarație overdue + emite finding de tip filing-overdue-*", () => {
    const state = createBaseState({
      filingRecords: [
        {
          id: "f1",
          type: "d300_tva",
          period: "2026-03",
          status: "missing",
          dueISO: "2026-04-25T00:00:00Z", // overdue cu ~18 zile la 2026-05-13
        },
      ],
    })

    const result = runPreventiveScan({ state, nowISO: NOW })

    expect(result.overdueFindings.length).toBeGreaterThanOrEqual(1)
    const overdueFinding = result.overdueFindings.find((f) =>
      f.id.startsWith("filing-overdue-"),
    )
    expect(overdueFinding).toBeDefined()
    expect(overdueFinding?.severity).toBe("high")
    expect(overdueFinding?.title).toContain("Declarație fiscală lipsă")
  })

  it("detectează cert expirat critic + emite finding cert-expiry-* cu severity critical", () => {
    const expiredCert: CertSpvRecord = {
      id: "cert-1",
      clientCif: "RO12345678",
      clientName: "ACME SRL",
      certSerial: "ABCD1234",
      ownerName: "Ion Popescu",
      validFromISO: "2025-01-01T00:00:00Z",
      validUntilISO: "2026-04-01T00:00:00Z", // expirat la 2026-05-13
      status: "unknown",
      createdAtISO: "2025-01-01T00:00:00Z",
      updatedAtISO: "2025-01-01T00:00:00Z",
    }

    const state = createBaseState({ certSpvRecords: [expiredCert] })
    const result = runPreventiveScan({ state, nowISO: NOW })

    expect(result.certFindings.length).toBe(1)
    expect(result.certFindings[0]?.severity).toBe("critical")
    expect(result.certFindings[0]?.id).toBe("cert-expiry-cert-1")
    expect(result.certSnapshot?.expired).toBe(1)
  })

  it("compute summary cu critical/warning/info counts agregate", () => {
    const expiredCert: CertSpvRecord = {
      id: "cert-1",
      clientCif: "RO123",
      clientName: "X",
      certSerial: "ABC",
      ownerName: "Ion",
      validFromISO: "2025-01-01T00:00:00Z",
      validUntilISO: "2026-04-01T00:00:00Z",
      status: "unknown",
      createdAtISO: "2025-01-01T00:00:00Z",
      updatedAtISO: "2025-01-01T00:00:00Z",
    }

    const state = createBaseState({
      filingRecords: [
        {
          id: "f-overdue",
          type: "d300_tva",
          period: "2026-03",
          status: "missing",
          dueISO: "2026-04-25T00:00:00Z",
        },
      ],
      certSpvRecords: [expiredCert],
    })

    const result = runPreventiveScan({ state, nowISO: NOW })
    expect(result.summary.criticalCount).toBeGreaterThanOrEqual(1) // cert expired
    expect(result.summary.warningCount).toBeGreaterThanOrEqual(1) // filing overdue
    expect(result.newFindings.length).toBeGreaterThanOrEqual(2)
  })
})

describe("buildCertExpiryFindings", () => {
  it("ignoră certificatele active fără riscuri", () => {
    const cert: CertSpvRecord = {
      id: "cert-active",
      clientCif: "RO123",
      clientName: "X",
      certSerial: "ABC",
      ownerName: "Ion",
      validFromISO: "2025-01-01T00:00:00Z",
      validUntilISO: "2027-01-01T00:00:00Z", // ~1.5 ani în viitor
      status: "unknown",
      createdAtISO: "2025-01-01T00:00:00Z",
      updatedAtISO: "2025-01-01T00:00:00Z",
    }
    expect(buildCertExpiryFindings([cert], NOW)).toEqual([])
  })

  it("marchează unauthorized ca critical + emite hint de re-înrolare", () => {
    const cert: CertSpvRecord = {
      id: "cert-unauth",
      clientCif: "RO123",
      clientName: "ACME",
      certSerial: "XYZ",
      ownerName: "Ana",
      validFromISO: "2025-01-01T00:00:00Z",
      validUntilISO: "2027-01-01T00:00:00Z",
      lastSpvVerifiedOk: false,
      lastSpvEnrollmentISO: "2026-05-10T00:00:00Z", // recent → grace period
      status: "unknown",
      createdAtISO: "2025-01-01T00:00:00Z",
      updatedAtISO: "2025-01-01T00:00:00Z",
    }
    const findings = buildCertExpiryFindings([cert], NOW)
    expect(findings.length).toBe(1)
    // recently enrolled + verified false = renewed_pending (medium)
    expect(findings[0]?.severity).toBe("medium")
  })
})

describe("buildFrequencyMismatchFindings", () => {
  it("returnează listă goală fără mismatches", () => {
    const findings = buildFrequencyMismatchFindings(
      [],
      { frequency: "monthly", confidence: "high", reason: "" },
      NOW,
    )
    expect(findings).toEqual([])
  })

  it("grupează pe (filingType, filedAsFrequency) — o singură finding per grup", () => {
    const findings = buildFrequencyMismatchFindings(
      [
        {
          filingId: "1",
          filingType: "d300_tva",
          period: "2026-Q1",
          detectedFrequency: "monthly",
          filedAsFrequency: "quarterly",
          severity: "error",
          message: "x",
        },
        {
          filingId: "2",
          filingType: "d300_tva",
          period: "2026-Q2",
          detectedFrequency: "monthly",
          filedAsFrequency: "quarterly",
          severity: "error",
          message: "x",
        },
      ],
      {
        frequency: "monthly",
        confidence: "high",
        reason: "CA peste prag.",
      },
      NOW,
    )

    expect(findings.length).toBe(1)
    expect(findings[0]?.id).toBe("freq-mismatch-d300_tva-quarterly")
    expect(findings[0]?.detail).toContain("Detectat pe 2 declarații")
  })
})

describe("mergePreventiveFindings", () => {
  const baseFinding: ScanFinding = {
    id: "existing-1",
    title: "Old title",
    detail: "old detail",
    category: "E_FACTURA",
    severity: "medium",
    risk: "low",
    principles: [],
    createdAtISO: "2026-05-01T10:00:00Z",
    sourceDocument: "old source",
  }

  it("refresh-ează entry existent fără să șteargă findingStatus / closureEvidence", () => {
    const existing: ScanFinding[] = [
      { ...baseFinding, findingStatus: "confirmed" },
    ]
    const fresh: ScanFinding[] = [
      { ...baseFinding, title: "Updated title", severity: "high", risk: "high" },
    ]

    const { merged, newCount, refreshedCount } = mergePreventiveFindings(existing, fresh)
    expect(merged.length).toBe(1)
    expect(merged[0]?.title).toBe("Updated title")
    expect(merged[0]?.severity).toBe("high")
    expect(merged[0]?.findingStatus).toBe("confirmed") // preserved
    expect(newCount).toBe(0)
    expect(refreshedCount).toBe(1)
  })

  it("adaugă findings noi cu id-uri necunoscute la sfârșit", () => {
    const fresh: ScanFinding[] = [{ ...baseFinding, id: "fresh-x" }]
    const { merged, newCount, refreshedCount } = mergePreventiveFindings([], fresh)
    expect(merged.length).toBe(1)
    expect(merged[0]?.id).toBe("fresh-x")
    expect(newCount).toBe(1)
    expect(refreshedCount).toBe(0)
  })

  it("este idempotent — re-rularea cu același input dă același output", () => {
    const fresh: ScanFinding[] = [{ ...baseFinding, id: "freq-mismatch-1" }]
    const pass1 = mergePreventiveFindings([], fresh)
    const pass2 = mergePreventiveFindings(pass1.merged, fresh)
    expect(pass2.newCount).toBe(0)
    expect(pass2.refreshedCount).toBe(1)
    expect(pass2.merged.length).toBe(pass1.merged.length)
  })
})
