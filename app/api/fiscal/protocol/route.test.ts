import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string

    constructor(message: string, status = 403, code = "AUTH_ROLE_FORBIDDEN") {
      super(message)
      this.status = status
      this.code = code
    }
  },
  requireRoleMock: vi.fn(),
  readStateMock: vi.fn(),
  mutateStateMock: vi.fn(),
  getOrgContextMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readState: mocks.readStateMock,
  mutateState: mocks.mutateStateMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

import { GET, PATCH } from "./route"

describe("fiscal protocol route", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mocks.requireRoleMock.mockReturnValue({
      userId: "user-1",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.getOrgContextMock.mockResolvedValue({
      orgId: "org-demo",
      orgName: "Demo Fiscal SRL",
    })
    mocks.readStateMock.mockResolvedValue({
      fiscalProtocols: {
        "finding-ef-004": {
          findingId: "finding-ef-004",
          findingTypeId: "EF-004",
          invoiceRef: "INV-2026-114",
          actionStatus: "retransmitted",
          spvReference: "MSG-2231",
          receiptStatus: "accepted",
          receiptReceivedAtISO: "2026-03-30T10:15:00.000Z",
          evidenceLocation: "Dosar/Fiscal/martie-2026",
          operatorNote: "Retransmis din ERP.",
          updatedAtISO: "2026-03-30T10:00:00.000Z",
        },
      },
    })
    mocks.mutateStateMock.mockImplementation(async (updater: (state: Record<string, unknown>) => Record<string, unknown>) =>
      updater({
        fiscalProtocols: {},
        events: [],
      })
    )
  })

  it("returnează protocolul fiscal salvat și nota derivată", async () => {
    const response = await GET(
      new Request("http://localhost/api/fiscal/protocol?findingId=finding-ef-004&findingTypeId=EF-004")
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.protocol.findingId).toBe("finding-ef-004")
    expect(payload.derived.readiness).toBe("ready")
    expect(payload.derived.handoffEvidenceNote).toContain("Referință SPV: MSG-2231")
    expect(payload.derived.handoffEvidenceNote).toContain("Recipisă SPV: acceptată în SPV")
  })

  it("salvează protocolul fiscal și întoarce feedbackul de readiness", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/fiscal/protocol", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          findingId: "finding-ef-005",
          findingTypeId: "EF-005",
          invoiceRef: "INV-2026-204",
          actionStatus: "transmitted",
          spvReference: "MSG-7788",
          receiptStatus: "received",
          receiptReceivedAtISO: "2026-03-30T11:45:00.000Z",
          evidenceLocation: "Dosar/Fiscal/aprilie-2026",
        }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.derived.readiness).toBe("ready")
    expect(payload.feedbackMessage).toContain("pregătit")
    expect(mocks.mutateStateMock).toHaveBeenCalled()
  })
})
