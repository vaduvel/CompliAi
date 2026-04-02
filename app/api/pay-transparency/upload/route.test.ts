import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireFreshRoleMock: vi.fn(),
  saveSalaryRecordsMock: vi.fn(),
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

vi.mock("@/lib/server/pay-transparency-store", () => ({
  saveSalaryRecords: mocks.saveSalaryRecordsMock,
}))

import { POST } from "./route"

describe("POST /api/pay-transparency/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-pt",
      orgName: "Org Pay",
      role: "owner",
    })
    mocks.saveSalaryRecordsMock.mockResolvedValue([
      {
        id: "salary-1",
        department: "Marketing",
        roleTitle: "Specialist",
        salaryGross: 5000,
        gender: "female",
      },
    ])
  })

  it("salvează înregistrările pe org-ul din sesiunea fresh", async () => {
    const response = await POST(
      new Request("http://localhost/api/pay-transparency/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records: [
            {
              department: "Marketing",
              roleTitle: "Specialist",
              salaryGross: 5000,
              gender: "female",
            },
          ],
        }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.saveSalaryRecordsMock).toHaveBeenCalledWith("org-pt", [
      {
        department: "Marketing",
        roleTitle: "Specialist",
        salaryGross: 5000,
        gender: "female",
      },
    ])
    expect(payload.recordsSaved).toBe(1)
  })

  it("respinge payload-ul gol", async () => {
    const response = await POST(
      new Request("http://localhost/api/pay-transparency/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: [] }),
      })
    )

    expect(response.status).toBe(400)
  })
})
