import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET, POST } from "./route"

const mocks = vi.hoisted(() => ({
  readSessionMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  readNis2StateMock: vi.fn(),
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
  readSessionFromRequest: mocks.readSessionMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/nis2-store", () => ({
  readNis2State: mocks.readNis2StateMock,
  createIncident: mocks.createIncidentMock,
}))

const SESSION = { userId: "user-1", orgId: "org-1", email: "test@site.ro" }
const ORG_CTX = { orgId: "org-1" }

const MOCK_INCIDENT = {
  id: "nis2-abc123",
  title: "Acces neautorizat",
  description: "Detalii incident",
  severity: "high",
  status: "open",
  detectedAtISO: "2026-03-17T10:00:00.000Z",
  deadline24hISO: "2026-03-18T10:00:00.000Z",
  deadline72hISO: "2026-03-20T10:00:00.000Z",
  affectedSystems: ["ERP"],
  createdAtISO: "2026-03-17T10:00:00.000Z",
  updatedAtISO: "2026-03-17T10:00:00.000Z",
}

describe("GET /api/nis2/incidents", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionMock.mockReturnValue(SESSION)
    mocks.getOrgContextMock.mockResolvedValue(ORG_CTX)
    mocks.readNis2StateMock.mockResolvedValue({ assessment: null, incidents: [MOCK_INCIDENT], vendors: [] })
  })

  it("returneaza lista de incidente", async () => {
    const res = await GET(new Request("http://localhost/api/nis2/incidents"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.incidents).toHaveLength(1)
    expect(body.incidents[0].id).toBe("nis2-abc123")
  })

  it("returneaza lista goala cand nu exista incidente", async () => {
    mocks.readNis2StateMock.mockResolvedValue({ assessment: null, incidents: [], vendors: [] })
    const res = await GET(new Request("http://localhost/api/nis2/incidents"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.incidents).toEqual([])
  })

  it("respinge accesul fara sesiune", async () => {
    mocks.readSessionMock.mockReturnValue(null)
    const res = await GET(new Request("http://localhost/api/nis2/incidents"))
    expect(res.status).toBe(401)
  })
})

describe("POST /api/nis2/incidents", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionMock.mockReturnValue(SESSION)
    mocks.getOrgContextMock.mockResolvedValue(ORG_CTX)
    mocks.createIncidentMock.mockResolvedValue(MOCK_INCIDENT)
  })

  it("creeaza incident valid si returneaza 201", async () => {
    const res = await POST(
      new Request("http://localhost/api/nis2/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Acces neautorizat",
          description: "Detalii incident",
          severity: "high",
          affectedSystems: ["ERP"],
        }),
      })
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.incident.id).toBe("nis2-abc123")
    expect(mocks.createIncidentMock).toHaveBeenCalledOnce()
  })

  it("respinge titlul lipsa", async () => {
    const res = await POST(
      new Request("http://localhost/api/nis2/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ severity: "high", affectedSystems: [] }),
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe("MISSING_TITLE")
  })

  it("respinge titlul gol (whitespace)", async () => {
    const res = await POST(
      new Request("http://localhost/api/nis2/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "   ", severity: "high", affectedSystems: [] }),
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe("MISSING_TITLE")
  })

  it("respinge severitatea invalida", async () => {
    const res = await POST(
      new Request("http://localhost/api/nis2/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Incident test", severity: "extreme", affectedSystems: [] }),
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe("INVALID_SEVERITY")
  })

  it("accepta toate severitate valide", async () => {
    for (const severity of ["low", "medium", "high", "critical"]) {
      mocks.createIncidentMock.mockResolvedValue({ ...MOCK_INCIDENT, severity })
      const res = await POST(
        new Request("http://localhost/api/nis2/incidents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Test", severity, affectedSystems: [] }),
        })
      )
      expect(res.status).toBe(201)
    }
  })

  it("paseaza detectedAtISO optional catre store", async () => {
    const detectedAt = "2026-03-10T08:00:00.000Z"
    await POST(
      new Request("http://localhost/api/nis2/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Incident cu data",
          severity: "medium",
          affectedSystems: [],
          detectedAtISO: detectedAt,
        }),
      })
    )

    const callArg = mocks.createIncidentMock.mock.calls[0][1]
    expect(callArg.detectedAtISO).toBe(detectedAt)
  })

  it("respinge accesul fara sesiune", async () => {
    mocks.readSessionMock.mockReturnValue(null)
    const res = await POST(
      new Request("http://localhost/api/nis2/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Test", severity: "low", affectedSystems: [] }),
      })
    )
    expect(res.status).toBe(401)
  })
})
