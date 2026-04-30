import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET, POST } from "./route"

const mocks = vi.hoisted(() => ({
  requireFreshRoleMock: vi.fn(),
  readDsarStateMock: vi.fn(),
  createDsarMock: vi.fn(),
  updateDsarMock: vi.fn(),
  generateDsarDraftMock: vi.fn(),
  generateDsarProcessPackMock: vi.fn(),
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

vi.mock("@/lib/server/dsar-store", () => ({
  readDsarState: mocks.readDsarStateMock,
  createDsar: mocks.createDsarMock,
  updateDsar: mocks.updateDsarMock,
}))

vi.mock("@/lib/compliance/dsar-drafts", () => ({
  generateDsarDraft: mocks.generateDsarDraftMock,
  generateDsarProcessPack: mocks.generateDsarProcessPackMock,
}))

const SESSION = { userId: "user-1", orgId: "org-1", orgName: "Org Test SRL", email: "test@site.ro" }

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
    mocks.requireFreshRoleMock.mockResolvedValue(SESSION)
    mocks.readDsarStateMock.mockResolvedValue({ requests: [SAMPLE_DSAR], updatedAtISO: "2026-03-20T10:00:00.000Z" })
    mocks.generateDsarProcessPackMock.mockReturnValue({
      title: "Pachet minim DSAR",
      summary: "Pack",
      assets: [],
      completionChecklist: [],
    })
  })

  it("returneaza lista de cereri DSAR", async () => {
    const res = await GET(new Request("http://localhost/api/dsar"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.requests).toHaveLength(1)
    expect(body.requests[0].requesterName).toBe("Ion Popescu")
    expect(body.processPack.title).toBe("Pachet minim DSAR")
  })

  it("respinge accesul fara sesiune", async () => {
    mocks.requireFreshRoleMock.mockRejectedValueOnce(
      new mocks.AuthzErrorMock("Neautorizat.", 401, "UNAUTHORIZED")
    )
    const res = await GET(new Request("http://localhost/api/dsar"))
    expect(res.status).toBe(401)
  })
})

describe("POST /api/dsar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue(SESSION)
    mocks.readDsarStateMock.mockResolvedValue({ requests: [], updatedAtISO: "2026-03-20T10:00:00.000Z" })
    mocks.createDsarMock.mockResolvedValue(SAMPLE_DSAR)
    mocks.updateDsarMock.mockResolvedValue({ ...SAMPLE_DSAR, draftResponseGenerated: true })
    mocks.generateDsarDraftMock.mockReturnValue({
      subject: "DSAR",
      body: "Draft",
      legalBasis: "Art. 15 GDPR",
      requiredActions: [],
    })
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
      receivedAtISO: expect.any(String),
    }))
  })

  it("nu dubleaza cererea DSAR la retry in aceeasi fereastra de 5 minute", async () => {
    mocks.readDsarStateMock.mockResolvedValueOnce({
      requests: [SAMPLE_DSAR],
      updatedAtISO: "2026-03-20T10:00:00.000Z",
    })

    const res = await POST(
      new Request("http://localhost/api/dsar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName: "Ion Popescu",
          requesterEmail: "ion@exemplu.ro",
          requestType: "access",
          receivedAtISO: "2026-03-20T10:03:00.000Z",
        }),
      })
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(body.request.id).toBe("dsar-abc123")
    expect(mocks.createDsarMock).not.toHaveBeenCalled()
    expect(mocks.updateDsarMock).not.toHaveBeenCalled()
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
