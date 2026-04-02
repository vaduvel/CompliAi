import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { mergeDetectedAISystems } from "@/lib/server/detected-ai-systems"
import { discoverAISystemsFromManifest } from "@/lib/server/manifest-autodiscovery"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { getOrgContext } from "@/lib/server/org-context"
import { WRITE_ROLES } from "@/lib/server/rbac"

type DiscoverPayload = {
  documentName?: string
  content?: string
}

export async function POST(request: Request) {
  let session: Awaited<ReturnType<typeof requireFreshRole>>
  try {
    session = await requireFreshRole(request, WRITE_ROLES, "autodiscovery sisteme AI")
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    throw error
  }

  const body = (await request.json()) as DiscoverPayload
  const documentName = body.documentName?.trim() || "manifest.txt"
  const content = body.content?.trim() || ""

  if (!content) {
    return NextResponse.json(
      { error: "Incarca sau lipeste continutul manifestului inainte de autodiscovery." },
      { status: 400 }
    )
  }

  const nowISO = new Date().toISOString()
  const nextState = await mutateStateForOrg(session.orgId, (current) => {
    const scanId = `scan-${Math.random().toString(36).slice(2, 10)}`
    const discovery = discoverAISystemsFromManifest({
      documentName,
      content,
      sourceScanId: scanId,
      nowISO,
    })

    const scan = {
      id: scanId,
      documentName,
      contentPreview: content.slice(0, 220),
      contentExtracted: content.slice(0, 4000),
      createdAtISO: nowISO,
      findingsCount: discovery.candidates.length + discovery.findings.length,
      sourceKind: discovery.sourceKind,
      extractionMethod: "manual" as const,
      extractionStatus: "completed" as const,
      analysisStatus: "completed" as const,
      reviewRequired: false,
      analyzedAtISO: nowISO,
    }

    return {
      ...current,
      scans: [scan, ...current.scans].slice(0, 100),
      findings: [...discovery.findings, ...current.findings].slice(0, 200),
      alerts: [...discovery.alerts, ...current.alerts].slice(0, 200),
      detectedAISystems: mergeDetectedAISystems(current.detectedAISystems, discovery.candidates),
      events: appendComplianceEvents(current, [
        createComplianceEvent({
          type: "scan.manifest_discovered",
          entityType: "scan",
          entityId: scan.id,
          message:
            discovery.sourceKind === "yaml"
              ? `Config YAML CompliScan procesat: ${documentName}.`
              : `Manifest procesat pentru autodiscovery: ${documentName}.`,
          createdAtISO: nowISO,
          metadata: {
            providers: discovery.providers.join(", ") || "none",
            candidates: discovery.candidates.length,
            findings: discovery.findings.length,
            sourceKind: discovery.sourceKind,
          },
        }),
        ...discovery.candidates.map((candidate) =>
          createComplianceEvent({
            type: "system.detected",
            entityType: "system",
            entityId: candidate.id,
            message: `Sistem detectat automat: ${candidate.name}.`,
            createdAtISO: nowISO,
            metadata: {
              confidence: candidate.confidence,
              riskLevel: candidate.riskLevel,
            },
          })
        ),
        ...discovery.findings.map((finding) =>
          createComplianceEvent({
            type: "finding.detected",
            entityType: "finding",
            entityId: finding.id,
            message: `Finding generat automat: ${finding.title}.`,
            createdAtISO: nowISO,
            metadata: {
              category: finding.category,
              ruleId: finding.provenance?.ruleId || "n/a",
              sourceDocument: finding.sourceDocument,
            },
          })
        ),
      ]),
    }
  }, session.orgName)
  const workspace = {
    ...(await getOrgContext({ request })),
    orgId: session.orgId,
    orgName: session.orgName,
    workspaceOwner: session.email,
    userRole: session.role,
  }

  return NextResponse.json({
    ...(await buildDashboardPayload(nextState, workspace)),
    message: "Autodiscovery finalizat. Revizuieste sistemele detectate inainte de confirmare.",
  })
}
