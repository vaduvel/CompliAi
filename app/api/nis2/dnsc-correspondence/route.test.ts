import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  AuthzErrorClass: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 401, code = "AUTH_SESSION_REQUIRED") {
      super(message)
      this.status = status
      this.code = code
    }
  },
  requireFreshRoleMock: vi.fn(),
  addDnscRegistrationCorrespondenceEntryMock: vi.fn(),
  deleteDnscRegistrationCorrespondenceEntryMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorClass,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/nis2-store", () => ({
  addDnscRegistrationCorrespondenceEntry: mocks.addDnscRegistrationCorrespondenceEntryMock,
  deleteDnscRegistrationCorrespondenceEntry: mocks.deleteDnscRegistrationCorrespondenceEntryMock,
}))

import { DELETE, POST } from "./route"

describe("NIS2 DNSC correspondence route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      orgId: "org-session",
      orgName: "Marketing Growth Hub SRL",
      role: "owner",
    })
    mocks.addDnscRegistrationCorrespondenceEntryMock.mockResolvedValue([{ id: "corr-1" }])
    mocks.deleteDnscRegistrationCorrespondenceEntryMock.mockResolvedValue([])
  })

  it("salvează corespondența pe org-ul sesiunii", async () => {
    const response = await POST(
      new Request("http://localhost/api/nis2/dnsc-correspondence", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-compliscan-org-id": "wrong-org" },
        body: JSON.stringify({
          date: "2026-04-02",
          direction: "sent",
          summary: "Am trimis clarificările către DNSC.",
        }),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.addDnscRegistrationCorrespondenceEntryMock).toHaveBeenCalledWith("org-session", {
      date: "2026-04-02",
      direction: "sent",
      summary: "Am trimis clarificările către DNSC.",
    })
    expect(body.correspondence).toEqual([{ id: "corr-1" }])
  })

  it("șterge corespondența de pe org-ul sesiunii", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/nis2/dnsc-correspondence?id=corr-1", {
        method: "DELETE",
        headers: { "x-compliscan-org-id": "wrong-org" },
      })
    )

    expect(response.status).toBe(200)
    expect(mocks.deleteDnscRegistrationCorrespondenceEntryMock).toHaveBeenCalledWith("org-session", "corr-1")
  })

  it("refuză accesul fără sesiune", async () => {
    mocks.requireFreshRoleMock.mockRejectedValueOnce(
      new mocks.AuthzErrorClass("Ai nevoie de sesiune activa.")
    )

    const response = await POST(
      new Request("http://localhost/api/nis2/dnsc-correspondence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: "2026-04-02",
          direction: "sent",
          summary: "Test",
        }),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.code).toBe("AUTH_SESSION_REQUIRED")
  })
})
