// NIS2 per-org store — .data/nis2-{orgId}.json
// Holds: assessment answers, incident log, vendor risk register

import { promises as fs } from "node:fs"
import path from "node:path"

import type { Nis2Answers, Nis2Sector } from "@/lib/compliance/nis2-rules"

const DATA_DIR = path.join(process.cwd(), ".data")

// ── Types ─────────────────────────────────────────────────────────────────────

export type Nis2IncidentSeverity = "low" | "medium" | "high" | "critical"
export type Nis2IncidentStatus = "open" | "reported-24h" | "reported-72h" | "closed"

export type Nis2Incident = {
  id: string
  title: string
  description: string
  severity: Nis2IncidentSeverity
  status: Nis2IncidentStatus
  detectedAtISO: string
  deadline24hISO: string // detectedAt + 24h → early warning to DNSC
  deadline72hISO: string // detectedAt + 72h → full report to DNSC
  reportedAtISO?: string
  resolvedAtISO?: string
  affectedSystems: string[]
  createdAtISO: string
  updatedAtISO: string
}

export type Nis2VendorRiskLevel = "low" | "medium" | "high" | "critical"

export type Nis2Vendor = {
  id: string
  name: string
  service: string
  riskLevel: Nis2VendorRiskLevel
  hasSecurityClause: boolean
  hasIncidentNotification: boolean
  hasAuditRight: boolean
  contractReviewAtISO?: string
  notes: string
  createdAtISO: string
  updatedAtISO: string
}

export type Nis2AssessmentRecord = {
  sector: Nis2Sector
  answers: Nis2Answers
  savedAtISO: string
  score: number
  maturityLabel: string
}

export type Nis2OrgState = {
  assessment: Nis2AssessmentRecord | null
  incidents: Nis2Incident[]
  vendors: Nis2Vendor[]
  updatedAtISO: string
}

function emptyState(): Nis2OrgState {
  return {
    assessment: null,
    incidents: [],
    vendors: [],
    updatedAtISO: new Date().toISOString(),
  }
}

// ── File helpers ──────────────────────────────────────────────────────────────

function getFile(orgId: string): string {
  return path.join(DATA_DIR, `nis2-${orgId}.json`)
}

export async function readNis2State(orgId: string): Promise<Nis2OrgState> {
  try {
    const raw = await fs.readFile(getFile(orgId), "utf8")
    return JSON.parse(raw) as Nis2OrgState
  } catch {
    return emptyState()
  }
}

async function writeNis2State(orgId: string, state: Nis2OrgState): Promise<Nis2OrgState> {
  const updated = { ...state, updatedAtISO: new Date().toISOString() }
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(getFile(orgId), JSON.stringify(updated, null, 2), "utf8")
  return updated
}

// ── Assessment ────────────────────────────────────────────────────────────────

export async function saveNis2Assessment(
  orgId: string,
  record: Nis2AssessmentRecord
): Promise<Nis2OrgState> {
  const state = await readNis2State(orgId)
  return writeNis2State(orgId, { ...state, assessment: record })
}

// ── Incidents ─────────────────────────────────────────────────────────────────

function uid() {
  return `nis2-${Math.random().toString(36).slice(2, 10)}`
}

function incidentDeadlines(detectedAtISO: string) {
  const t = new Date(detectedAtISO).getTime()
  return {
    deadline24hISO: new Date(t + 24 * 60 * 60 * 1000).toISOString(),
    deadline72hISO: new Date(t + 72 * 60 * 60 * 1000).toISOString(),
  }
}

export async function createIncident(
  orgId: string,
  input: Pick<Nis2Incident, "title" | "description" | "severity" | "affectedSystems"> & {
    detectedAtISO?: string
  }
): Promise<Nis2Incident> {
  const state = await readNis2State(orgId)
  const now = new Date().toISOString()
  const detectedAt = input.detectedAtISO ?? now
  const deadlines = incidentDeadlines(detectedAt)
  const incident: Nis2Incident = {
    id: uid(),
    title: input.title,
    description: input.description,
    severity: input.severity,
    status: "open",
    detectedAtISO: detectedAt,
    ...deadlines,
    affectedSystems: input.affectedSystems,
    createdAtISO: now,
    updatedAtISO: now,
  }
  await writeNis2State(orgId, {
    ...state,
    incidents: [incident, ...state.incidents],
  })
  return incident
}

export async function updateIncident(
  orgId: string,
  incidentId: string,
  patch: Partial<Pick<Nis2Incident, "status" | "title" | "description" | "severity" | "affectedSystems" | "reportedAtISO" | "resolvedAtISO">>
): Promise<Nis2Incident | null> {
  const state = await readNis2State(orgId)
  const idx = state.incidents.findIndex((i) => i.id === incidentId)
  if (idx === -1) return null
  const updated: Nis2Incident = {
    ...state.incidents[idx],
    ...patch,
    updatedAtISO: new Date().toISOString(),
  }
  const incidents = [...state.incidents]
  incidents[idx] = updated
  await writeNis2State(orgId, { ...state, incidents })
  return updated
}

export async function deleteIncident(orgId: string, incidentId: string): Promise<boolean> {
  const state = await readNis2State(orgId)
  const filtered = state.incidents.filter((i) => i.id !== incidentId)
  if (filtered.length === state.incidents.length) return false
  await writeNis2State(orgId, { ...state, incidents: filtered })
  return true
}

// ── Vendors ───────────────────────────────────────────────────────────────────

export async function createVendor(
  orgId: string,
  input: Pick<Nis2Vendor, "name" | "service" | "riskLevel" | "hasSecurityClause" | "hasIncidentNotification" | "hasAuditRight" | "notes" | "contractReviewAtISO">
): Promise<Nis2Vendor> {
  const state = await readNis2State(orgId)
  const now = new Date().toISOString()
  const vendor: Nis2Vendor = {
    id: uid(),
    ...input,
    createdAtISO: now,
    updatedAtISO: now,
  }
  await writeNis2State(orgId, {
    ...state,
    vendors: [vendor, ...state.vendors],
  })
  return vendor
}

export async function updateVendor(
  orgId: string,
  vendorId: string,
  patch: Partial<Omit<Nis2Vendor, "id" | "createdAtISO" | "updatedAtISO">>
): Promise<Nis2Vendor | null> {
  const state = await readNis2State(orgId)
  const idx = state.vendors.findIndex((v) => v.id === vendorId)
  if (idx === -1) return null
  const updated: Nis2Vendor = {
    ...state.vendors[idx],
    ...patch,
    updatedAtISO: new Date().toISOString(),
  }
  const vendors = [...state.vendors]
  vendors[idx] = updated
  await writeNis2State(orgId, { ...state, vendors })
  return updated
}

export async function deleteVendor(orgId: string, vendorId: string): Promise<boolean> {
  const state = await readNis2State(orgId)
  const filtered = state.vendors.filter((v) => v.id !== vendorId)
  if (filtered.length === state.vendors.length) return false
  await writeNis2State(orgId, { ...state, vendors: filtered })
  return true
}
