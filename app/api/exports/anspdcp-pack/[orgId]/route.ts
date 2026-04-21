/**
 * ANSPDCP-shaped Audit Pack PDF — Faza 6.1
 *
 * GET /api/exports/anspdcp-pack/[orgId]
 *
 * Generates an ANSPDCP-structured PDF from existing audit-pack data.
 * Reuses mature engines (buildAuditPack + buildPDFFromMarkdown) — does NOT
 * rewrite compliance logic. Maps data to the 12 sections expected by
 * Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal.
 *
 * Returns: PDF with SHA-256 integrity hash.
 */
import { NextResponse } from "next/server"

import { buildAuditPack } from "@/lib/server/audit-pack"
import { buildAnspdcpMarkdown } from "@/lib/server/anspdcp-pack"
import { buildCompliScanSnapshot } from "@/lib/server/compliscan-export"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { buildPDFFromMarkdown } from "@/lib/server/pdf-generator"
import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import {
  AuthzError,
  listUserMemberships,
  requireFreshAuthenticatedSession,
} from "@/lib/server/auth"
import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import { readNis2State } from "@/lib/server/nis2-store"
import { readDsarState } from "@/lib/server/dsar-store"
import { safeListReviews } from "@/lib/server/vendor-review-store"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { logRouteError } from "@/lib/server/operational-logger"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const context = createRequestContext(request, "/api/exports/anspdcp-pack/[orgId]")

  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "generarea dosarului ANSPDCP"
    )
    const { orgId } = await params

    // Verify user has active membership to the target org
    const memberships = await listUserMemberships(session.userId)
    const membership = memberships.find(
      (m) => m.orgId === orgId && m.status === "active"
    )
    if (!membership) {
      return jsonError("Acces interzis sau organizație inexistentă.", 403, "FORBIDDEN")
    }

    // Load all state sources
    const rawState =
      (await readFreshStateForOrg(orgId, membership.orgName)) ??
      normalizeComplianceState(initialComplianceState)

    const [state, nis2State, dsarState, vendorReviews] = await Promise.all([
      Promise.resolve(rawState),
      readNis2State(orgId),
      readDsarState(orgId),
      safeListReviews(orgId),
    ])

    const initials = membership.orgName
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "??"
    const workspaceOverride = {
      orgId,
      orgName: membership.orgName,
      workspaceLabel: membership.orgName,
      workspaceOwner: membership.orgName,
      workspaceInitials: initials,
      userRole: membership.role,
    }

    const payload = await buildDashboardPayload(state, workspaceOverride)
    const snapshot = payload.state.snapshotHistory[0] ?? buildCompliScanSnapshot(payload)

    const auditPack = buildAuditPack({
      state: payload.state,
      remediationPlan: payload.remediationPlan,
      workspace: payload.workspace,
      compliancePack: payload.compliancePack,
      snapshot,
      nis2State,
    })

    const { markdown, hash } = buildAnspdcpMarkdown({
      auditPack,
      state,
      orgProfile: state.orgProfile ?? null,
      orgName: membership.orgName,
      dsarRequests: dsarState.requests,
      nis2State,
      vendorReviews,
    })

    const pdfBuffer = await buildPDFFromMarkdown(markdown, {
      orgName: membership.orgName,
      documentType: "Dosar ANSPDCP",
      generatedAt: new Date().toISOString(),
    })

    const safeName = membership.orgName.replace(/[^a-z0-9]/gi, "-").toLowerCase()
    const fileName = `ANSPDCP-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      ...withRequestIdHeaders(
        {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${fileName}"`,
            "Cache-Control": "no-store",
            "Content-Length": pdfBuffer.length.toString(),
            "X-Content-Integrity-SHA256": hash,
          },
        },
        context
      ),
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      await logRouteError(context, error, {
        code: error.code,
        durationMs: getRequestDurationMs(context),
        status: error.status,
      })
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    await logRouteError(context, error, {
      code: "ANSPDCP_PACK_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return jsonError(
      error instanceof Error ? error.message : "Generarea dosarului ANSPDCP a eșuat.",
      500,
      "ANSPDCP_PACK_FAILED",
      undefined,
      context
    )
  }
}
