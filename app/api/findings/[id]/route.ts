// GET /api/findings/[id]  — Returns a single ScanFinding
// PATCH /api/findings/[id] — Update finding status (confirm/dismiss/resolve)
//   B2: Auto-generates task candidate on confirmation
//   B3: Document flow must be explicitly reviewed and attached before resolve

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { readFreshSessionFromRequest } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { readFreshState, readState, writeState } from "@/lib/server/mvp-store"
import { createNotification } from "@/lib/server/notifications-store"
import { mapFindingToTask } from "@/lib/finding-to-task-mapper"
import type { FindingResolution } from "@/lib/compliance/types"
import type { DocumentType } from "@/lib/server/document-generator"
import { isFindingResolvedLike } from "@/lib/compliscan/finding-cockpit"

const VALID_DOC_TYPES: DocumentType[] = [
  "privacy-policy",
  "cookie-policy",
  "dpa",
  "nis2-incident-response",
  "ai-governance",
]

const REQUIRED_CONFIRMATION_CHECKLIST = [
  "content-reviewed",
  "facts-confirmed",
  "approved-for-evidence",
] as const

type FindingFlowState =
  | "not_required"
  | "draft_missing"
  | "draft_ready"
  | "attached_as_evidence"

type FindingPatchBody = {
  status?: string
  generatedDocumentId?: string
  confirmationChecklist?: string[]
  evidenceNote?: string
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const state = await readState()
    const finding = state.findings.find((f) => f.id === id)

    if (!finding) {
      return jsonError("Finding inexistent.", 404, "NOT_FOUND")
    }

    const linkedGeneratedDocument =
      [...(state.generatedDocuments ?? [])]
        .filter((document) => document.sourceFindingId === id)
        .sort((a, b) => b.generatedAtISO.localeCompare(a.generatedAtISO))[0] ?? null

    return NextResponse.json({
      finding,
      linkedGeneratedDocument,
      documentFlowState: getDocumentFlowState(finding.suggestedDocumentType, linkedGeneratedDocument?.approvalStatus),
    })
  } catch {
    return jsonError("Eroare la citirea finding-ului.", 500)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: findingId } = await params
    const session = await readFreshSessionFromRequest(request)
    if (!session) {
      return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")
    }

    const { orgId } = await getOrgContext()
    // Always read fresh from Supabase to avoid stale cache overwriting concurrent agent writes
    const state = await readFreshState()

    const findingIdx = state.findings.findIndex((f) => f.id === findingId)
    if (findingIdx === -1) {
      return jsonError("Finding-ul nu a fost găsit.", 404, "FINDING_NOT_FOUND")
    }

    const body = (await request.json()) as FindingPatchBody
    const newStatus = body.status

    if (!newStatus || !["confirmed", "dismissed", "resolved", "under_monitoring"].includes(newStatus)) {
      return jsonError(
        "Status invalid. Opțiuni: confirmed, dismissed, resolved, under_monitoring.",
        400,
        "INVALID_STATUS"
      )
    }

    const finding = state.findings[findingIdx]
    const linkedGeneratedDocument =
      [...(state.generatedDocuments ?? [])]
        .filter((document) => document.sourceFindingId === findingId)
        .sort((a, b) => b.generatedAtISO.localeCompare(a.generatedAtISO))[0] ?? null

    const storedStatus =
      newStatus === "resolved"
        ? "under_monitoring"
        : (newStatus as "confirmed" | "dismissed" | "under_monitoring")

    // Update finding status (B2)
    const updatedFinding = {
      ...finding,
      findingStatus: storedStatus,
      findingStatusUpdatedAtISO: new Date().toISOString(),
    }

    const updatedFindings = [...state.findings]
    let taskCandidateSummary: {
      id: string
      title: string
      suggestedOwner: string
      deadline: string
      evidenceNeeded: string
      documentTrigger: string | null
    } | null = null
    const generatedDocuments = [...(state.generatedDocuments ?? [])]
    let feedbackMessage =
      newStatus === "dismissed"
        ? "Finding respins. A rămas disponibil pentru audit, dar nu mai intră în fluxul activ."
        : "Finding închis și trecut în monitorizare."

    // B2: On confirmation, generate task candidate + notify
    if (newStatus === "confirmed") {
      const taskCandidate = mapFindingToTask(updatedFinding)
      taskCandidateSummary = {
        id: taskCandidate.id,
        title: taskCandidate.title,
        suggestedOwner: taskCandidate.suggestedOwner,
        deadline: taskCandidate.deadline,
        evidenceNeeded: taskCandidate.evidenceNeeded,
        documentTrigger: taskCandidate.documentTrigger,
      }
      feedbackMessage = `Finding confirmat. Cazul este pregătit pentru ${taskCandidate.suggestedOwner}.`

      await createNotification(orgId, {
        type: "info",
        title: "Ți-am pregătit cazul pentru rezolvare",
        message:
          `Finding-ul "${finding.title}" este confirmat. ` +
          `${taskCandidate.suggestedOwner} poate închide cazul până la ${new Date(taskCandidate.deadline).toLocaleDateString("ro-RO")}.`,
        linkTo: `/dashboard/resolve/${findingId}`,
      }).catch(() => {})

      if (finding.suggestedDocumentType) {
        const docType = finding.suggestedDocumentType as DocumentType
        if (VALID_DOC_TYPES.includes(docType)) {
          feedbackMessage += ` Deschide flow-ul ghidat pentru ${docType}, verifică draftul și atașează-l ca dovadă înainte de închidere.`
        }
      }
    }

    if (isFindingResolvedLike(storedStatus) && finding.suggestedDocumentType) {
      const confirmationChecklist = normalizeConfirmationChecklist(body.confirmationChecklist)
      const generatedDocumentId = body.generatedDocumentId?.trim()

      if (!generatedDocumentId) {
        return jsonError(
          "Pentru acest finding trebuie să aprobi și să atașezi draftul generat înainte de închidere.",
          400,
          "DOCUMENT_APPROVAL_REQUIRED"
        )
      }

      if (!hasRequiredConfirmation(confirmationChecklist)) {
        return jsonError(
          "Confirmarea este incompletă. Bifează review-ul, verificarea faptelor și aprobarea ca dovadă.",
          400,
          "DOCUMENT_CONFIRMATION_INCOMPLETE"
        )
      }

      const documentIndex = generatedDocuments.findIndex(
        (document) => document.id === generatedDocumentId && document.sourceFindingId === findingId
      )

      if (documentIndex === -1) {
        return jsonError(
          "Draftul selectat nu aparține acestui finding.",
          400,
          "DOCUMENT_NOT_LINKED_TO_FINDING"
        )
      }

      const approvedDocument = {
        ...generatedDocuments[documentIndex],
        approvalStatus: "approved_as_evidence" as const,
        approvedAtISO: new Date().toISOString(),
        approvedByUserId: session.userId,
        approvedByEmail: session.email,
        confirmationChecklist,
        evidenceNote: body.evidenceNote?.trim() || undefined,
      }
      const nextResolution: FindingResolution = {
        problem:
          finding.resolution?.problem ??
          finding.detail,
        impact:
          finding.resolution?.impact ??
          finding.impactSummary ??
          "Riscul rămâne deschis până când documentul și confirmarea sunt finalizate explicit.",
        action:
          finding.resolution?.action ??
          finding.remediationHint ??
          "Generează documentul recomandat, verifică-l cap-coadă și aprobă-l explicit ca dovadă.",
        generatedAsset:
          finding.resolution?.generatedAsset ??
          `${approvedDocument.title} pregătit ca draft verificat`,
        humanStep:
          body.evidenceNote?.trim() ||
          finding.resolution?.humanStep ||
          "Ai confirmat manual că documentul reflectă realitatea firmei înainte de a-l folosi ca dovadă.",
        closureEvidence:
          body.evidenceNote?.trim() ||
          `Draft aprobat și atașat ca dovadă: ${approvedDocument.title}.`,
        revalidation: finding.resolution?.revalidation,
      }

      generatedDocuments[documentIndex] = approvedDocument
      updatedFindings[findingIdx] = {
        ...updatedFinding,
        resolution: nextResolution,
      }
      feedbackMessage =
        "Dovada a intrat la dosar. Draftul a fost verificat, aprobat și legat de finding ca artefact auditabil, iar cazul a intrat în monitorizare cu urmă clară pentru reverificare."
    }

    if (!isFindingResolvedLike(storedStatus) || !finding.suggestedDocumentType) {
      updatedFindings[findingIdx] = updatedFinding
    }

    const updatedState = {
      ...state,
      findings: updatedFindings,
      generatedDocuments,
    }

    await writeState(updatedState)

    return NextResponse.json({
      ok: true,
      finding: updatedFindings[findingIdx],
      findingId,
      status: storedStatus,
      taskCandidate: taskCandidateSummary,
      linkedGeneratedDocument:
        isFindingResolvedLike(storedStatus) && body.generatedDocumentId
          ? generatedDocuments.find((document) => document.id === body.generatedDocumentId) ?? linkedGeneratedDocument
          : linkedGeneratedDocument,
      documentFlowState: getDocumentFlowState(
        finding.suggestedDocumentType,
        generatedDocuments.find((document) => document.sourceFindingId === findingId)?.approvalStatus
      ),
      suggestedDocumentType: finding.suggestedDocumentType ?? null,
      feedbackMessage,
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Eroare la actualizarea finding-ului.",
      500,
      "FINDING_UPDATE_FAILED"
    )
  }
}

function normalizeConfirmationChecklist(values: string[] | undefined) {
  const aliases: Record<string, string> = {
    "reviewed-content": "content-reviewed",
  }

  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => aliases[value] ?? value)
    )
  )
}

function hasRequiredConfirmation(values: string[]) {
  return REQUIRED_CONFIRMATION_CHECKLIST.every((value) => values.includes(value))
}

function getDocumentFlowState(
  suggestedDocumentType: string | undefined,
  approvalStatus: "draft" | "approved_as_evidence" | undefined
): FindingFlowState {
  if (!suggestedDocumentType) return "not_required"
  if (approvalStatus === "approved_as_evidence") return "attached_as_evidence"
  if (approvalStatus === "draft") return "draft_ready"
  return "draft_missing"
}
