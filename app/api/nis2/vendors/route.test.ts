import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET, POST } from "./route"

const mocks = vi.hoisted(() => ({
  readSessionMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  readNis2StateMock: vi.fn(),
  createVendorMock: vi.fn(),
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
  createVendor: mocks.createVendorMock,
}))

const SESSION = { userId: "user-1", orgId: "org-1", email: "test@site.ro" }
const ORG_CTX = { orgId: "org-1" }

const MOCK_VENDOR = {
  id: "nis2-vnd123",
  name: "AWS Romania",
  service: "Cloud hosting",
  riskLevel: "high",
  hasSecurityClause: true,
  hasIncidentNotification: true,
  hasAuditRight: false,
  notes: "SOC2 Type II",
  createdAtISO: "2026-03-17T10:00:00.000Z",
  updatedAtISO: "2026-03-17T10:00:00.000Z",
}

describe("GET /api/nis2/vendors", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionMock.mockReturnValue(SESSION)
    mocks.getOrgContextMock.mockResolvedValue(ORG_CTX)
    mocks.readNis2StateMock.mockResolvedValue({ assessment: null, incidents: [], vendors: [MOCK_VENDOR] })
  })

  it("returneaza lista de vendori", async () => {
    const res = await GET(new Request("http://localhost/api/nis2/vendors"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.vendors).toHaveLength(1)
    expect(body.vendors[0].id).toBe("nis2-vnd123")
  })

  it("returneaza lista goala cand nu exista vendori", async () => {
    mocks.readNis2StateMock.mockResolvedValue({ assessment: null, incidents: [], vendors: [] })
    const res = await GET(new Request("http://localhost/api/nis2/vendors"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.vendors).toEqual([])
  })

  it("respinge accesul fara sesiune", async () => {
    mocks.readSessionMock.mockReturnValue(null)
    const res = await GET(new Request("http://localhost/api/nis2/vendors"))
    expect(res.status).toBe(401)
  })
})

describe("POST /api/nis2/vendors", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionMock.mockReturnValue(SESSION)
    mocks.getOrgContextMock.mockResolvedValue(ORG_CTX)
    mocks.createVendorMock.mockResolvedValue(MOCK_VENDOR)
  })

  it("creeaza vendor valid si returneaza 201", async () => {
    const res = await POST(
      new Request("http://localhost/api/nis2/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "AWS Romania",
          service: "Cloud hosting",
          riskLevel: "high",
          hasSecurityClause: true,
          hasIncidentNotification: true,
          hasAuditRight: false,
          notes: "SOC2 Type II",
        }),
      })
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.vendor.id).toBe("nis2-vnd123")
    expect(mocks.createVendorMock).toHaveBeenCalledOnce()
  })

  it("respinge numele lipsa", async () => {
    const res = await POST(
      new Request("http://localhost/api/nis2/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskLevel: "medium", service: "SaaS" }),
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe("MISSING_NAME")
  })

  it("respinge numele gol (whitespace)", async () => {
    const res = await POST(
      new Request("http://localhost/api/nis2/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "  ", riskLevel: "low", service: "" }),
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe("MISSING_NAME")
  })

  it("respinge nivelul de risc invalid", async () => {
    const res = await POST(
      new Request("http://localhost/api/nis2/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Vendor X", riskLevel: "extreme", service: "" }),
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe("INVALID_RISK_LEVEL")
  })

  it("accepta toate nivelele de risc valide", async () => {
    for (const riskLevel of ["low", "medium", "high", "critical"]) {
      mocks.createVendorMock.mockResolvedValue({ ...MOCK_VENDOR, riskLevel })
      const res = await POST(
        new Request("http://localhost/api/nis2/vendors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Vendor Test", riskLevel, service: "" }),
        })
      )
      expect(res.status).toBe(201)
    }
  })

  it("valoreaza false pentru campurile booleene lipsa", async () => {
    await POST(
      new Request("http://localhost/api/nis2/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Minimal Vendor", riskLevel: "low" }),
      })
    )

    const callArg = mocks.createVendorMock.mock.calls[0][1]
    expect(callArg.hasSecurityClause).toBe(false)
    expect(callArg.hasIncidentNotification).toBe(false)
    expect(callArg.hasAuditRight).toBe(false)
    expect(callArg.notes).toBe("")
  })

  it("respinge accesul fara sesiune", async () => {
    mocks.readSessionMock.mockReturnValue(null)
    const res = await POST(
      new Request("http://localhost/api/nis2/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test", riskLevel: "low" }),
      })
    )
    expect(res.status).toBe(401)
  })
})
