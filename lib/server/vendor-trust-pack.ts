import { classifyAISystem } from "@/lib/compliance/ai-act-classifier"
import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import type {
  ComplianceState,
  GeneratedDocumentRecord,
  ScanFinding,
} from "@/lib/compliance/types"
import type { VendorReview } from "@/lib/compliance/vendor-review-engine"
import { readStateForOrg } from "@/lib/server/mvp-store"
import {
  buildNis2Package,
  readNis2State,
  type Nis2OrgState,
} from "@/lib/server/nis2-store"
import {
  buildProcurementQuestionnaire,
  type ProcurementQuestion,
} from "@/lib/server/procurement-questionnaire"
import { generateSignedShareToken } from "@/lib/server/share-token-store"
import { safeListReviews } from "@/lib/server/vendor-review-store"
import { getWhiteLabelConfig } from "@/lib/server/white-label"

export type VendorTrustPack = {
  generatedAtISO: string
  orgId: string
  orgName: string
  gdpr: {
    hasRopa: boolean
    hasPrivacyPolicy: boolean
    hasDpa: boolean
    gdprProgress: number
    openFindings: number
    evidenceItems: { title: string; type: string; approvedAtISO: string }[]
  }
  nis2: {
    applicable: boolean
    dnscRegistered: boolean
    assessmentScore: number | null
    maturityScore: number | null
    openIncidents: number
    vendorsCount: number
  }
  security: {
    aiSystemsCount: number
    highRiskAiCount: number
    vendorReviewsTotal: number
    vendorReviewsOpen: number
    vendorReviewsCritical: number
  }
  readinessScore: number
  readinessLabel: "Gata de audit" | "Parțial pregătit" | "În progres"
  shareToken?: string
  procurementQuestionnaire: ProcurementQuestion[]
}

type BuildVendorTrustPackOptions = {
  orgName?: string
  state?: ComplianceState | null
  nis2State?: Nis2OrgState | null
  reviews?: VendorReview[]
}

const PRIVACY_POLICY_TYPES = new Set(["privacy-policy"])
const DPA_TYPES = new Set(["dpa", "dpa-agreement"])
const ROPA_TYPES = new Set(["ropa", "data-processing-record"])
const GDPR_EVIDENCE_TYPES = new Set([...PRIVACY_POLICY_TYPES, ...DPA_TYPES, ...ROPA_TYPES])

function clampScore(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

function isActiveFinding(finding: ScanFinding) {
  return !(
    finding.findingStatus === "resolved" ||
    finding.findingStatus === "dismissed" ||
    finding.findingStatus === "under_monitoring"
  )
}

function isEvidenceReady(doc: GeneratedDocumentRecord) {
  return (
    doc.approvalStatus === "approved_as_evidence" ||
    doc.validationStatus === "passed" ||
    doc.adoptionStatus === "signed" ||
    doc.adoptionStatus === "active"
  )
}

function matchesDocumentType(doc: GeneratedDocumentRecord, allowed: Set<string>) {
  return allowed.has(String(doc.documentType).trim().toLowerCase())
}

function findBestGdprDocs(docs: GeneratedDocumentRecord[]) {
  return docs
    .filter((doc) => isEvidenceReady(doc) && matchesDocumentType(doc, GDPR_EVIDENCE_TYPES))
    .sort((left, right) => right.generatedAtISO.localeCompare(left.generatedAtISO))
}

function buildGdprEvidenceItems(docs: GeneratedDocumentRecord[]) {
  return docs.slice(0, 6).map((doc) => ({
    title: doc.title,
    type: String(doc.documentType),
    approvedAtISO: doc.approvedAtISO ?? doc.validatedAtISO ?? doc.generatedAtISO,
  }))
}

function buildReadinessLabel(score: number): VendorTrustPack["readinessLabel"] {
  if (score >= 80) return "Gata de audit"
  if (score >= 55) return "Parțial pregătit"
  return "În progres"
}

function computeGdprScore(
  gdprProgress: number,
  hasPrivacyPolicy: boolean,
  hasDpa: boolean,
  hasRopa: boolean,
  openFindings: number
) {
  const documentCoverage = [hasPrivacyPolicy, hasDpa, hasRopa].filter(Boolean).length / 3
  const documentScore = documentCoverage * 100
  const findingPenalty = Math.min(openFindings * 12, 40)
  return clampScore((gdprProgress + documentScore) / 2 - findingPenalty)
}

function computeNis2Score(input: {
  applicable: boolean
  dnscRegistered: boolean
  assessmentScore: number | null
  maturityScore: number | null
  openIncidents: number
  vendorsCount: number
}) {
  if (!input.applicable) return 100

  const dnscScore = input.dnscRegistered ? 100 : 35
  const assessmentScore = input.assessmentScore ?? 0
  const maturityScore = input.maturityScore ?? 0
  const incidentScore = clampScore(100 - input.openIncidents * 25)
  const vendorScore = input.vendorsCount === 0 ? 70 : clampScore(100 - Math.min(input.vendorsCount, 5) * 4)

  return clampScore(
    (dnscScore * 0.28) +
      (assessmentScore * 0.24) +
      (maturityScore * 0.24) +
      (incidentScore * 0.16) +
      (vendorScore * 0.08)
  )
}

function computeSecurityScore(input: {
  aiSystemsCount: number
  highRiskAiCount: number
  vendorReviewsTotal: number
  vendorReviewsOpen: number
  vendorReviewsCritical: number
}) {
  const aiScore =
    input.aiSystemsCount === 0
      ? 100
      : clampScore(100 - input.highRiskAiCount * 18)

  const vendorProgramScore =
    input.vendorReviewsTotal === 0
      ? 55
      : clampScore(100 - input.vendorReviewsOpen * 10 - input.vendorReviewsCritical * 18)

  return clampScore((aiScore * 0.45) + (vendorProgramScore * 0.55))
}

export async function buildVendorTrustPack(
  orgId: string,
  options: BuildVendorTrustPackOptions = {}
): Promise<VendorTrustPack> {
  const generatedAtISO = new Date().toISOString()
  const [loadedState, loadedNis2State, loadedReviews, whiteLabel] = await Promise.all([
    options.state ?? readStateForOrg(orgId),
    options.nis2State ?? readNis2State(orgId),
    options.reviews ?? safeListReviews(orgId),
    getWhiteLabelConfig(orgId).catch(() => null),
  ])

  const state = normalizeComplianceState(
    loadedState ?? structuredClone(initialComplianceState)
  )
  const nis2State = loadedNis2State ?? null
  const reviews = loadedReviews ?? []
  const orgName =
    options.orgName?.trim() ||
    whiteLabel?.partnerName?.trim() ||
    orgId

  const gdprDocs = findBestGdprDocs(state.generatedDocuments ?? [])
  const hasPrivacyPolicy = gdprDocs.some((doc) => matchesDocumentType(doc, PRIVACY_POLICY_TYPES))
  const hasDpa = gdprDocs.some((doc) => matchesDocumentType(doc, DPA_TYPES))
  const hasRopa = gdprDocs.some((doc) => matchesDocumentType(doc, ROPA_TYPES))
  const gdprOpenFindings = state.findings.filter(
    (finding) => finding.category === "GDPR" && isActiveFinding(finding)
  ).length
  const gdprProgress = computeGdprScore(
    state.gdprProgress ?? 0,
    hasPrivacyPolicy,
    hasDpa,
    hasRopa,
    gdprOpenFindings
  )

  const nis2Package = buildNis2Package(nis2State, generatedAtISO)
  const nis2Applicable =
    nis2Package.applicable ||
    (state.applicability?.entries ?? []).some(
      (entry) => entry.tag === "nis2" && entry.certainty !== "unlikely"
    )

  const aiSystemsCount = state.aiSystems.length
  const highRiskAiCount = state.aiSystems.filter(
    (system) => classifyAISystem(system.purpose).riskLevel === "high_risk"
  ).length
  const vendorReviewsTotal = reviews.length
  const vendorReviewsOpen = reviews.filter((review) => review.status !== "closed").length
  const vendorReviewsCritical = reviews.filter(
    (review) => review.urgency === "critical" && review.status !== "closed"
  ).length

  const nis2Score = computeNis2Score({
    applicable: nis2Applicable,
    dnscRegistered: nis2Package.dnscStatus === "confirmed",
    assessmentScore: nis2Package.assessmentScore,
    maturityScore: nis2Package.maturityScore,
    openIncidents: nis2Package.openIncidents,
    vendorsCount: nis2State?.vendors.length ?? 0,
  })
  const securityScore = computeSecurityScore({
    aiSystemsCount,
    highRiskAiCount,
    vendorReviewsTotal,
    vendorReviewsOpen,
    vendorReviewsCritical,
  })

  const readinessScore = clampScore(
    (gdprProgress * 0.45) + (nis2Score * 0.3) + (securityScore * 0.25)
  )

  const pack: VendorTrustPack = {
    generatedAtISO,
    orgId,
    orgName,
    gdpr: {
      hasRopa,
      hasPrivacyPolicy,
      hasDpa,
      gdprProgress,
      openFindings: gdprOpenFindings,
      evidenceItems: buildGdprEvidenceItems(gdprDocs),
    },
    nis2: {
      applicable: nis2Applicable,
      dnscRegistered: nis2Package.dnscStatus === "confirmed",
      assessmentScore: nis2Package.assessmentScore,
      maturityScore: nis2Package.maturityScore,
      openIncidents: nis2Package.openIncidents,
      vendorsCount: nis2State?.vendors.length ?? 0,
    },
    security: {
      aiSystemsCount,
      highRiskAiCount,
      vendorReviewsTotal,
      vendorReviewsOpen,
      vendorReviewsCritical,
    },
    readinessScore,
    readinessLabel: buildReadinessLabel(readinessScore),
    shareToken: generateSignedShareToken(orgId, "partner", generatedAtISO),
    procurementQuestionnaire: [],
  }

  pack.procurementQuestionnaire = buildProcurementQuestionnaire({
    gdpr: pack.gdpr,
    nis2: pack.nis2,
    security: pack.security,
  })

  return pack
}

export function buildVendorTrustPackMarkdown(pack: VendorTrustPack) {
  const statusLine = (label: string, value: string) => `- ${label}: ${value}`
  const questionnaire = pack.procurementQuestionnaire
    .map(
      (item, index) =>
        `${index + 1}. ${item.question}\n   - Răspuns: ${item.answer}\n   - Dovadă: ${item.evidence ?? "—"}`
    )
    .join("\n")

  return [
    "# Vendor Trust Pack",
    "",
    `## Organizație`,
    statusLine("Nume", pack.orgName),
    statusLine("Generat", new Date(pack.generatedAtISO).toLocaleString("ro-RO")),
    statusLine("Readiness", `${pack.readinessScore}/100 · ${pack.readinessLabel}`),
    "",
    "## GDPR",
    statusLine("RoPA", pack.gdpr.hasRopa ? "da" : "nu"),
    statusLine("Privacy Policy", pack.gdpr.hasPrivacyPolicy ? "da" : "nu"),
    statusLine("DPA", pack.gdpr.hasDpa ? "da" : "nu"),
    statusLine("Progres", `${pack.gdpr.gdprProgress}%`),
    statusLine("Finding-uri deschise", String(pack.gdpr.openFindings)),
    "",
    "## NIS2",
    statusLine("Aplicabil", pack.nis2.applicable ? "da" : "nu"),
    statusLine("DNSC confirmat", pack.nis2.dnscRegistered ? "da" : "nu"),
    statusLine("Assessment", pack.nis2.assessmentScore === null ? "—" : `${pack.nis2.assessmentScore}%`),
    statusLine("Maturitate", pack.nis2.maturityScore === null ? "—" : `${pack.nis2.maturityScore}%`),
    statusLine("Incidente deschise", String(pack.nis2.openIncidents)),
    statusLine("Vendori în registru", String(pack.nis2.vendorsCount)),
    "",
    "## Security",
    statusLine("Sisteme AI", String(pack.security.aiSystemsCount)),
    statusLine("AI high-risk", String(pack.security.highRiskAiCount)),
    statusLine("Vendor reviews total", String(pack.security.vendorReviewsTotal)),
    statusLine("Vendor reviews deschise", String(pack.security.vendorReviewsOpen)),
    statusLine("Vendor reviews critice", String(pack.security.vendorReviewsCritical)),
    "",
    "## Evidence GDPR",
    ...(pack.gdpr.evidenceItems.length > 0
      ? pack.gdpr.evidenceItems.map((item) => `- ${item.title} · ${item.type} · ${item.approvedAtISO}`)
      : ["- Nu există încă documente aprobate în Dosar."]),
    "",
    "## Procurement questionnaire",
    questionnaire || "- Nu există răspunsuri auto-completate.",
  ].join("\n")
}
