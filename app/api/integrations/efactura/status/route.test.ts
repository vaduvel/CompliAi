// Sprint 8 — ANAF Live Readiness smoke test
import { describe, it, expect, vi, beforeEach } from "vitest"

import { GET } from "./route"

const mocks = vi.hoisted(() => ({
  getAnafModeMock: vi.fn(),
  readStateMock: vi.fn(),
}))

vi.mock("@/lib/server/efactura-anaf-client", () => ({
  getAnafMode: mocks.getAnafModeMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readState: mocks.readStateMock,
}))

const BASE_STATE = {
  efacturaConnected: false,
  efacturaSyncedAtISO: null,
}

describe("GET /api/integrations/efactura/status", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readStateMock.mockResolvedValue(BASE_STATE)
    mocks.getAnafModeMock.mockReturnValue("mock")
    delete process.env.ANAF_CLIENT_ID
    delete process.env.ANAF_CLIENT_SECRET
    delete process.env.ANAF_CUI
  })

  it("returnează mode=mock când lipsesc credențialele", async () => {
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.mode).toBe("mock")
    expect(body.ready).toBe(false)
    expect(body.missingConfig).toContain("ANAF_CLIENT_ID")
    expect(body.missingConfig).toContain("ANAF_CLIENT_SECRET")
  })

  it("returnează mode=real și ready=true când toate env sunt setate", async () => {
    process.env.ANAF_CLIENT_ID = "test-id"
    process.env.ANAF_CLIENT_SECRET = "test-secret"
    process.env.ANAF_CUI = "RO12345678"
    mocks.getAnafModeMock.mockReturnValue("real")

    const res = await GET()
    const body = await res.json()

    expect(body.mode).toBe("real")
    expect(body.ready).toBe(true)
    expect(body.missingConfig).toHaveLength(0)
  })

  it("returnează connected din state", async () => {
    mocks.readStateMock.mockResolvedValue({
      ...BASE_STATE,
      efacturaConnected: true,
      efacturaSyncedAtISO: "2026-03-17T10:00:00.000Z",
    })

    const res = await GET()
    const body = await res.json()

    expect(body.connected).toBe(true)
    expect(body.syncedAtISO).toBe("2026-03-17T10:00:00.000Z")
  })

  it("include mesaj clar pentru fiecare mod", async () => {
    const res = await GET()
    const body = await res.json()
    expect(body.message).toContain("demo")

    mocks.getAnafModeMock.mockReturnValue("real")
    process.env.ANAF_CLIENT_ID = "x"
    process.env.ANAF_CLIENT_SECRET = "y"
    process.env.ANAF_CUI = "z"
    const res2 = await GET()
    const body2 = await res2.json()
    expect(body2.message).toContain("real")
  })
})
