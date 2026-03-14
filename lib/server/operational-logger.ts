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

export function logRouteError(
  context: RequestContext | undefined,
  error: unknown,
  details: Omit<OperationalLogDetails, "errorName" | "message"> = {}
) {
  const normalizedError = error instanceof Error ? error : new Error("Unknown route error")

  logOperationalEvent("error", "route.error", context, {
    ...details,
    errorName: normalizedError.name,
    message: normalizedError.message,
  })
}
