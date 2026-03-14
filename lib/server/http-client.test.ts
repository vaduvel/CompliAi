import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { fetchWithOperationalGuard } from "@/lib/server/http-client"

describe("fetchWithOperationalGuard", () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it("reincearca pe status retryable si intoarce raspunsul bun", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    global.fetch = fetchMock as typeof fetch

    const promise = fetchWithOperationalGuard("https://example.test", {
      retries: 1,
      retryDelayMs: 10,
    })

    await vi.runAllTimersAsync()
    const response = await promise

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(response.status).toBe(200)
  })

  it("arunca eroare de timeout clara", async () => {
    global.fetch = vi.fn((_input, init) => {
      const signal = init?.signal as AbortSignal | undefined
      return new Promise((_, reject) => {
        signal?.addEventListener("abort", () => {
          const error = new Error("Aborted")
          error.name = "AbortError"
          reject(error)
        })
      })
    }) as typeof fetch

    const promise = fetchWithOperationalGuard("https://example.test", {
      timeoutMs: 5,
      retries: 0,
      label: "vision",
    })
    const expectation = expect(promise).rejects.toThrow("HTTP_TIMEOUT:vision:5")

    await vi.advanceTimersByTimeAsync(10)

    await expectation
  })
})
