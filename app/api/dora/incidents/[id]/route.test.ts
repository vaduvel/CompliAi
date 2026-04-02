import { beforeEach, describe, expect, it, vi } from "vitest"

import { PATCH } from "./route"

const mocks = vi.hoisted(() => ({
  requireFreshRoleMock: vi.fn(),
  updateIncidentMock: vi.fn(),
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

vi.mock("@/lib/server/dora-store", () => ({
  updateIncident: mocks.updateIncidentMock,
}))

const SESSION = { userId: "user-1", orgId: "org-1", orgName: "Org Test SRL", email: "test@site.ro" }

function patchRequest(id: string, body: Record<string, unknown>) {
  return new Request(`http://localhost/api/dora/incidents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("PATCH /api/dora/incidents/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue(SESSION)
    mocks.updateIncidentMock.mockResolvedValue({
      id: "dora-1",
      status: "resolved",
      resolvedAtISO: "2026-04-01T12:00:00.000Z",
    })
  })

  it("actualizeaza incidentul in org-ul sesiunii", async () => {
    const res = await PATCH(
      patchRequest("dora-1", { status: "resolved" }),
      { params: Promise.resolve({ id: "dora-1" }) }
    )

    expect(res.status).toBe(200)
    expect(mocks.updateIncidentMock).toHaveBeenCalledWith(
      "org-1",
      "dora-1",
      expect.objectContaining({ status: "resolved" })
    )
  })

  it("respinge status invalid", async () => {
    const res = await PATCH(
      patchRequest("dora-1", { status: "broken" }),
      { params: Promise.resolve({ id: "dora-1" }) }
    )

    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe("INVALID_STATUS")
  })

  it("returneaza 404 daca incidentul lipseste", async () => {
    mocks.updateIncidentMock.mockResolvedValueOnce(null)

    const res = await PATCH(
      patchRequest("missing", { status: "resolved" }),
      { params: Promise.resolve({ id: "missing" }) }
    )

    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe("NOT_FOUND")
  })
})
