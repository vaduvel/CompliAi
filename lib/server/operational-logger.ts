import * as Sentry from "@sentry/nextjs"

import type { RequestContext } from "@/lib/server/request-context"

export type OperationalLogLevel = "info" | "warn" | "error"

type OperationalLogDetails = {
  code?: string
  durationMs?: number
  errorName?: string
  message?: string
  method?: string
  metadata?: Record<string, unknown>
  route?: string
  status?: number
}

export function logOperationalEvent(
  level: OperationalLogLevel,
  event: string,
  context: RequestContext | undefined,
  details: OperationalLogDetails = {}
) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    requestId: context?.requestId,
    route: details.route ?? context?.route,
    ...details,
  }

  const line = JSON.stringify(payload)

  if (level === "error") {
    console.error(line)
    return
  }

  if (level === "warn") {
    console.warn(line)
    return
  }

  console.info(line)
}

export async function logRouteError(
  context: RequestContext | undefined,
  error: unknown,
  details: Omit<OperationalLogDetails, "errorName" | "message"> = {}
) {
  const normalizedError = error instanceof Error ? error : new Error("Unknown route error")

  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.withScope((scope) => {
      scope.setLevel("error")
      scope.setTag("event", "route.error")

      if (context?.route) {
        scope.setTag("route", context.route)
      }

      if (details.code) {
        scope.setTag("code", details.code)
      }

      if (context?.requestId) {
        scope.setContext("request", {
          requestId: context.requestId,
        })
      }

      scope.setContext("route_error", {
        durationMs: details.durationMs,
        errorName: normalizedError.name,
        message: normalizedError.message,
        metadata: details.metadata,
        method: details.method,
        route: details.route ?? context?.route,
        status: details.status,
      })

      Sentry.captureException(normalizedError)
    })

    await Sentry.flush(1500)
  }

  logOperationalEvent("error", "route.error", context, {
    ...details,
    errorName: normalizedError.name,
    message: normalizedError.message,
  })
}
