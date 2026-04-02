// V3 P1.3 — Inspector Mode Route Tests
import { beforeEach, describe, expect, it, vi } from "vitest"
import { initialComplianceState } from "@/lib/compliance/engine"
import type { ComplianceState } from "@/lib/compliance/types"
import type { Nis2OrgState } from "@/lib/server/nis2-store"

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  AuthzErrorClass: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 401, code = "AUTH_SESSION_REQUIRED") {
      super(message)
      this.status = status
      this.code = code
    }
  },
  requireFreshAuthenticatedSessionMock: vi.fn(),
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readStateForOrg: vi.fn(),
}))

vi.mock("@/lib/server/nis2-store", () => ({
  readNis2State: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorClass,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/plan", () => ({
  requirePlan: vi.fn(async () => "pro"),
  PlanError: class PlanError extends Error {
    code = "PLAN_REQUIRED"
    status = 403
  },
}))

import { readStateForOrg } from "@/lib/server/mvp-store"
import { readNis2State } from "@/lib/server/nis2-store"
import { GET } from "./route"

function makeRequest(): Request {
  return new Request("http://localhost/api/inspector")
}

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
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      orgId: "org-test",
      orgName: "Test Org",
      email: "owner@example.com",
      role: "owner",
    })
    vi.mocked(readStateForOrg).mockResolvedValue(makeState())
    vi.mocked(readNis2State).mockResolvedValue(makeNis2State())
  })

  it("returnează structura InspectorSimulationResult validă", async () => {
    const res = await GET(makeRequest())
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
    const res = await GET(makeRequest())
    const body = await res.json()
    expect(["ready", "partial", "not-ready"]).toContain(body.overallVerdict)
  })

  it("readinessScore este între 0 și 100", async () => {
    const res = await GET(makeRequest())
    const body = await res.json()
    expect(body.readinessScore).toBeGreaterThanOrEqual(0)
    expect(body.readinessScore).toBeLessThanOrEqual(100)
  })

  it("frameworks conțin GDPR, NIS2, EU AI Act, e-Factura", async () => {
    const res = await GET(makeRequest())
    const body = await res.json()

    const names = body.frameworks.map((f: { framework: string }) => f.framework)
    expect(names).toContain("GDPR")
    expect(names).toContain("NIS2")
    expect(names).toContain("EU AI Act")
    expect(names).toContain("e-Factura")
  })

  it("fiecare framework are verdict valid", async () => {
    const res = await GET(makeRequest())
    const body = await res.json()

    for (const fw of body.frameworks) {
      expect(["pass", "partial", "fail", "na"]).toContain(fw.verdict)
      expect(typeof fw.score).toBe("number")
      expect(Array.isArray(fw.checks)).toBe(true)
    }
  })

  it("cu stare goală, verdictul este not-ready sau partial (fără baseline, fără scans)", async () => {
    const res = await GET(makeRequest())
    const body = await res.json()
    expect(["not-ready", "partial"]).toContain(body.overallVerdict)
  })

  it("returnează 500 la eroare internă", async () => {
    vi.mocked(readStateForOrg).mockRejectedValue(new Error("store failure"))

    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  it("apelează readNis2State cu orgId corect", async () => {
    await GET(makeRequest())
    expect(readNis2State).toHaveBeenCalledWith("org-test")
  })

  it("apelează readStateForOrg cu orgId corect", async () => {
    await GET(makeRequest())
    expect(readStateForOrg).toHaveBeenCalledWith("org-test")
  })

  it("cere sesiune activă înainte de inspector", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValueOnce(
      new mocks.AuthzErrorClass("Ai nevoie de sesiune activa pentru Inspector Mode / Simulare Control.")
    )

    const res = await GET(makeRequest())

    expect(res.status).toBe(401)
  })
})
