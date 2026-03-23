import { NextResponse } from "next/server"

import { readSessionFromRequest, setUserMode } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { RequestValidationError, requirePlainObject } from "@/lib/server/request-validation"

const ALLOWED_MODES = ["solo", "partner", "compliance"] as const

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/auth/set-user-mode")

  try {
    const session = readSessionFromRequest(request)
    if (!session) {
      return jsonError("Sesiune invalida.", 401, "AUTH_SESSION_REQUIRED", undefined, context)
    }

    const body = requirePlainObject(await request.json())
    const mode = typeof body.mode === "string" ? body.mode.trim() : ""

    if (!ALLOWED_MODES.includes(mode as (typeof ALLOWED_MODES)[number])) {
      return jsonError(
        `Mod invalid. Valorile acceptate sunt: ${ALLOWED_MODES.join(", ")}.`,
        400,
        "INVALID_USER_MODE",
        undefined,
        context
      )
    }

    await setUserMode(session.userId, mode as (typeof ALLOWED_MODES)[number])

    return NextResponse.json({ ok: true, userMode: mode })
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return jsonError("Utilizatorul curent nu exista.", 404, "AUTH_USER_NOT_FOUND", undefined, context)
    }

    const message = error instanceof Error ? error.message : "Eroare la setarea modului de utilizare."
    await logRouteError(context, error, {
      code: "SET_USER_MODE_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })
    return jsonError(message, 500, "SET_USER_MODE_FAILED", undefined, context)
  }
}
