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
  requireFreshAuthenticatedSessionMock: vi.fn(),
  readFreshStateForOrgMock: vi.fn(),
  generateContractsBaselinePackMock: vi.fn(),
  logRouteErrorMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
}))

vi.mock("@/lib/compliance/contracts-drafts", () => ({
  generateContractsBaselinePack: mocks.generateContractsBaselinePackMock,
}))

vi.mock("@/lib/server/operational-logger", () => ({
  logRouteError: mocks.logRouteErrorMock,
}))

import { GET } from "./route"

describe("GET /api/contracts/pack", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readFreshStateForOrgMock.mockResolvedValue({
      orgProfile: {
        sector: "retail",
        employeeCount: "10-49",
        usesAITools: true,
      },
    })
    mocks.generateContractsBaselinePackMock.mockReturnValue({
      kind: "contracts-baseline",
      title: "Pachet minim baseline contractual",
      summary: "sumar contracte",
      assets: [{ id: "contracts-matrix" }],
      completionChecklist: ["c1", "c2", "c3"],
      generatorDocumentType: "contract-template",
      generatorLabel: "Generează template-ul",
      returnEvidenceNote: "return note contracts",
    })
  })

  it("cere autentificare când nu există sesiune", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValue(
      new mocks.AuthzErrorMock("Autentificare necesară.", 401, "UNAUTHORIZED")
    )

    const response = await GET(new Request("http://localhost/api/contracts/pack"))
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.code).toBe("UNAUTHORIZED")
  })

  it("returnează pachetul contractual pregătit", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-demo-imm",
      email: "demo@demo-imm.compliscan.ro",
      orgName: "Demo Retail SRL",
      role: "owner",
    })

    const response = await GET(new Request("http://localhost/api/contracts/pack?kind=contracts-baseline"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({
      kind: "contracts-baseline",
      pack: {
        kind: "contracts-baseline",
        title: "Pachet minim baseline contractual",
        summary: "sumar contracte",
        assets: [{ id: "contracts-matrix" }],
        completionChecklist: ["c1", "c2", "c3"],
        generatorDocumentType: "contract-template",
        generatorLabel: "Generează template-ul",
        returnEvidenceNote: "return note contracts",
      },
    })
    expect(mocks.generateContractsBaselinePackMock).toHaveBeenCalledWith({
      orgName: "Demo Retail SRL",
      sector: "retail",
      employeeCount: "10-49",
      hasAiTools: true,
    })
    expect(mocks.readFreshStateForOrgMock).toHaveBeenCalledWith("org-demo-imm", "Demo Retail SRL")
  })

  it("respinge tipurile necunoscute", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-demo-imm",
      email: "demo@demo-imm.compliscan.ro",
      orgName: "Demo Retail SRL",
      role: "owner",
    })

    const response = await GET(new Request("http://localhost/api/contracts/pack?kind=unknown"))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("CONTRACTS_PACK_KIND_INVALID")
  })
})
