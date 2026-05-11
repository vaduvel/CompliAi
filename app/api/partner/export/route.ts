// GET /api/partner/export
// DPO Migration Confidence Pack — export complet cabinet + clienți.

export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { computeDashboardSummary, normalizeComplianceState } from "@/lib/compliance/engine"
import { isFindingOperationallyClosed } from "@/lib/compliance/task-resolution"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole, resolveUserMode } from "@/lib/server/auth"
import { listCabinetTemplates } from "@/lib/server/cabinet-templates-store"
import {
  buildDpoSecurityContractualPack,
  renderDpoSecurityContractualPackMarkdown,
} from "@/lib/server/dpo-security-contractual-pack"
import { readStateForOrg } from "@/lib/server/mvp-store"
import {
  listAccessiblePortfolioMemberships,
  loadPortfolioBundles,
} from "@/lib/server/portfolio"
import { getWhiteLabelConfig } from "@/lib/server/white-label"

function safeFileSegment(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "cabinet"
}

function summarizeClientState(state: Awaited<ReturnType<typeof readStateForOrg>>) {
  if (!state) return null
  const normalized = normalizeComplianceState(state)
  const summary = computeDashboardSummary(normalized)
  const openFindings = normalized.findings.filter(
    (finding) =>
      !["resolved", "dismissed", "under_monitoring"].includes(finding.findingStatus ?? "open") &&
      !isFindingOperationallyClosed(normalized, finding.id)
  )
  const validatedEvidence = Object.values(normalized.taskState).filter(
    (task) => task.attachedEvidenceMeta?.quality?.status === "sufficient"
  )
  return {
    score: summary.score,
    riskLabel: summary.riskLabel,
    openAlerts: summary.openAlerts,
    openFindings: openFindings.length,
    validatedEvidence: validatedEvidence.length,
    auditReadiness:
      openFindings.length === 0 && Boolean(normalized.validatedBaselineSnapshotId)
        ? "audit_ready"
        : "review_required",
    generatedDocuments: normalized.generatedDocuments.length,
    latestEvents: normalized.events.slice(-25),
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager"],
      "exportul complet al cabinetului"
    )
    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      return jsonError(
        "Exportul complet cabinet este disponibil doar în modul partner.",
        403,
        "PARTNER_EXPORT_FORBIDDEN"
      )
    }

    const [memberships, templates, whiteLabel] = await Promise.all([
      listAccessiblePortfolioMemberships(session),
      listCabinetTemplates(session.orgId),
      getWhiteLabelConfig(session.orgId).catch(() => null),
    ])
    const bundles = await loadPortfolioBundles(memberships.slice(0, 100))
    const securityPack = buildDpoSecurityContractualPack({
      cabinetOrgId: session.orgId,
      cabinetName: whiteLabel?.partnerName?.trim() || session.orgName,
      consultantEmail: session.email,
      consultantRole: session.role,
      appUrl: process.env.NEXT_PUBLIC_URL,
    })

    const clients = bundles.map((bundle) => ({
      membership: bundle.membership,
      summary: summarizeClientState(bundle.state),
      state: bundle.state,
      nis2: bundle.nis2,
      dsar: bundle.dsar,
      vendorReviews: bundle.vendorReviews,
    }))

    const payload = {
      _meta: {
        exportedAtISO: new Date().toISOString(),
        format: "CompliScan DPO Cabinet Migration Export",
        version: "2026.04",
        scope: "cabinet_plus_clients",
        cabinetOrgId: session.orgId,
        cabinetName: session.orgName,
        consultantEmail: session.email,
        consultantRole: session.role,
        clientCount: clients.length,
      },
      cabinet: {
        orgId: session.orgId,
        orgName: session.orgName,
        whiteLabel,
        templates,
      },
      securityContractualPack: securityPack,
      securityContractualPackMarkdown: renderDpoSecurityContractualPackMarkdown(securityPack),
      clients,
    }

    const filename = `compliscan-cabinet-export-${safeFileSegment(session.orgName)}-${new Date()
      .toISOString()
      .slice(0, 10)}.json`

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError(
      error instanceof Error ? error.message : "Exportul complet cabinet a eșuat.",
      500,
      "PARTNER_EXPORT_FAILED"
    )
  }
}
