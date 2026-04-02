import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET, PATCH, POST } from "./route"

const mocks = vi.hoisted(() => ({
  requireFreshRoleMock: vi.fn(),
  safeGetRecentRunsMock: vi.fn(),
  executeAgentMock: vi.fn(),
  safeRecordFeedbackMock: vi.fn(),
  createRequestContextMock: vi.fn(),
  withRequestIdHeadersMock: vi.fn(),
  logRouteErrorMock: vi.fn(),
  getRequestDurationMsMock: vi.fn(),
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 401, code = "AUTH_SESSION_REQUIRED") {
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

vi.mock("@/lib/server/agent-run-store", () => ({
  safeGetRecentRuns: mocks.safeGetRecentRunsMock,
}))

vi.mock("@/lib/server/agent-orchestrator", () => ({
  executeAgent: mocks.executeAgentMock,
}))

vi.mock("@/lib/server/agent-feedback-store", () => ({
  safeRecordFeedback: mocks.safeRecordFeedbackMock,
}))

vi.mock("@/lib/server/request-context", () => ({
  createRequestContext: mocks.createRequestContextMock,
  getRequestDurationMs: mocks.getRequestDurationMsMock,
}))

vi.mock("@/lib/server/api-response", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/api-response")>("@/lib/server/api-response")
  return {
    ...actual,
    withRequestIdHeaders: mocks.withRequestIdHeadersMock,
  }
})

vi.mock("@/lib/server/operational-logger", () => ({
  logRouteError: mocks.logRouteErrorMock,
}))

const SESSION = { userId: "user-1", orgId: "org-1", orgName: "Org Test", email: "owner@test.ro", role: "owner" }

describe("GET /api/agents", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue(SESSION)
    mocks.safeGetRecentRunsMock.mockResolvedValue([{ agentType: "document" }])
    mocks.createRequestContextMock.mockReturnValue({ requestId: "req-1" })
    mocks.withRequestIdHeadersMock.mockReturnValue(undefined)
  })

  it("citește agent history din org-ul sesiunii", async () => {
    const res = await GET(new Request("http://localhost/api/agents"))

    expect(res.status).toBe(200)
    expect(mocks.safeGetRecentRunsMock).toHaveBeenCalledWith("org-1", 30)
  })
})

describe("POST /api/agents", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue(SESSION)
    mocks.executeAgentMock.mockResolvedValue({ ok: true })
    mocks.createRequestContextMock.mockReturnValue({ requestId: "req-1" })
    mocks.withRequestIdHeadersMock.mockReturnValue(undefined)
  })

  it("execută agentul în org-ul sesiunii", async () => {
    const res = await POST(
      new Request("http://localhost/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentType: "document" }),
      })
    )

    expect(res.status).toBe(200)
    expect(mocks.executeAgentMock).toHaveBeenCalledWith("org-1", "document")
  })
})

describe("PATCH /api/agents", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue(SESSION)
    mocks.safeRecordFeedbackMock.mockResolvedValue(undefined)
    mocks.createRequestContextMock.mockReturnValue({ requestId: "req-1" })
    mocks.withRequestIdHeadersMock.mockReturnValue(undefined)
  })

  it("salvează feedback-ul pentru org-ul sesiunii", async () => {
    const res = await PATCH(
      new Request("http://localhost/api/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentType: "document", decision: "approved" }),
      })
    )

    expect(res.status).toBe(200)
    expect(mocks.safeRecordFeedbackMock).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({ agentType: "document", decision: "approved" })
    )
  })
})
