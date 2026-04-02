// Sprint 10 — Annex IV document generator API
// POST /api/ai-act/annex-iv
// Generates a Annex IV technical documentation template for a given AI system.
// Returns markdown content ready for download.

import { NextResponse } from "next/server"

import { buildAIActFindingId } from "@/lib/compliance/ai-act-classifier"
import type { GeneratedDocumentRecord } from "@/lib/compliance/types"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { mutateStateForOrg, readFreshStateForOrg } from "@/lib/server/mvp-store"
import { buildAnnexIVDocument } from "@/lib/compliance/ai-conformity-assessment"

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer"],
      "generarea documentatiei Anexa IV"
    )

    const body = (await request.json()) as { systemId?: string }
    const { systemId } = body

    const state = await readFreshStateForOrg(session.orgId, session.orgName)
    if (!state) return jsonError("Stare indisponibilă.", 404, "STATE_NOT_FOUND")

    const system = state.aiSystems.find((s) => s.id === systemId)
    if (!system) return jsonError("Sistem AI negăsit.", 404, "SYSTEM_NOT_FOUND")

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
      session.orgName
    )

    const generatedDocumentId = `generated-doc-${Math.random().toString(36).slice(2, 10)}`
    const generatedDocument: GeneratedDocumentRecord = {
      id: generatedDocumentId,
      documentType: "annex-iv",
      title: doc.title,
      content: doc.content,
      generatedAtISO: doc.generatedAtISO,
      llmUsed: false,
      sourceFindingId: buildAIActFindingId(system.id, "technical-documentation"),
      approvalStatus: "draft",
      validationStatus: "pending",
    }

    await mutateStateForOrg(session.orgId, (current) => ({
      ...current,
      generatedDocuments: [
        generatedDocument,
        ...(current.generatedDocuments ?? []),
      ].slice(0, 150),
    }), session.orgName)

    return NextResponse.json({
      ok: true,
      title: doc.title,
      content: doc.content,
      generatedAtISO: doc.generatedAtISO,
      recordId: generatedDocumentId,
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError("Eroare la generarea Anexei IV.", 500, "ANNEX_IV_FAILED")
  }
}
