// Whistleblowing channel store — Directiva EU 2019/1937
// Obligatoriu pentru organizații cu >50 angajați

import { createAdaptiveStorage } from "@/lib/server/storage-adapter"

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
  updatedAtISO: string
}

const storage = createAdaptiveStorage<WhistleblowingState>("whistleblowing", "whistleblowing")

function generateToken(orgId: string): string {
  // Deterministc token from orgId — safe to expose publicly
  return Buffer.from(orgId).toString("base64url").slice(0, 16)
}

function emptyState(orgId: string): WhistleblowingState {
  return {
    reports: [],
    publicToken: generateToken(orgId),
    updatedAtISO: new Date().toISOString(),
  }
}

export async function readWhistleblowingState(orgId: string): Promise<WhistleblowingState> {
  return (await storage.read(orgId)) ?? emptyState(orgId)
}

async function writeState(orgId: string, state: WhistleblowingState): Promise<WhistleblowingState> {
  const updated = { ...state, updatedAtISO: new Date().toISOString() }
  await storage.write(orgId, updated)
  return updated
}

export async function resolveOrgByToken(token: string, orgIds: string[]): Promise<string | null> {
  for (const orgId of orgIds) {
    if (generateToken(orgId) === token) return orgId
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
