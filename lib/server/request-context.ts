import { randomUUID } from "node:crypto"

export type RequestContext = {
  route: string
  requestId: string
  startedAtMs: number
}

export function createRequestContext(request: Request | undefined, route: string): RequestContext {
  const incomingRequestId = request?.headers.get("x-request-id")?.trim()

  return {
    route,
    requestId: incomingRequestId || randomUUID(),
    startedAtMs: Date.now(),
  }
}

export function getRequestDurationMs(context: RequestContext) {
  return Date.now() - context.startedAtMs
}
