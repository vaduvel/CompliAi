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
import { buildAuditPack } from "@/lib/server/audit-pack"
import { readNis2State } from "@/lib/server/nis2-store"
import {
  getPartnerAccountPlanStatus,
  hasLegacyPartnerOrgPlan,
  requirePlan,
  PlanError,
} from "@/lib/server/plan"
import { getWhiteLabelConfig } from "@/lib/server/white-label"
import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { getOrgContext } from "@/lib/server/org-context"

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
    const session = await requireFreshRole(request, ["owner", "partner_manager", "compliance"], "exportul Audit Pack")
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
    const branding = whiteLabel?.partnerName
      ? {
          partnerName: whiteLabel.partnerName,
          tagline: whiteLabel.tagline ?? null,
          brandColor: whiteLabel.brandColor,
          logoUrl: whiteLabel.logoUrl ?? null,
        }
      : null
    const issuedBy = branding?.partnerName || payload.workspace.workspaceLabel || session.orgName
    const auditPack = {
      ...baseAuditPack,
      issuer: {
        issuedBy,
        cabinetName: issuedBy,
        consultantName: payload.workspace.workspaceOwner || null,
        source: branding?.partnerName ? "white_label" as const : "workspace" as const,
      },
    }
    const dateLabel = auditPack.generatedAt.slice(0, 10)
    const fileName = `audit-pack-v2-1-${payload.workspace.orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}-${dateLabel}.json`

    const output = branding ? { ...auditPack, branding } : auditPack
    return new Response(JSON.stringify(output, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
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
      error instanceof Error ? error.message : "Exportul Audit Pack a esuat.",
      500,
      "AUDIT_PACK_EXPORT_FAILED"
    )
  }
}
