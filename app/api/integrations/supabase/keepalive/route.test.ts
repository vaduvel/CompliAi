import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  runSupabaseKeepaliveMock: vi.fn(),
}))

vi.mock("@/lib/server/supabase-storage", () => ({
  runSupabaseKeepalive: mocks.runSupabaseKeepaliveMock,
}))

import { GET, POST } from "./route"

describe("Supabase keepalive route", () => {
  const originalKeepaliveKey = process.env.COMPLISCAN_KEEPALIVE_KEY
  const originalResetKey = process.env.COMPLISCAN_RESET_KEY

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.COMPLISCAN_KEEPALIVE_KEY = "keepalive-secret"
    process.env.COMPLISCAN_RESET_KEY = "reset-secret"
  })

  afterEach(() => {
    if (originalKeepaliveKey === undefined) delete process.env.COMPLISCAN_KEEPALIVE_KEY
    else process.env.COMPLISCAN_KEEPALIVE_KEY = originalKeepaliveKey

    if (originalResetKey === undefined) delete process.env.COMPLISCAN_RESET_KEY
    else process.env.COMPLISCAN_RESET_KEY = originalResetKey
  })

  it("respinge cererile fara cheia de keepalive", async () => {
    const response = await GET(new Request("http://localhost/api/integrations/supabase/keepalive"))
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("SUPABASE_KEEPALIVE_FORBIDDEN")
  })

  it("porneste keepalive-ul pe GET cand cheia este valida", async () => {
    mocks.runSupabaseKeepaliveMock.mockResolvedValueOnce({
      bucketName: "compliscan-heartbeat",
      createdBucket: false,
      objectPath: "cron/last-ping.txt",
      objectKey: "compliscan-heartbeat/cron/last-ping.txt",
      timestamp: "2026-03-13T10:00:00.000Z",
      source: "manual",
    })

    const response = await GET(
      new Request("http://localhost/api/integrations/supabase/keepalive?source=cron", {
        headers: { "x-compliscan-keepalive-key": "keepalive-secret" },
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.bucketName).toBe("compliscan-heartbeat")
    expect(mocks.runSupabaseKeepaliveMock).toHaveBeenCalledWith({
      source: "cron",
      note: "Supabase keepalive ping",
    })
  })

  it("porneste keepalive-ul pe POST cu note si cheia valida", async () => {
    mocks.runSupabaseKeepaliveMock.mockResolvedValueOnce({
      bucketName: "compliscan-heartbeat",
      createdBucket: true,
      objectPath: "cron/last-ping.txt",
      objectKey: "compliscan-heartbeat/cron/last-ping.txt",
      timestamp: "2026-03-13T10:05:00.000Z",
      source: "manual",
    })

    const response = await POST(
      new Request("http://localhost/api/integrations/supabase/keepalive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-compliscan-keepalive-key": "keepalive-secret",
        },
        body: JSON.stringify({
          source: "manual-trigger",
          note: "ping extern",
        }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(mocks.runSupabaseKeepaliveMock).toHaveBeenCalledWith({
      source: "manual-trigger",
      note: "ping extern",
    })
  })

  it("mapeaza erorile helperului", async () => {
    mocks.runSupabaseKeepaliveMock.mockRejectedValueOnce(new Error("storage offline"))

    const response = await GET(
      new Request("http://localhost/api/integrations/supabase/keepalive", {
        headers: { "x-compliscan-keepalive-key": "keepalive-secret" },
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.code).toBe("SUPABASE_KEEPALIVE_FAILED")
  })
})
