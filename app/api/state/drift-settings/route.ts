import { NextResponse } from "next/server"

import type { ComplianceDriftChange, ComplianceDriftSeverity } from "@/lib/compliance/types"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { mutateState } from "@/lib/server/mvp-store"

type DriftSettingsPayload = {
  severityOverrides?: Partial<Record<ComplianceDriftChange, ComplianceDriftSeverity | "default">>
}

export async function POST(request: Request) {
  try {
    requireRole(request, ["owner", "partner_manager", "compliance"], "actualizarea setarilor de drift")

    const body = (await request.json().catch(() => ({}))) as DriftSettingsPayload
    const severityOverrides = sanitizeOverrides(body.severityOverrides)

    const nextState = await mutateState((current) => ({
      ...current,
      driftSettings: {
        severityOverrides,
      },
    }))

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState)),
      message: "Setarile de severitate pentru drift au fost actualizate.",
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Setarile de drift nu au putut fi actualizate.",
      500,
      "DRIFT_SETTINGS_UPDATE_FAILED"
    )
  }
}

function sanitizeOverrides(
  value: DriftSettingsPayload["severityOverrides"]
): Partial<Record<ComplianceDriftChange, ComplianceDriftSeverity>> {
  if (!value || typeof value !== "object") return {}

  return Object.fromEntries(
    Object.entries(value).flatMap(([change, severity]) => {
      if (
        severity === "critical" ||
        severity === "high" ||
        severity === "medium" ||
        severity === "low"
      ) {
        return [[change, severity]]
      }

      return []
    })
  ) as Partial<Record<ComplianceDriftChange, ComplianceDriftSeverity>>
}
