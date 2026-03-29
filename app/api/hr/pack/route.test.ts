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
  readSessionFromRequestMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  readStateMock: vi.fn(),
  generateJobDescriptionPackMock: vi.fn(),
  logRouteErrorMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  readSessionFromRequest: mocks.readSessionFromRequestMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readState: mocks.readStateMock,
}))

vi.mock("@/lib/compliance/hr-drafts", () => ({
  generateJobDescriptionPack: mocks.generateJobDescriptionPackMock,
}))

vi.mock("@/lib/server/operational-logger", () => ({
  logRouteError: mocks.logRouteErrorMock,
}))

import { GET } from "./route"

describe("GET /api/hr/pack", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getOrgContextMock.mockResolvedValue({ orgId: "org-demo-imm", orgName: "Demo Retail SRL" })
    mocks.readStateMock.mockResolvedValue({
      orgProfile: {
        sector: "retail",
        employeeCount: "10-49",
        usesAITools: true,
      },
    })
    mocks.generateJobDescriptionPackMock.mockReturnValue({
      title: "Pachet minim fișe de post",
      summary: "sumar",
      assets: [{ id: "template-1" }],
      completionChecklist: ["c1", "c2", "c3"],
    })
  })

  it("cere autentificare când nu există sesiune", async () => {
    mocks.readSessionFromRequestMock.mockReturnValue(null)

    const response = await GET(new Request("http://localhost/api/hr/pack"))
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.code).toBe("UNAUTHORIZED")
  })

  it("returnează pachetul HR pregătit din profilul organizației", async () => {
    mocks.readSessionFromRequestMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-demo-imm",
      email: "demo@demo-imm.compliscan.ro",
      orgName: "Demo Retail SRL",
      role: "owner",
    })

    const response = await GET(new Request("http://localhost/api/hr/pack"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({
      pack: {
        title: "Pachet minim fișe de post",
        summary: "sumar",
        assets: [{ id: "template-1" }],
        completionChecklist: ["c1", "c2", "c3"],
      },
    })
    expect(mocks.generateJobDescriptionPackMock).toHaveBeenCalledWith({
      orgName: "Demo Retail SRL",
      sector: "retail",
      employeeCount: "10-49",
      hasAiTools: true,
    })
  })
})
