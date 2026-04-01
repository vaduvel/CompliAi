import { hasSupabaseConfig, supabaseInsert, supabaseSelect, supabaseUpdate } from "@/lib/server/supabase-rest"
import type { DriftTrigger } from "@/lib/compliance/types"

export type ReviewCycleType = "scheduled" | "drift_triggered" | "expiry_triggered" | "manual"
export type ReviewCycleStatus = "upcoming" | "due" | "overdue" | "completed"

export type ReviewCycle = {
  id: string
  orgId: string
  findingId: string
  findingTypeId: string | null
  reviewType: ReviewCycleType
  status: ReviewCycleStatus
  scheduledAt: string
  completedAt: string | null
  completedBy: string | null
  outcome: string | null
  reopenedFindingId: string | null
  notes: string | null
  createdAt: string
  triggerType?: DriftTrigger
  triggerDetail?: string
}

type ReviewCycleRow = {
  id: string
  org_id: string
  finding_id: string
  finding_type_id: string | null
  review_type: string
  status: string
  scheduled_at: string
  completed_at: string | null
  completed_by: string | null
  outcome: string | null
  reopened_finding_id: string | null
  notes: string | null
  created_at: string
}

type EncodedDriftMeta = {
  notes?: string | null
  triggerType?: DriftTrigger
  triggerDetail?: string
}

const localCycles = new Map<string, ReviewCycleRow[]>()

function getLocalCycles(orgId: string): ReviewCycleRow[] {
  if (!localCycles.has(orgId)) localCycles.set(orgId, [])
  return localCycles.get(orgId)!
}

function encodeNotes(meta: EncodedDriftMeta) {
  if (!meta.notes && !meta.triggerType && !meta.triggerDetail) {
    return null
  }

  return JSON.stringify({
    notes: meta.notes ?? null,
    triggerType: meta.triggerType ?? null,
    triggerDetail: meta.triggerDetail ?? null,
  })
}

function decodeNotes(value: string | null | undefined): EncodedDriftMeta {
  if (!value?.trim()) return {}

  try {
    const parsed = JSON.parse(value) as EncodedDriftMeta
    return {
      notes: typeof parsed.notes === "string" ? parsed.notes : parsed.notes ?? undefined,
      triggerType:
        parsed.triggerType === "time_elapsed" ||
        parsed.triggerType === "legislation_change" ||
        parsed.triggerType === "new_vendor_added" ||
        parsed.triggerType === "ai_system_modified" ||
        parsed.triggerType === "org_profile_change" ||
        parsed.triggerType === "incident_closed" ||
        parsed.triggerType === "efactura_status_change"
          ? parsed.triggerType
          : undefined,
      triggerDetail:
        typeof parsed.triggerDetail === "string" && parsed.triggerDetail.trim()
          ? parsed.triggerDetail.trim()
          : undefined,
    }
  } catch {
    return { notes: value }
  }
}

function rowToCycle(row: ReviewCycleRow): ReviewCycle {
  const meta = decodeNotes(row.notes)

  return {
    id: row.id,
    orgId: row.org_id,
    findingId: row.finding_id,
    findingTypeId: row.finding_type_id,
    reviewType:
      row.review_type === "drift_triggered" || row.review_type === "expiry_triggered" || row.review_type === "manual"
        ? row.review_type
        : "scheduled",
    status:
      row.status === "due" || row.status === "overdue" || row.status === "completed"
        ? row.status
        : "upcoming",
    scheduledAt: row.scheduled_at,
    completedAt: row.completed_at,
    completedBy: row.completed_by,
    outcome: row.outcome,
    reopenedFindingId: row.reopened_finding_id,
    notes: meta.notes ?? null,
    createdAt: row.created_at,
    triggerType: meta.triggerType,
    triggerDetail: meta.triggerDetail,
  }
}

function cycleToRow(cycle: ReviewCycle): ReviewCycleRow {
  return {
    id: cycle.id,
    org_id: cycle.orgId,
    finding_id: cycle.findingId,
    finding_type_id: cycle.findingTypeId,
    review_type: cycle.reviewType,
    status: cycle.status,
    scheduled_at: cycle.scheduledAt,
    completed_at: cycle.completedAt,
    completed_by: cycle.completedBy,
    outcome: cycle.outcome,
    reopened_finding_id: cycle.reopenedFindingId,
    notes: encodeNotes({
      notes: cycle.notes,
      triggerType: cycle.triggerType,
      triggerDetail: cycle.triggerDetail,
    }),
    created_at: cycle.createdAt,
  }
}

export async function createReviewCycle(params: {
  orgId: string
  findingId: string
  findingTypeId?: string | null
  reviewType?: ReviewCycleType
  status?: ReviewCycleStatus
  scheduledAt: string
  notes?: string
  triggerType?: DriftTrigger
  triggerDetail?: string
}): Promise<ReviewCycle> {
  const row: ReviewCycleRow = {
    id: crypto.randomUUID(),
    org_id: params.orgId,
    finding_id: params.findingId,
    finding_type_id: params.findingTypeId ?? null,
    review_type: params.reviewType ?? "scheduled",
    status: params.status ?? "upcoming",
    scheduled_at: params.scheduledAt,
    completed_at: null,
    completed_by: null,
    outcome: null,
    reopened_finding_id: null,
    notes: encodeNotes({
      notes: params.notes,
      triggerType: params.triggerType,
      triggerDetail: params.triggerDetail,
    }),
    created_at: new Date().toISOString(),
  }

  if (hasSupabaseConfig()) {
    await supabaseInsert("review_cycles", [row], "public")
  } else {
    getLocalCycles(params.orgId).push(row)
  }

  return rowToCycle(row)
}

export async function listReviewCycles(
  orgId: string,
  filters?: {
    findingId?: string
    status?: ReviewCycleStatus[]
    reviewType?: ReviewCycleType[]
    limit?: number
  }
): Promise<ReviewCycle[]> {
  if (hasSupabaseConfig()) {
    let query = `select=*&org_id=eq.${orgId}&order=scheduled_at.asc`
    if (filters?.findingId) {
      query += `&finding_id=eq.${filters.findingId}`
    }
    if (filters?.status?.length) {
      query += `&status=in.(${filters.status.join(",")})`
    }
    if (filters?.reviewType?.length) {
      query += `&review_type=in.(${filters.reviewType.join(",")})`
    }
    query += `&limit=${filters?.limit ?? 100}`

    const rows = await supabaseSelect<ReviewCycleRow>("review_cycles", query, "public")
    return rows.map(rowToCycle)
  }

  let rows = [...getLocalCycles(orgId)]
  if (filters?.findingId) {
    rows = rows.filter((row) => row.finding_id === filters.findingId)
  }
  if (filters?.status?.length) {
    rows = rows.filter((row) => filters.status!.includes(rowToCycle(row).status))
  }
  if (filters?.reviewType?.length) {
    rows = rows.filter((row) => filters.reviewType!.includes(rowToCycle(row).reviewType))
  }

  return rows
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    .slice(0, filters?.limit ?? 100)
    .map(rowToCycle)
}

export async function listDueReviewCycles(nowISO: string): Promise<ReviewCycle[]> {
  if (hasSupabaseConfig()) {
    const rows = await supabaseSelect<ReviewCycleRow>(
      "review_cycles",
      `select=*&status=in.(upcoming,due,overdue)&scheduled_at=lte.${nowISO}&order=scheduled_at.asc&limit=200`,
      "public"
    )
    return rows.map(rowToCycle)
  }

  const rows = Array.from(localCycles.values()).flat()
  return rows
    .map(rowToCycle)
    .filter((cycle) =>
      (cycle.status === "upcoming" || cycle.status === "due" || cycle.status === "overdue") &&
      cycle.scheduledAt <= nowISO
    )
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
}

export async function updateReviewCycle(
  orgId: string,
  cycleId: string,
  updates: Partial<Pick<ReviewCycle, "status" | "scheduledAt" | "completedAt" | "completedBy" | "outcome" | "reopenedFindingId" | "notes" | "triggerType" | "triggerDetail">>
): Promise<ReviewCycle | null> {
  const currentCycles = await listReviewCycles(orgId, { limit: 200 })
  const current = currentCycles.find((cycle) => cycle.id === cycleId)
  if (!current) return null

  const next: ReviewCycle = {
    ...current,
    ...updates,
  }
  const rowUpdates = cycleToRow(next)

  if (hasSupabaseConfig()) {
    await supabaseUpdate(
      "review_cycles",
      `org_id=eq.${orgId}&id=eq.${cycleId}`,
      {
        status: rowUpdates.status,
        scheduled_at: rowUpdates.scheduled_at,
        completed_at: rowUpdates.completed_at,
        completed_by: rowUpdates.completed_by,
        outcome: rowUpdates.outcome,
        reopened_finding_id: rowUpdates.reopened_finding_id,
        notes: rowUpdates.notes,
      },
      "public"
    )
  } else {
    const rows = getLocalCycles(orgId)
    const index = rows.findIndex((row) => row.id === cycleId)
    if (index !== -1) {
      rows[index] = {
        ...rows[index],
        status: rowUpdates.status,
        scheduled_at: rowUpdates.scheduled_at,
        completed_at: rowUpdates.completed_at,
        completed_by: rowUpdates.completed_by,
        outcome: rowUpdates.outcome,
        reopened_finding_id: rowUpdates.reopened_finding_id,
        notes: rowUpdates.notes,
      }
    }
  }

  return next
}

export async function upsertMonitoringReviewCycle(params: {
  orgId: string
  findingId: string
  findingTypeId?: string | null
  scheduledAt: string
  notes?: string
}): Promise<ReviewCycle> {
  const existing = await listReviewCycles(params.orgId, {
    findingId: params.findingId,
    status: ["upcoming", "due", "overdue"],
    reviewType: ["scheduled"],
    limit: 20,
  })

  const activeCycle = existing[0]
  if (activeCycle) {
    return (
      (await updateReviewCycle(params.orgId, activeCycle.id, {
        scheduledAt: params.scheduledAt,
        status: "upcoming",
        notes: params.notes ?? activeCycle.notes ?? undefined,
      })) ?? activeCycle
    )
  }

  return createReviewCycle({
    orgId: params.orgId,
    findingId: params.findingId,
    findingTypeId: params.findingTypeId,
    reviewType: "scheduled",
    status: "upcoming",
    scheduledAt: params.scheduledAt,
    notes: params.notes,
  })
}

export async function markReviewCycleCompleted(params: {
  orgId: string
  cycleId: string
  completedBy?: string | null
  outcome?: string | null
  reopenedFindingId?: string | null
  notes?: string
}): Promise<ReviewCycle | null> {
  return updateReviewCycle(params.orgId, params.cycleId, {
    status: "completed",
    completedAt: new Date().toISOString(),
    completedBy: params.completedBy ?? null,
    outcome: params.outcome ?? null,
    reopenedFindingId: params.reopenedFindingId ?? null,
    notes: params.notes,
  })
}
