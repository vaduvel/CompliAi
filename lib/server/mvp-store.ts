import { promises as fs } from "node:fs"
import path from "node:path"

import {
  computeDashboardSummary,
  initialComplianceState,
  normalizeComplianceState,
} from "@/lib/compliance/engine"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { buildRemediationPlan } from "@/lib/compliance/remediation"
import type { ChatMessage, ComplianceState } from "@/lib/compliance/types"
import { buildComplianceDriftRecords, mergeDriftRecords } from "@/lib/server/compliance-drift"
import { buildCompliScanSnapshot } from "@/lib/server/compliscan-export"
import {
  hasSupabaseConfig,
  supabaseSelect,
  supabaseUpsert,
} from "@/lib/server/supabase-rest"
import { getOrgContext } from "@/lib/server/org-context"

const DATA_DIR = path.join(process.cwd(), ".data")

// Per-org in-memory cache
const memoryStates = new Map<string, ComplianceState>()
const initializedOrgs = new Set<string>()

function getDataFile(orgId: string): string {
  return path.join(DATA_DIR, `state-${orgId}.json`)
}

export async function readState(): Promise<ComplianceState> {
  const { orgId } = await getOrgContext()

  if (!initializedOrgs.has(orgId)) {
    initializedOrgs.add(orgId)
    const loaded = normalizeComplianceState(await loadState(orgId))
    memoryStates.set(orgId, loaded)
  }

  const current = memoryStates.get(orgId) ?? normalizeComplianceState(initialComplianceState)
  const normalized = normalizeComplianceState(current)
  memoryStates.set(orgId, normalized)
  return structuredClone(normalized)
}

export async function writeState(nextState: ComplianceState): Promise<void> {
  const { orgId } = await getOrgContext()
  const normalized = normalizeComplianceState(structuredClone(nextState))
  const enriched = await enrichStateWithSnapshots(normalized)
  memoryStates.set(orgId, enriched)
  await persistState(orgId, enriched)
}

export async function mutateState(
  updater: (current: ComplianceState) => ComplianceState | Promise<ComplianceState>
): Promise<ComplianceState> {
  const current = await readState()
  const next = await updater(current)
  await writeState(next)
  return readState()
}

export async function appendChat(
  userMessage: string,
  assistantMessage: string
): Promise<ComplianceState> {
  return mutateState((current) => {
    const now = new Date().toISOString()
    const user: ChatMessage = {
      id: uid("chat"),
      role: "user",
      content: userMessage,
      createdAtISO: now,
    }
    const assistant: ChatMessage = {
      id: uid("chat"),
      role: "assistant",
      content: assistantMessage,
      createdAtISO: now,
    }
    return {
      ...current,
      chat: [...current.chat, user, assistant].slice(-20),
    }
  })
}

async function loadFromDisk(orgId: string): Promise<ComplianceState> {
  try {
    const raw = await fs.readFile(getDataFile(orgId), "utf8")
    const parsed = JSON.parse(raw) as ComplianceState
    return normalizeComplianceState(parsed)
  } catch {
    const clean = normalizeComplianceState(initialComplianceState)
    await persistToDisk(orgId, clean)
    return structuredClone(clean)
  }
}

async function persistToDisk(orgId: string, state: ComplianceState) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(getDataFile(orgId), JSON.stringify(state, null, 2), "utf8")
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

async function loadState(orgId: string): Promise<ComplianceState> {
  if (hasSupabaseConfig()) {
    try {
      type AppStateRow = { org_id: string; state: ComplianceState }
      const rows = await supabaseSelect<AppStateRow>(
        "app_state",
        `select=org_id,state&org_id=eq.${orgId}&limit=1`
      )
      if (rows.length > 0) return rows[0].state

      const inserted = await supabaseUpsert<
        { org_id: string; state: ComplianceState },
        AppStateRow
      >("app_state", {
        org_id: orgId,
        state: normalizeComplianceState(initialComplianceState),
      })
      if (inserted[0]) return normalizeComplianceState(inserted[0].state)
    } catch {
      // Falls back to local store if schema is not initialized yet.
    }
  }
  return loadFromDisk(orgId)
}

async function persistState(orgId: string, state: ComplianceState): Promise<void> {
  if (hasSupabaseConfig()) {
    try {
      await supabaseUpsert("app_state", { org_id: orgId, state })
      return
    } catch {
      // Falls back to local store if schema is not initialized yet.
    }
  }
  await persistToDisk(orgId, state)
}

async function enrichStateWithSnapshots(nextState: ComplianceState): Promise<ComplianceState> {
  const normalized = normalizeComplianceState(structuredClone(nextState))
  const hasTrackedData =
    normalized.scans.length > 0 ||
    normalized.findings.length > 0 ||
    normalized.aiSystems.length > 0 ||
    normalized.detectedAISystems.length > 0

  if (!hasTrackedData) {
    return {
      ...normalized,
      driftRecords: [],
      snapshotHistory: [],
      validatedBaselineSnapshotId: undefined,
    }
  }

  const workspace = await getOrgContext()
  const summary = computeDashboardSummary(normalized)
  const remediationPlan = buildRemediationPlan(normalized)
  const currentSnapshot = buildCompliScanSnapshot({
    state: normalized,
    summary,
    remediationPlan,
    workspace,
  })
  const baselineSnapshot = normalized.validatedBaselineSnapshotId
    ? normalized.snapshotHistory.find(
        (snapshot) => snapshot.snapshotId === normalized.validatedBaselineSnapshotId
      )
    : undefined
  const previousSnapshot = normalized.snapshotHistory[0]
  const comparisonSnapshot =
    baselineSnapshot?.snapshotId === currentSnapshot.snapshotId
      ? previousSnapshot?.snapshotId === currentSnapshot.snapshotId
        ? undefined
        : previousSnapshot
      : baselineSnapshot ?? previousSnapshot
  currentSnapshot.comparedToSnapshotId = comparisonSnapshot?.snapshotId ?? null
  const driftRecords = buildComplianceDriftRecords(
    currentSnapshot,
    comparisonSnapshot,
    normalized.driftSettings
  )
  const mergedDrifts = mergeDriftRecords(
    normalized.driftRecords,
    driftRecords,
    currentSnapshot.generatedAt
  )
  const snapshotHistory =
    previousSnapshot?.snapshotId === currentSnapshot.snapshotId
      ? [currentSnapshot, ...normalized.snapshotHistory.slice(1)]
      : [currentSnapshot, ...normalized.snapshotHistory].slice(0, 12)

  const nextValidatedBaselineSnapshotId =
    normalized.validatedBaselineSnapshotId &&
    snapshotHistory.some((snapshot) => snapshot.snapshotId === normalized.validatedBaselineSnapshotId)
      ? normalized.validatedBaselineSnapshotId
      : undefined

  return {
    ...normalized,
    driftRecords: mergedDrifts.drifts,
    snapshotHistory,
    validatedBaselineSnapshotId: nextValidatedBaselineSnapshotId,
    events: appendComplianceEvents(
      normalized,
      mergedDrifts.events.map((event) =>
        createComplianceEvent({
          type: event.type === "detected" ? "drift.detected" : "drift.sla-breached",
          entityType: "drift",
          entityId: event.driftId,
          message: event.message,
          createdAtISO: currentSnapshot.generatedAt,
        })
      )
    ),
  }
}
