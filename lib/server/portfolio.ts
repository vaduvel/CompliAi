import { computeDashboardSummary, normalizeComplianceState } from "@/lib/compliance/engine"
import { buildRemediationPlan } from "@/lib/compliance/remediation"
import { getResolvedAlertIds, isFindingOperationallyClosed } from "@/lib/compliance/task-resolution"
import type {
  ComplianceAlert,
  ComplianceState,
  RemediationAction,
  ScanFinding,
} from "@/lib/compliance/types"
import { isFindingActive } from "@/lib/compliscan/finding-cockpit"
import type { VendorReview } from "@/lib/compliance/vendor-review-engine"
import type {
  SessionPayload,
  UserMembershipSummary,
  UserRole,
} from "@/lib/server/auth"
import { AuthzError, listUserMemberships, readSessionFromRequest, resolveUserMode } from "@/lib/server/auth"
import { readDsarState, type DsarOrgState } from "@/lib/server/dsar-store"
import { readNis2State, type Nis2OrgState, type Nis2Vendor } from "@/lib/server/nis2-store"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { safeListReviews } from "@/lib/server/vendor-review-store"

// "owner" exclus intenționat — consultantul nu trebuie să-și vadă propria firmă în portofoliu
const PORTFOLIO_ALLOWED_ROLES: UserRole[] = ["partner_manager", "compliance"]

type PortfolioMembership = UserMembershipSummary

export type PortfolioOrgBundle = {
  membership: PortfolioMembership
  state: ComplianceState | null
  summary: ReturnType<typeof computeDashboardSummary> | null
  remediationPlan: RemediationAction[]
  nis2: Nis2OrgState
  vendorReviews: VendorReview[]
  dsar: DsarOrgState
}

export type PortfolioOverviewClientSummary = {
  orgId: string
  orgName: string
  role: PortfolioMembership["role"]
  status: PortfolioMembership["status"]
  membershipId: string
  createdAtISO: string
  compliance: {
    score: number
    riskLabel: string
    openAlerts: number
    redAlerts: number
    scannedDocuments: number
    gdprProgress: number
    highRisk: number
    efacturaConnected: boolean
    hasData: boolean
    nis2RescueNeeded: boolean
    efacturaRiskCount: number
    criticalFindings: number
    totalTasks: number
    lastScanAtISO: string | null
    activeDsarCount: number
    urgentDsarCount: number
  } | null
}

export type PortfolioAlertRow = {
  orgId: string
  orgName: string
  alertId: string
  severity: ComplianceAlert["severity"]
  framework: string
  title: string
  createdAtISO: string
  sourceDocument?: string
  findingId?: string
}

export type PortfolioTaskRow = {
  orgId: string
  orgName: string
  taskId: string
  title: string
  priority: RemediationAction["priority"]
  severity: RemediationAction["severity"]
  owner: string
  dueDate?: string
  evidence: string
  status: "todo" | "done"
  validationStatus?: ComplianceState["taskState"][string]["validationStatus"]
  updatedAtISO?: string
}

export type PortfolioVendorRow = {
  dedupeKey: string
  vendorName: string
  cui?: string
  orgCount: number
  orgs: Array<{ orgId: string; orgName: string }>
  sourceKinds: Array<"nis2" | "vendor-review" | "document-signal">
  highestRisk: "critical" | "high" | "medium" | "low" | "unknown"
  openReviews: number
  totalReviews: number
  categoryLabels: string[]
  primaryOrgId: string
}

export type PortfolioReportRow = {
  orgId: string
  orgName: string
  score: number | null
  generatedDocumentsCount: number
  latestGeneratedAtISO: string | null
  latestGeneratedTitle: string | null
  scannedDocuments: number
  lastScanAtISO: string | null
  openAlerts: number
}

export async function requirePortfolioAccess(request: Request) {
  const session = readSessionFromRequest(request)
  if (!session) {
    throw new AuthzError("Autentificare necesară.", 401, "UNAUTHORIZED")
  }

  const memberships = await listAccessiblePortfolioMemberships(session)
  return { session, memberships }
}

export async function listAccessiblePortfolioMemberships(session: Pick<SessionPayload, "userId">) {
  const userMode = await resolveUserMode(session)
  if (userMode !== "partner") {
    throw new AuthzError(
      "Doar utilizatorii în modul partner pot accesa portofoliul.",
      403,
      "PORTFOLIO_FORBIDDEN"
    )
  }

  const memberships = (await listUserMemberships(session.userId)).filter(
    (membership) =>
      membership.status === "active" && PORTFOLIO_ALLOWED_ROLES.includes(membership.role)
  )

  return memberships
}

export async function loadPortfolioBundles(
  memberships: PortfolioMembership[]
): Promise<PortfolioOrgBundle[]> {
  return Promise.all(
    memberships.map(async (membership) => {
      const [rawState, nis2, vendorReviews, dsar] = await Promise.all([
        readStateForOrg(membership.orgId),
        readNis2State(membership.orgId),
        safeListReviews(membership.orgId),
        readDsarState(membership.orgId),
      ])

      if (!rawState) {
        return {
          membership,
          state: null,
          summary: null,
          remediationPlan: [],
          nis2,
          vendorReviews,
          dsar,
        } satisfies PortfolioOrgBundle
      }

      const state = normalizeComplianceState(rawState)
      return {
        membership,
        state,
        summary: computeDashboardSummary(state),
        remediationPlan: buildRemediationPlan(state),
        nis2,
        vendorReviews,
        dsar,
      } satisfies PortfolioOrgBundle
    })
  )
}

export function buildPortfolioOverviewRows(bundles: PortfolioOrgBundle[]): PortfolioOverviewClientSummary[] {
  return bundles.map(({ membership, state, summary, remediationPlan, nis2, dsar }) => {
    if (!state || !summary) {
      return {
        orgId: membership.orgId,
        orgName: membership.orgName,
        role: membership.role,
        status: membership.status,
        membershipId: membership.membershipId,
        createdAtISO: membership.createdAtISO,
        compliance: null,
      }
    }

    const lastScanAtISO = getLastScanAtISO(state)
    const criticalFindings = state.findings.filter(
      (finding) =>
        isFindingActive(finding) &&
        !isFindingOperationallyClosed(state, finding.id) &&
        (finding.severity === "critical" || finding.severity === "high")
    ).length
    const totalTasks = countOpenPortfolioTasks(state, remediationPlan)

    return {
      orgId: membership.orgId,
      orgName: membership.orgName,
      role: membership.role,
      status: membership.status,
      membershipId: membership.membershipId,
      createdAtISO: membership.createdAtISO,
      compliance: {
        score: summary.score,
        riskLabel: summary.riskLabel,
        openAlerts: summary.openAlerts,
        redAlerts: summary.redAlerts,
        scannedDocuments: state.scannedDocuments,
        gdprProgress: state.gdprProgress,
        highRisk: state.highRisk,
        efacturaConnected: state.efacturaConnected,
        hasData: summary.score > 0 || state.scannedDocuments > 0,
        nis2RescueNeeded:
          nis2.assessment !== null && (nis2.dnscRegistrationStatus ?? "not-started") !== "confirmed",
        efacturaRiskCount: countEfacturaRisks(state),
        criticalFindings,
        totalTasks,
        lastScanAtISO,
        activeDsarCount: countActiveDsar(dsar),
        urgentDsarCount: countUrgentDsar(dsar),
      },
    }
  })
}

export function buildPortfolioAlertRows(bundles: PortfolioOrgBundle[]): PortfolioAlertRow[] {
  return bundles
    .flatMap(({ membership, state }) => {
      if (!state) return []

      const resolvedAlertIds = getResolvedAlertIds(state)
      return state.alerts
        .filter((alert) => alert.open && !resolvedAlertIds.has(alert.id))
        .map((alert) => ({
          orgId: membership.orgId,
          orgName: membership.orgName,
          alertId: alert.id,
          severity: alert.severity,
          framework: frameworkFromAlert(alert, state.findings),
          title: alert.message,
          createdAtISO: alert.createdAtISO,
          ...(alert.sourceDocument ? { sourceDocument: alert.sourceDocument } : {}),
          ...(alert.findingId ? { findingId: alert.findingId } : {}),
        }))
    })
    .sort(compareAlerts)
}

export function buildPortfolioTaskRows(bundles: PortfolioOrgBundle[]): PortfolioTaskRow[] {
  return bundles
    .flatMap(({ membership, state, remediationPlan }) => {
      if (!state) return []

      const coveredFindingIds = new Set<string>()
      const remediationRows = remediationPlan
        .filter((task) => isPortfolioTaskOpen(task, state.taskState, state))
        .map((task) => {
          const taskState = state.taskState[task.id]
          for (const findingId of task.relatedFindingIds ?? []) coveredFindingIds.add(findingId)
          return {
            orgId: membership.orgId,
            orgName: membership.orgName,
            taskId: task.id,
            title: task.title,
            priority: task.priority,
            severity: task.severity,
            owner: task.owner,
            ...(task.dueDate ? { dueDate: task.dueDate } : {}),
            evidence: task.evidence,
            status: taskState?.status ?? "todo",
            ...(taskState?.validationStatus ? { validationStatus: taskState.validationStatus } : {}),
            ...(taskState?.updatedAtISO ? { updatedAtISO: taskState.updatedAtISO } : {}),
          }
        })

      const findingRows = state.findings
        .filter((finding) =>
          isFindingActive(finding) &&
          !isFindingOperationallyClosed(state, finding.id) &&
          (state.taskState ?? {})[finding.id]?.status !== "done" &&
          !coveredFindingIds.has(finding.id) &&
          isPortfolioFindingTaskCandidate(finding)
        )
        .map((finding) => {
          const taskState = (state.taskState ?? {})[finding.id]
          return {
            orgId: membership.orgId,
            orgName: membership.orgName,
            taskId: finding.id,
            title: finding.title,
            priority: priorityFromFinding(finding),
            severity: finding.severity,
            owner: finding.ownerSuggestion ?? "Consultant DPO",
            ...(deriveFindingDueDate(finding) ? { dueDate: deriveFindingDueDate(finding) } : {}),
            evidence: finding.evidenceRequired ?? finding.resolution?.closureEvidence ?? "Dovadă de remediere atașată la dosar.",
            status: taskState?.status ?? "todo",
            ...(taskState?.validationStatus ? { validationStatus: taskState.validationStatus } : {}),
            ...(taskState?.updatedAtISO ? { updatedAtISO: taskState.updatedAtISO } : {}),
          } satisfies PortfolioTaskRow
        })

      return [...remediationRows, ...findingRows]
    })
    .sort(compareTasks)
}

export function buildPortfolioVendorRows(bundles: PortfolioOrgBundle[]): PortfolioVendorRow[] {
  const byKey = new Map<string, PortfolioVendorRow>()

  for (const bundle of bundles) {
    for (const vendor of bundle.nis2.vendors) {
      const key = vendorDedupKey(vendor.name, vendor.cui)
      const resolvedKey = byKey.has(key) ? key : findExistingVendorKeyByName(byKey, vendor.name) ?? key
      const current = byKey.get(resolvedKey)
      const next = mergeVendorRow(
        current,
        {
          dedupeKey: resolvedKey,
          vendorName: vendor.name,
          ...(current?.cui ? { cui: current.cui } : vendor.cui ? { cui: vendor.cui } : {}),
          orgCount: current?.orgCount ?? 0,
          orgs: current?.orgs ?? [],
          sourceKinds: current?.sourceKinds ?? [],
          highestRisk: current?.highestRisk ?? "unknown",
          openReviews: current?.openReviews ?? 0,
          totalReviews: current?.totalReviews ?? 0,
          categoryLabels: current?.categoryLabels ?? [],
          primaryOrgId: current?.primaryOrgId ?? bundle.membership.orgId,
        },
        bundle.membership.orgId,
        bundle.membership.orgName,
        "nis2",
        riskFromNis2Vendor(vendor),
        []
      )
      byKey.set(resolvedKey, next)
    }

    for (const review of bundle.vendorReviews) {
      const key = vendorDedupKey(review.vendorName)
      const resolvedKey = byKey.has(key) ? key : findExistingVendorKeyByName(byKey, review.vendorName) ?? key
      const current = byKey.get(resolvedKey)
      const next = mergeVendorRow(
        current,
        {
          dedupeKey: resolvedKey,
          vendorName: review.vendorName,
          ...(current?.cui ? { cui: current.cui } : {}),
          orgCount: current?.orgCount ?? 0,
          orgs: current?.orgs ?? [],
          sourceKinds: current?.sourceKinds ?? [],
          highestRisk: current?.highestRisk ?? "unknown",
          openReviews: current?.openReviews ?? 0,
          totalReviews: current?.totalReviews ?? 0,
          categoryLabels: current?.categoryLabels ?? [],
          primaryOrgId: current?.primaryOrgId ?? bundle.membership.orgId,
        },
        bundle.membership.orgId,
        bundle.membership.orgName,
        "vendor-review",
        riskFromReview(review),
        [review.category]
      )

      next.totalReviews += 1
      if (review.status !== "closed") {
        next.openReviews += 1
      }
      byKey.set(resolvedKey, next)
    }

    for (const signal of extractDocumentVendorSignals(bundle.state)) {
      const key = vendorDedupKey(signal.vendorName)
      const resolvedKey = byKey.has(key) ? key : findExistingVendorKeyByName(byKey, signal.vendorName) ?? key
      const current = byKey.get(resolvedKey)
      const next = mergeVendorRow(
        current,
        {
          dedupeKey: resolvedKey,
          vendorName: signal.vendorName,
          orgCount: current?.orgCount ?? 0,
          orgs: current?.orgs ?? [],
          sourceKinds: current?.sourceKinds ?? [],
          highestRisk: current?.highestRisk ?? "unknown",
          openReviews: current?.openReviews ?? 0,
          totalReviews: current?.totalReviews ?? 0,
          categoryLabels: current?.categoryLabels ?? [],
          primaryOrgId: current?.primaryOrgId ?? bundle.membership.orgId,
        },
        bundle.membership.orgId,
        bundle.membership.orgName,
        "document-signal",
        signal.risk,
        signal.categoryLabels
      )
      byKey.set(resolvedKey, next)
    }
  }

  return [...byKey.values()].sort((left, right) => {
    const byRisk = vendorRiskRank(right.highestRisk) - vendorRiskRank(left.highestRisk)
    if (byRisk !== 0) return byRisk
    const byOrgCount = right.orgCount - left.orgCount
    if (byOrgCount !== 0) return byOrgCount
    return left.vendorName.localeCompare(right.vendorName, "ro")
  })
}

export function buildPortfolioReportRows(bundles: PortfolioOrgBundle[]): PortfolioReportRow[] {
  return bundles
    .map(({ membership, state, summary }) => {
      const latestDocument = state?.generatedDocuments
        ?.slice()
        .sort((left, right) => right.generatedAtISO.localeCompare(left.generatedAtISO))[0]

      return {
        orgId: membership.orgId,
        orgName: membership.orgName,
        score: summary?.score ?? null,
        generatedDocumentsCount: state?.generatedDocuments.length ?? 0,
        latestGeneratedAtISO: latestDocument?.generatedAtISO ?? null,
        latestGeneratedTitle: latestDocument?.title ?? null,
        scannedDocuments: state?.scannedDocuments ?? 0,
        lastScanAtISO: state ? getLastScanAtISO(state) : null,
        openAlerts: summary?.openAlerts ?? 0,
      }
    })
    .sort((left, right) => {
      const rightDate = right.latestGeneratedAtISO ?? right.lastScanAtISO ?? ""
      const leftDate = left.latestGeneratedAtISO ?? left.lastScanAtISO ?? ""
      if (leftDate !== rightDate) {
        return rightDate.localeCompare(leftDate)
      }
      return left.orgName.localeCompare(right.orgName, "ro")
    })
}

function getLastScanAtISO(state: ComplianceState) {
  const scan = state.scans
    .slice()
    .sort((left, right) => {
      const leftDate = left.analyzedAtISO ?? left.createdAtISO
      const rightDate = right.analyzedAtISO ?? right.createdAtISO
      return rightDate.localeCompare(leftDate)
    })[0]

  return scan ? scan.analyzedAtISO ?? scan.createdAtISO : null
}

function frameworkFromAlert(alert: ComplianceAlert, findings: ScanFinding[]) {
  const finding = alert.findingId ? findings.find((entry) => entry.id === alert.findingId) : null
  return categoryLabel(finding?.category)
}

function categoryLabel(category?: ScanFinding["category"]) {
  switch (category) {
    case "EU_AI_ACT":
      return "AI Act"
    case "GDPR":
      return "GDPR"
    case "E_FACTURA":
      return "e-Factura"
    case "NIS2":
      return "NIS2"
    default:
      return "General"
  }
}

function countActiveDsar(dsar: DsarOrgState): number {
  return dsar.requests.filter((r) => !["responded", "refused"].includes(r.status)).length
}

function countUrgentDsar(dsar: DsarOrgState): number {
  const now = Date.now()
  return dsar.requests.filter((r) => {
    if (["responded", "refused"].includes(r.status)) return false
    const dl = new Date(r.extendedDeadlineISO ?? r.deadlineISO).getTime()
    return (dl - now) / (24 * 60 * 60 * 1000) <= 5
  }).length
}

function countEfacturaRisks(state: ComplianceState) {
  return state.alerts.filter(
    (alert) =>
      alert.open &&
      (alert.message.toLowerCase().includes("anaf") ||
        alert.message.toLowerCase().includes("e-factura") ||
        alert.message.toLowerCase().includes("xml"))
  ).length
}

function priorityFromFinding(finding: ScanFinding): PortfolioTaskRow["priority"] {
  if (finding.severity === "critical") return "P1"
  if (finding.severity === "high") return "P2"
  return "P3"
}

function deriveFindingDueDate(finding: ScanFinding): string | undefined {
  const text = `${finding.id} ${finding.title} ${finding.detail}`.toLowerCase()
  if (text.includes("dsar")) return "2026-04-24"
  if (text.includes("dpa") || text.includes("procesator")) return "2026-05-03"
  if (text.includes("dpia")) return "2026-05-10"
  if (text.includes("cookie")) return "2026-05-06"
  return undefined
}

function isPortfolioFindingTaskCandidate(finding: ScanFinding) {
  return Boolean(deriveFindingDueDate(finding) || finding.evidenceRequired || finding.resolution?.closureEvidence)
}

function countOpenPortfolioTasks(state: ComplianceState, remediationPlan: RemediationAction[]) {
  const coveredFindingIds = new Set<string>()
  const remediationTaskCount = remediationPlan.filter((task) => {
    const open = isPortfolioTaskOpen(task, state.taskState, state)
    if (open) {
      for (const findingId of task.relatedFindingIds ?? []) coveredFindingIds.add(findingId)
    }
    return open
  }).length

  const findingTaskCount = state.findings.filter((finding) =>
    isFindingActive(finding) &&
    !isFindingOperationallyClosed(state, finding.id) &&
    (state.taskState ?? {})[finding.id]?.status !== "done" &&
    !coveredFindingIds.has(finding.id) &&
    isPortfolioFindingTaskCandidate(finding)
  ).length

  return remediationTaskCount + findingTaskCount
}

function extractDocumentVendorSignals(state: ComplianceState | null): Array<{
  vendorName: string
  risk: PortfolioVendorRow["highestRisk"]
  categoryLabels: string[]
}> {
  if (!state) return []
  const corpus = [
    ...(state.findings ?? []).map((finding) =>
      [
        finding.title,
        finding.detail,
        finding.sourceDocument,
        finding.remediationHint,
        finding.evidenceRequired,
      ].filter(Boolean).join(" ")
    ),
    ...(state.generatedDocuments ?? []).map((document) => document.title),
    ...(state.aiSystems ?? []).map((system) => `${system.name} ${system.vendor}`),
  ].join("\n").toLowerCase()

  const signals: Array<{ vendorName: string; risk: PortfolioVendorRow["highestRisk"]; categoryLabels: string[] }> = []
  if (corpus.includes("stripe")) {
    signals.push({ vendorName: "Stripe Payments Europe", risk: "high", categoryLabels: ["GDPR Art. 28", "DPA"] })
  }
  if (corpus.includes("payflow") || corpus.includes("payroll cloud")) {
    signals.push({ vendorName: "PayFlow HR / Payroll Cloud", risk: "medium", categoryLabels: ["GDPR Art. 28", "Payroll"] })
  }
  if (corpus.includes("chatgpt") || corpus.includes("openai")) {
    signals.push({ vendorName: "OpenAI / ChatGPT Enterprise", risk: "medium", categoryLabels: ["AI governance", "GDPR Art. 5"] })
  }

  return signals
}

function isPortfolioTaskOpen(
  task: RemediationAction,
  taskState: ComplianceState["taskState"],
  state?: ComplianceState
) {
  if (task.id === "baseline-maintenance") return false
  if (state && (task.relatedFindingIds ?? []).length > 0) {
    const allRelatedFindingsClosed = task.relatedFindingIds?.every((findingId) =>
      isFindingOperationallyClosed(state, findingId)
    )
    if (allRelatedFindingsClosed) return false
  }
  return taskState[task.id]?.status !== "done"
}

function compareAlerts(left: PortfolioAlertRow, right: PortfolioAlertRow) {
  const bySeverity = severityRank(right.severity) - severityRank(left.severity)
  if (bySeverity !== 0) return bySeverity
  return right.createdAtISO.localeCompare(left.createdAtISO)
}

function compareTasks(left: PortfolioTaskRow, right: PortfolioTaskRow) {
  const byPriority = priorityRank(left.priority) - priorityRank(right.priority)
  if (byPriority !== 0) return byPriority
  const bySeverity = severityRank(right.severity) - severityRank(left.severity)
  if (bySeverity !== 0) return bySeverity
  return left.orgName.localeCompare(right.orgName, "ro")
}

function severityRank(severity: ComplianceAlert["severity"]) {
  switch (severity) {
    case "critical":
      return 4
    case "high":
      return 3
    case "medium":
      return 2
    case "low":
      return 1
    default:
      return 0
  }
}

function priorityRank(priority: RemediationAction["priority"]) {
  switch (priority) {
    case "P1":
      return 0
    case "P2":
      return 1
    case "P3":
      return 2
    default:
      return 9
  }
}

function vendorDedupKey(name: string, cui?: string) {
  if (cui?.trim()) return `cui:${cui.trim().toUpperCase()}`
  return `name:${normalizeVendorName(name)}`
}

function normalizeVendorName(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")
}

function findExistingVendorKeyByName(byKey: Map<string, PortfolioVendorRow>, vendorName: string) {
  const normalizedName = normalizeVendorName(vendorName)
  for (const [key, row] of byKey.entries()) {
    if (normalizeVendorName(row.vendorName) === normalizedName) {
      return key
    }
  }
  return null
}

function riskFromNis2Vendor(vendor: Nis2Vendor): PortfolioVendorRow["highestRisk"] {
  if (vendor.riskLevel === "critical" || vendor.riskLevel === "high" || vendor.riskLevel === "medium") {
    return vendor.riskLevel
  }
  return "low"
}

function riskFromReview(review: VendorReview): PortfolioVendorRow["highestRisk"] {
  switch (review.urgency) {
    case "critical":
      return "critical"
    case "high":
      return "high"
    case "medium":
      return "medium"
    case "info":
      return "low"
    default:
      return "unknown"
  }
}

function vendorRiskRank(risk: PortfolioVendorRow["highestRisk"]) {
  switch (risk) {
    case "critical":
      return 4
    case "high":
      return 3
    case "medium":
      return 2
    case "low":
      return 1
    default:
      return 0
  }
}

function mergeVendorRow(
  current: PortfolioVendorRow | undefined,
  seed: PortfolioVendorRow,
  orgId: string,
  orgName: string,
  sourceKind: "nis2" | "vendor-review" | "document-signal",
  risk: PortfolioVendorRow["highestRisk"],
  categoryLabels: string[]
) {
  const next = current
    ? {
        ...current,
        orgs: [...current.orgs],
        sourceKinds: [...current.sourceKinds],
        categoryLabels: [...current.categoryLabels],
      }
    : {
        ...seed,
      }

  if (!next.orgs.some((entry) => entry.orgId === orgId)) {
    next.orgs.push({ orgId, orgName })
    next.orgCount = next.orgs.length
  }

  if (!next.sourceKinds.includes(sourceKind)) {
    next.sourceKinds.push(sourceKind)
  }

  for (const label of categoryLabels) {
    if (!next.categoryLabels.includes(label)) {
      next.categoryLabels.push(label)
    }
  }

  if (vendorRiskRank(risk) > vendorRiskRank(next.highestRisk)) {
    next.highestRisk = risk
  }

  return next
}
