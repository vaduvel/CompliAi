// DORA store — Digital Operational Resilience Act (EU 2022/2554)
// Aplicabil: instituții financiare, asigurători, firme de investiții, prestatori ICT critici

import { createAdaptiveStorage } from "@/lib/server/storage-adapter"

// ─── Types ───────────────────────────────────────────────────────────────────

export type DoraIncidentSeverity = "major" | "significant" | "minor"
export type DoraIncidentStatus =
  | "detected"
  | "under-analysis"
  | "notified-authority"
  | "resolved"
  | "closed"

export type DoraIncident = {
  id: string
  title: string
  description: string
  severity: DoraIncidentSeverity
  status: DoraIncidentStatus
  occurredAtISO: string
  detectedAtISO: string
  // Termen raportare: major → 4h inițial (DEISP), 72h detaliat, 1 lună final
  initialReportDeadlineISO: string   // T+4h (majore) / T+24h (semnificative)
  finalReportDeadlineISO: string     // T+1 lună
  affectedSystems: string[]
  estimatedImpact: string
  rootCause?: string
  mitigation?: string
  notifiedAuthorityAtISO?: string
  resolvedAtISO?: string
  createdAtISO: string
  updatedAtISO: string
}

export type TprmCriticality = "critical" | "important" | "standard"
export type TprmStatus = "active" | "under-review" | "exiting"

export type DoraTprmEntry = {
  id: string
  providerName: string
  serviceType: string            // ex: "Cloud hosting", "Payment processing"
  criticality: TprmCriticality
  contractStartISO: string
  contractEndISO: string
  lastAssessmentISO?: string
  nextAssessmentISO?: string
  riskLevel: "low" | "medium" | "high"
  status: TprmStatus
  subcontractors?: string[]
  notes?: string
  createdAtISO: string
  updatedAtISO: string
}

export type DoraTestType = "vulnerability-assessment" | "penetration-test" | "tlpt" | "scenario-based"
export type DoraTestStatus = "planned" | "in-progress" | "completed" | "failed"

export type DoraResilienceTest = {
  id: string
  testType: DoraTestType
  scope: string
  plannedAtISO: string
  completedAtISO?: string
  status: DoraTestStatus
  findings: string
  remediationStatus?: "open" | "in-progress" | "closed"
  conductedBy: string
  createdAtISO: string
  updatedAtISO: string
}

export type DoraState = {
  incidents: DoraIncident[]
  tprm: DoraTprmEntry[]
  resilienceTests: DoraResilienceTest[]
  updatedAtISO: string
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const storage = createAdaptiveStorage<DoraState>("dora", "dora")

function emptyState(): DoraState {
  return {
    incidents: [],
    tprm: [],
    resilienceTests: [],
    updatedAtISO: new Date().toISOString(),
  }
}

export async function readDoraState(orgId: string): Promise<DoraState> {
  return (await storage.read(orgId)) ?? emptyState()
}

async function writeState(orgId: string, state: DoraState): Promise<DoraState> {
  const updated = { ...state, updatedAtISO: new Date().toISOString() }
  await storage.write(orgId, updated)
  return updated
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

// ─── Incidents ────────────────────────────────────────────────────────────────

function computeReportDeadlines(
  detectedAt: string,
  severity: DoraIncidentSeverity
): { initial: string; final: string } {
  const detected = new Date(detectedAt)
  const initial = new Date(detected)
  const final = new Date(detected)
  // DORA Art. 19: major → initial notification within 4h, significant → 24h
  if (severity === "major") initial.setHours(initial.getHours() + 4)
  else if (severity === "significant") initial.setHours(initial.getHours() + 24)
  else initial.setHours(initial.getHours() + 72)
  // Final report: within 1 month
  final.setMonth(final.getMonth() + 1)
  return { initial: initial.toISOString(), final: final.toISOString() }
}

export async function createIncident(
  orgId: string,
  input: {
    title: string
    description: string
    severity: DoraIncidentSeverity
    occurredAtISO: string
    detectedAtISO: string
    affectedSystems: string[]
    estimatedImpact: string
  }
): Promise<DoraIncident> {
  const state = await readDoraState(orgId)
  const now = new Date().toISOString()
  const { initial, final } = computeReportDeadlines(input.detectedAtISO, input.severity)
  const incident: DoraIncident = {
    id: uid("dora-inc"),
    ...input,
    status: "detected",
    initialReportDeadlineISO: initial,
    finalReportDeadlineISO: final,
    createdAtISO: now,
    updatedAtISO: now,
  }
  await writeState(orgId, { ...state, incidents: [incident, ...state.incidents] })
  return incident
}

export async function updateIncident(
  orgId: string,
  incidentId: string,
  patch: Partial<Pick<DoraIncident, "status" | "rootCause" | "mitigation" | "notifiedAuthorityAtISO" | "resolvedAtISO">>
): Promise<DoraIncident | null> {
  const state = await readDoraState(orgId)
  const idx = state.incidents.findIndex((i) => i.id === incidentId)
  if (idx === -1) return null
  const updated: DoraIncident = { ...state.incidents[idx], ...patch, updatedAtISO: new Date().toISOString() }
  const incidents = [...state.incidents]
  incidents[idx] = updated
  await writeState(orgId, { ...state, incidents })
  return updated
}

// ─── TPRM ────────────────────────────────────────────────────────────────────

export async function createTprmEntry(
  orgId: string,
  input: Omit<DoraTprmEntry, "id" | "createdAtISO" | "updatedAtISO">
): Promise<DoraTprmEntry> {
  const state = await readDoraState(orgId)
  const now = new Date().toISOString()
  const entry: DoraTprmEntry = { id: uid("dora-tp"), ...input, createdAtISO: now, updatedAtISO: now }
  await writeState(orgId, { ...state, tprm: [entry, ...state.tprm] })
  return entry
}

export async function updateTprmEntry(
  orgId: string,
  entryId: string,
  patch: Partial<Pick<DoraTprmEntry, "status" | "riskLevel" | "lastAssessmentISO" | "nextAssessmentISO" | "notes">>
): Promise<DoraTprmEntry | null> {
  const state = await readDoraState(orgId)
  const idx = state.tprm.findIndex((e) => e.id === entryId)
  if (idx === -1) return null
  const updated: DoraTprmEntry = { ...state.tprm[idx], ...patch, updatedAtISO: new Date().toISOString() }
  const tprm = [...state.tprm]
  tprm[idx] = updated
  await writeState(orgId, { ...state, tprm })
  return updated
}

// ─── Resilience Tests ─────────────────────────────────────────────────────────

export async function createResilienceTest(
  orgId: string,
  input: Omit<DoraResilienceTest, "id" | "createdAtISO" | "updatedAtISO">
): Promise<DoraResilienceTest> {
  const state = await readDoraState(orgId)
  const now = new Date().toISOString()
  const test: DoraResilienceTest = { id: uid("dora-test"), ...input, createdAtISO: now, updatedAtISO: now }
  await writeState(orgId, { ...state, resilienceTests: [test, ...state.resilienceTests] })
  return test
}
