// GET /api/account/export-data
// GDPR Art. 20 — Right to Data Portability
// Returns all personal data as a structured JSON download.
// Includes: profile, findings, scans, documents, vendors, incidents, events.

export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import { readNis2State } from "@/lib/server/nis2-store"
import { initialComplianceState, normalizeComplianceState, computeDashboardSummary } from "@/lib/compliance/engine"

export async function GET(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(request, "exportul datelor personale")

    const state =
      (await readFreshStateForOrg(session.orgId, session.orgName)) ??
      normalizeComplianceState(initialComplianceState)
    const nis2State = await readNis2State(session.orgId)
    const normalized = normalizeComplianceState(state)
    const summary = computeDashboardSummary(normalized)

    // Build portable data package — only user-owned data, no internal system state
    const exportData = {
      _meta: {
        exportedAt: new Date().toISOString(),
        format: "CompliScan GDPR Art. 20 Data Export",
        version: "1.0",
        orgId: session.orgId,
        orgName: session.orgName ?? null,
        userEmail: session.email,
        description:
          "Acesta este exportul complet al datelor tale personale din CompliScan, " +
          "conform GDPR Art. 20 (Dreptul la portabilitatea datelor).",
      },
      profile: {
        email: session.email,
        orgId: session.orgId,
        orgName: session.orgName ?? null,
        role: session.role,
        orgProfile: state.orgProfile ?? null,
        orgProfilePrefill: state.orgProfilePrefill ?? null,
      },
      complianceData: {
        overallScore: summary.score,
        riskLabel: summary.riskLabel,
        applicability: state.applicability ?? null,
      },
      findings: (state.findings ?? []).map((f) => ({
        id: f.id,
        title: f.title,
        category: f.category,
        severity: f.severity,
        status: f.findingStatus ?? "open",
        createdAt: f.createdAtISO,
        detail: f.detail,
        remediationHint: f.remediationHint ?? null,
      })),
      scans: (state.scans ?? []).map((s) => ({
        id: s.id,
        documentName: s.documentName,
        createdAt: s.createdAtISO,
        findingsCount: s.findingsCount,
        sourceKind: s.sourceKind ?? null,
      })),
      generatedDocuments: (state.generatedDocuments ?? []).map((d) => ({
        id: d.id,
        documentType: d.documentType,
        title: d.title,
        generatedAt: d.generatedAtISO,
      })),
      aiSystems: (state.aiSystems ?? []).map((ai) => ({
        id: ai.id,
        name: ai.name,
        purpose: ai.purpose,
        riskLevel: ai.riskLevel,
        vendor: ai.vendor,
        createdAt: ai.createdAtISO,
      })),
      vendors: nis2State.vendors.map((v) => ({
        id: v.id,
        name: v.name,
        cui: v.cui ?? null,
        riskLevel: v.riskLevel,
        service: v.service,
        createdAt: v.createdAtISO,
      })),
      incidents: nis2State.incidents.map((i) => ({
        id: i.id,
        title: i.title,
        severity: i.severity,
        status: i.status,
        detectedAt: i.detectedAtISO,
        attackType: i.attackType ?? null,
      })),
      alerts: (state.alerts ?? []).map((a) => ({
        id: a.id,
        severity: a.severity,
        message: a.message,
        open: a.open,
        createdAt: a.createdAtISO,
      })),
      events: (state.events ?? []).slice(-200).map((e) => ({
        id: e.id,
        type: e.type,
        message: e.message,
        createdAt: e.createdAtISO,
      })),
    }

    const filename = `compliai-export-${session.orgId}-${new Date().toISOString().split("T")[0]}.json`

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError("Exportul datelor a eșuat.", 500, "DATA_EXPORT_FAILED")
  }
}
