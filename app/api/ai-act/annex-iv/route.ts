// Sprint 10 — Annex IV document generator API
// POST /api/ai-act/annex-iv
// Generates a Annex IV technical documentation template for a given AI system.
// Returns markdown content ready for download.

import { NextResponse } from "next/server"

import { buildAIActFindingId } from "@/lib/compliance/ai-act-classifier"
import { jsonError } from "@/lib/server/api-response"
import { getOrgContext } from "@/lib/server/org-context"
import { mutateState } from "@/lib/server/mvp-store"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { loadOrganizations } from "@/lib/server/auth"
import { buildAnnexIVDocument } from "@/lib/compliance/ai-conformity-assessment"

export async function POST(request: Request) {
  try {
    const ctx = await getOrgContext()
    if (!ctx?.orgId) return jsonError("Neautorizat.", 401, "UNAUTHORIZED")

    const body = (await request.json()) as { systemId?: string }
    const { systemId } = body

    const state = await readStateForOrg(ctx.orgId)
    if (!state) return jsonError("Stare indisponibilă.", 404, "STATE_NOT_FOUND")

    const system = state.aiSystems.find((s) => s.id === systemId)
    if (!system) return jsonError("Sistem AI negăsit.", 404, "SYSTEM_NOT_FOUND")

    // Resolve org name for the document header
    let orgName: string | undefined
    try {
      const orgs = await loadOrganizations()
      orgName = orgs.find((o) => o.id === ctx.orgId)?.name
    } catch {
      // non-blocking
    }

    const riskLevelMap: Record<string, string> = {
      high: "high",
      limited: "limited",
      minimal: "minimal",
    }

    const doc = buildAnnexIVDocument(
      {
        id: system.id,
        name: system.name,
        vendor: system.vendor,
        modelType: system.modelType,
        purpose: system.purpose,
        riskLevel: riskLevelMap[system.riskLevel] ?? system.riskLevel,
        usesPersonalData: system.usesPersonalData,
        makesAutomatedDecisions: system.makesAutomatedDecisions,
        impactsRights: system.impactsRights,
        hasHumanReview: system.hasHumanReview,
        annexIIIHint: system.annexIIIHint,
        createdAtISO: system.createdAtISO,
      },
      {}, // empty answers — template mode, user fills in the blanks
      orgName
    )

    const generatedDocumentId = `generated-doc-${Math.random().toString(36).slice(2, 10)}`
    await mutateState((current) => ({
      ...current,
      generatedDocuments: [
        {
          id: generatedDocumentId,
          documentType: "annex-iv",
          title: doc.title,
          content: doc.content,
          generatedAtISO: doc.generatedAtISO,
          llmUsed: false,
          sourceFindingId: buildAIActFindingId(system.id, "technical-documentation"),
          approvalStatus: "draft",
          validationStatus: "pending",
        },
        ...(current.generatedDocuments ?? []),
      ].slice(0, 150),
    }))

    return NextResponse.json({
      ok: true,
      title: doc.title,
      content: doc.content,
      generatedAtISO: doc.generatedAtISO,
      recordId: generatedDocumentId,
    })
  } catch {
    return jsonError("Eroare la generarea Anexei IV.", 500, "ANNEX_IV_FAILED")
  }
}
