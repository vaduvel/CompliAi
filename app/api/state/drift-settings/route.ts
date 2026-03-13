import { NextResponse } from "next/server"

import type { ComplianceDriftChange, ComplianceDriftSeverity } from "@/lib/compliance/types"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { mutateState } from "@/lib/server/mvp-store"

type DriftSettingsPayload = {
  severityOverrides?: Partial<Record<ComplianceDriftChange, ComplianceDriftSeverity | "default">>
}

export async function POST(request: Request) {
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
