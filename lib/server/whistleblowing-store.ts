// Whistleblowing channel store — Directiva EU 2019/1937
// Obligatoriu pentru organizații cu >50 angajați

import { createAdaptiveStorage } from "@/lib/server/storage-adapter"
import { randomBytes } from "node:crypto"

export type WhistleblowingCategory =
  | "fraud"
  | "corruption"
  | "safety"
  | "privacy"
  | "harassment"
  | "financial"
  | "other"

export type WhistleblowingStatus =
  | "received"
  | "under_investigation"
  | "resolved"
  | "closed"

export type WhistleblowingReport = {
  id: string
  orgId: string
  submittedAtISO: string
  deadlineISO: string         // 3 luni de la primire (Art. 9 Directivă)
  category: WhistleblowingCategory
  description: string
  status: WhistleblowingStatus
  anonymous: boolean
  contactInfo?: string        // Opțional — dacă persoana vrea să fie contactată
  internalNotes?: string      // Vizibil doar intern
  assignedTo?: string
  resolvedAtISO?: string
  createdAtISO: string
  updatedAtISO: string
}

export type WhistleblowingState = {
  reports: WhistleblowingReport[]
  publicToken: string         // Token public pentru URL-ul de semnalare
  legacyPublicToken?: string  // Token determinist vechi, acceptat temporar după migrare
  legacyTokenValidUntilISO?: string
  updatedAtISO: string
}

const storage = createAdaptiveStorage<WhistleblowingState>("whistleblowing", "whistleblowing")
const LEGACY_TOKEN_GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000

function legacyDeterministicToken(orgId: string): string {
  return Buffer.from(orgId).toString("base64url").slice(0, 16)
}

function generateRandomToken(): string {
  return randomBytes(18).toString("base64url")
}

function emptyState(): WhistleblowingState {
  return {
    reports: [],
    publicToken: generateRandomToken(),
    updatedAtISO: new Date().toISOString(),
  }
}

function isLegacyStillValid(state: WhistleblowingState, now = new Date()): boolean {
  if (!state.legacyPublicToken || !state.legacyTokenValidUntilISO) return false
  return new Date(state.legacyTokenValidUntilISO).getTime() > now.getTime()
}

async function writeState(orgId: string, state: WhistleblowingState): Promise<WhistleblowingState> {
  const updated = { ...state, updatedAtISO: new Date().toISOString() }
  await storage.write(orgId, updated)
  return updated
}

function migrateLegacyToken(orgId: string, state: WhistleblowingState): WhistleblowingState | null {
  const legacyToken = legacyDeterministicToken(orgId)
  if (state.publicToken !== legacyToken) return null

  return {
    ...state,
    publicToken: generateRandomToken(),
    legacyPublicToken: state.legacyPublicToken ?? legacyToken,
    legacyTokenValidUntilISO:
      state.legacyTokenValidUntilISO ??
      new Date(Date.now() + LEGACY_TOKEN_GRACE_PERIOD_MS).toISOString(),
  }
}

async function readMigratedStoredState(orgId: string): Promise<WhistleblowingState | null> {
  const stored = await storage.read(orgId)
  if (!stored) return null

  const migrated = migrateLegacyToken(orgId, stored)
  if (!migrated) return stored

  return writeState(orgId, migrated)
}

export async function readWhistleblowingState(orgId: string): Promise<WhistleblowingState> {
  const stored = await readMigratedStoredState(orgId)
  if (stored) return stored

  return writeState(orgId, emptyState())
}

export async function resolveOrgByToken(token: string, orgIds: string[]): Promise<string | null> {
  for (const orgId of orgIds) {
    const state = await readMigratedStoredState(orgId)
    if (!state) continue
    if (state.publicToken === token) return orgId
    if (state.legacyPublicToken === token && isLegacyStillValid(state)) return orgId
  }
  return null
}

function uid() {
  return `wb-${Math.random().toString(36).slice(2, 10)}`
}

function computeDeadline(submittedAt: string): string {
  const d = new Date(submittedAt)
  d.setMonth(d.getMonth() + 3)
  return d.toISOString()
}

export async function createReport(
  orgId: string,
  input: {
    category: WhistleblowingCategory
    description: string
    anonymous: boolean
    contactInfo?: string
  }
): Promise<WhistleblowingReport> {
  const state = await readWhistleblowingState(orgId)
  const now = new Date().toISOString()
  const report: WhistleblowingReport = {
    id: uid(),
    orgId,
    submittedAtISO: now,
    deadlineISO: computeDeadline(now),
    category: input.category,
    description: input.description,
    status: "received",
    anonymous: input.anonymous,
    contactInfo: input.anonymous ? undefined : input.contactInfo,
    createdAtISO: now,
    updatedAtISO: now,
  }
  await writeState(orgId, { ...state, reports: [report, ...state.reports] })
  return report
}

export async function updateReport(
  orgId: string,
  reportId: string,
  patch: Partial<Pick<WhistleblowingReport, "status" | "internalNotes" | "assignedTo" | "resolvedAtISO">>
): Promise<WhistleblowingReport | null> {
  const state = await readWhistleblowingState(orgId)
  const idx = state.reports.findIndex((r) => r.id === reportId)
  if (idx === -1) return null
  const updated: WhistleblowingReport = {
    ...state.reports[idx],
    ...patch,
    updatedAtISO: new Date().toISOString(),
  }
  const reports = [...state.reports]
  reports[idx] = updated
  await writeState(orgId, { ...state, reports })
  return updated
}
