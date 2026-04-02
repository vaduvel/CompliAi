import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import {
  getReviewCycle,
  markReviewCycleCompleted,
  updateReviewCycle,
  type ReviewCycleStatus,
} from "@/lib/server/review-cycle-store"

const READ_ROLES = ["owner", "partner_manager", "compliance", "reviewer", "viewer"] as const
const WRITE_ROLES = ["owner", "partner_manager", "compliance", "reviewer"] as const

function normalizeStatus(value: unknown): ReviewCycleStatus | undefined {
  return value === "upcoming" || value === "due" || value === "overdue" || value === "completed"
    ? value
    : undefined
}

function deriveActiveStatus(scheduledAtISO: string, nowISO: string): Exclude<ReviewCycleStatus, "completed"> {
  return scheduledAtISO <= nowISO ? "due" : "upcoming"
}

async function buildResponse(orgId: string, cycleId: string, orgName?: string) {
  const [cycle, state] = await Promise.all([
    getReviewCycle(orgId, cycleId),
    readFreshStateForOrg(orgId, orgName),
  ])
  if (!cycle) return null

  const finding = state?.findings.find((item) => item.id === cycle.findingId)
  return {
    ...cycle,
    findingTitle: finding?.title ?? cycle.findingId,
    findingStatus: finding?.findingStatus ?? finding?.reviewState ?? null,
    href: `/dashboard/resolve/${encodeURIComponent(cycle.findingId)}`,
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFreshRole(request, [...READ_ROLES], "citirea review-ului programat")
    const { id } = await params
    const item = await buildResponse(session.orgId, id, session.orgName)
    if (!item) {
      return jsonError("Review-ul programat nu există.", 404, "REVIEW_CYCLE_NOT_FOUND")
    }
    return NextResponse.json({ item })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut încărca review-ul.", 500, "REVIEW_CYCLE_GET_FAILED")
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFreshRole(request, [...WRITE_ROLES], "actualizarea review-ului programat")
    const { id } = await params
    const body = (await request.json().catch(() => null)) as
      | {
          status?: ReviewCycleStatus
          scheduledAt?: string
          notes?: string
          outcome?: string
          complete?: boolean
        }
      | null

    const existing = await getReviewCycle(session.orgId, id)
    if (!existing) {
      return jsonError("Review-ul programat nu există.", 404, "REVIEW_CYCLE_NOT_FOUND")
    }

    const shouldComplete = body?.complete === true || body?.status === "completed"
    if (shouldComplete) {
      await markReviewCycleCompleted({
        orgId: session.orgId,
        cycleId: id,
        completedBy: session.email,
        outcome: body?.outcome?.trim() || "review_completed",
        notes: body?.notes?.trim() || existing.notes || undefined,
      })
    } else {
      const scheduledAt =
        typeof body?.scheduledAt === "string" && !Number.isNaN(Date.parse(body.scheduledAt))
          ? new Date(body.scheduledAt).toISOString()
          : undefined
      const nowISO = new Date().toISOString()
      const normalizedStatus = normalizeStatus(body?.status)

      await updateReviewCycle(session.orgId, id, {
        scheduledAt: scheduledAt ?? existing.scheduledAt,
        status:
          normalizedStatus && normalizedStatus !== "completed"
            ? normalizedStatus
            : scheduledAt
              ? deriveActiveStatus(scheduledAt, nowISO)
              : existing.status,
        notes: typeof body?.notes === "string" ? body.notes.trim() : existing.notes ?? undefined,
      })
    }

    const item = await buildResponse(session.orgId, id, session.orgName)
    return NextResponse.json({ item })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut actualiza review-ul.", 500, "REVIEW_CYCLE_UPDATE_FAILED")
  }
}
