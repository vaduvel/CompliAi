import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET, POST } from "./route"

const mocks = vi.hoisted(() => ({
  requireFreshRoleMock: vi.fn(),
  readDoraStateMock: vi.fn(),
  createIncidentMock: vi.fn(),
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
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/dora-store", () => ({
  readDoraState: mocks.readDoraStateMock,
  createIncident: mocks.createIncidentMock,
}))

const SESSION = { userId: "user-1", orgId: "org-1", orgName: "Org Test SRL", email: "test@site.ro" }

const INCIDENT = {
  id: "dora-1",
  title: "Pana ERP",
  description: "Incident sever",
  severity: "major",
  status: "detected",
  occurredAtISO: "2026-04-01T08:00:00.000Z",
  detectedAtISO: "2026-04-01T08:15:00.000Z",
  affectedSystems: ["ERP"],
  estimatedImpact: "Operațiuni afectate",
}

describe("GET /api/dora", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue(SESSION)
    mocks.readDoraStateMock.mockResolvedValue({ incidents: [INCIDENT], timeline: [] })
  })

  it("citeste starea DORA din org-ul sesiunii", async () => {
    const res = await GET(new Request("http://localhost/api/dora"))

    expect(res.status).toBe(200)
    expect(mocks.readDoraStateMock).toHaveBeenCalledWith("org-1")
  })
})

describe("POST /api/dora", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue(SESSION)
    mocks.createIncidentMock.mockResolvedValue(INCIDENT)
  })

  it("creeaza incident valid in org-ul sesiunii", async () => {
    const res = await POST(
      new Request("http://localhost/api/dora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Pana ERP",
          description: "Incident sever",
          severity: "major",
          occurredAtISO: "2026-04-01T08:00:00.000Z",
          detectedAtISO: "2026-04-01T08:15:00.000Z",
          affectedSystems: ["ERP"],
        }),
      })
    )

    expect(res.status).toBe(201)
    expect(mocks.createIncidentMock).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({ title: "Pana ERP", severity: "major" })
    )
  })

  it("respinge severitatea invalida", async () => {
    const res = await POST(
      new Request("http://localhost/api/dora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Pana ERP",
          description: "Incident sever",
          severity: "critical",
          occurredAtISO: "2026-04-01T08:00:00.000Z",
          detectedAtISO: "2026-04-01T08:15:00.000Z",
        }),
      })
    )

    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe("INVALID_SEVERITY")
  })
})
