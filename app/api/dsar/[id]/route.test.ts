import { beforeEach, describe, expect, it, vi } from "vitest"

import { DELETE, PATCH } from "./route"

const mocks = vi.hoisted(() => ({
  requireFreshRoleMock: vi.fn(),
  updateDsarMock: vi.fn(),
  deleteDsarMock: vi.fn(),
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
  updateDsar: mocks.updateDsarMock,
  deleteDsar: mocks.deleteDsarMock,
}))

const SESSION = { userId: "user-1", orgId: "org-1", orgName: "Org Test SRL", email: "test@site.ro" }

const SAMPLE_DSAR = {
  id: "dsar-1",
  orgId: "org-1",
  requesterName: "Ion Popescu",
  requesterEmail: "ion@exemplu.ro",
  requestType: "access",
  status: "received",
}

function patchRequest(id: string, body: Record<string, unknown>) {
  return new Request(`http://localhost/api/dsar/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("PATCH /api/dsar/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue(SESSION)
    mocks.updateDsarMock.mockResolvedValue(SAMPLE_DSAR)
  })

  it("aplica shortcut action si actualizeaza cererea in org-ul din sesiune", async () => {
    const res = await PATCH(patchRequest("dsar-1", { action: "mark-responded" }), {
      params: Promise.resolve({ id: "dsar-1" }),
    })

    expect(res.status).toBe(200)
    expect(mocks.updateDsarMock).toHaveBeenCalledWith(
      "org-1",
      "dsar-1",
      expect.objectContaining({ status: "responded" })
    )
  })

  it("respinge actiune necunoscuta", async () => {
    const res = await PATCH(patchRequest("dsar-1", { action: "wrong-action" }), {
      params: Promise.resolve({ id: "dsar-1" }),
    })

    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe("INVALID_ACTION")
  })

  it("respinge status invalid", async () => {
    const res = await PATCH(patchRequest("dsar-1", { status: "closed" }), {
      params: Promise.resolve({ id: "dsar-1" }),
    })

    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe("INVALID_STATUS")
  })

  it("returneaza 404 cand cererea nu exista", async () => {
    mocks.updateDsarMock.mockResolvedValueOnce(null)

    const res = await PATCH(patchRequest("dsar-missing", { status: "in_progress" }), {
      params: Promise.resolve({ id: "dsar-missing" }),
    })

    expect(res.status).toBe(404)
  })
})

describe("DELETE /api/dsar/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue(SESSION)
    mocks.deleteDsarMock.mockResolvedValue(true)
  })

  it("sterge cererea din org-ul din sesiune", async () => {
    const res = await DELETE(new Request("http://localhost/api/dsar/dsar-1", { method: "DELETE" }), {
      params: Promise.resolve({ id: "dsar-1" }),
    })

    expect(res.status).toBe(200)
    expect(mocks.deleteDsarMock).toHaveBeenCalledWith("org-1", "dsar-1")
  })

  it("returneaza 404 daca cererea lipseste", async () => {
    mocks.deleteDsarMock.mockResolvedValueOnce(false)

    const res = await DELETE(new Request("http://localhost/api/dsar/missing", { method: "DELETE" }), {
      params: Promise.resolve({ id: "missing" }),
    })

    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe("NOT_FOUND")
  })
})
