import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET, POST } from "./route"

const mocks = vi.hoisted(() => ({
  requireRoleMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  readDsarStateMock: vi.fn(),
  createDsarMock: vi.fn(),
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
  readSessionFromRequest: vi.fn().mockReturnValue({ userId: "u1" }),
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/server/rbac", () => ({
  WRITE_ROLES: ["owner", "compliance", "reviewer"],
  DELETE_ROLES: ["owner", "compliance"],
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/dsar-store", () => ({
  readDsarState: mocks.readDsarStateMock,
  createDsar: mocks.createDsarMock,
}))

const SESSION = { userId: "user-1", orgId: "org-1", email: "test@site.ro" }
const ORG_CTX = { orgId: "org-1" }

const SAMPLE_DSAR = {
  id: "dsar-abc123",
  orgId: "org-1",
  receivedAtISO: "2026-03-20T10:00:00.000Z",
  deadlineISO: "2026-04-19T10:00:00.000Z",
  requesterName: "Ion Popescu",
  requesterEmail: "ion@exemplu.ro",
  requestType: "access",
  status: "received",
  identityVerified: false,
  draftResponseGenerated: false,
  responseReviewedByHuman: false,
  evidenceVaultIds: [],
  createdAtISO: "2026-03-20T10:00:00.000Z",
  updatedAtISO: "2026-03-20T10:00:00.000Z",
}

describe("GET /api/dsar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue(SESSION)
    mocks.getOrgContextMock.mockResolvedValue(ORG_CTX)
    mocks.readDsarStateMock.mockResolvedValue({ requests: [SAMPLE_DSAR], updatedAtISO: "2026-03-20T10:00:00.000Z" })
  })

  it("returneaza lista de cereri DSAR", async () => {
    const res = await GET(new Request("http://localhost/api/dsar"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.requests).toHaveLength(1)
    expect(body.requests[0].requesterName).toBe("Ion Popescu")
  })

  it("respinge accesul fara sesiune", async () => {
    mocks.requireRoleMock.mockImplementation(() => {
      throw new mocks.AuthzErrorMock("Neautorizat.", 401, "UNAUTHORIZED")
    })
    const res = await GET(new Request("http://localhost/api/dsar"))
    expect(res.status).toBe(401)
  })
})

describe("POST /api/dsar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue(SESSION)
    mocks.getOrgContextMock.mockResolvedValue(ORG_CTX)
    mocks.createDsarMock.mockResolvedValue(SAMPLE_DSAR)
  })

  it("creeaza cerere DSAR cu deadline 30 zile", async () => {
    const res = await POST(
      new Request("http://localhost/api/dsar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName: "Ion Popescu",
          requesterEmail: "ion@exemplu.ro",
          requestType: "access",
        }),
      })
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.request.requesterName).toBe("Ion Popescu")
    expect(mocks.createDsarMock).toHaveBeenCalledWith("org-1", expect.objectContaining({
      requesterName: "Ion Popescu",
      requesterEmail: "ion@exemplu.ro",
      requestType: "access",
    }))
  })

  it("respinge tip cerere invalid", async () => {
    const res = await POST(
      new Request("http://localhost/api/dsar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName: "Ion",
          requesterEmail: "ion@test.ro",
          requestType: "invalid_type",
        }),
      })
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe("INVALID_TYPE")
  })

  it("respinge fara nume solicitant", async () => {
    const res = await POST(
      new Request("http://localhost/api/dsar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName: "",
          requesterEmail: "ion@test.ro",
          requestType: "access",
        }),
      })
    )
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe("MISSING_FIELD")
  })
})
