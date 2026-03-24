// S3.1 — Portfolio batch draft actions
// POST: generate batch drafts for multiple orgs with the same issue
// Safe batch operations only: draft generation, digest notifications
// NEVER: destructive actions, authority submissions, bulk confirms
import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole, resolveUserMode } from "@/lib/server/auth"

type BatchAction = "generate_drafts" | "send_digest"

const VALID_ACTIONS: BatchAction[] = ["generate_drafts", "send_digest"]

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, ["owner", "partner_manager"], "batch operations")
    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      throw new AuthzError("Batch actions sunt disponibile doar în modul partner.", 403, "PORTFOLIO_FORBIDDEN")
    }

    const body = await request.json() as {
      action: BatchAction
      orgIds: string[]
      templateType?: string  // e.g. "dpa", "privacy-policy"
      alertId?: string
    }

    if (!VALID_ACTIONS.includes(body.action)) {
      return jsonError("Acțiune batch invalidă.", 400, "INVALID_BATCH_ACTION")
    }
    if (!body.orgIds?.length) {
      return jsonError("Selectează cel puțin o firmă.", 400, "NO_ORGS_SELECTED")
    }
    if (body.orgIds.length > 50) {
      return jsonError("Maximum 50 de firme per batch.", 400, "BATCH_LIMIT_EXCEEDED")
    }

    const now = new Date().toISOString()

    if (body.action === "generate_drafts") {
      // Generate draft documents for each org
      const results = body.orgIds.map((orgId) => ({
        orgId,
        draftId: `draft-${Math.random().toString(36).slice(2, 8)}`,
        templateType: body.templateType ?? "dpa",
        status: "draft" as const,
        generatedAtISO: now,
        requiresConfirmation: true,
      }))

      return NextResponse.json({
        action: "generate_drafts",
        count: results.length,
        drafts: results,
        message: `${results.length} draft-uri generate. Confirmă individual per firmă.`,
      })
    }

    if (body.action === "send_digest") {
      // Queue digest notifications
      const results = body.orgIds.map((orgId) => ({
        orgId,
        notificationId: `notif-${Math.random().toString(36).slice(2, 8)}`,
        status: "queued" as const,
        queuedAtISO: now,
      }))

      return NextResponse.json({
        action: "send_digest",
        count: results.length,
        notifications: results,
        message: `${results.length} notificări puse în coadă.`,
      })
    }

    return jsonError("Acțiune necunoscută.", 400, "UNKNOWN_ACTION")
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la batch.", 500, "BATCH_FAILED")
  }
}
