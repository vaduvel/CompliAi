// V3 P2.1 — Shadow AI Route Tests
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { initialComplianceState } from "@/lib/compliance/engine"
import type { ComplianceState } from "@/lib/compliance/types"

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/server/mvp-store", () => ({
  readState: vi.fn(),
  mutateState: vi.fn(),
}))

import { readState, mutateState } from "@/lib/server/mvp-store"
import { GET, POST } from "./route"

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeState(overrides: Partial<ComplianceState> = {}): ComplianceState {
  return { ...initialComplianceState, ...overrides }
}

function makePostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/shadow-ai", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

const lowRiskAnswers = [
  { questionId: "sq-general-chatgpt", value: "no" },
  { questionId: "sq-sensitive-data", value: "no" },
  { questionId: "sq-ai-policy", value: "yes-enforced" },
  { questionId: "sq-ai-inventory", value: "yes-complete" },
]

const highRiskAnswers = [
  { questionId: "sq-general-chatgpt", value: "mixed" },
  { questionId: "sq-sensitive-data", value: "yes" },
  { questionId: "sq-ai-policy", value: "no" },
  { questionId: "sq-ai-inventory", value: "no" },
  { questionId: "sq-high-risk-decisions", value: "yes-no-oversight" },
]

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/shadow-ai", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(readState).mockResolvedValue(makeState())
  })

  it("returnează întrebările și răspunsurile curente", async () => {
    const res = await GET()
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty("questions")
    expect(body).toHaveProperty("answers")
    expect(body).toHaveProperty("completedAtISO")
    expect(Array.isArray(body.questions)).toBe(true)
    expect(body.questions.length).toBeGreaterThan(0)
  })

  it("returnează answers din state dacă există", async () => {
    const savedAnswers = [{ questionId: "sq-general-chatgpt", value: "no" }]
    vi.mocked(readState).mockResolvedValue(
      makeState({
        shadowAiAnswers: savedAnswers,
        shadowAiCompletedAtISO: "2026-03-10T12:00:00.000Z",
      })
    )

    const res = await GET()
    const body = await res.json()

    expect(body.answers).toEqual(savedAnswers)
    expect(body.completedAtISO).toBe("2026-03-10T12:00:00.000Z")
  })

  it("returnează arrays goale dacă state nu are shadow AI salvat", async () => {
    const res = await GET()
    const body = await res.json()

    expect(body.answers).toEqual([])
    expect(body.completedAtISO).toBeNull()
  })

  it("returnează 500 la eroare internă", async () => {
    vi.mocked(readState).mockRejectedValue(new Error("store error"))

    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe("POST /api/shadow-ai", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mutateState).mockImplementation(async (fn) => fn(makeState()) as ComplianceState)
  })

  it("returnează 400 dacă answers nu e array", async () => {
    const res = await POST(makePostRequest({ answers: "invalid" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain("array")
  })

  it("returnează 400 când answers depășește numărul de întrebări", async () => {
    const res = await POST(
      makePostRequest({
        answers: Array.from({ length: 50 }, (_, index) => ({
          questionId: `fake-${index}`,
          value: "no",
        })),
      })
    )
    expect(res.status).toBe(400)
  })

  it("returnează 400 pentru questionId duplicat", async () => {
    const res = await POST(
      makePostRequest({
        answers: [
          { questionId: "sq-general-chatgpt", value: "no" },
          { questionId: "sq-general-chatgpt", value: "approved" },
        ],
      })
    )
    expect(res.status).toBe(400)
  })

  it("returnează ShadowAiAssessmentResult valid cu răspunsuri low-risk", async () => {
    const res = await POST(makePostRequest({ answers: lowRiskAnswers }))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty("riskLevel")
    expect(body).toHaveProperty("riskScore")
    expect(body).toHaveProperty("detectedCategories")
    expect(body).toHaveProperty("recommendations")
    expect(body).toHaveProperty("findings")
    expect(body).toHaveProperty("completedAtISO")
  })

  it("riskLevel este unul din valorile valide", async () => {
    const res = await POST(makePostRequest({ answers: lowRiskAnswers }))
    const body = await res.json()
    expect(["critical", "high", "medium", "low", "none"]).toContain(body.riskLevel)
  })

  it("riskScore este între 0 și 100", async () => {
    const res = await POST(makePostRequest({ answers: highRiskAnswers }))
    const body = await res.json()
    expect(body.riskScore).toBeGreaterThanOrEqual(0)
    expect(body.riskScore).toBeLessThanOrEqual(100)
  })

  it("răspunsuri high-risk generează riskLevel high sau critical", async () => {
    const res = await POST(makePostRequest({ answers: highRiskAnswers }))
    const body = await res.json()
    expect(["high", "critical"]).toContain(body.riskLevel)
  })

  it("array gol de answers e acceptat (score 0, riskLevel none)", async () => {
    const res = await POST(makePostRequest({ answers: [] }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.riskLevel).toBe("none")
  })

  it("mutateState este apelat pentru a persista answers", async () => {
    await POST(makePostRequest({ answers: lowRiskAnswers }))
    expect(mutateState).toHaveBeenCalledTimes(1)
  })

  it("returnează 500 la eroare internă", async () => {
    vi.mocked(mutateState).mockRejectedValue(new Error("write error"))

    const res = await POST(makePostRequest({ answers: lowRiskAnswers }))
    expect(res.status).toBe(500)
  })
})
