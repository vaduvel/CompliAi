import { beforeEach, describe, expect, it, vi } from "vitest"

import { DELETE, PATCH } from "./route"

const mocks = vi.hoisted(() => ({
  readSessionMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  updateIncidentMock: vi.fn(),
  deleteIncidentMock: vi.fn(),
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
  updateIncident: mocks.updateIncidentMock,
  deleteIncident: mocks.deleteIncidentMock,
}))

const SESSION = { userId: "user-1", orgId: "org-1", email: "test@site.ro" }
const ORG_CTX = { orgId: "org-1" }
const INCIDENT_ID = "nis2-abc123"

const MOCK_INCIDENT = {
  id: INCIDENT_ID,
  title: "Incident test",
  description: "",
  severity: "high",
  status: "reported-24h",
  detectedAtISO: "2026-03-17T10:00:00.000Z",
  deadline24hISO: "2026-03-18T10:00:00.000Z",
  deadline72hISO: "2026-03-20T10:00:00.000Z",
  affectedSystems: [],
  createdAtISO: "2026-03-17T10:00:00.000Z",
  updatedAtISO: "2026-03-17T11:00:00.000Z",
}

describe("PATCH /api/nis2/incidents/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionMock.mockReturnValue(SESSION)
    mocks.getOrgContextMock.mockResolvedValue(ORG_CTX)
    mocks.updateIncidentMock.mockResolvedValue(MOCK_INCIDENT)
  })

  it("actualizeaza statusul incidentului", async () => {
    const res = await PATCH(
      new Request(`http://localhost/api/nis2/incidents/${INCIDENT_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "reported-24h" }),
      }),
      { params: Promise.resolve({ id: INCIDENT_ID }) }
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.incident.status).toBe("reported-24h")
    expect(mocks.updateIncidentMock).toHaveBeenCalledWith("org-1", INCIDENT_ID, { status: "reported-24h" })
  })

  it("returneaza 404 pentru incident inexistent", async () => {
    mocks.updateIncidentMock.mockResolvedValue(null)

    const res = await PATCH(
      new Request(`http://localhost/api/nis2/incidents/nis2-inexistent`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      }),
      { params: Promise.resolve({ id: "nis2-inexistent" }) }
    )
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.code).toBe("NOT_FOUND")
  })

  it("respinge accesul fara sesiune", async () => {
    mocks.readSessionMock.mockReturnValue(null)
    const res = await PATCH(
      new Request(`http://localhost/api/nis2/incidents/${INCIDENT_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      }),
      { params: Promise.resolve({ id: INCIDENT_ID }) }
    )
    expect(res.status).toBe(401)
  })

  it("poate actualiza mai multe campuri simultan", async () => {
    const patch = { status: "closed", resolvedAtISO: "2026-03-18T12:00:00.000Z", severity: "low" }
    await PATCH(
      new Request(`http://localhost/api/nis2/incidents/${INCIDENT_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
      { params: Promise.resolve({ id: INCIDENT_ID }) }
    )

    expect(mocks.updateIncidentMock).toHaveBeenCalledWith("org-1", INCIDENT_ID, patch)
  })
})

describe("DELETE /api/nis2/incidents/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionMock.mockReturnValue(SESSION)
    mocks.getOrgContextMock.mockResolvedValue(ORG_CTX)
    mocks.deleteIncidentMock.mockResolvedValue(true)
  })

  it("sterge incidentul si returneaza ok=true", async () => {
    const res = await DELETE(
      new Request(`http://localhost/api/nis2/incidents/${INCIDENT_ID}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: INCIDENT_ID }) }
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(mocks.deleteIncidentMock).toHaveBeenCalledWith("org-1", INCIDENT_ID)
  })

  it("returneaza 404 daca incidentul nu exista", async () => {
    mocks.deleteIncidentMock.mockResolvedValue(false)

    const res = await DELETE(
      new Request(`http://localhost/api/nis2/incidents/nis2-inexistent`, { method: "DELETE" }),
      { params: Promise.resolve({ id: "nis2-inexistent" }) }
    )
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.code).toBe("NOT_FOUND")
  })

  it("respinge accesul fara sesiune", async () => {
    mocks.readSessionMock.mockReturnValue(null)
    const res = await DELETE(
      new Request(`http://localhost/api/nis2/incidents/${INCIDENT_ID}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: INCIDENT_ID }) }
    )
    expect(res.status).toBe(401)
  })
})
