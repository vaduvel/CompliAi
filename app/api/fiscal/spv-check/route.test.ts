import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  ensureValidTokenMock: vi.fn(),
  fetchSpvMessagesMock: vi.fn(),
  markTokenUsedMock: vi.fn(),
  readStateForOrgMock: vi.fn(),
  requireRoleMock: vi.fn(),
  writeStateForOrgMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readStateForOrg: mocks.readStateForOrgMock,
  writeStateForOrg: mocks.writeStateForOrgMock,
}))

vi.mock("@/lib/anaf-spv-client", () => ({
  ensureValidToken: mocks.ensureValidTokenMock,
  fetchSpvMessages: mocks.fetchSpvMessagesMock,
  markTokenUsed: mocks.markTokenUsedMock,
}))

import { POST } from "./route"

describe("POST /api/fiscal/spv-check", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue({
      orgId: "org-session",
      orgName: "Marketing Growth Hub SRL",
    })
    mocks.readStateForOrgMock.mockResolvedValue({
      orgProfile: { cui: "RO45758405" },
      findings: [],
    })
    mocks.ensureValidTokenMock.mockResolvedValue({
      token: {
        accessToken: "token-1",
        refreshToken: "refresh-1",
      },
      expired: false,
    })
    mocks.fetchSpvMessagesMock.mockResolvedValue({
      mesaje: [
        {
          id: "msg-1",
          tip: "Factura respinsă",
          dataCreare: "2026-04-02",
          detalii: "Eroare XML critică la validare.",
        },
      ],
    })
  })

  it("citește CUI-ul și salvează findings în state-ul org-ului sesiunii", async () => {
    const response = await POST(
      new Request("http://localhost/api/fiscal/spv-check", {
        method: "POST",
        headers: {
          "x-compliscan-org-id": "org-header",
          "x-compliscan-org-name": "Marketing Growth Hub SRL",
        },
      })
    )

    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.cui).toBe("RO45758405")
    expect(mocks.readStateForOrgMock).toHaveBeenCalledWith("org-session")
    expect(mocks.writeStateForOrgMock).toHaveBeenCalledWith(
      "org-session",
      expect.objectContaining({
        findings: [
          expect.objectContaining({
            id: "spv-msg-1",
            category: "E_FACTURA",
          }),
        ],
      }),
      "Marketing Growth Hub SRL"
    )
  })

  it("blochează verificarea dacă org-ul activ nu are CUI", async () => {
    mocks.readStateForOrgMock.mockResolvedValueOnce({
      orgProfile: { cui: "" },
      findings: [],
    })

    const response = await POST(
      new Request("http://localhost/api/fiscal/spv-check", {
        method: "POST",
      })
    )

    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.code).toBe("NO_CUI")
    expect(mocks.fetchSpvMessagesMock).not.toHaveBeenCalled()
    expect(mocks.writeStateForOrgMock).not.toHaveBeenCalled()
  })
})
