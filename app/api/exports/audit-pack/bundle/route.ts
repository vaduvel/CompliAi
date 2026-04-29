import { buildAuditPack } from "@/lib/server/audit-pack"
import { buildAuditPackBundle } from "@/lib/server/audit-pack-bundle"
import { buildCompliScanSnapshot } from "@/lib/server/compliscan-export"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import {
  AuthzError,
  listUserMemberships,
  requireFreshRole,
  resolveUserMode,
} from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import { readNis2State } from "@/lib/server/nis2-store"
import { getWhiteLabelConfig } from "@/lib/server/white-label"
import {
  getPartnerAccountPlanStatus,
  hasLegacyPartnerOrgPlan,
  requirePlan,
  PlanError,
} from "@/lib/server/plan"
import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { getOrgContext } from "@/lib/server/org-context"

export const runtime = "nodejs"

async function canExportForPartnerClient(session: Awaited<ReturnType<typeof requireFreshRole>>) {
  if (session.role !== "partner_manager") return false
  const userMode = await resolveUserMode(session).catch(() => null)
  if (userMode !== "partner") return false

  const memberships = (await listUserMemberships(session.userId)).filter(
    (membership) => membership.status === "active" && membership.role === "partner_manager"
  )
  const clientOrgIds = Array.from(new Set(memberships.map((membership) => membership.orgId)))
  const status = await getPartnerAccountPlanStatus({
    userId: session.userId,
    currentOrgs: clientOrgIds.length,
    legacyPartnerEnabled: await hasLegacyPartnerOrgPlan(clientOrgIds),
  })

  return status.source === "trial" || status.source === "legacy_org_partner" || status.source === "account"
}

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, ["owner", "partner_manager", "compliance"], "exportul Audit Pack bundle")
    try {
      await requirePlan(request, "pro", "Audit Pack complet")
    } catch (error) {
      if (!(error instanceof PlanError) || !(await canExportForPartnerClient(session))) {
        throw error
      }
    }

    const rawState =
      (await readFreshStateForOrg(session.orgId, session.orgName)) ??
      normalizeComplianceState(initialComplianceState)
    const [state, nis2State, whiteLabel] = await Promise.all([
      Promise.resolve(rawState),
      readNis2State(session.orgId),
      getWhiteLabelConfig(session.orgId).catch(() => null),
    ])
    const workspaceOverride = {
      ...(await getOrgContext({ request })),
      orgId: session.orgId,
      orgName: session.orgName,
      workspaceLabel: session.orgName,
      userRole: session.role,
    }
    const payload = await buildDashboardPayload(state, workspaceOverride)
    const snapshot = payload.state.snapshotHistory[0] ?? buildCompliScanSnapshot(payload)
    const baseAuditPack = buildAuditPack({
      state: payload.state,
      remediationPlan: payload.remediationPlan,
      workspace: payload.workspace,
      compliancePack: payload.compliancePack,
      snapshot,
      nis2State,
    })
    const issuedBy =
      whiteLabel?.partnerName?.trim() || payload.workspace.workspaceLabel || session.orgName
    const auditPack = {
      ...baseAuditPack,
      issuer: {
        issuedBy,
        cabinetName: issuedBy,
        consultantName: payload.workspace.workspaceOwner || null,
        source: whiteLabel?.partnerName?.trim() ? "white_label" as const : "workspace" as const,
      },
    }
    const bundle = await buildAuditPackBundle(auditPack)

    return new Response(new Uint8Array(bundle.buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${bundle.fileName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    if (error instanceof PlanError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Exportul Audit Pack bundle a esuat.",
      500,
      "AUDIT_PACK_BUNDLE_EXPORT_FAILED"
    )
  }
}
