import { NextResponse } from "next/server"

export function jsonError(
  message: string,
  status = 400,
  code = "REQUEST_FAILED",
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      error: message,
      code,
      ...(extra ?? {}),
    },
    { status }
  )
}
