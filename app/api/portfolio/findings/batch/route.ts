// Portfolio findings batch — dismiss/confirm N findings or mark N notifications
// as read across multiple client orgs in a single call. Only safe low-gating
// transitions are allowed here; resolve/monitor stays per-finding because each
// finding type has its own close gating (docs, checklists, evidence).

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError } from "@/lib/server/auth"
import {
  listAccessiblePortfolioMemberships,
  requirePortfolioAccess,
} from "@/lib/server/portfolio"
import { readFreshStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import {
  createNotification,
  markNotificationRead,
} from "@/lib/server/notifications-store"
import { mapFindingToTask } from "@/lib/finding-to-task-mapper"
import {
  materializeFindingTruth,
} from "@/lib/compliscan/finding-truth"
import { normalizeFindingSuggestedDocumentType } from "@/lib/compliscan/finding-kernel"

type BatchAction = "dismiss_finding" | "confirm_finding" | "mark_notification_read"
const VALID_ACTIONS: BatchAction[] = [
  "dismiss_finding",
  "confirm_finding",
  "mark_notification_read",
]

type BatchItemInput = {
  orgId: string
  findingId?: string
  notificationId?: string
}

type BatchItemResult = {
  orgId: string
  findingId?: string
  notificationId?: string
  status: "success" | "failed" | "skipped"
  error?: string
}

type BatchBody = {
  action: BatchAction
  items: BatchItemInput[]
}

const MAX_ITEMS = 50

export async function POST(request: Request) {
  try {
    const { session } = await requirePortfolioAccess(request)
    const memberships = await listAccessiblePortfolioMemberships(session)
    const allowedOrgIds = new Set(memberships.map((m) => m.orgId))
    const orgNameById = new Map(memberships.map((m) => [m.orgId, m.orgName]))

    const body = (await request.json()) as BatchBody
    if (!body?.action || !VALID_ACTIONS.includes(body.action)) {
      return jsonError("Acțiune batch invalidă.", 400, "INVALID_BATCH_ACTION")
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return jsonError("Selectează cel puțin un item.", 400, "NO_ITEMS_SELECTED")
    }
    if (body.items.length > MAX_ITEMS) {
      return jsonError(`Maximum ${MAX_ITEMS} itemi per batch.`, 400, "BATCH_LIMIT_EXCEEDED")
    }

    // Group items by org so we read/write each org's state exactly once.
    const itemsByOrg = new Map<string, BatchItemInput[]>()
    const preResults: BatchItemResult[] = []
    for (const item of body.items) {
      if (!item?.orgId) {
        preResults.push({
          orgId: item?.orgId ?? "",
          findingId: item?.findingId,
          notificationId: item?.notificationId,
          status: "failed",
          error: "orgId lipsește.",
        })
        continue
      }
      if (!allowedOrgIds.has(item.orgId)) {
        preResults.push({
          orgId: item.orgId,
          findingId: item.findingId,
          notificationId: item.notificationId,
          status: "failed",
          error: "Fără acces la această organizație.",
        })
        continue
      }
      const bucket = itemsByOrg.get(item.orgId) ?? []
      bucket.push(item)
      itemsByOrg.set(item.orgId, bucket)
    }

    const results: BatchItemResult[] = [...preResults]

    if (body.action === "mark_notification_read") {
      for (const [orgId, items] of itemsByOrg) {
        for (const item of items) {
          if (!item.notificationId) {
            results.push({
              orgId,
              status: "failed",
              error: "notificationId lipsește.",
            })
            continue
          }
          try {
            const updated = await markNotificationRead(orgId, item.notificationId)
            results.push({
              orgId,
              notificationId: item.notificationId,
              status: updated ? "success" : "skipped",
              error: updated ? undefined : "Notificare inexistentă.",
            })
          } catch (err) {
            results.push({
              orgId,
              notificationId: item.notificationId,
              status: "failed",
              error: err instanceof Error ? err.message : "unknown",
            })
          }
        }
      }
    } else {
      // dismiss_finding / confirm_finding — batched by org so we write once per org.
      const nowISO = new Date().toISOString()
      for (const [orgId, items] of itemsByOrg) {
        const orgName = orgNameById.get(orgId)
        let state
        try {
          state = await readFreshStateForOrg(orgId, orgName)
        } catch (err) {
          for (const item of items) {
            results.push({
              orgId,
              findingId: item.findingId,
              status: "failed",
              error: err instanceof Error ? err.message : "Nu am putut citi starea.",
            })
          }
          continue
        }
        if (!state) {
          for (const item of items) {
            results.push({
              orgId,
              findingId: item.findingId,
              status: "failed",
              error: "Nu există stare de conformitate.",
            })
          }
          continue
        }

        const updatedFindings = [...state.findings]
        const notificationsToCreate: Array<{
          title: string
          message: string
          linkTo: string
        }> = []
        const perItemResults: BatchItemResult[] = []

        for (const item of items) {
          if (!item.findingId) {
            perItemResults.push({
              orgId,
              status: "failed",
              error: "findingId lipsește.",
            })
            continue
          }
          const idx = updatedFindings.findIndex((f) => f.id === item.findingId)
          if (idx === -1) {
            perItemResults.push({
              orgId,
              findingId: item.findingId,
              status: "failed",
              error: "Finding inexistent.",
            })
            continue
          }
          const finding = normalizeFindingSuggestedDocumentType(updatedFindings[idx])

          if (body.action === "dismiss_finding") {
            updatedFindings[idx] = materializeFindingTruth({
              ...finding,
              findingStatus: "dismissed",
              findingStatusUpdatedAtISO: nowISO,
            })
            perItemResults.push({
              orgId,
              findingId: item.findingId,
              status: "success",
            })
          } else {
            // confirm_finding
            if (finding.findingStatus === "confirmed") {
              perItemResults.push({
                orgId,
                findingId: item.findingId,
                status: "skipped",
                error: "Finding deja confirmat.",
              })
              continue
            }
            const confirmed = materializeFindingTruth({
              ...finding,
              findingStatus: "confirmed",
              findingStatusUpdatedAtISO: nowISO,
            })
            updatedFindings[idx] = confirmed
            const taskCandidate = mapFindingToTask(confirmed)
            notificationsToCreate.push({
              title: "Ți-am pregătit cazul pentru rezolvare",
              message:
                `Finding-ul "${finding.title}" este confirmat. ` +
                `${taskCandidate.suggestedOwner} poate închide cazul până la ${new Date(
                  taskCandidate.deadline
                ).toLocaleDateString("ro-RO")}.`,
              linkTo: `/dashboard/actiuni/remediere/${item.findingId}`,
            })
            perItemResults.push({
              orgId,
              findingId: item.findingId,
              status: "success",
            })
          }
        }

        // Single write per org.
        try {
          await writeStateForOrg(orgId, { ...state, findings: updatedFindings }, orgName)
          for (const payload of notificationsToCreate) {
            await createNotification(orgId, { type: "info", ...payload }).catch(() => {})
          }
          results.push(...perItemResults)
        } catch (err) {
          for (const r of perItemResults) {
            results.push({
              ...r,
              status: "failed",
              error: err instanceof Error ? err.message : "Scriere eșuată.",
            })
          }
        }
      }
    }

    const successCount = results.filter((r) => r.status === "success").length
    const failedCount = results.filter((r) => r.status === "failed").length
    const skippedCount = results.filter((r) => r.status === "skipped").length

    return NextResponse.json({
      ok: true,
      action: body.action,
      results,
      successCount,
      failedCount,
      skippedCount,
      message:
        successCount > 0
          ? `${successCount} itemi procesați cu succes.`
          : skippedCount > 0 && failedCount === 0
            ? "Toate deja procesate."
            : "Niciun item nu a putut fi procesat.",
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError(
      error instanceof Error ? error.message : "Eroare la batch.",
      500,
      "PORTFOLIO_FINDINGS_BATCH_FAILED"
    )
  }
}
