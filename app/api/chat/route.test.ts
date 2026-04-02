import { beforeEach, describe, expect, it, vi } from "vitest"

import { initialComplianceState } from "@/lib/compliance/engine"

const mocks = vi.hoisted(() => ({
  generateComplianceAnswerMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  requireFreshAuthenticatedSessionMock: vi.fn(),
  readFreshStateForOrgMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/gemini", () => ({
  generateComplianceAnswer: mocks.generateComplianceAnswerMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
}))

import { POST } from "./route"

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-demo",
      orgName: "Demo Org",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.readFreshStateForOrgMock.mockResolvedValue(structuredClone(initialComplianceState))
    mocks.generateComplianceAnswerMock.mockResolvedValue("Răspuns AI")
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId: string, updater: (state: typeof initialComplianceState) => unknown) => {
      updater(structuredClone(initialComplianceState))
      return structuredClone(initialComplianceState)
    })
  })

  it("cere autentificare pentru assistantul din dashboard", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValueOnce(new Error("AUTH"))

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Salut" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.error).toContain("Autentificarea")
  })

  it("citește și persistă conversația pe org-ul din sesiune", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Ce fac acum?" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.answer).toBe("Răspuns AI")
    expect(mocks.readFreshStateForOrgMock).toHaveBeenCalledWith("org-demo", "Demo Org")
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith(
      "org-demo",
      expect.any(Function),
      "Demo Org"
    )
  })
})
