import * as Sentry from "@sentry/nextjs"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { logRouteError } from "./operational-logger"
import { RequestValidationError } from "./request-validation"

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  flush: vi.fn().mockResolvedValue(true),
  withScope: vi.fn((callback: (scope: Record<string, ReturnType<typeof vi.fn>>) => void) => {
    callback({
      setContext: vi.fn(),
      setLevel: vi.fn(),
      setTag: vi.fn(),
    })
  }),
}))

describe("logRouteError", () => {
  beforeEach(() => {
    vi.mocked(Sentry.captureException).mockClear()
    vi.mocked(Sentry.flush).mockClear()
    vi.mocked(Sentry.withScope).mockClear()
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0"
    vi.spyOn(console, "error").mockImplementation(() => undefined)
  })

  it("captures unexpected route errors in Sentry", async () => {
    await logRouteError(undefined, new Error("Boom"), {
      route: "/api/example",
      status: 500,
    })

    expect(Sentry.captureException).toHaveBeenCalledTimes(1)
    expect(Sentry.flush).toHaveBeenCalledTimes(1)
  })

  it("skips Sentry capture for request validation errors", async () => {
    await logRouteError(undefined, new RequestValidationError("Payload invalid."), {
      route: "/api/example",
      status: 400,
    })

    expect(Sentry.captureException).not.toHaveBeenCalled()
    expect(Sentry.flush).not.toHaveBeenCalled()
  })
})
