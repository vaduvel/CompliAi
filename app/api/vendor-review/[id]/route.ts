// V5 — Vendor Review Workbench API — single review
// GET    /api/vendor-review/:id   → get review detail
// PATCH  /api/vendor-review/:id   → submit context, approve, close, update
// DELETE /api/vendor-review/:id   → remove review

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest, requireRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { getReview, updateReview, deleteReview } from "@/lib/server/vendor-review-store"
import { mutateState } from "@/lib/server/mvp-store"
import { makeKnowledgeItem, mergeKnowledgeItems } from "@/lib/compliance/org-knowledge"
import {
  determineReviewCase,
  determineUrgency,
  generateReviewAssets,
  nextStatusAfterReview,
  computeNextReviewDue,
  appendAudit,
  createEvidenceId,
  buildPastClosure,
  type VendorReviewContext,
  type EvidenceType,
} from "@/lib/compliance/vendor-review-engine"

const WRITE_ROLES = ["owner", "compliance", "reviewer"] as const
const DELETE_ROLES = ["owner", "compliance"] as const

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const { id } = await params
    const { orgId } = await getOrgContext()
    const review = await getReview(orgId, id)
    if (!review) return jsonError("Review-ul nu a fost găsit.", 404, "REVIEW_NOT_FOUND")

    return NextResponse.json({ review })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut citi review-ul.", 500, "VENDOR_REVIEW_GET_FAILED")
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "actualizare vendor review")
    const { id } = await params
    const { orgId } = await getOrgContext()
    const existing = await getReview(orgId, id)
    if (!existing) return jsonError("Review-ul nu a fost găsit.", 404, "REVIEW_NOT_FOUND")

    const body = (await request.json()) as {
      action?: "submit-context" | "approve" | "reject" | "close" | "reopen" | "add-evidence" | "revalidate"
      context?: VendorReviewContext
      closureEvidence?: string
      // V5.3 — structured evidence
      evidenceType?: EvidenceType
      evidenceDescription?: string
    }

    // ── Submit context (V5.2 — branching + asset generation) ─────────────
    if (body.action === "submit-context") {
      if (!body.context) {
        return jsonError("Contextul este obligatoriu.", 400, "MISSING_CONTEXT")
      }
      const reviewCase = determineReviewCase(body.context, existing.category)
      const urgency = determineUrgency(reviewCase, body.context, existing.category)
      const assets = generateReviewAssets(existing.vendorName, reviewCase, body.context)
      const nextStatus = nextStatusAfterReview(reviewCase)
      const nextReviewDueISO = computeNextReviewDue(reviewCase)

      const updated = await updateReview(orgId, id, {
        context: body.context,
        reviewCase,
        urgency,
        generatedAssets: assets,
        status: nextStatus,
        nextReviewDueISO,
        auditTrail: appendAudit(existing.auditTrail, "context-submitted", session.email),
      })
      return NextResponse.json({ review: updated })
    }

    // ── Approve (human validation) ──────────────────────────────────────
    if (body.action === "approve") {
      const updated = await updateReview(orgId, id, {
        status: "awaiting-evidence",
        closureApprovedBy: session.email,
        auditTrail: appendAudit(existing.auditTrail, "approved", session.email),
      })
      return NextResponse.json({ review: updated })
    }

    // ── Reject — back to needs-context ──────────────────────────────────
    if (body.action === "reject") {
      const updated = await updateReview(orgId, id, {
        status: "needs-context",
        context: undefined,
        reviewCase: undefined,
        generatedAssets: undefined,
        auditTrail: appendAudit(existing.auditTrail, "rejected", session.email),
      })
      return NextResponse.json({ review: updated })
    }

    // ── Add evidence item (V5.3) ────────────────────────────────────────
    if (body.action === "add-evidence") {
      if (!body.evidenceDescription?.trim()) {
        return jsonError("Descrierea dovezii este obligatorie.", 400, "MISSING_EVIDENCE_DESC")
      }
      const newItem = {
        id: createEvidenceId(),
        type: body.evidenceType ?? ("other" as EvidenceType),
        description: body.evidenceDescription.trim(),
        addedBy: session.email,
        addedAtISO: new Date().toISOString(),
      }
      const updated = await updateReview(orgId, id, {
        evidenceItems: [...(existing.evidenceItems ?? []), newItem],
        auditTrail: appendAudit(existing.auditTrail, "evidence-added", session.email, newItem.type),
      })
      return NextResponse.json({ review: updated })
    }

    // ── Close with evidence ─────────────────────────────────────────────
    if (body.action === "close") {
      // Must have at least one evidence item OR legacy text
      const hasEvidence = (existing.evidenceItems?.length ?? 0) > 0 || body.closureEvidence?.trim()
      if (!hasEvidence) {
        return jsonError("Cel puțin o dovadă este obligatorie pentru închidere.", 400, "MISSING_EVIDENCE")
      }
      const closedAtISO = new Date().toISOString()
      const updated = await updateReview(orgId, id, {
        status: "closed",
        closureEvidence: body.closureEvidence?.trim() || existing.closureEvidence,
        closedAtISO,
        reviewCount: (existing.reviewCount ?? 0) + 1,
        auditTrail: appendAudit(existing.auditTrail, "closed", session.email),
      })

      // MULT B — write vendor name to orgKnowledge when review is closed
      const dateLabel = new Date(closedAtISO).toLocaleDateString("ro-RO")
      void mutateState((s) => {
        const knowledgeItems = s.orgKnowledge?.items ?? []
        const vendorItem = makeKnowledgeItem(
          "vendors",
          existing.vendorName,
          "vendor-review",
          `Vendor review la ${dateLabel}`,
          "high",
        )
        return {
          ...s,
          orgKnowledge: {
            items: mergeKnowledgeItems(knowledgeItems, [vendorItem]),
            lastUpdatedAtISO: closedAtISO,
          },
        }
      })

      return NextResponse.json({ review: updated })
    }

    // ── Reopen ──────────────────────────────────────────────────────────
    if (body.action === "reopen") {
      // Archive current closure as past closure (V5.4)
      const pastClosure = buildPastClosure(existing)
      const pastClosures = [...(existing.pastClosures ?? []), ...(pastClosure ? [pastClosure] : [])]

      const updated = await updateReview(orgId, id, {
        status: "needs-context",
        closedAtISO: undefined,
        closureEvidence: undefined,
        closureApprovedBy: undefined,
        evidenceItems: undefined,
        pastClosures,
        auditTrail: appendAudit(existing.auditTrail, "reopened", session.email),
      })
      return NextResponse.json({ review: updated })
    }

    // ── Revalidate (V5.4 — triggered by cron or manual) ────────────────
    if (body.action === "revalidate") {
      // Archive current closure, reset for re-review
      const pastClosure = buildPastClosure(existing)
      const pastClosures = [...(existing.pastClosures ?? []), ...(pastClosure ? [pastClosure] : [])]

      const updated = await updateReview(orgId, id, {
        status: "needs-context",
        closedAtISO: undefined,
        closureEvidence: undefined,
        closureApprovedBy: undefined,
        evidenceItems: undefined,
        pastClosures,
        reviewReason: "Revalidare periodică — review-ul anterior a expirat.",
        auditTrail: appendAudit(existing.auditTrail, "revalidation-triggered", session.email),
      })
      return NextResponse.json({ review: updated })
    }

    return jsonError("Acțiune necunoscută.", 400, "UNKNOWN_ACTION")
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut actualiza review-ul.", 500, "VENDOR_REVIEW_UPDATE_FAILED")
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireRole(request, [...DELETE_ROLES], "ștergere vendor review")
    const { id } = await params
    const { orgId } = await getOrgContext()
    const deleted = await deleteReview(orgId, id)
    if (!deleted) return jsonError("Review-ul nu a fost găsit.", 404, "REVIEW_NOT_FOUND")
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut șterge review-ul.", 500, "VENDOR_REVIEW_DELETE_FAILED")
  }
}
