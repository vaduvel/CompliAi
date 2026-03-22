import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { readState } from "@/lib/server/mvp-store"

export async function GET(request: Request) {
  try {
    requireRole(request, ["owner", "partner_manager", "compliance", "reviewer", "viewer"], "vizualizarea log-ului de audit")
    const state = await readState()
    return NextResponse.json({ events: state.events ?? [] })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError("Log-ul de audit nu a putut fi incarcat.", 500, "AUDIT_LOG_FAILED")
  }
}
