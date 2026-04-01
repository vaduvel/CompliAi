import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { readStateForOrg } from "@/lib/server/mvp-store"
import {
  createReviewCycle,
  listReviewCycles,
  type ReviewCycle,
  type ReviewCycleStatus,
  type ReviewCycleType,
} from "@/lib/server/review-cycle-store"

const READ_ROLES = ["owner", "partner_manager", "compliance", "reviewer", "viewer"] as const
const WRITE_ROLES = ["owner", "partner_manager", "compliance", "reviewer"] as const

type ReviewCycleApiItem = ReviewCycle & {
  findingTitle: string
  findingStatus: string | null
  href: string
  isOverdue: boolean
}

function parseStatusList(value: string | null): ReviewCycleStatus[] | undefined {
  if (!value?.trim()) return undefined
  const allowed: ReviewCycleStatus[] = ["upcoming", "due", "overdue", "completed"]
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is ReviewCycleStatus => allowed.includes(item as ReviewCycleStatus))
  return items.length > 0 ? items : undefined
}

function parseTypeList(value: string | null): ReviewCycleType[] | undefined {
  if (!value?.trim()) return undefined
  const allowed: ReviewCycleType[] = ["scheduled", "drift_triggered", "expiry_triggered", "manual"]
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is ReviewCycleType => allowed.includes(item as ReviewCycleType))
  return items.length > 0 ? items : undefined
}

function enrichCycles(cycles: ReviewCycle[], findingMap: Map<string, { title: string; status: string | null }>) {
  const nowISO = new Date().toISOString()
  return cycles.map((cycle) => {
    const finding = findingMap.get(cycle.findingId)
    return {
      ...cycle,
      findingTitle: finding?.title ?? cycle.findingId,
      findingStatus: finding?.status ?? null,
      href: `/dashboard/resolve/${encodeURIComponent(cycle.findingId)}`,
      isOverdue: cycle.status !== "completed" && cycle.scheduledAt < nowISO,
    } satisfies ReviewCycleApiItem
  })
}

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, [...READ_ROLES], "citirea review-urilor programate")
    const search = new URL(request.url).searchParams
    const state = await readStateForOrg(session.orgId)
    const cycles = await listReviewCycles(session.orgId, {
      findingId: search.get("findingId")?.trim() || undefined,
      status: parseStatusList(search.get("status")),
      reviewType: parseTypeList(search.get("reviewType")),
      limit: Number(search.get("limit") ?? "100") || 100,
    })

    const findingMap = new Map(
      (state?.findings ?? []).map((finding) => [
        finding.id,
        {
          title: finding.title,
          status: finding.findingStatus ?? finding.reviewState ?? null,
        },
      ])
    )
    const items = enrichCycles(cycles, findingMap)
    const summary = {
      total: items.length,
      upcoming: items.filter((item) => item.status === "upcoming").length,
      due: items.filter((item) => item.status === "due").length,
      overdue: items.filter((item) => item.status === "overdue" || item.isOverdue).length,
      completed: items.filter((item) => item.status === "completed").length,
    }

    return NextResponse.json({ items, summary })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut încărca review-urile programate.", 500, "REVIEW_CYCLES_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, [...WRITE_ROLES], "programarea unui review manual")
    const body = (await request.json().catch(() => null)) as
      | {
          findingId?: string
          findingTypeId?: string | null
          scheduledAt?: string
          reviewType?: ReviewCycleType
          notes?: string
        }
      | null

    const findingId = body?.findingId?.trim()
    const scheduledAt =
      typeof body?.scheduledAt === "string" && !Number.isNaN(Date.parse(body.scheduledAt))
        ? new Date(body.scheduledAt).toISOString()
        : null

    if (!findingId) {
      return jsonError("findingId este obligatoriu.", 400, "REVIEW_CYCLE_MISSING_FINDING")
    }
    if (!scheduledAt) {
      return jsonError("scheduledAt este obligatoriu și trebuie să fie valid.", 400, "REVIEW_CYCLE_INVALID_DATE")
    }

    const reviewType: ReviewCycleType =
      body?.reviewType === "drift_triggered" ||
      body?.reviewType === "expiry_triggered" ||
      body?.reviewType === "manual"
        ? body.reviewType
        : "manual"

    const cycle = await createReviewCycle({
      orgId: session.orgId,
      findingId,
      findingTypeId: body?.findingTypeId?.trim() || null,
      scheduledAt,
      reviewType,
      notes: body?.notes?.trim() || undefined,
    })

    return NextResponse.json({ item: cycle }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut programa review-ul.", 500, "REVIEW_CYCLE_CREATE_FAILED")
  }
}
