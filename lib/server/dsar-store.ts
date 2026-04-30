// DSAR (Data Subject Access Requests) per-org store
// S2.3: GDPR Art. 15-22 — tracking cereri persoane vizate
// Pattern: identic cu nis2-store.ts (adaptive storage)

import { createAdaptiveStorage } from "@/lib/server/storage-adapter"

const dsarStorage = createAdaptiveStorage<DsarOrgState>("dsar", "dsar_state")

// ── Types ─────────────────────────────────────────────────────────────────────

export type DsarRequestType =
  | "access"        // Art. 15 — dreptul de acces
  | "rectification"  // Art. 16 — dreptul la rectificare
  | "erasure"        // Art. 17 — dreptul la ștergere
  | "portability"    // Art. 20 — dreptul la portabilitate
  | "objection"      // Art. 21 — dreptul la opoziție
  | "restriction"    // Art. 18 — dreptul la restricționare

export type DsarStatus =
  | "received"
  | "in_progress"
  | "awaiting_verification"
  | "responded"
  | "refused"

export type DsarRequest = {
  id: string
  orgId: string
  receivedAtISO: string
  deadlineISO: string           // receivedAt + 30 zile
  extendedDeadlineISO?: string  // max 60 zile total, cu notificare
  requesterName: string
  requesterEmail: string
  requestType: DsarRequestType
  status: DsarStatus
  identityVerified: boolean
  draftResponseGenerated: boolean
  responseReviewedByHuman: boolean
  responseSentAtISO?: string
  evidenceVaultIds: string[]
  notes?: string
  createdAtISO: string
  updatedAtISO: string
}

export type DsarOrgState = {
  requests: DsarRequest[]
  updatedAtISO: string
}

function emptyState(): DsarOrgState {
  return { requests: [], updatedAtISO: new Date().toISOString() }
}

// ── Storage ───────────────────────────────────────────────────────────────────

export async function readDsarState(orgId: string): Promise<DsarOrgState> {
  return (await dsarStorage.read(orgId)) ?? emptyState()
}

async function writeDsarState(orgId: string, state: DsarOrgState): Promise<DsarOrgState> {
  const updated = { ...state, updatedAtISO: new Date().toISOString() }
  await dsarStorage.write(orgId, updated)
  return updated
}

export async function seedDsarState(orgId: string, state: DsarOrgState): Promise<DsarOrgState> {
  return writeDsarState(orgId, state)
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

function uid() {
  return `dsar-${Math.random().toString(36).slice(2, 10)}`
}

function computeDeadline(receivedAtISO: string): string {
  return new Date(new Date(receivedAtISO).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function isDuplicateWindow(leftISO: string, rightISO: string) {
  const left = new Date(leftISO).getTime()
  const right = new Date(rightISO).getTime()
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false
  return Math.abs(left - right) <= 5 * 60 * 1000
}

export async function createDsar(
  orgId: string,
  input: Pick<DsarRequest, "requesterName" | "requesterEmail" | "requestType"> & {
    receivedAtISO?: string
    notes?: string
  }
): Promise<DsarRequest> {
  const state = await readDsarState(orgId)
  const now = new Date().toISOString()
  const receivedAt = input.receivedAtISO ?? now
  const duplicate = state.requests.find(
    (request) =>
      normalizeEmail(request.requesterEmail) === normalizeEmail(input.requesterEmail) &&
      request.requestType === input.requestType &&
      isDuplicateWindow(request.receivedAtISO, receivedAt)
  )

  if (duplicate) {
    return duplicate
  }

  const request: DsarRequest = {
    id: uid(),
    orgId,
    receivedAtISO: receivedAt,
    deadlineISO: computeDeadline(receivedAt),
    requesterName: input.requesterName,
    requesterEmail: input.requesterEmail,
    requestType: input.requestType,
    status: "received",
    identityVerified: false,
    draftResponseGenerated: false,
    responseReviewedByHuman: false,
    evidenceVaultIds: [],
    notes: input.notes,
    createdAtISO: now,
    updatedAtISO: now,
  }
  await writeDsarState(orgId, {
    ...state,
    requests: [request, ...state.requests],
  })
  return request
}

export async function updateDsar(
  orgId: string,
  dsarId: string,
  patch: Partial<Pick<
    DsarRequest,
    | "status" | "identityVerified" | "draftResponseGenerated"
    | "responseReviewedByHuman" | "responseSentAtISO"
    | "evidenceVaultIds" | "notes" | "extendedDeadlineISO"
  >>
): Promise<DsarRequest | null> {
  const state = await readDsarState(orgId)
  const idx = state.requests.findIndex((r) => r.id === dsarId)
  if (idx === -1) return null
  const updated: DsarRequest = {
    ...state.requests[idx],
    ...patch,
    updatedAtISO: new Date().toISOString(),
  }
  const requests = [...state.requests]
  requests[idx] = updated
  await writeDsarState(orgId, { ...state, requests })
  return updated
}

export async function deleteDsar(orgId: string, dsarId: string): Promise<boolean> {
  const state = await readDsarState(orgId)
  const filtered = state.requests.filter((r) => r.id !== dsarId)
  if (filtered.length === state.requests.length) return false
  await writeDsarState(orgId, { ...state, requests: filtered })
  return true
}
