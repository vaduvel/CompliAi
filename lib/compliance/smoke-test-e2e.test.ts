/**
 * Smoke Test E2E — verifică flow-ul complet:
 * Register → Wizard (Applicability) → Dashboard state → Finding → Evidence → Audit Pack
 *
 * Testează logica pură (fără server/network), validând că modulele
 * se compun corect într-un flow end-to-end.
 */
import { describe, expect, it } from "vitest"

import {
  evaluateApplicability,
  type OrgProfile,
  type ApplicabilityResult,
} from "./applicability"
import { normalizeComplianceState, computeDashboardSummary } from "./engine"
import { runHealthCheck } from "./health-check"
import { assessEvidenceQuality } from "./evidence-quality"
import { buildRemediationPlan } from "./remediation"
import type { ComplianceState, ScanFinding, TaskEvidenceAttachment } from "./types"
import { getLegalSource } from "./legal-sources"

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeOrgProfile(overrides: Partial<OrgProfile> = {}): OrgProfile {
  return {
    sector: "retail",
    employeeCount: "10-49",
    usesAITools: true,
    requiresEfactura: true,
    cui: "RO12345678",
    completedAtISO: "2026-03-18T10:00:00.000Z",
    ...overrides,
  }
}

function makeBaseState(applicability: ApplicabilityResult): ComplianceState {
  return normalizeComplianceState({
    orgProfile: makeOrgProfile(),
    applicability,
    findings: [],
    alerts: [],
    driftRecords: [],
    events: [],
    taskState: {},
  })
}

function makeFinding(overrides: Partial<ScanFinding> = {}): ScanFinding {
  return {
    id: "finding-smoke-1",
    title: "Politica GDPR lipsă",
    description: "Nu a fost generată o politică de confidențialitate.",
    detail: "Organizația nu are o politică de confidențialitate generată sau încărcată.",
    severity: "high",
    category: "GDPR",
    tags: ["gdpr"],
    source: "health-check",
    detectedAtISO: "2026-03-18T10:00:00.000Z",
    ...overrides,
  }
}

function makeEvidence(): TaskEvidenceAttachment {
  return {
    id: "evidence-smoke-1",
    fileName: "politica-gdpr-semnata.pdf",
    mimeType: "application/pdf",
    sizeBytes: 245_000,
    uploadedAtISO: "2026-03-18T11:00:00.000Z",
    kind: "document_bundle",
    storageProvider: "local_private",
    storageKey: "org-demo/finding-smoke-1/politica-gdpr-semnata.pdf",
    accessPath: "/api/tasks/finding-smoke-1/evidence/evidence-smoke-1",
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Smoke Test E2E: register → wizard → dashboard → finding → evidence → audit pack", () => {

  // Step 1: Applicability Wizard
  describe("Step 1: Applicability Wizard", () => {
    it("evaluează corect profilul unei firme mici retail cu AI + e-Factura", () => {
      const profile = makeOrgProfile()
      const result = evaluateApplicability(profile)

      // GDPR always certain
      expect(result.tags).toContain("gdpr")

      // e-Factura certain (requiresEfactura=true)
      expect(result.tags).toContain("efactura")

      // AI Act probable (usesAITools=true)
      expect(result.tags).toContain("ai-act")

      // SAF-T probable (requiresEfactura=true)
      expect(result.tags).toContain("saft")

      // NIS2 unlikely for retail 10-49
      expect(result.tags).not.toContain("nis2")

      // Fiecare tag activ are sursă legală
      for (const tag of result.tags) {
        const source = getLegalSource(tag)
        expect(source).toBeDefined()
        expect(source.citation.length).toBeGreaterThan(5)
      }
    })

    it("evaluează corect o firmă din sector esențial NIS2", () => {
      const profile = makeOrgProfile({ sector: "energy", employeeCount: "250+" })
      const result = evaluateApplicability(profile)

      expect(result.tags).toContain("nis2")
      expect(result.tags).toContain("cer")
      expect(result.tags).toContain("saft")
      expect(result.tags.length).toBe(6) // gdpr, efactura, nis2, ai-act, cer, saft
    })
  })

  // Step 2: Dashboard State
  describe("Step 2: Dashboard State Initialization", () => {
    it("creează stare normalizată cu scor inițial", () => {
      const applicability = evaluateApplicability(makeOrgProfile())
      const state = makeBaseState(applicability)

      expect(state).toBeDefined()
      expect(state.findings).toEqual([])

      const summary = computeDashboardSummary(state)
      expect(summary).toBeDefined()
      expect(typeof summary.score).toBe("number")
    })

    it("health check-ul rulează pe stare goală fără erori", () => {
      const applicability = evaluateApplicability(makeOrgProfile())
      const state = makeBaseState(applicability)

      const hc = runHealthCheck(state, "2026-03-18T10:00:00.000Z")
      expect(hc).toBeDefined()
      expect(typeof hc.score).toBe("number")
      expect(hc.overallStatus).toBeDefined()
    })
  })

  // Step 3: Finding Detection
  describe("Step 3: Finding Detection & Remediation", () => {
    it("finding-ul se creează cu toate câmpurile necesare", () => {
      const finding = makeFinding()

      expect(finding.id).toBeTruthy()
      expect(finding.severity).toBe("high")
      expect(finding.category).toBe("GDPR")
      expect(finding.detectedAtISO).toBeTruthy()
    })

    it("remediation plan se generează din findings", () => {
      const applicability = evaluateApplicability(makeOrgProfile())
      const state = makeBaseState(applicability)
      const stateWithFindings = {
        ...state,
        findings: [makeFinding()],
      }

      const plan = buildRemediationPlan(stateWithFindings)
      expect(plan).toBeDefined()
      expect(Array.isArray(plan)).toBe(true)
    })
  })

  // Step 4: Evidence Upload & Quality Assessment
  describe("Step 4: Evidence Upload & Quality", () => {
    it("evaluează calitatea evidenței corespunzător", () => {
      const evidence = makeEvidence()
      const quality = assessEvidenceQuality(evidence)

      expect(quality).toBeDefined()
      expect(quality.status).toBeDefined()
      // 245KB PDF should be sufficient
      expect(quality.status).toBe("sufficient")
    })

    it("evidența mică primește calitate slabă", () => {
      const smallEvidence = { ...makeEvidence(), sizeBytes: 50 }
      const quality = assessEvidenceQuality(smallEvidence)

      expect(quality.status).toBe("weak")
      // Reason code can be "very_small_file" or "tiny_bundle" depending on kind
      expect(quality.reasonCodes.length).toBeGreaterThan(0)
    })
  })

  // Step 5: Audit Pack Readiness
  describe("Step 5: Audit Pack Readiness", () => {
    it("starea cu finding nerezolvat afectează health check", () => {
      const applicability = evaluateApplicability(makeOrgProfile())
      const stateClean = makeBaseState(applicability)

      // State cu finding nerezolvat
      const stateWithFinding = {
        ...stateClean,
        findings: [makeFinding()],
      }

      const hcClean = runHealthCheck(stateClean, "2026-03-18T10:00:00.000Z")
      const hcWithFinding = runHealthCheck(stateWithFinding, "2026-03-18T10:00:00.000Z")

      // Health check ar trebui să aibă cel puțin la fel de multe itemi
      expect(hcWithFinding.items.length).toBeGreaterThanOrEqual(hcClean.items.length)
    })
  })

  // Step 6: SAF-T Awareness (completare item parțial)
  describe("Step 6: SAF-T Awareness Integration", () => {
    it("SAF-T apare ca tag activ pentru firme cu e-Factura", () => {
      const result = evaluateApplicability(makeOrgProfile({ requiresEfactura: true }))
      const saft = result.entries.find((e) => e.tag === "saft")

      expect(saft).toBeDefined()
      expect(saft!.certainty).toBe("probable")
      expect(saft!.reason).toContain("D406")
      expect(saft!.reason).toContain("contabilul")
    })

    it("SAF-T nu apare ca tag activ pentru firme fără e-Factura", () => {
      const result = evaluateApplicability(makeOrgProfile({ requiresEfactura: false }))
      const saft = result.entries.find((e) => e.tag === "saft")

      expect(saft).toBeDefined()
      expect(saft!.certainty).toBe("unlikely")
      expect(result.tags).not.toContain("saft")
    })

    it("SAF-T are sursă legală completă", () => {
      const source = getLegalSource("saft")
      expect(source.shortName).toBe("SAF-T (D406)")
      expect(source.citation).toContain("MFP")
      expect(source.applicabilityNote).toContain("2025")
    })
  })

  // Full chain validation
  describe("Full Chain: profile → applicability → state → health → finding → evidence → score", () => {
    it("parcurge tot flow-ul fără erori", () => {
      // 1. Profile → Applicability
      const profile = makeOrgProfile()
      const applicability = evaluateApplicability(profile)
      expect(applicability.tags.length).toBeGreaterThanOrEqual(3)

      // 2. State init
      const state = makeBaseState(applicability)
      expect(state).toBeDefined()

      // 3. Health check
      const hc = runHealthCheck(state, "2026-03-18T10:00:00.000Z")
      expect(typeof hc.score).toBe("number")

      // 4. Finding
      const finding = makeFinding()
      const stateWithFinding = { ...state, findings: [finding] }

      // 5. Remediation
      const plan = buildRemediationPlan(stateWithFinding)
      expect(plan).toBeDefined()

      // 6. Evidence quality
      const evidence = makeEvidence()
      const quality = assessEvidenceQuality(evidence)
      expect(quality.status).toBe("sufficient")

      // 7. Dashboard summary
      const summary = computeDashboardSummary(stateWithFinding)
      expect(typeof summary.score).toBe("number")
      expect(summary.score).toBeGreaterThanOrEqual(0)
      expect(summary.score).toBeLessThanOrEqual(100)
    })
  })
})
