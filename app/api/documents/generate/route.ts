import { NextResponse } from "next/server"

export const maxDuration = 60

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { jsonError } from "@/lib/server/api-response"
import { requireFreshRole, AuthzError } from "@/lib/server/auth"
import { trackEvent } from "@/lib/server/analytics"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { RequestValidationError } from "@/lib/server/request-validation"
import {
  generateDocument,
  DOCUMENT_TYPES,
  getGeneratedDocumentTitle,
  type DocumentType,
  type DocumentGenerationInput,
} from "@/lib/server/document-generator"
import { makeKnowledgeItem, mergeKnowledgeItems } from "@/lib/compliance/org-knowledge"

const VALID_TYPES = new Set<string>(DOCUMENT_TYPES.map((d) => d.id))

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, ["owner", "partner_manager", "compliance", "reviewer"], "generarea documentelor")

    const body = (await request.json()) as Partial<DocumentGenerationInput> & {
      sourceFindingId?: string
      /** For RoPA: pre-generated markdown content from structured form */
      pregeneratedContent?: string
    }

    const documentType = body.documentType
    if (!documentType || !VALID_TYPES.has(documentType)) {
      return jsonError(
        `documentType invalid. Valori acceptate: ${[...VALID_TYPES].join(", ")}.`,
        400,
        "INVALID_DOCUMENT_TYPE"
      )
    }

    const orgName = body.orgName?.trim()
    if (!orgName) {
      return jsonError("orgName este obligatoriu.", 400, "ORG_NAME_REQUIRED")
    }

    const input: DocumentGenerationInput = {
      documentType: documentType as DocumentType,
      orgName,
      orgWebsite: body.orgWebsite?.trim() || undefined,
      orgSector: body.orgSector?.trim() || undefined,
      orgCui: body.orgCui?.trim() || undefined,
      dpoEmail: body.dpoEmail?.trim() || undefined,
      dataFlows: body.dataFlows?.trim() || undefined,
      counterpartyName: typeof body.counterpartyName === "string" ? body.counterpartyName.trim() || undefined : undefined,
      counterpartyReferenceUrl:
        typeof body.counterpartyReferenceUrl === "string"
          ? body.counterpartyReferenceUrl.trim() || undefined
          : undefined,
      // Per-role job description fields
      jobTitle: typeof body.jobTitle === "string" ? body.jobTitle.trim() || undefined : undefined,
      department: typeof body.department === "string" ? body.department.trim() || undefined : undefined,
      contractType: typeof body.contractType === "string" ? body.contractType.trim() || undefined : undefined,
      specificDuties: typeof body.specificDuties === "string" ? body.specificDuties.trim() || undefined : undefined,
      // HR procedures
      workSchedule: typeof body.workSchedule === "string" ? body.workSchedule.trim() || undefined : undefined,
      // Contracts
      serviceDescription: typeof body.serviceDescription === "string" ? body.serviceDescription.trim() || undefined : undefined,
      paymentTerms: typeof body.paymentTerms === "string" ? body.paymentTerms.trim() || undefined : undefined,
    }

    const sourceFindingId = body.sourceFindingId?.trim() || undefined
    const approvalStatus = sourceFindingId ? ("draft" as const) : undefined

    let result: Awaited<ReturnType<typeof generateDocument>>
    if (documentType === "ropa" && typeof body.pregeneratedContent === "string" && body.pregeneratedContent.trim()) {
      result = {
        documentType: documentType as DocumentType,
        title: getGeneratedDocumentTitle(input),
        content: body.pregeneratedContent.trim(),
        generatedAtISO: new Date().toISOString(),
        llmUsed: false,
        expiresAtISO: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        nextReviewDateISO: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }
    } else {
      result = await generateDocument(input)
    }

    const generatedDocumentId = `generated-doc-${Math.random().toString(36).slice(2, 10)}`

    await mutateStateForOrg(session.orgId, (current) => ({
      ...current,
      generatedDocuments: [
        {
          id: generatedDocumentId,
          documentType: result.documentType,
          title: result.title,
          content: result.content,
          generatedAtISO: result.generatedAtISO,
          llmUsed: result.llmUsed,
          sourceFindingId,
          approvalStatus,
          validationStatus: sourceFindingId ? ("pending" as const) : undefined,
          expiresAtISO: result.expiresAtISO,
          nextReviewDateISO: result.nextReviewDateISO,
        },
        ...(current.generatedDocuments ?? []),
      ].slice(0, 100),
      events: appendComplianceEvents(current, [
        createComplianceEvent(
          {
            type: "document.generated",
            entityType: "system",
            entityId: generatedDocumentId,
            message: `Document generat: ${result.title}.`,
            createdAtISO: result.generatedAtISO,
            metadata: {
              documentType: result.documentType,
              llmUsed: result.llmUsed,
            },
          },
          {
            id: session.userId,
            label: session.email,
            role: session.role,
            source: "session",
          }
        ),
      ]),
    }), session.orgName)

    void trackEvent(session.orgId, "generated_first_document", { docType: input.documentType })

    // MULT B — write dataFlows as processing-purposes knowledge when privacy policy is generated
    if (input.documentType === "privacy-policy" && input.dataFlows) {
      const knowledgeAtISO = result.generatedAtISO
      const dateLabel = new Date(knowledgeAtISO).toLocaleDateString("ro-RO")
      await mutateStateForOrg(session.orgId, (s) => {
        const knowledgeItems = s.orgKnowledge?.items ?? []
        const item = makeKnowledgeItem(
          "processing-purposes",
          input.dataFlows!,
          "privacy-policy-wizard",
          `Politică confidențialitate la ${dateLabel}`,
          "medium",
        )
        return {
          ...s,
          orgKnowledge: {
            items: mergeKnowledgeItems(knowledgeItems, [item]),
            lastUpdatedAtISO: knowledgeAtISO,
          },
        }
      }, session.orgName)
    }

    return NextResponse.json({
      ...result,
      recordId: generatedDocumentId,
      sourceFindingId: sourceFindingId ?? null,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    if (error instanceof RequestValidationError) return jsonError(error.message, error.status, error.code)

    const message = error instanceof Error ? error.message : "Generarea a eșuat."
    return jsonError(message, 500, "DOCUMENT_GENERATION_FAILED")
  }
}
