// V3 P1.2 — Health Check Route Tests
import { beforeEach, describe, expect, it, vi } from "vitest"
import { initialComplianceState } from "@/lib/compliance/engine"
import type { ComplianceState } from "@/lib/compliance/types"

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/server/mvp-store", () => ({
  readState: vi.fn(),
}))

vi.mock("@/lib/server/plan", () => ({
  requirePlan: vi.fn(async () => "pro"),
  PlanError: class PlanError extends Error {
    code = "PLAN_REQUIRED"
    status = 403
  },
}))

import { readState } from "@/lib/server/mvp-store"
import { GET } from "./route"

function makeRequest(): Request {
  return new Request("http://localhost/api/health-check")
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeState(overrides: Partial<ComplianceState> = {}): ComplianceState {
  return { ...initialComplianceState, ...overrides }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/health-check", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returnează structura HealthCheckResult validă", async () => {
    vi.mocked(readState).mockResolvedValue(makeState())

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty("score")
    expect(body).toHaveProperty("items")
    expect(body).toHaveProperty("checkedAtISO")
    expect(typeof body.score).toBe("number")
    expect(Array.isArray(body.items)).toBe(true)
  })

  it("returnează score între 0 și 100", async () => {
    vi.mocked(readState).mockResolvedValue(makeState())

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.score).toBeGreaterThanOrEqual(0)
    expect(body.score).toBeLessThanOrEqual(100)
  })

  it("fiecare item are status ok/warning/critical", async () => {
    vi.mocked(readState).mockResolvedValue(makeState())

    const res = await GET(makeRequest())
    const body = await res.json()

    for (const item of body.items) {
      expect(["ok", "warning", "critical"]).toContain(item.status)
      expect(typeof item.title).toBe("string")
    }
  })

  it("returnează 500 la eroare internă", async () => {
    vi.mocked(readState).mockRejectedValue(new Error("store error"))

    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  it("cu validatedBaselineSnapshotId setat, baseline check e ok", async () => {
    vi.mocked(readState).mockResolvedValue(
      makeState({ validatedBaselineSnapshotId: "snap-123" })
    )

    const res = await GET(makeRequest())
    const body = await res.json()

    const baselineItem = body.items.find((i: { id: string }) => i.id === "hc-baseline")
    expect(baselineItem?.status).toBe("ok")
  })

  it("fără baseline, item baseline e warning sau critical", async () => {
    vi.mocked(readState).mockResolvedValue(
      makeState({ validatedBaselineSnapshotId: undefined })
    )

    const res = await GET(makeRequest())
    const body = await res.json()

    const baselineItem = body.items.find((i: { id: string }) => i.id === "hc-baseline")
    expect(["warning", "critical"]).toContain(baselineItem?.status)
  })
})
