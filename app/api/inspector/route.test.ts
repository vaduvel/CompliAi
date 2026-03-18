// V3 P1.3 — Inspector Mode Route Tests
import { beforeEach, describe, expect, it, vi } from "vitest"
import { initialComplianceState } from "@/lib/compliance/engine"
import type { ComplianceState } from "@/lib/compliance/types"
import type { Nis2OrgState } from "@/lib/server/nis2-store"

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/server/mvp-store", () => ({
  readState: vi.fn(),
}))

vi.mock("@/lib/server/nis2-store", () => ({
  readNis2State: vi.fn(),
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: vi.fn(async () => ({ orgId: "org-test", userEmail: "test@test.ro", orgName: "Test Org" })),
}))

import { readState } from "@/lib/server/mvp-store"
import { readNis2State } from "@/lib/server/nis2-store"
import { GET } from "./route"

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeState(overrides: Partial<ComplianceState> = {}): ComplianceState {
  return { ...initialComplianceState, ...overrides }
}

function makeNis2State(overrides: Partial<Nis2OrgState> = {}): Nis2OrgState {
  return {
    assessment: null,
    incidents: [],
    vendors: [],
    updatedAtISO: new Date().toISOString(),
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/inspector", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(readState).mockResolvedValue(makeState())
    vi.mocked(readNis2State).mockResolvedValue(makeNis2State())
  })

  it("returnează structura InspectorSimulationResult validă", async () => {
    const res = await GET()
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty("simulatedAt")
    expect(body).toHaveProperty("overallVerdict")
    expect(body).toHaveProperty("readinessScore")
    expect(body).toHaveProperty("frameworks")
    expect(body).toHaveProperty("criticalGaps")
    expect(Array.isArray(body.frameworks)).toBe(true)
    expect(Array.isArray(body.criticalGaps)).toBe(true)
  })

  it("overallVerdict este ready | partial | not-ready", async () => {
    const res = await GET()
    const body = await res.json()
    expect(["ready", "partial", "not-ready"]).toContain(body.overallVerdict)
  })

  it("readinessScore este între 0 și 100", async () => {
    const res = await GET()
    const body = await res.json()
    expect(body.readinessScore).toBeGreaterThanOrEqual(0)
    expect(body.readinessScore).toBeLessThanOrEqual(100)
  })

  it("frameworks conțin GDPR, NIS2, EU AI Act, e-Factura", async () => {
    const res = await GET()
    const body = await res.json()

    const names = body.frameworks.map((f: { framework: string }) => f.framework)
    expect(names).toContain("GDPR")
    expect(names).toContain("NIS2")
    expect(names).toContain("EU AI Act")
    expect(names).toContain("e-Factura")
  })

  it("fiecare framework are verdict valid", async () => {
    const res = await GET()
    const body = await res.json()

    for (const fw of body.frameworks) {
      expect(["pass", "partial", "fail", "na"]).toContain(fw.verdict)
      expect(typeof fw.score).toBe("number")
      expect(Array.isArray(fw.checks)).toBe(true)
    }
  })

  it("cu stare goală, verdictul este not-ready sau partial (fără baseline, fără scans)", async () => {
    const res = await GET()
    const body = await res.json()
    expect(["not-ready", "partial"]).toContain(body.overallVerdict)
  })

  it("returnează 500 la eroare internă", async () => {
    vi.mocked(readState).mockRejectedValue(new Error("store failure"))

    const res = await GET()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  it("apelează readNis2State cu orgId corect", async () => {
    await GET()
    expect(readNis2State).toHaveBeenCalledWith("org-test")
  })
})
