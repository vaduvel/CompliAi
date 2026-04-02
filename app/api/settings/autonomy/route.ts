/**
 * Autonomy Settings API — get/update per-user automation preferences.
 *
 * GET  /api/settings/autonomy
 * PATCH /api/settings/autonomy
 */
import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { getAutonomySettings, saveAutonomySettings } from "@/lib/server/autonomy-resolver"

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, ["owner", "compliance"], "autonomy-get")

    const settings = await getAutonomySettings(session.userId, session.orgId)
    return NextResponse.json({ settings })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la încărcarea setărilor.", 500, "AUTONOMY_GET_FAILED")
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireFreshRole(request, ["owner", "compliance"], "autonomy-update")

    const body = await request.json()

    const saved = await saveAutonomySettings(session.userId, session.orgId, {
      lowRiskPolicy: body.lowRiskPolicy,
      mediumRiskPolicy: body.mediumRiskPolicy,
      highRiskPolicy: body.highRiskPolicy,
      categoryOverrides: body.categoryOverrides,
    })

    return NextResponse.json({ settings: saved })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la salvarea setărilor.", 500, "AUTONOMY_UPDATE_FAILED")
  }
}
