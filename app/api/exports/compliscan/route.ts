import { NextRequest } from "next/server"

import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import {
  buildCompliScanFileName,
  buildCompliScanSnapshot,
  serializeCompliScanYaml,
} from "@/lib/server/compliscan-export"
import { readState } from "@/lib/server/mvp-store"

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format") === "yaml" ? "yaml" : "json"
  const payload = await buildDashboardPayload(await readState())
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
}
