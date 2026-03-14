import { NextResponse } from "next/server"

import type { RequestContext } from "@/lib/server/request-context"

export function jsonError(
  message: string,
  status = 400,
  code = "REQUEST_FAILED",
  extra?: Record<string, unknown>,
  context?: RequestContext
) {
  const headers = new Headers()

  if (context?.requestId) {
    headers.set("x-request-id", context.requestId)
  }

  return NextResponse.json(
    {
      error: message,
      code,
      ...(context?.requestId ? { requestId: context.requestId } : {}),
      ...(extra ?? {}),
    },
    { status, headers }
  )
}

export function jsonWithRequestContext<T extends Record<string, unknown>>(
  payload: T,
  context?: RequestContext,
  init?: ResponseInit
) {
  const headers = new Headers(init?.headers)

  if (context?.requestId) {
    headers.set("x-request-id", context.requestId)
  }

  return NextResponse.json(
    {
      ...payload,
      ...(context?.requestId ? { requestId: context.requestId } : {}),
    },
    {
      ...init,
      headers,
    }
  )
}

export function withRequestIdHeaders(init: ResponseInit | undefined, context?: RequestContext) {
  const headers = new Headers(init?.headers)

  if (context?.requestId) {
    headers.set("x-request-id", context.requestId)
  }

  return {
    ...init,
    headers,
  }
}
