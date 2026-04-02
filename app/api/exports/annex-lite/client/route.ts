import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { buildClientAnnexLiteDocument } from "@/lib/server/annex-lite-client"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { getOrgContext } from "@/lib/server/org-context"

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, ["owner", "partner_manager", "compliance"], "exportul Annex IV lite")

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
    const document = buildClientAnnexLiteDocument(payload.compliancePack)

    return new Response(document.html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${document.fileName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Exportul Annex IV lite a esuat.",
      500,
      "ANNEX_LITE_EXPORT_FAILED"
    )
  }
}
