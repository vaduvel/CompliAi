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
import {
  buildCockpitRecipe,
  classifyFinding,
  computeNextMonitoringDateISO,
  getCloseGatingRequirements,
} from "@/lib/compliscan/finding-kernel"
import type { ScanFinding } from "@/lib/compliance/types"

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
  revalidationConfirmed?: boolean
  newReviewDateISO?: string
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

    if (!newStatus || !["open", "confirmed", "dismissed", "resolved", "under_monitoring"].includes(newStatus)) {
      return jsonError(
        "Status invalid. Opțiuni: open, confirmed, dismissed, resolved, under_monitoring.",
        400,
        "INVALID_STATUS"
      )
    }

    const finding = state.findings[findingIdx]
    const linkedGeneratedDocument =
      [...(state.generatedDocuments ?? [])]
        .filter((document) => document.sourceFindingId === findingId)
        .sort((a, b) => b.generatedAtISO.localeCompare(a.generatedAtISO))[0] ?? null
    const nowISO = new Date().toISOString()
    const { findingTypeId } = classifyFinding(finding)
    const closeGating = getCloseGatingRequirements(findingTypeId)

    const storedStatus =
      newStatus === "resolved"
        ? "under_monitoring"
        : (newStatus as "open" | "confirmed" | "dismissed" | "under_monitoring")

    // Update finding status (B2)
    const updatedFinding = {
      ...finding,
      findingStatus: storedStatus,
      findingStatusUpdatedAtISO: nowISO,
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

    if (newStatus === "open") {
      updatedFindings[findingIdx] = {
        ...finding,
        findingStatus: "open",
        findingStatusUpdatedAtISO: nowISO,
        reopenedFromISO:
          isFindingResolvedLike(finding.findingStatus)
            ? finding.findingStatusUpdatedAtISO ?? nowISO
            : finding.reopenedFromISO,
        nextMonitoringDateISO: undefined,
      }

      await writeState({
        ...state,
        findings: updatedFindings,
        generatedDocuments,
      })

      return NextResponse.json({
        ok: true,
        finding: updatedFindings[findingIdx],
        findingId,
        status: "open",
        linkedGeneratedDocument,
        documentFlowState: getDocumentFlowState(
          finding.suggestedDocumentType,
          linkedGeneratedDocument?.approvalStatus
        ),
        suggestedDocumentType: finding.suggestedDocumentType ?? null,
        feedbackMessage:
          "Caz redeschis. Contextul rezolvării anterioare rămâne disponibil, iar cockpitul pornește din nou pe aceeași urmă.",
      })
    }

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

    if (isFindingResolvedLike(storedStatus) && closeGating.requiresGeneratedDocument) {
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
        approvedAtISO: nowISO,
        approvedByUserId: session.userId,
        approvedByEmail: session.email,
        confirmationChecklist,
        evidenceNote: body.evidenceNote?.trim() || undefined,
      }
      const nextMonitoringDateISO =
        approvedDocument.nextReviewDateISO ??
        computeNextMonitoringDateISO(findingTypeId, nowISO) ??
        undefined
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
        revalidation:
          nextMonitoringDateISO
            ? `Următor control programat la ${formatRoDate(nextMonitoringDateISO)}.`
            : finding.resolution?.revalidation,
        reviewedAtISO: nowISO,
      }

      generatedDocuments[documentIndex] = approvedDocument
      updatedFindings[findingIdx] = {
        ...updatedFinding,
        resolution: nextResolution,
        operationalEvidenceNote: body.evidenceNote?.trim() || finding.operationalEvidenceNote,
        nextMonitoringDateISO,
      }
      feedbackMessage =
        "Dovada a intrat la dosar. Draftul a fost verificat, aprobat și legat de finding ca artefact auditabil, iar cazul a intrat în monitorizare cu urmă clară pentru reverificare."
    }

    if (isFindingResolvedLike(storedStatus) && !closeGating.requiresGeneratedDocument) {
      const evidenceNote = body.evidenceNote?.trim()
      const newReviewDateISO = normalizeReviewDateISO(body.newReviewDateISO)
      const nextMonitoringDateISO =
        newReviewDateISO ??
        computeNextMonitoringDateISO(findingTypeId, nowISO) ??
        undefined

      if (closeGating.requiresEvidenceNote && !evidenceNote) {
        return jsonError(
          "Pentru acest finding trebuie să adaugi dovada operațională înainte de închidere.",
          400,
          "OPERATIONAL_EVIDENCE_REQUIRED"
        )
      }

      if (closeGating.requiresRevalidationConfirmation && !body.revalidationConfirmed) {
        return jsonError(
          "Pentru revalidare trebuie să confirmi explicit că ai reverificat dovada anterioară.",
          400,
          "REVALIDATION_CONFIRMATION_REQUIRED"
        )
      }

      if (closeGating.requiresNextReviewDate && !newReviewDateISO) {
        return jsonError(
          "Pentru acest finding trebuie să alegi următoarea dată de review înainte de închidere.",
          400,
          "NEXT_REVIEW_DATE_REQUIRED"
        )
      }

      const previousEvidence =
        finding.operationalEvidenceNote ||
        finding.resolution?.closureEvidence ||
        finding.evidenceRequired

      const nextResolution: FindingResolution = {
        problem:
          finding.resolution?.problem ??
          finding.detail,
        impact:
          finding.resolution?.impact ??
          finding.impactSummary ??
          "Riscul rămâne deschis până când măsura este aplicată și dovada este păstrată la dosar.",
        action:
          finding.resolution?.action ??
          finding.remediationHint ??
          "Aplici măsura, confirmi rezultatul și păstrezi dovada auditabilă în același cockpit.",
        generatedAsset: finding.resolution?.generatedAsset,
        humanStep:
          evidenceNote ||
          finding.resolution?.humanStep ||
          "Ai confirmat manual că măsura a fost aplicată și reflectă realitatea firmei.",
        closureEvidence:
          evidenceNote ||
          previousEvidence ||
          "Dovadă operațională confirmată și păstrată în cockpit.",
        revalidation:
          nextMonitoringDateISO
            ? `Următor control programat la ${formatRoDate(nextMonitoringDateISO)}.`
            : finding.resolution?.revalidation,
        reviewedAtISO: nowISO,
      }

      updatedFindings[findingIdx] = {
        ...updatedFinding,
        resolution: nextResolution,
        operationalEvidenceNote: evidenceNote ?? finding.operationalEvidenceNote,
        nextMonitoringDateISO,
      }

      feedbackMessage = closeGating.requiresRevalidationConfirmation
        ? `Revalidarea a fost salvată la dosar. Dovada anterioară rămâne disponibilă, iar următorul control este programat pentru ${formatRoDate(nextMonitoringDateISO ?? nowISO)}.`
        : `Dovada operațională a intrat la dosar, iar cazul a trecut în monitorizare${nextMonitoringDateISO ? ` până la ${formatRoDate(nextMonitoringDateISO)}` : ""}.`
    }

    if (!isFindingResolvedLike(storedStatus)) {
      updatedFindings[findingIdx] = updatedFinding
    }

    const updatedState = {
      ...state,
      findings: updatedFindings,
      generatedDocuments,
    }

    await writeState(updatedState)

    if (newStatus === "resolved" && updatedFindings[findingIdx]?.category === "E_FACTURA") {
      const fiscalNotification = buildFiscalMonitoringNotification(updatedFindings[findingIdx])
      if (fiscalNotification) {
        await createNotification(orgId, fiscalNotification).catch(() => {})
      }
    }

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

function normalizeReviewDateISO(value: string | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed.toISOString()
}

function formatRoDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO")
}

function buildFiscalMonitoringNotification(
  finding: ScanFinding
): { type: "fiscal_alert"; title: string; message: string; linkTo: string } | null {
  if (finding.category !== "E_FACTURA") return null

  const recipe = buildCockpitRecipe(finding)
  const nextControlLabel = finding.nextMonitoringDateISO
    ? ` Următorul control este programat pentru ${formatRoDate(finding.nextMonitoringDateISO)}.`
    : ""
  const recheckSignal =
    recipe.monitoringSignals.find((signal) => !signal.startsWith("Următor control la")) ??
    recipe.monitoringSignals[0] ??
    "Cazul fiscal rămâne în monitorizare activă."

  switch (recipe.findingTypeId) {
    case "EF-001":
      return {
        type: "fiscal_alert",
        title: "Reverificăm SPV-ul firmei",
        message: `${recipe.heroSummary} ${recheckSignal}${nextControlLabel}`.trim(),
        linkTo: recipe.workflowLink?.href ?? `/dashboard/fiscal?tab=spv&findingId=${finding.id}`,
      }
    case "EF-003":
      return {
        type: "fiscal_alert",
        title: "Reverificăm factura retransmisă",
        message: `${recipe.heroSummary} ${recheckSignal}${nextControlLabel}`.trim(),
        linkTo: `/dashboard/resolve/${finding.id}`,
      }
    case "EF-004":
      return {
        type: "fiscal_alert",
        title: "Verificăm dacă factura a ieșit din prelucrare",
        message: `${recipe.heroSummary} ${recheckSignal}${nextControlLabel}`.trim(),
        linkTo: `/dashboard/resolve/${finding.id}`,
      }
    case "EF-005":
      return {
        type: "fiscal_alert",
        title: "Verificăm confirmarea transmiterii în SPV",
        message: `${recipe.heroSummary} ${recheckSignal}${nextControlLabel}`.trim(),
        linkTo: `/dashboard/resolve/${finding.id}`,
      }
    case "EF-006":
      return {
        type: "fiscal_alert",
        title: "Verificăm factura după corecția datelor clientului",
        message: `${recipe.heroSummary} ${recheckSignal}${nextControlLabel}`.trim(),
        linkTo: `/dashboard/resolve/${finding.id}`,
      }
    default:
      return {
        type: "fiscal_alert",
        title: "Monitorizare fiscală activă",
        message: `${recipe.heroSummary} ${recheckSignal}${nextControlLabel}`.trim(),
        linkTo: `/dashboard/resolve/${finding.id}`,
      }
  }
}
