import { NextRequest } from "next/server"

import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import {
  buildCompliScanFileName,
  buildCompliScanSnapshot,
  serializeCompliScanYaml,
} from "@/lib/server/compliscan-export"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { getOrgContext } from "@/lib/server/org-context"

export async function GET(request: NextRequest) {
  try {
    const session = await requireFreshRole(request, ["owner", "partner_manager", "compliance"], "exportul CompliScan")

    const format = request.nextUrl.searchParams.get("format") === "yaml" ? "yaml" : "json"
    const state =
      (await readFreshStateForOrg(session.orgId, session.orgName)) ??
      normalizeComplianceState(initialComplianceState)
    const workspaceOverride = {
      ...(await getOrgContext({ request })),
      orgId: session.orgId,
      orgName: session.orgName,
      userRole: session.role,
    }
    const payload = await buildDashboardPayload(state, workspaceOverride)
    const snapshot = buildCompliScanSnapshot(payload)
    snapshot.drift = payload.state.driftRecords.map((item) => ({
      id: item.id,
      snapshotId: item.snapshotId,
      comparedToSnapshotId: item.comparedToSnapshotId,
      type: item.type,
      change: item.change,
      severity: item.severity,
      systemId: item.systemLabel,
      sourceId: item.sourceDocument,
      detectedAt: item.detectedAtISO,
      before: item.before,
      after: item.after,
    }))
    const fileName = buildCompliScanFileName(snapshot.workspace.name, snapshot.generatedAt, format)
    const body =
      format === "yaml"
        ? serializeCompliScanYaml(snapshot)
        : JSON.stringify(snapshot, null, 2)

    return new Response(body, {
      headers: {
        "Content-Type":
          format === "yaml"
            ? "application/yaml; charset=utf-8"
            : "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Exportul CompliScan a esuat.",
      500,
      "COMPLISCAN_EXPORT_FAILED"
    )
  }
}
