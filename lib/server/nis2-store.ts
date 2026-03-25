// NIS2 per-org store — .data/nis2-{orgId}.json
// Holds: assessment answers, incident log, vendor risk register
// Sprint 9: usa storage-adapter în loc de fs direct → migrare Supabase ușoară.

import type { Nis2Answers, Nis2AnswersMeta, Nis2Sector } from "@/lib/compliance/nis2-rules"
import { detectTechVendor } from "@/lib/server/efactura-mock-data"
import type { EfacturaSupplierImportRecord } from "@/lib/server/efactura-vendor-signals"
import { validateCUI } from "@/lib/server/request-validation"
import { createAdaptiveStorage } from "@/lib/server/storage-adapter"
import { hasSupabaseConfig, supabaseUpsert } from "@/lib/server/supabase-rest"

const nis2Storage = createAdaptiveStorage<Nis2OrgState>("nis2", "nis2_state")

// ── Types ─────────────────────────────────────────────────────────────────────

export type Nis2IncidentSeverity = "low" | "medium" | "high" | "critical"
export type Nis2IncidentStatus = "open" | "reported-24h" | "reported-72h" | "closed"

// Câmpuri aliniate cu formularul oficial de raportare DNSC (NIS2 Art. 23)
export type Nis2AttackType =
  | "ransomware"
  | "ddos"
  | "phishing"
  | "supply-chain"
  | "insider"
  | "unauthorized-access"
  | "data-breach"
  | "unknown"
  | "other"

export type Nis2OperationalImpact = "none" | "partial" | "full"

// ── NIS2 Art. 23 — Raportare în 3 etape ───────────────────────────────────────
// Etapa 1: Early warning (24h) — notificare inițială DNSC
// Etapa 2: Raport complet (72h) — analiză detaliată, impact, măsuri
// Etapa 3: Raport final (1 lună) — cauză rădăcină, lecții, plan preventiv

export type Nis2StageReport = {
  submittedAtISO: string
  submittedBy?: string       // email-ul celui care a trimis
  content: string            // textul / rezumatul raportului
  notifiedDNSCAtISO?: string // momentul trimiterii efective la DNSC
}

export type Nis2EarlyWarningReport = Nis2StageReport & {
  initialImpactAssessment: string
  crossBorderEffect: boolean
}

export type Nis2FullReport72h = Nis2StageReport & {
  detailedAnalysis: string
  technicalIndicators: string
  affectedDataCategories: string[]
  estimatedAffectedUsers: number | null
}

export type Nis2FinalReport = Nis2StageReport & {
  rootCauseAnalysis: string
  lessonsLearned: string
  preventiveMeasures: string
  remediationDeadlineISO?: string
}

export type Nis2DnscCorrespondence = {
  id: string
  date: string           // ISO date
  direction: "sent" | "received"
  summary: string
  createdAtISO: string
}

export type Nis2PostIncidentTracking = {
  dnscReference?: string           // număr înregistrare DNSC primit după early warning
  dnscCorrespondence?: Nis2DnscCorrespondence[]
  remediationStartedAtISO?: string
  remediationCompletedAtISO?: string
  followUpValidationAtISO?: string
  isRemediated: boolean
  notes?: string
}

// ── ANSPDCP Breach Notification (GDPR Art. 33) — parallel cu DNSC ────────────
// Dacă incidentul implică date personale, notificarea ANSPDCP e separată:
// - Deadline propriu (72h de la descoperire)
// - Formular propriu (categorii date, nr persoane, DPO, măsuri)
// - Tracking propriu (status, nr înregistrare, corespondență)

export type AnspdcpNotificationStatus = "pending" | "submitted" | "acknowledged"

export type AnspdcpBreachNotification = {
  required: boolean                     // user confirmă că e necesar
  deadlineISO: string                   // detectedAt + 72h
  status: AnspdcpNotificationStatus
  // GDPR Art. 33(3) — conținut obligatoriu:
  dataCategories: string[]              // categorii date personale afectate
  estimatedDataSubjects: number | null  // nr. aproximativ persoane vizate
  dpoContact?: string                   // DPO / responsabil conformitate
  consequencesDescription?: string      // consecințe probabile
  measuresTaken?: string                // măsuri luate / propuse
  // Tracking
  submittedAtISO?: string
  anspdcpReference?: string             // nr. înregistrare ANSPDCP
  notifyDataSubjects: boolean           // Art. 34 — dacă trebuie notificați individual
  dataSubjectsNotifiedAtISO?: string
}

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
  // ── Câmpuri DNSC (opționale, backward-compatible) ──────────────────────────
  attackType?: Nis2AttackType
  attackVector?: string           // ex: "email phishing cu atașament .exe"
  operationalImpact?: Nis2OperationalImpact
  operationalImpactDetails?: string // ex: "sisteme de producție oprite 4h"
  measuresTaken?: string          // măsuri de containment/remediere luate
  reportedToDNSCAtISO?: string    // când s-a trimis raportul oficial la DNSC
  // ── SLA alert tracking (A6) ─────────────────────────────────────────────────
  alert50SentAtISO?: string       // timestamp when 50% SLA alert was sent
  alert80SentAtISO?: string       // timestamp when 80% SLA alert was sent
  // ── Raportare 3 etape NIS2 Art. 23 (S0.1) ─────────────────────────────────
  earlyWarningReport?: Nis2EarlyWarningReport
  fullReport72h?: Nis2FullReport72h
  finalReport?: Nis2FinalReport
  // ── Post-incident tracking (S2.4) ─────────────────────────────────────────
  postIncidentTracking?: Nis2PostIncidentTracking
  // ── ANSPDCP breach notification (GOLD 6) ──────────────────────────────────
  involvesPersonalData?: boolean
  anspdcpNotification?: AnspdcpBreachNotification
  createdAtISO: string
  updatedAtISO: string
}

export type Nis2VendorRiskLevel = "low" | "medium" | "high" | "critical"

export type Nis2Vendor = {
  id: string
  name: string
  cui?: string
  service: string
  riskLevel: Nis2VendorRiskLevel
  hasSecurityClause: boolean
  hasIncidentNotification: boolean
  hasAuditRight: boolean
  contractReviewAtISO?: string
  notes: string
  createdAtISO: string
  updatedAtISO: string
  // Sprint 5.1: 3-level tech detection
  techConfidence?: "high" | "medium" | "low" | null
  techDetectionReason?: string
  // Sprint 5.4: Supply Chain Risk Score
  hasDPA?: boolean                                  // DPA (Art. 28 GDPR) marcat de user
  hasSecuritySLA?: boolean                          // SLA securitate verificat de user
  dataProcessingVolume?: "none" | "low" | "high"   // volum date procesate — estimare
  lastReviewDate?: string                           // ultima revizuire contract (ISO)
  nextReviewDue?: string                            // lastReviewDate + 12 luni (ISO)
}

export type Nis2AssessmentRecord = {
  sector: Nis2Sector
  answers: Nis2Answers
  answersMeta?: Nis2AnswersMeta  // S2.1: per-answer source, confidence, confirmed
  savedAtISO: string
  score: number
  maturityLabel: string
}

export type DnscRegistrationStatus = "not-started" | "in-progress" | "submitted" | "confirmed"

// ── Sprint 2.6: Maturity Assessment DNSC ─────────────────────────────────────

export type MaturityDomainStatus = "compliant" | "partial" | "non_compliant"

export type MaturityDomain = {
  id: string
  name: string
  score: number
  status: MaturityDomainStatus
}

export type MaturityAssessment = {
  level: "basic" | "important" | "essential"
  completedAt: string
  domains: MaturityDomain[]
  overallScore: number
  answers: Record<string, string>
  remediationPlanDue: string   // completedAt + 30 zile
  remediationPlan?: string
}

// ── Sprint 2.7: Board/CISO Training Tracker ──────────────────────────────────

export type BoardMember = {
  id: string
  name: string
  role: string                    // "Administrator", "Director IT", "CISO", "Responsabil Securitate"
  nis2TrainingCompleted?: string  // ISO date
  nis2TrainingExpiry?: string     // completed + 12 luni
  cisoCertification?: string      // "CISA", "CISSP", "CompTIA Security+", etc.
  cisoCertExpiry?: string         // ISO date
  notes?: string
  createdAtISO: string
  updatedAtISO: string
}

export type Nis2OrgState = {
  assessment: Nis2AssessmentRecord | null
  incidents: Nis2Incident[]
  vendors: Nis2Vendor[]
  updatedAtISO: string
  dnscRegistrationStatus?: DnscRegistrationStatus  // Sprint 4 — opțional, backward-safe
  dnscRegistrationNumber?: string                  // GOLD 6 — număr înregistrare DNSC primit
  dnscRegistrationCorrespondence?: Nis2DnscCorrespondence[]  // GOLD 6 — corespondență înregistrare
  maturityAssessment?: MaturityAssessment           // Sprint 2.6
  boardMembers?: BoardMember[]                      // Sprint 2.7
}

function emptyState(): Nis2OrgState {
  return {
    assessment: null,
    incidents: [],
    vendors: [],
    updatedAtISO: new Date().toISOString(),
  }
}

// ── Storage helpers (Sprint 9: via adapter, nu direct fs) ─────────────────────

export async function readNis2State(orgId: string): Promise<Nis2OrgState> {
  return (await nis2Storage.read(orgId)) ?? emptyState()
}

async function writeNis2State(orgId: string, state: Nis2OrgState): Promise<Nis2OrgState> {
  const updated = { ...state, updatedAtISO: new Date().toISOString() }
  try {
    await nis2Storage.write(orgId, updated)
  } catch (error) {
    if (isMissingOrgForeignKey(error)) {
      await ensureSupabaseOrganization(orgId)
      await nis2Storage.write(orgId, updated)
    } else {
      throw error
    }
  }
  return updated
}

function isMissingOrgForeignKey(error: unknown) {
  const text = error instanceof Error ? error.message : String(error)
  return (
    text.includes("23503") &&
    (text.includes("nis2_state_org_id_fkey") || text.includes("org_id") || text.includes("organizations"))
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
    attackType?: Nis2AttackType
    attackVector?: string
    operationalImpact?: Nis2OperationalImpact
    operationalImpactDetails?: string
    measuresTaken?: string
    involvesPersonalData?: boolean
  }
): Promise<Nis2Incident> {
  const state = await readNis2State(orgId)
  const now = new Date().toISOString()
  const detectedAt = input.detectedAtISO ?? now
  const deadlines = incidentDeadlines(detectedAt)

  // Auto-detect personal data involvement from attack type
  const personalData = input.involvesPersonalData ??
    input.attackType === "data-breach"

  const incident: Nis2Incident = {
    id: uid(),
    title: input.title,
    description: input.description,
    severity: input.severity,
    status: "open",
    detectedAtISO: detectedAt,
    ...deadlines,
    affectedSystems: input.affectedSystems,
    ...(input.attackType !== undefined && { attackType: input.attackType }),
    ...(input.attackVector !== undefined && { attackVector: input.attackVector }),
    ...(input.operationalImpact !== undefined && { operationalImpact: input.operationalImpact }),
    ...(input.operationalImpactDetails !== undefined && { operationalImpactDetails: input.operationalImpactDetails }),
    ...(input.measuresTaken !== undefined && { measuresTaken: input.measuresTaken }),
    // ANSPDCP breach notification (GOLD 6)
    involvesPersonalData: personalData,
    ...(personalData && {
      anspdcpNotification: {
        required: true,
        deadlineISO: new Date(new Date(detectedAt).getTime() + 72 * 60 * 60 * 1000).toISOString(),
        status: "pending" as const,
        dataCategories: [],
        estimatedDataSubjects: null,
        notifyDataSubjects: false,
      },
    }),
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
  patch: Partial<Pick<
    Nis2Incident,
    | "status" | "title" | "description" | "severity" | "affectedSystems"
    | "reportedAtISO" | "resolvedAtISO"
    | "attackType" | "attackVector" | "operationalImpact" | "operationalImpactDetails"
    | "measuresTaken" | "reportedToDNSCAtISO"
    | "alert50SentAtISO" | "alert80SentAtISO"
    | "earlyWarningReport" | "fullReport72h" | "finalReport" | "postIncidentTracking"
    | "involvesPersonalData" | "anspdcpNotification"
  >>
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

// ── R-9: Import furnizori din e-Factura ───────────────────────────────────────

/**
 * Upsert furnizori din validările e-Factura în registrul NIS2.
 * Dedup pe CUI când există, altfel pe nume (case-insensitive) — nu creează duplicate.
 * Returnează numărul de furnizori nou adăugați.
 */
export async function upsertVendorsFromEfactura(
  orgId: string,
  supplierRecords: EfacturaSupplierImportRecord[]
): Promise<{ added: number; skipped: number; techVendorsWithoutDpa: string[] }> {
  const state = await readNis2State(orgId)
  const existingKeys = new Set(
    state.vendors.flatMap((vendor) => buildVendorIdentityKeys(vendor.name, vendor.cui))
  )
  const now = new Date().toISOString()
  let added = 0
  let skipped = 0
  const newVendors: Nis2Vendor[] = []
  const techVendorsWithoutDpa: string[] = []

  for (const record of supplierRecords) {
    const normalizedName = record.name.trim()
    const normalizedCui = record.cui ? validateCUI(record.cui) ?? undefined : undefined
    if (!normalizedName) {
      skipped++
      continue
    }

    const identityKeys = buildVendorIdentityKeys(normalizedName, normalizedCui)
    if (identityKeys.some((key) => existingKeys.has(key))) {
      skipped++
      continue
    }
    identityKeys.forEach((key) => existingKeys.add(key))

    // Sprint 5.1: 3-level detection
    const detection = detectTechVendor(normalizedName, normalizedCui ?? "")
    const { isTech, confidence, reason } = detection
    if (isTech) techVendorsWithoutDpa.push(normalizedName)

    const invoiceCount =
      typeof record.invoiceCount === "number" && Number.isFinite(record.invoiceCount)
        ? Math.max(1, Math.trunc(record.invoiceCount))
        : 1

    let notes: string
    if (isTech && confidence === "high") {
      notes = "⚠️ Furnizor tech/cloud identificat cu certitudine (Nivel 1). Verifică și atașează DPA conform GDPR Art. 28 și NIS2."
    } else if (isTech && confidence === "low") {
      notes = "🔍 Posibil furnizor tech (Nivel 3 — keyword match). Verifică manual dacă se aplică DPA."
    } else {
      notes = "Importat automat din validările e-Factura. Completează detaliile de securitate."
    }

    if (normalizedCui) {
      notes = `${notes} CUI detectat: ${normalizedCui}.`
    }
    if (invoiceCount > 1) {
      notes = `${notes} Detectat în ${invoiceCount} validări e-Factura.`
    }

    newVendors.push({
      id: uid(),
      name: normalizedName,
      ...(normalizedCui ? { cui: normalizedCui } : {}),
      service: isTech ? "Furnizor tech/cloud/SaaS (detectat automat)" : "Furnizor detectat din e-Factura",
      riskLevel: isTech && confidence === "high" ? "high" : isTech ? "medium" : "medium",
      hasSecurityClause: false,
      hasIncidentNotification: false,
      hasAuditRight: false,
      notes,
      techConfidence: confidence,
      techDetectionReason: reason || undefined,
      createdAtISO: now,
      updatedAtISO: now,
    })
    added++
  }

  if (newVendors.length > 0) {
    await writeNis2State(orgId, {
      ...state,
      vendors: [...newVendors, ...state.vendors],
    })
  }

  return { added, skipped, techVendorsWithoutDpa }
}

function buildVendorIdentityKeys(name: string, cui?: string) {
  const keys = [`name:${name.trim().toLowerCase()}`]
  if (cui) keys.push(`cui:${cui}`)
  return keys
}

// ── Sprint 4: DNSC Registration Status ───────────────────────────────────────

export async function saveDnscRegistrationStatus(
  orgId: string,
  status: DnscRegistrationStatus
): Promise<Nis2OrgState> {
  const state = await readNis2State(orgId)
  return writeNis2State(orgId, { ...state, dnscRegistrationStatus: status })
}

export async function getDnscRegistrationStatus(orgId: string): Promise<DnscRegistrationStatus> {
  const state = await readNis2State(orgId)
  return state.dnscRegistrationStatus ?? "not-started"
}

export async function saveDnscRegistrationNumber(orgId: string, number: string): Promise<void> {
  const state = await readNis2State(orgId)
  await writeNis2State(orgId, { ...state, dnscRegistrationNumber: number.trim() })
}

export async function addDnscRegistrationCorrespondenceEntry(
  orgId: string,
  entry: Omit<Nis2DnscCorrespondence, "id" | "createdAtISO">
): Promise<Nis2DnscCorrespondence[]> {
  const state = await readNis2State(orgId)
  const newEntry: Nis2DnscCorrespondence = { ...entry, id: uid(), createdAtISO: new Date().toISOString() }
  const correspondence = [...(state.dnscRegistrationCorrespondence ?? []), newEntry]
  await writeNis2State(orgId, { ...state, dnscRegistrationCorrespondence: correspondence })
  return correspondence
}

export async function deleteDnscRegistrationCorrespondenceEntry(
  orgId: string,
  entryId: string
): Promise<Nis2DnscCorrespondence[]> {
  const state = await readNis2State(orgId)
  const correspondence = (state.dnscRegistrationCorrespondence ?? []).filter((e) => e.id !== entryId)
  await writeNis2State(orgId, { ...state, dnscRegistrationCorrespondence: correspondence })
  return correspondence
}

// ── Sprint 2.6: Maturity Assessment DNSC ─────────────────────────────────────

export async function saveMaturityAssessment(
  orgId: string,
  data: MaturityAssessment
): Promise<Nis2OrgState> {
  const state = await readNis2State(orgId)
  return writeNis2State(orgId, { ...state, maturityAssessment: data })
}

export async function readMaturityAssessment(orgId: string): Promise<MaturityAssessment | null> {
  const state = await readNis2State(orgId)
  return state.maturityAssessment ?? null
}

// ── Sprint 2.7: Board / CISO Training Tracker ────────────────────────────────

export async function readBoardMembers(orgId: string): Promise<BoardMember[]> {
  const state = await readNis2State(orgId)
  return state.boardMembers ?? []
}

export async function createBoardMember(
  orgId: string,
  input: Pick<BoardMember, "name" | "role"> &
    Partial<Pick<BoardMember, "nis2TrainingCompleted" | "cisoCertification" | "cisoCertExpiry" | "notes">>
): Promise<BoardMember> {
  const state = await readNis2State(orgId)
  const now = new Date().toISOString()
  const nis2TrainingExpiry = input.nis2TrainingCompleted
    ? new Date(
        new Date(input.nis2TrainingCompleted).getTime() + 365 * 24 * 60 * 60 * 1000
      ).toISOString()
    : undefined
  const member: BoardMember = {
    id: uid(),
    name: input.name,
    role: input.role,
    ...(input.nis2TrainingCompleted !== undefined && { nis2TrainingCompleted: input.nis2TrainingCompleted, nis2TrainingExpiry }),
    ...(input.cisoCertification !== undefined && { cisoCertification: input.cisoCertification }),
    ...(input.cisoCertExpiry !== undefined && { cisoCertExpiry: input.cisoCertExpiry }),
    ...(input.notes !== undefined && { notes: input.notes }),
    createdAtISO: now,
    updatedAtISO: now,
  }
  await writeNis2State(orgId, {
    ...state,
    boardMembers: [member, ...(state.boardMembers ?? [])],
  })
  return member
}

export async function updateBoardMember(
  orgId: string,
  memberId: string,
  patch: Partial<Omit<BoardMember, "id" | "createdAtISO" | "updatedAtISO">>
): Promise<BoardMember | null> {
  const state = await readNis2State(orgId)
  const members = state.boardMembers ?? []
  const idx = members.findIndex((m) => m.id === memberId)
  if (idx === -1) return null
  const nis2TrainingExpiry =
    patch.nis2TrainingCompleted !== undefined
      ? new Date(
          new Date(patch.nis2TrainingCompleted).getTime() + 365 * 24 * 60 * 60 * 1000
        ).toISOString()
      : members[idx].nis2TrainingExpiry
  const updated: BoardMember = {
    ...members[idx],
    ...patch,
    nis2TrainingExpiry,
    updatedAtISO: new Date().toISOString(),
  }
  const newMembers = [...members]
  newMembers[idx] = updated
  await writeNis2State(orgId, { ...state, boardMembers: newMembers })
  return updated
}

export async function deleteBoardMember(orgId: string, memberId: string): Promise<boolean> {
  const state = await readNis2State(orgId)
  const members = state.boardMembers ?? []
  const filtered = members.filter((m) => m.id !== memberId)
  if (filtered.length === members.length) return false
  await writeNis2State(orgId, { ...state, boardMembers: filtered })
  return true
}

// ── Seed (demo) ──────────────────────────────────────────────────────────────

/**
 * Bulk-write NIS2 state for a given org — used by demo seeder.
 * Overwrites the entire NIS2 state for that org.
 */
export async function seedNis2State(orgId: string, state: Nis2OrgState): Promise<void> {
  await writeNis2State(orgId, state)
}

// ── DNSC Report generator — implementare în lib/compliance/dnsc-report.ts ─────
export { buildDNSCReport } from "@/lib/compliance/dnsc-report"
