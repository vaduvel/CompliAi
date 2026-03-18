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
import { isLocalFallbackAllowedForCloudPrimary } from "@/lib/server/cloud-fallback-policy"
import {
  hasSupabaseConfig,
  supabaseSelect,
  supabaseUpsert,
} from "@/lib/server/supabase-rest"
import {
  loadOrgStateFromSupabase,
  persistOrgStateToSupabase,
  shouldUseSupabaseOrgStateAsPrimary,
} from "@/lib/server/supabase-org-state"
import { getConfiguredDataBackend } from "@/lib/server/supabase-tenancy"
import { systemEventActor } from "@/lib/server/event-actor"
import { getOrgContext } from "@/lib/server/org-context"

const DATA_DIR = path.join(process.cwd(), ".data")

// Per-org in-memory cache
const memoryStates = new Map<string, ComplianceState>()
const initializedOrgs = new Set<string>()

function getDataFile(orgId: string): string {
  return path.join(DATA_DIR, `state-${orgId}.json`)
}

export async function readState(): Promise<ComplianceState> {
  const { orgId, orgName } = await getOrgContext()

  if (!initializedOrgs.has(orgId)) {
    initializedOrgs.add(orgId)
    const loaded = normalizeComplianceState(await loadState(orgId, orgName))
    memoryStates.set(orgId, loaded)
  }

  const current = memoryStates.get(orgId) ?? normalizeComplianceState(initialComplianceState)
  const normalized = normalizeComplianceState(current)
  memoryStates.set(orgId, normalized)
  return structuredClone(normalized)
}

export async function writeState(nextState: ComplianceState): Promise<void> {
  const { orgId, orgName } = await getOrgContext()
  const normalized = normalizeComplianceState(structuredClone(nextState))
  const enriched = await enrichStateWithSnapshots(normalized)
  memoryStates.set(orgId, enriched)
  await persistState(orgId, orgName, enriched)
}

export async function mutateState(
  updater: (current: ComplianceState) => ComplianceState | Promise<ComplianceState>
): Promise<ComplianceState> {
  const current = await readState()
  const next = await updater(current)
  await writeState(next)
  return readState()
}

/**
 * Read state for a specific orgId — bypasses getOrgContext().
 * Used by partner portal, trust page, cron, demo routes that need
 * cross-org access without relying on request headers.
 */
export async function readStateForOrg(orgId: string): Promise<ComplianceState | null> {
  const cached = memoryStates.get(orgId)
  if (cached) return structuredClone(cached)

  try {
    const loaded = await loadState(orgId)
    const normalized = normalizeComplianceState(loaded)
    memoryStates.set(orgId, normalized)
    initializedOrgs.add(orgId)
    return structuredClone(normalized)
  } catch {
    return null
  }
}

/**
 * Write state for a specific orgId — bypasses getOrgContext().
 * Used by demo seed route to write state for demo orgs.
 */
export async function writeStateForOrg(orgId: string, state: ComplianceState, orgName?: string): Promise<void> {
  const normalized = normalizeComplianceState(structuredClone(state))
  memoryStates.set(orgId, normalized)
  initializedOrgs.add(orgId)
  await persistState(orgId, orgName, normalized)
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

async function loadState(orgId: string, orgName?: string): Promise<ComplianceState> {
  const dataBackend = getConfiguredDataBackend()

  if (shouldUseSupabaseOrgStateAsPrimary()) {
    try {
      const mirroredState = await loadOrgStateFromSupabase(orgId)
      if (mirroredState) return normalizeComplianceState(mirroredState)

      const legacyCloudState = await loadLegacyCloudAppState(orgId)
      if (legacyCloudState) {
        await persistOrgStateSafe(orgId, orgName, legacyCloudState)
        return structuredClone(legacyCloudState)
      }

      const initialCloudState = normalizeComplianceState(initialComplianceState)
      await persistOrgStateSafe(orgId, orgName, initialCloudState)
      return structuredClone(initialCloudState)
    } catch (error) {
      if (!isLocalFallbackAllowedForCloudPrimary()) {
        throw new Error(
          error instanceof Error
            ? `SUPABASE_ORG_STATE_REQUIRED: ${error.message}`
            : "SUPABASE_ORG_STATE_REQUIRED"
        )
      }
    }
  }

  const diskState = await loadFromDisk(orgId)
  if (dataBackend === "supabase") {
    try {
      await persistOrgStateSafe(orgId, orgName, diskState)
    } catch (error) {
      if (!isLocalFallbackAllowedForCloudPrimary()) {
        throw new Error(
          error instanceof Error
            ? `SUPABASE_ORG_STATE_REQUIRED: ${error.message}`
            : "SUPABASE_ORG_STATE_REQUIRED"
        )
      }
    }
  }
  return diskState
}

async function persistState(
  orgId: string,
  orgName: string | undefined,
  state: ComplianceState
): Promise<void> {
  const dataBackend = getConfiguredDataBackend()
  const keepLocalCopy = dataBackend !== "supabase"

  if (shouldUseSupabaseOrgStateAsPrimary()) {
    try {
      const mirrored = await persistOrgStateSafe(orgId, orgName, state)
      if (mirrored.synced) return
    } catch (error) {
      if (!isLocalFallbackAllowedForCloudPrimary()) {
        throw new Error(
          error instanceof Error
            ? `SUPABASE_ORG_STATE_REQUIRED: ${error.message}`
            : "SUPABASE_ORG_STATE_REQUIRED"
        )
      }
    }

    await persistToDisk(orgId, state)
    return
  }

  try {
    await persistOrgStateSafe(orgId, orgName, state)
  } catch {
    // Falls back to local store if public org_state mirror is not available.
  }

  if (!keepLocalCopy) return
  await persistToDisk(orgId, state)
}

async function loadLegacyCloudAppState(orgId: string): Promise<ComplianceState | null> {
  if (!hasSupabaseConfig()) return null

  try {
    type AppStateRow = { org_id: string; state: ComplianceState }
    const rows = await supabaseSelect<AppStateRow>(
      "app_state",
      `select=org_id,state&org_id=eq.${orgId}&limit=1`
    )

    if (!rows[0]?.state) return null
    return normalizeComplianceState(rows[0].state)
  } catch {
    return null
  }
}

function isMissingOrgForeignKey(error: unknown) {
  const text = error instanceof Error ? error.message : String(error)
  return (
    text.includes("23503") &&
    (text.includes("org_state_org_id_fkey") || text.includes("org_id") || text.includes("organizations"))
  )
}

async function ensureSupabaseOrganization(orgId: string, orgName?: string) {
  if (!hasSupabaseConfig()) return

  const name = orgName?.trim() || "Organizatie"
  const now = new Date().toISOString()
  await supabaseUpsert(
    "organizations",
    {
      id: orgId,
      name,
      slug: slugify(name),
      created_at: now,
      updated_at: now,
    },
    "public"
  )
}

async function persistOrgStateSafe(orgId: string, orgName: string | undefined, state: ComplianceState) {
  try {
    return await persistOrgStateToSupabase(orgId, state)
  } catch (error) {
    if (isMissingOrgForeignKey(error)) {
      await ensureSupabaseOrganization(orgId, orgName)
      return await persistOrgStateToSupabase(orgId, state)
    }
    throw error
  }
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || null
  )
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
        }, systemEventActor())
      )
    ),
  }
}
