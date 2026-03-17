import { beforeEach, describe, expect, it, vi } from "vitest"

import { DELETE, PATCH } from "./route"

const mocks = vi.hoisted(() => ({
  readSessionMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  updateVendorMock: vi.fn(),
  deleteVendorMock: vi.fn(),
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
  updateVendor: mocks.updateVendorMock,
  deleteVendor: mocks.deleteVendorMock,
}))

const SESSION = { userId: "user-1", orgId: "org-1", email: "test@site.ro" }
const ORG_CTX = { orgId: "org-1" }
const VENDOR_ID = "nis2-vnd123"

const MOCK_VENDOR = {
  id: VENDOR_ID,
  name: "AWS Romania",
  service: "Cloud hosting",
  riskLevel: "critical",
  hasSecurityClause: true,
  hasIncidentNotification: true,
  hasAuditRight: true,
  notes: "",
  createdAtISO: "2026-03-17T10:00:00.000Z",
  updatedAtISO: "2026-03-17T11:00:00.000Z",
}

describe("PATCH /api/nis2/vendors/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionMock.mockReturnValue(SESSION)
    mocks.getOrgContextMock.mockResolvedValue(ORG_CTX)
    mocks.updateVendorMock.mockResolvedValue(MOCK_VENDOR)
  })

  it("actualizeaza nivelul de risc al furnizorului", async () => {
    const res = await PATCH(
      new Request(`http://localhost/api/nis2/vendors/${VENDOR_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskLevel: "critical" }),
      }),
      { params: Promise.resolve({ id: VENDOR_ID }) }
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.vendor.riskLevel).toBe("critical")
    expect(mocks.updateVendorMock).toHaveBeenCalledWith("org-1", VENDOR_ID, { riskLevel: "critical" })
  })

  it("actualizeaza clauzele contractuale", async () => {
    const patch = { hasSecurityClause: true, hasAuditRight: true }
    await PATCH(
      new Request(`http://localhost/api/nis2/vendors/${VENDOR_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
      { params: Promise.resolve({ id: VENDOR_ID }) }
    )

    expect(mocks.updateVendorMock).toHaveBeenCalledWith("org-1", VENDOR_ID, patch)
  })

  it("returneaza 404 pentru vendor inexistent", async () => {
    mocks.updateVendorMock.mockResolvedValue(null)

    const res = await PATCH(
      new Request(`http://localhost/api/nis2/vendors/nis2-inexistent`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskLevel: "low" }),
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
      new Request(`http://localhost/api/nis2/vendors/${VENDOR_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskLevel: "low" }),
      }),
      { params: Promise.resolve({ id: VENDOR_ID }) }
    )
    expect(res.status).toBe(401)
  })
})

describe("DELETE /api/nis2/vendors/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionMock.mockReturnValue(SESSION)
    mocks.getOrgContextMock.mockResolvedValue(ORG_CTX)
    mocks.deleteVendorMock.mockResolvedValue(true)
  })

  it("sterge furnizorul si returneaza ok=true", async () => {
    const res = await DELETE(
      new Request(`http://localhost/api/nis2/vendors/${VENDOR_ID}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: VENDOR_ID }) }
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(mocks.deleteVendorMock).toHaveBeenCalledWith("org-1", VENDOR_ID)
  })

  it("returneaza 404 daca furnizorul nu exista", async () => {
    mocks.deleteVendorMock.mockResolvedValue(false)

    const res = await DELETE(
      new Request(`http://localhost/api/nis2/vendors/nis2-inexistent`, { method: "DELETE" }),
      { params: Promise.resolve({ id: "nis2-inexistent" }) }
    )
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.code).toBe("NOT_FOUND")
  })

  it("respinge accesul fara sesiune", async () => {
    mocks.readSessionMock.mockReturnValue(null)
    const res = await DELETE(
      new Request(`http://localhost/api/nis2/vendors/${VENDOR_ID}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: VENDOR_ID }) }
    )
    expect(res.status).toBe(401)
  })
})
