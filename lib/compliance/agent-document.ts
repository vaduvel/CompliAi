// V6 — Document Agent
// Proactive document gap analysis: detects missing, expired, or incomplete
// compliance documents and recommends generation or regeneration.
// Does NOT call Gemini/LLM — only scans state and proposes actions (level 2).

import type { ComplianceState } from "@/lib/compliance/types"
import type { DocumentType } from "@/lib/server/document-generator"
import {
  generateRunId,
  type AgentAction,
  type AgentOutput,
} from "@/lib/compliance/agentic-engine"

// ── Types ────────────────────────────────────────────────────────────────────

export type DocumentAgentInput = {
  orgId: string
  state: ComplianceState
  nowISO: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000
const DOCUMENT_EXPIRY_DAYS = 365

/** Which document types should exist based on state flags */
type DocumentRule = {
  type: DocumentType
  label: string
  requiredWhen: (state: ComplianceState) => boolean
}

const DOCUMENT_RULES: DocumentRule[] = [
  {
    type: "privacy-policy",
    label: "Politică de Confidențialitate",
    requiredWhen: () => true, // always required — GDPR applies to all
  },
  {
    type: "cookie-policy",
    label: "Politică de Cookies",
    requiredWhen: () => true, // any web-facing org
  },
  {
    type: "dpa",
    label: "Acord de Prelucrare Date (DPA)",
    requiredWhen: (s) => {
      // Required if org has vendors or AI systems processing personal data
      const vendors = (s as Record<string, unknown>).nis2Vendors as unknown[] | undefined
      const aiSystems = s.aiSystems ?? []
      return (vendors && vendors.length > 0) || aiSystems.length > 0
    },
  },
  {
    type: "nis2-incident-response",
    label: "Plan de Răspuns Incidente NIS2",
    requiredWhen: (s) => {
      // Required if NIS2 assessment is done
      const assessed = (s as Record<string, unknown>).nis2AssessmentCompletedAt
      return Boolean(assessed)
    },
  },
  {
    type: "ai-governance",
    label: "Politică de Guvernanță AI",
    requiredWhen: (s) => {
      // Required if org has registered AI systems
      return (s.aiSystems ?? []).length > 0
    },
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(isoDate: string | undefined | null, nowMs: number): number | null {
  if (!isoDate) return null
  const d = new Date(isoDate).getTime()
  if (isNaN(d)) return null
  return Math.floor((nowMs - d) / MS_PER_DAY)
}

type GeneratedDocRecord = {
  type: string
  generatedAtISO: string
}

function extractGeneratedDocs(state: ComplianceState): GeneratedDocRecord[] {
  // Generated docs are stored in state.generatedDocuments or similar
  const docs = (state as Record<string, unknown>).generatedDocuments as
    | GeneratedDocRecord[]
    | undefined
  return docs ?? []
}

// ── Agent logic ──────────────────────────────────────────────────────────────

export function runDocumentAgent(input: DocumentAgentInput): AgentOutput {
  const runId = generateRunId("document")
  const startedAtISO = new Date().toISOString()
  const actions: AgentAction[] = []
  const nowMs = new Date(input.nowISO).getTime()
  let itemsScanned = 0
  let issuesFound = 0

  const generatedDocs = extractGeneratedDocs(input.state)
  const generatedByType = new Map<string, GeneratedDocRecord>()
  for (const doc of generatedDocs) {
    // Keep most recent per type
    const existing = generatedByType.get(doc.type)
    if (!existing || doc.generatedAtISO > existing.generatedAtISO) {
      generatedByType.set(doc.type, doc)
    }
  }

  // 1. Check each document rule
  for (const rule of DOCUMENT_RULES) {
    itemsScanned++
    const isRequired = rule.requiredWhen(input.state)
    if (!isRequired) continue

    const existing = generatedByType.get(rule.type)

    if (!existing) {
      // Document is required but never generated
      issuesFound++
      actions.push({
        type: "document_drafted",
        description: `Lipsă: ${rule.label} — document necesar conform legislației, dar negăsit. Generare recomandată.`,
        targetId: rule.type,
        approvalLevel: 2,
        autoApplied: false,
      })
      continue
    }

    // Check if expired
    const age = daysSince(existing.generatedAtISO, nowMs)
    if (age !== null && age > DOCUMENT_EXPIRY_DAYS) {
      issuesFound++
      actions.push({
        type: "document_drafted",
        description: `Expirat: ${rule.label} — generat acum ${age} zile (limită: ${DOCUMENT_EXPIRY_DAYS}). Regenerare recomandată.`,
        targetId: rule.type,
        approvalLevel: 2,
        autoApplied: false,
      })
      continue
    }

    // Check if stale (>180 days) — warn but don't escalate
    if (age !== null && age > 180) {
      actions.push({
        type: "alert_created",
        description: `Atenție: ${rule.label} — generat acum ${age} zile. Verifică dacă reflectă starea curentă.`,
        targetId: rule.type,
        approvalLevel: 1,
        autoApplied: true,
      })
    }
  }

  // 2. Check for profile completeness affecting doc quality
  const profileGaps: string[] = []
  const raw = input.state as Record<string, unknown>
  if (!raw.orgName && !raw.companyName) profileGaps.push("numele organizației")
  if (!raw.orgWebsite && !raw.website) profileGaps.push("website-ul")
  if (!raw.orgSector && !raw.sector) profileGaps.push("sectorul de activitate")
  if (!raw.orgCui && !raw.cui) profileGaps.push("CUI-ul")

  if (profileGaps.length > 0) {
    itemsScanned++
    issuesFound++
    actions.push({
      type: "finding_created",
      description: `Profil incomplet — lipsesc: ${profileGaps.join(", ")}. Documentele generate pot fi incomplete.`,
      targetId: "profile-completeness",
      approvalLevel: 1,
      autoApplied: true,
    })
  }

  // 3. Check AI systems without governance documentation
  const aiSystems = input.state.aiSystems ?? []
  if (aiSystems.length > 0) {
    itemsScanned++
    const highRisk = aiSystems.filter(
      (sys) => (sys as Record<string, unknown>).riskLevel === "high" ||
               (sys as Record<string, unknown>).riskLevel === "unacceptable",
    )
    if (highRisk.length > 0 && !generatedByType.has("ai-governance")) {
      issuesFound++
      actions.push({
        type: "escalation_raised",
        description: `${highRisk.length} sistem(e) AI cu risc ridicat fără politică de guvernanță AI. Obligatoriu conform EU AI Act.`,
        targetId: "ai-governance-missing-high-risk",
        approvalLevel: 2,
        autoApplied: false,
      })
    }
  }

  // Build reasoning
  const reasoning = buildReasoning(actions, issuesFound, itemsScanned, generatedByType.size)

  return {
    agentType: "document",
    runId,
    status: actions.some((a) => !a.autoApplied) ? "awaiting_approval" : "completed",
    actions,
    confidence: issuesFound === 0 ? 0.95 : issuesFound <= 2 ? 0.8 : 0.65,
    reasoning,
    startedAtISO,
    completedAtISO: new Date().toISOString(),
    metrics: {
      itemsScanned,
      issuesFound,
      actionsAutoApplied: actions.filter((a) => a.autoApplied).length,
      actionsPendingApproval: actions.filter((a) => !a.autoApplied).length,
    },
  }
}

function buildReasoning(
  actions: AgentAction[],
  issues: number,
  scanned: number,
  docsFound: number,
): string {
  const parts: string[] = []
  parts.push(`Verificat ${scanned} reguli de documentare (${docsFound} documente existente).`)

  if (issues === 0) {
    parts.push("Toate documentele necesare sunt prezente și actuale.")
  } else {
    const missing = actions.filter((a) => a.type === "document_drafted" && a.description.startsWith("Lipsă")).length
    const expired = actions.filter((a) => a.type === "document_drafted" && a.description.startsWith("Expirat")).length
    const gaps: string[] = []
    if (missing > 0) gaps.push(`${missing} lipsă`)
    if (expired > 0) gaps.push(`${expired} expirate`)
    if (gaps.length > 0) parts.push(`Documente: ${gaps.join(", ")}.`)

    const pending = actions.filter((a) => !a.autoApplied).length
    if (pending > 0) parts.push(`${pending} acțiuni necesită aprobare umană.`)
  }

  return parts.join(" ")
}
