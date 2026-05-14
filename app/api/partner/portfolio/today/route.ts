// FC-11 (2026-05-14) — Portfolio "AZI" aggregator API.
//
// Returnează într-un singur GET datele pentru cele 6 carduri de pe homepage-ul
// cabinetului (/portfolio/fiscal tab "AZI"):
//   1. 📋 Declarații de depus / rectificat (R6/R7 + filing-missing/late)
//   2. 📅 Termene urgente (7 zile)
//   3. ⚠️ Certificate & împuterniciri (FC-10 alerts)
//   4. 📨 Cereri documente lipsă (FC-9 overdue + pending client)
//   5. 🚨 Pre-ANAF iminent (FC-6 top risks)
//   6. 💼 Excepții CRITIC Master Queue (FC-7)
//
// Plus header snapshot: green/yellow/red counts + total risk RON + ore cabinet.
//
// Doar partner mode. Each item include focusId pentru click-through cu ?focus=.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession, resolveUserMode } from "@/lib/server/auth"
import {
  listAccessiblePortfolioMemberships,
  loadPortfolioBundles,
  type PortfolioOrgBundle,
} from "@/lib/server/portfolio"
import { runCrossCorrelation } from "@/lib/compliance/cross-correlation-engine"
import {
  annotateWithImpact,
  type FindingWithImpact,
} from "@/lib/compliance/economic-impact"
import {
  buildMasterExceptionQueue,
  type ExceptionItem,
} from "@/lib/compliance/master-exception-queue"
import {
  runPreAnafSimulation,
  type AnafSimulationRisk,
} from "@/lib/compliance/pre-anaf-simulation"
import {
  generateGuardianAlerts,
  refreshCertificateStatuses,
  refreshMandateStatuses,
  type DigitalCertificate,
  type GuardianAlert,
  type RepresentationMandate,
} from "@/lib/compliance/authority-mandate-guardian"
import {
  markOverdueRequests,
  type EvidenceRequest,
} from "@/lib/compliance/missing-evidence-workflow"
import type { ComplianceState } from "@/lib/compliance/types"
import type { StateWithParsedDeclarations } from "@/lib/compliance/parsed-declarations"
import type { StateWithParsedAga } from "@/lib/compliance/parsed-aga"
import type { StateWithParsedInvoices } from "@/lib/compliance/parsed-invoices"
import type { StateWithOnrcSnapshots } from "@/lib/compliance/onrc-snapshot"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"

type StateExt = ComplianceState &
  StateWithParsedDeclarations &
  StateWithParsedAga &
  StateWithParsedInvoices &
  StateWithOnrcSnapshots & {
    filingRecords?: FilingRecord[]
    digitalCertificates?: DigitalCertificate[]
    representationMandates?: RepresentationMandate[]
    evidenceRequests?: EvidenceRequest[]
    orgProfile?: {
      vatFrequency?: "monthly" | "quarterly"
      [k: string]: unknown
    }
  }

// ── Types pentru cards ───────────────────────────────────────────────────────

type DeclarationItem = {
  clientOrgId: string
  clientOrgName: string
  title: string
  severity: "critic" | "important" | "atentie"
  impactRON: number
  daysOverdue: number
  period: string
  focusId: string // ex: "xcorr-r6-XYZ"
}

type CalendarItem = {
  clientOrgId: string
  clientOrgName: string
  type: string // ex: "D300_TVA"
  period: string
  dueISO: string
  daysLeft: number
  focusId: string
}

type CertificateItem = {
  clientOrgId: string
  clientOrgName: string
  title: string // ex: "Certificat ANAF expirat" / "Împuternicire expiră"
  severity: "critical" | "warning"
  daysUntilExpiry: number
  expiresAtISO: string
  category: "certificate" | "mandate"
  focusId: string
}

type EvidenceItem = {
  clientOrgId: string
  clientOrgName: string
  title: string
  status: "overdue" | "sent" | "client-acknowledged" | "requested"
  daysToDeadline: number
  type: string
  focusId: string
}

type PreAnafItem = {
  clientOrgId: string
  clientOrgName: string
  title: string
  probability: "imminent" | "high" | "medium" | "low"
  exposureMaxRON: number
  rankingScore: number
  focusId: string
}

type ExceptionCardItem = {
  clientOrgId: string
  clientOrgName: string
  title: string
  severity: "critic" | "important"
  impactRON: number
  category: string
  focusId: string
}

type SnapshotData = {
  totalClients: number
  greenCount: number // 0 errors, 0 warnings
  yellowCount: number // has warnings
  redCount: number // has errors
  totalRiskRON: number
  totalCabinetHoursPerMonth: number
  toxicClientsCount: number
  totalSpvSyncedCount: number
}

type TodayResponse = {
  ok: true
  generatedAtISO: string
  snapshot: SnapshotData
  cards: {
    declarations: {
      totalFirms: number
      totalImpactRON: number
      items: DeclarationItem[]
    }
    calendar: {
      totalFirms: number
      totalDeadlines: number
      items: CalendarItem[]
    }
    certificates: {
      totalFirms: number
      expiredCount: number
      expiringSoonCount: number
      items: CertificateItem[]
    }
    evidence: {
      totalFirms: number
      overdueCount: number
      pendingClientCount: number
      items: EvidenceItem[]
    }
    preAnaf: {
      totalFirms: number
      imminentCount: number
      highCount: number
      totalExposureMaxRON: number
      items: PreAnafItem[]
    }
    exceptions: {
      totalFirms: number
      criticCount: number
      totalImpactRON: number
      items: ExceptionCardItem[]
    }
  }
}

const MAX_ITEMS_PER_CARD = 8 // top N per card

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysFromNow(iso: string): number {
  const now = Date.now()
  const target = new Date(iso).getTime()
  return Math.round((target - now) / 86_400_000)
}

// ── Per-client extractors ───────────────────────────────────────────────────

function extractDeclarations(
  bundle: PortfolioOrgBundle,
  findings: FindingWithImpact[],
): DeclarationItem[] {
  const items: DeclarationItem[] = []
  for (const f of findings) {
    if (f.rule !== "R6" && f.rule !== "R7") continue
    if (f.severity !== "error" && f.severity !== "warning") continue
    const sevMap = { error: "critic", warning: "important" } as const
    // Extract daysOverdue from sources[0].value (R6) or 0 (R7)
    const sourceValue = f.sources?.[0]?.value
    const daysOverdue = typeof sourceValue === "number" ? sourceValue : 0
    items.push({
      clientOrgId: bundle.membership.orgId,
      clientOrgName: bundle.membership.orgName,
      title: f.title,
      severity: sevMap[f.severity as "error" | "warning"],
      impactRON: f.economicImpact?.totalCostMaxRON ?? 0,
      daysOverdue,
      period: f.period ?? "—",
      focusId: f.id,
    })
  }
  return items
}

function extractCalendar(bundle: PortfolioOrgBundle): CalendarItem[] {
  const state = bundle.state as StateExt | null
  if (!state) return []
  const filings = state.filingRecords ?? []
  const items: CalendarItem[] = []
  for (const f of filings) {
    if (f.status !== "upcoming") continue
    const daysLeft = daysFromNow(f.dueISO)
    if (daysLeft < 0 || daysLeft > 7) continue // doar urgent în 7 zile
    items.push({
      clientOrgId: bundle.membership.orgId,
      clientOrgName: bundle.membership.orgName,
      type: f.type.toUpperCase(),
      period: f.period,
      dueISO: f.dueISO,
      daysLeft,
      focusId: f.id,
    })
  }
  return items
}

function extractCertificates(
  bundle: PortfolioOrgBundle,
  alerts: GuardianAlert[],
): CertificateItem[] {
  const items: CertificateItem[] = []
  for (const a of alerts) {
    if (a.severity !== "critical" && a.severity !== "warning") continue
    items.push({
      clientOrgId: bundle.membership.orgId,
      clientOrgName: bundle.membership.orgName,
      title: `${a.refType} · ${a.refName}`,
      severity: a.severity === "critical" ? "critical" : "warning",
      daysUntilExpiry: a.daysUntilExpiry,
      expiresAtISO: a.expiresAtISO,
      category: a.category,
      focusId: a.refId,
    })
  }
  return items
}

function extractEvidence(bundle: PortfolioOrgBundle): EvidenceItem[] {
  const state = bundle.state as StateExt | null
  if (!state) return []
  const requests = markOverdueRequests(state.evidenceRequests ?? [])
  const items: EvidenceItem[] = []
  for (const r of requests) {
    // Prioritizăm overdue + sent/acknowledged
    if (
      r.status !== "overdue" &&
      r.status !== "sent" &&
      r.status !== "client-acknowledged" &&
      r.status !== "requested"
    )
      continue
    items.push({
      clientOrgId: bundle.membership.orgId,
      clientOrgName: bundle.membership.orgName,
      title: r.title,
      status: r.status,
      daysToDeadline: daysFromNow(r.dueISO),
      type: r.type,
      focusId: r.id,
    })
  }
  return items
}

function extractPreAnafTop(
  bundle: PortfolioOrgBundle,
  risks: AnafSimulationRisk[],
): PreAnafItem[] {
  return risks.slice(0, 3).map((r) => ({
    clientOrgId: bundle.membership.orgId,
    clientOrgName: bundle.membership.orgName,
    title: r.title,
    probability: r.probability,
    exposureMaxRON: r.exposureRON.max,
    rankingScore: r.rankingScore,
    focusId: r.id,
  }))
}

function extractExceptions(
  bundle: PortfolioOrgBundle,
  items: ExceptionItem[],
): ExceptionCardItem[] {
  return items
    .filter((i) => i.severity === "critic" || i.severity === "important")
    .slice(0, 3)
    .map((i) => ({
      clientOrgId: bundle.membership.orgId,
      clientOrgName: bundle.membership.orgName,
      title: i.title,
      severity: i.severity as "critic" | "important",
      impactRON: i.impactRON,
      category: i.category,
      focusId: i.id,
    }))
}

// ── Snapshot calc ───────────────────────────────────────────────────────────

function classifyClient(errorCount: number, warningCount: number): "green" | "yellow" | "red" {
  if (errorCount > 0) return "red"
  if (warningCount > 0) return "yellow"
  return "green"
}

// ── Main handler ────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "vizualizare portofoliu AZI",
    )

    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      return jsonError(
        "Doar utilizatorii în modul partner pot accesa această secțiune.",
        403,
        "PORTFOLIO_TODAY_FORBIDDEN",
      )
    }

    const memberships = await listAccessiblePortfolioMemberships(session)
    const bundles = await loadPortfolioBundles(memberships.slice(0, 50))

    // Per-client extraction
    const allDeclarations: DeclarationItem[] = []
    const allCalendar: CalendarItem[] = []
    const allCertificates: CertificateItem[] = []
    const allEvidence: EvidenceItem[] = []
    const allPreAnaf: PreAnafItem[] = []
    const allExceptions: ExceptionCardItem[] = []

    let totalRiskRON = 0
    let totalCabinetHours = 0
    let totalSpvSyncedCount = 0
    let greenCount = 0
    let yellowCount = 0
    let redCount = 0

    for (const bundle of bundles) {
      const state = bundle.state as StateExt | null
      if (!state) {
        // No state — count as green (nothing to flag)
        greenCount++
        continue
      }

      const declarations = state.parsedDeclarations ?? []
      const aga = state.parsedAga ?? []
      const invoices = state.parsedInvoices ?? []
      const onrc = state.onrcSnapshots ?? []
      const filings = state.filingRecords ?? []
      const certs = refreshCertificateStatuses(state.digitalCertificates ?? [])
      const mandates = refreshMandateStatuses(state.representationMandates ?? [])
      const guardianAlerts = generateGuardianAlerts(certs, mandates)

      // Cross-correlation cu economic impact
      const xcorrReport = runCrossCorrelation({
        declarations,
        aga,
        invoices,
        onrc,
        filings,
        expectedVatFrequency: state.orgProfile?.vatFrequency,
      })
      const annotated = annotateWithImpact(xcorrReport.findings)

      // Master Queue
      const queueReport = buildMasterExceptionQueue({
        crossCorrelationFindings: annotated.filter(
          (f) => f.severity === "warning" || f.severity === "error",
        ),
        filings,
      })

      // Pre-ANAF
      const preAnafReport = runPreAnafSimulation(
        { crossCorrelationReport: { ...xcorrReport, findings: annotated } },
        { topN: 3 },
      )

      // Extract per-card items
      allDeclarations.push(...extractDeclarations(bundle, annotated))
      allCalendar.push(...extractCalendar(bundle))
      allCertificates.push(...extractCertificates(bundle, guardianAlerts))
      allEvidence.push(...extractEvidence(bundle))
      allPreAnaf.push(...extractPreAnafTop(bundle, preAnafReport.topRisks))
      allExceptions.push(...extractExceptions(bundle, queueReport.items))

      // Snapshot
      const errCount = xcorrReport.summary.errors
      const warnCount = xcorrReport.summary.warnings
      const color = classifyClient(errCount, warnCount)
      if (color === "red") redCount++
      else if (color === "yellow") yellowCount++
      else greenCount++

      // Aggregate metrics
      totalRiskRON += xcorrReport.summary.economic?.totalCostMaxRON ?? 0
      // Estimate cabinet hours: 1h per warning, 2h per error
      totalCabinetHours += errCount * 2 + warnCount * 1
      // SPV synced: if has any filing or invoice or efacturaConnected
      if (filings.length > 0 || invoices.length > 0 || state.efacturaConnected) {
        totalSpvSyncedCount++
      }
    }

    // Sort + truncate per card
    allDeclarations.sort((a, b) => {
      const sevOrder = { critic: 0, important: 1, atentie: 2 }
      if (sevOrder[a.severity] !== sevOrder[b.severity])
        return sevOrder[a.severity] - sevOrder[b.severity]
      return b.impactRON - a.impactRON
    })

    allCalendar.sort((a, b) => a.daysLeft - b.daysLeft)

    allCertificates.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1
      return a.daysUntilExpiry - b.daysUntilExpiry
    })

    allEvidence.sort((a, b) => {
      const order = { overdue: 0, sent: 1, "client-acknowledged": 2, requested: 3 } as const
      const aOrd = order[a.status] ?? 4
      const bOrd = order[b.status] ?? 4
      if (aOrd !== bOrd) return aOrd - bOrd
      return a.daysToDeadline - b.daysToDeadline
    })

    allPreAnaf.sort((a, b) => b.rankingScore - a.rankingScore)

    allExceptions.sort((a, b) => {
      const sevOrder = { critic: 0, important: 1 }
      if (sevOrder[a.severity] !== sevOrder[b.severity])
        return sevOrder[a.severity] - sevOrder[b.severity]
      return b.impactRON - a.impactRON
    })

    const snapshot: SnapshotData = {
      totalClients: bundles.length,
      greenCount,
      yellowCount,
      redCount,
      totalRiskRON: Math.round(totalRiskRON),
      totalCabinetHoursPerMonth: Math.round(totalCabinetHours / 3), // per-month (assuming data from 3 months)
      toxicClientsCount: 0, // populated by separate burden API
      totalSpvSyncedCount,
    }

    const response: TodayResponse = {
      ok: true,
      generatedAtISO: new Date().toISOString(),
      snapshot,
      cards: {
        declarations: {
          totalFirms: new Set(allDeclarations.map((i) => i.clientOrgId)).size,
          totalImpactRON: Math.round(allDeclarations.reduce((s, i) => s + i.impactRON, 0)),
          items: allDeclarations.slice(0, MAX_ITEMS_PER_CARD),
        },
        calendar: {
          totalFirms: new Set(allCalendar.map((i) => i.clientOrgId)).size,
          totalDeadlines: allCalendar.length,
          items: allCalendar.slice(0, MAX_ITEMS_PER_CARD),
        },
        certificates: {
          totalFirms: new Set(allCertificates.map((i) => i.clientOrgId)).size,
          expiredCount: allCertificates.filter((i) => i.daysUntilExpiry < 0).length,
          expiringSoonCount: allCertificates.filter((i) => i.daysUntilExpiry >= 0).length,
          items: allCertificates.slice(0, MAX_ITEMS_PER_CARD),
        },
        evidence: {
          totalFirms: new Set(allEvidence.map((i) => i.clientOrgId)).size,
          overdueCount: allEvidence.filter((i) => i.status === "overdue").length,
          pendingClientCount: allEvidence.filter(
            (i) => i.status === "sent" || i.status === "client-acknowledged",
          ).length,
          items: allEvidence.slice(0, MAX_ITEMS_PER_CARD),
        },
        preAnaf: {
          totalFirms: new Set(allPreAnaf.map((i) => i.clientOrgId)).size,
          imminentCount: allPreAnaf.filter((i) => i.probability === "imminent").length,
          highCount: allPreAnaf.filter((i) => i.probability === "high").length,
          totalExposureMaxRON: Math.round(allPreAnaf.reduce((s, i) => s + i.exposureMaxRON, 0)),
          items: allPreAnaf.slice(0, MAX_ITEMS_PER_CARD),
        },
        exceptions: {
          totalFirms: new Set(allExceptions.map((i) => i.clientOrgId)).size,
          criticCount: allExceptions.filter((i) => i.severity === "critic").length,
          totalImpactRON: Math.round(allExceptions.reduce((s, i) => s + i.impactRON, 0)),
          items: allExceptions.slice(0, MAX_ITEMS_PER_CARD),
        },
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Eroare AZI aggregator.",
      500,
      "PORTFOLIO_TODAY_FAILED",
    )
  }
}
