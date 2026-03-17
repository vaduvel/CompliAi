import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET, POST } from "./route"

const mocks = vi.hoisted(() => ({
  readSessionMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  readNis2StateMock: vi.fn(),
  saveNis2AssessmentMock: vi.fn(),
  scoreNis2AssessmentMock: vi.fn(),
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 403, code = "AUTH_ROLE_FORBIDDEN") {
      super(message)
      this.status = status
      this.code = code
    }
  },
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  readSessionFromRequest: mocks.readSessionMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/nis2-store", () => ({
  readNis2State: mocks.readNis2StateMock,
  saveNis2Assessment: mocks.saveNis2AssessmentMock,
}))

vi.mock("@/lib/compliance/nis2-rules", () => ({
  scoreNis2Assessment: mocks.scoreNis2AssessmentMock,
}))

const SESSION = { userId: "user-1", orgId: "org-1", email: "test@site.ro" }
const ORG_CTX = { orgId: "org-1" }

const MOCK_RESULT = {
  score: 65,
  maturityLabel: "partial",
  entityType: "essential",
  gaps: [],
  answeredCount: 10,
  totalCount: 18,
}

describe("GET /api/nis2/assessment", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionMock.mockReturnValue(SESSION)
    mocks.getOrgContextMock.mockResolvedValue(ORG_CTX)
    mocks.readNis2StateMock.mockResolvedValue({ assessment: null, incidents: [], vendors: [] })
  })

  it("returneaza evaluarea salvata (null daca nu exista)", async () => {
    const res = await GET(new Request("http://localhost/api/nis2/assessment"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.assessment).toBeNull()
    expect(mocks.readNis2StateMock).toHaveBeenCalledWith("org-1")
  })

  it("returneaza evaluarea salvata cand exista", async () => {
    const assessment = {
      sector: "banking",
      answers: { "nis2-rm-01": "yes" },
      savedAtISO: "2026-03-17T10:00:00.000Z",
      score: 72,
      maturityLabel: "partial",
    }
    mocks.readNis2StateMock.mockResolvedValue({ assessment, incidents: [], vendors: [] })

    const res = await GET(new Request("http://localhost/api/nis2/assessment"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.assessment.sector).toBe("banking")
    expect(body.assessment.score).toBe(72)
  })

  it("respinge accesul fara sesiune", async () => {
    mocks.readSessionMock.mockReturnValue(null)
    const res = await GET(new Request("http://localhost/api/nis2/assessment"))
    expect(res.status).toBe(401)
  })
})

describe("POST /api/nis2/assessment", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionMock.mockReturnValue(SESSION)
    mocks.getOrgContextMock.mockResolvedValue(ORG_CTX)
    mocks.scoreNis2AssessmentMock.mockReturnValue(MOCK_RESULT)
    mocks.saveNis2AssessmentMock.mockResolvedValue({})
  })

  it("scoreaza si salveaza evaluarea NIS2", async () => {
    const res = await POST(
      new Request("http://localhost/api/nis2/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector: "banking",
          answers: { "nis2-rm-01": "yes", "nis2-ir-01": "partial" },
        }),
      })
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.result.score).toBe(65)
    expect(body.result.maturityLabel).toBe("partial")
    expect(mocks.scoreNis2AssessmentMock).toHaveBeenCalledWith(
      { "nis2-rm-01": "yes", "nis2-ir-01": "partial" },
      "banking"
    )
    expect(mocks.saveNis2AssessmentMock).toHaveBeenCalledOnce()
  })

  it("respinge body fara sector", async () => {
    const res = await POST(
      new Request("http://localhost/api/nis2/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: { "nis2-rm-01": "yes" } }),
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe("MISSING_FIELDS")
  })

  it("respinge body fara answers", async () => {
    const res = await POST(
      new Request("http://localhost/api/nis2/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector: "general" }),
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe("MISSING_FIELDS")
  })

  it("respinge accesul fara sesiune", async () => {
    mocks.readSessionMock.mockReturnValue(null)
    const res = await POST(
      new Request("http://localhost/api/nis2/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector: "general", answers: {} }),
      })
    )
    expect(res.status).toBe(401)
  })

  it("salveaza cu sector, score si maturityLabel din rezultatul scoring-ului", async () => {
    mocks.scoreNis2AssessmentMock.mockReturnValue({ ...MOCK_RESULT, score: 81, maturityLabel: "robust" })

    await POST(
      new Request("http://localhost/api/nis2/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector: "health", answers: { "nis2-rm-01": "yes" } }),
      })
    )

    const savedRecord = mocks.saveNis2AssessmentMock.mock.calls[0][1]
    expect(savedRecord.sector).toBe("health")
    expect(savedRecord.score).toBe(81)
    expect(savedRecord.maturityLabel).toBe("robust")
  })
})
