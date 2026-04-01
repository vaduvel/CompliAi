// Sprint 8 — ANAF Live Readiness smoke test
import { describe, it, expect, vi, beforeEach } from "vitest"

import { GET } from "./route"

const mocks = vi.hoisted(() => ({
  getAnafModeMock: vi.fn(),
  getAnafEnvironmentMock: vi.fn(),
  isAnafProductionUnlockedMock: vi.fn(),
  readStateMock: vi.fn(),
}))

vi.mock("@/lib/server/efactura-anaf-client", () => ({
  getAnafMode: mocks.getAnafModeMock,
  getAnafEnvironment: mocks.getAnafEnvironmentMock,
  isAnafProductionUnlocked: mocks.isAnafProductionUnlockedMock,
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
    mocks.getAnafEnvironmentMock.mockReturnValue("test")
    mocks.isAnafProductionUnlockedMock.mockReturnValue(false)
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
    mocks.getAnafEnvironmentMock.mockReturnValue("prod")
    mocks.isAnafProductionUnlockedMock.mockReturnValue(true)

    const res = await GET()
    const body = await res.json()

    expect(body.mode).toBe("real")
    expect(body.ready).toBe(true)
    expect(body.productionReady).toBe(true)
    expect(body.missingConfig).toHaveLength(0)
  })

  it("returnează mode=test când credențialele există dar producția nu este deblocată", async () => {
    process.env.ANAF_CLIENT_ID = "test-id"
    process.env.ANAF_CLIENT_SECRET = "test-secret"
    process.env.ANAF_CUI = "RO12345678"
    mocks.getAnafModeMock.mockReturnValue("test")
    mocks.getAnafEnvironmentMock.mockReturnValue("test")

    const res = await GET()
    const body = await res.json()

    expect(body.mode).toBe("test")
    expect(body.ready).toBe(true)
    expect(body.productionReady).toBe(false)
    expect(body.message).toContain("TEST")
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
    mocks.getAnafEnvironmentMock.mockReturnValue("prod")
    mocks.isAnafProductionUnlockedMock.mockReturnValue(true)
    process.env.ANAF_CLIENT_ID = "x"
    process.env.ANAF_CLIENT_SECRET = "y"
    process.env.ANAF_CUI = "z"
    const res2 = await GET()
    const body2 = await res2.json()
    expect(body2.message).toContain("real")
  })
})
