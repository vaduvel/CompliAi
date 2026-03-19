import { beforeEach, describe, expect, it, vi } from "vitest"

const sentryMocks = vi.hoisted(() => ({
  captureException: vi.fn(),
  flush: vi.fn().mockResolvedValue(undefined),
  withScope: vi.fn(
    (
      callback: (scope: {
        setLevel: (value: string) => void
        setTag: (key: string, value: string) => void
        setContext: (key: string, value: unknown) => void
      }) => void
    ) => {
      callback({
        setLevel: vi.fn(),
        setTag: vi.fn(),
        setContext: vi.fn(),
      })
    }
  ),
}))

vi.mock("@sentry/nextjs", () => sentryMocks)

import { logRouteError } from "./operational-logger"

describe("logRouteError", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0"
  })

  it("nu trimite in Sentry erorile de validare 4xx", async () => {
    await logRouteError(
      {
        route: "/api/scan",
        requestId: "req-validation",
        startedAtMs: Date.now(),
      },
      Object.assign(new Error("Payload invalid"), { name: "RequestValidationError" }),
      {
        code: "INVALID_REQUEST",
        status: 400,
      }
    )

    expect(sentryMocks.captureException).not.toHaveBeenCalled()
    expect(sentryMocks.flush).not.toHaveBeenCalled()
  })

  it("trimite in Sentry erorile reale 5xx", async () => {
    await logRouteError(
      {
        route: "/api/reports",
        requestId: "req-500",
        startedAtMs: Date.now(),
      },
      new Error("db down"),
      {
        code: "REPORTS_GENERATE_FAILED",
        status: 500,
      }
    )

    expect(sentryMocks.captureException).toHaveBeenCalledTimes(1)
    expect(sentryMocks.flush).toHaveBeenCalledTimes(1)
  })
})
