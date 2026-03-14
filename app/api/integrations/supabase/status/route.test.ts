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
  getSupabaseOperationalStatusMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/server/supabase-status", () => ({
  getSupabaseOperationalStatus: mocks.getSupabaseOperationalStatusMock,
}))

import { GET } from "./route"

describe("GET /api/integrations/supabase/status", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-demo",
      role: "owner",
    })
    mocks.getSupabaseOperationalStatusMock.mockResolvedValue({
      authBackend: "supabase",
      dataBackend: "supabase",
      restConfigured: true,
      storageConfigured: true,
      localFallbackAllowed: false,
      bucket: {
        ok: true,
        name: "compliscan-evidence-private",
        state: "present",
      },
      tables: {
        organizations: { ok: true },
      },
      summary: {
        healthyTables: 1,
        totalTables: 1,
        schemaReady: true,
        bucketReady: true,
        blockers: [],
        ready: true,
      },
    })
  })

  it("intoarce statusul operational pentru owner/compliance", async () => {
    const response = await GET(new Request("http://localhost/api/integrations/supabase/status"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get("x-request-id")).toBe(payload.requestId)
    expect(payload.ok).toBe(true)
    expect(payload.summary.ready).toBe(true)
  })

  it("respinge rolurile nepermise", async () => {
    mocks.requireRoleMock.mockImplementationOnce(() => {
      throw new mocks.AuthzErrorMock("Interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    })

    const response = await GET(new Request("http://localhost/api/integrations/supabase/status"))
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(response.headers.get("x-request-id")).toBe(payload.requestId)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })
})
