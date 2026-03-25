// V6 — Regulatory Radar Agent
// Monitors regulatory landscape: framework coverage gaps, upcoming deadlines,
// stale legal status, missing assessments per active framework.
// Phase 1: state-based analysis (no external API calls).
// Phase 2 (future): DNSC.ro scraping, EUR-Lex API, Monitorul Oficial.

import type { ComplianceState } from "@/lib/compliance/types"
import type { ApplicabilityTag } from "@/lib/compliance/applicability"
import {
  FRAMEWORK_LEGAL_STATUS,
  type LegalStatus,
} from "@/lib/compliance/legal-sources"
import {
  generateRunId,
  type AgentAction,
  type AgentOutput,
} from "@/lib/compliance/agentic-engine"

// ── Types ────────────────────────────────────────────────────────────────────

export type RegulatoryRadarInput = {
  orgId: string
  state: ComplianceState
  nowISO: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000

/** Known regulatory deadlines (static — updated with product releases) */
type RegulatoryDeadline = {
  id: string
  framework: ApplicabilityTag
  description: string
  deadlineISO: string
  impactLevel: "critical" | "high" | "medium"
  requiresAssessment: boolean
}

const KNOWN_DEADLINES: RegulatoryDeadline[] = [
  {
    // Deadline trecut (aug 2025) — Art. 5 prohibitions sunt active
    // Rămâne în lista pentru a genera escalare dacă ai sisteme AI interzise nereviewed
    id: "ai-act-art5-prohibitions",
    framework: "ai-act",
    description: "EU AI Act — Art. 5 interdicții sisteme AI interzise (în vigoare din aug 2025)",
    deadlineISO: "2025-08-02T00:00:00.000Z",
    impactLevel: "critical",
    requiresAssessment: true,
  },
  {
    // Deadline viitor (aug 2026) — cel mai important acum
    id: "ai-act-high-risk-annex-iii",
    framework: "ai-act",
    description: "EU AI Act — Sisteme high-risk Annex III: obligații complete + înregistrare EU DB",
    deadlineISO: "2026-08-02T00:00:00.000Z",
    impactLevel: "high",
    requiresAssessment: true,
  },
  {
    // Deadline trecut (oct 2025) — NIS2 obligatorie, orice gap e escalare activă
    id: "nis2-full-compliance",
    framework: "nis2",
    description: "NIS2 — Conformitate completă OUG 155/2024 + Legea 124/2025 (în vigoare din oct 2025)",
    deadlineISO: "2025-10-17T00:00:00.000Z",
    impactLevel: "critical",
    requiresAssessment: true,
  },
  {
    // Deadline trecut (ian 2025) — e-Factura B2B obligatorie
    // requiresAssessment: false → nu generează escalare pentru "assessment lipsă"
    // Dar dacă nu ai SPV conectat → fiscal_sensor prinde asta separat
    id: "efactura-b2b-mandatory",
    framework: "efactura",
    description: "e-Factura — Obligatoriu B2B pentru toți plătitorii de TVA (în vigoare din ian 2025)",
    deadlineISO: "2025-01-01T00:00:00.000Z",
    impactLevel: "high",
    requiresAssessment: false,
  },
  {
    // Deadline viitor: GDPR — revizuire ghiduri EDPB pentru AI (estimat)
    id: "gdpr-edpb-ai-guidelines",
    framework: "gdpr",
    description: "GDPR — Ghiduri EDPB privind AI și date personale: conformitate recomandată",
    deadlineISO: "2026-12-31T00:00:00.000Z",
    impactLevel: "medium",
    requiresAssessment: false,
  },
]

/** Which frameworks require what assessment/state presence */
type FrameworkRequirement = {
  framework: ApplicabilityTag
  label: string
  stateCheck: (state: ComplianceState) => { present: boolean; detail?: string }
}

const FRAMEWORK_REQUIREMENTS: FrameworkRequirement[] = [
  {
    framework: "gdpr",
    label: "GDPR — Inventar date personale",
    stateCheck: (s) => {
      const findings = (s.findings ?? []).filter((f) => f.category === "GDPR")
      return {
        present: findings.length > 0 || (s.aiSystems ?? []).length > 0,
        detail: findings.length === 0 ? "Niciun finding GDPR scanat" : undefined,
      }
    },
  },
  {
    framework: "nis2",
    label: "NIS2 — Auto-evaluare completată",
    stateCheck: (s) => {
      const assessed = (s as Record<string, unknown>).nis2AssessmentCompletedAt
      return {
        present: Boolean(assessed),
        detail: assessed ? undefined : "Auto-evaluare NIS2 necompletată",
      }
    },
  },
  {
    framework: "ai-act",
    label: "AI Act — Inventar sisteme AI",
    stateCheck: (s) => {
      const aiSystems = s.aiSystems ?? []
      return {
        present: aiSystems.length > 0,
        detail: aiSystems.length === 0 ? "Niciun sistem AI inventariat" : undefined,
      }
    },
  },
  {
    framework: "efactura",
    label: "e-Factura — Validare factură",
    stateCheck: (s) => {
      const signals = (s as Record<string, unknown>).efacturaSignals as unknown[] | undefined
      return {
        present: Boolean(signals && signals.length > 0),
        detail: !signals || signals.length === 0 ? "Nicio factură validată" : undefined,
      }
    },
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(isoDate: string, nowMs: number): number {
  return Math.floor((new Date(isoDate).getTime() - nowMs) / MS_PER_DAY)
}

function daysSince(isoDate: string | undefined | null, nowMs: number): number | null {
  if (!isoDate) return null
  const d = new Date(isoDate).getTime()
  if (isNaN(d)) return null
  return Math.floor((nowMs - d) / MS_PER_DAY)
}

// ── Agent logic ──────────────────────────────────────────────────────────────

export function runRegulatoryRadar(input: RegulatoryRadarInput): AgentOutput {
  const runId = generateRunId("regulatory_radar")
  const startedAtISO = new Date().toISOString()
  const actions: AgentAction[] = []
  const nowMs = new Date(input.nowISO).getTime()
  let itemsScanned = 0
  let issuesFound = 0

  // Determine which frameworks apply to this org
  const applicableTags = detectApplicableFrameworks(input.state)

  // 1. Check upcoming regulatory deadlines
  for (const deadline of KNOWN_DEADLINES) {
    itemsScanned++

    // Only check if framework applies to this org
    if (!applicableTags.includes(deadline.framework)) continue

    const daysLeft = daysUntil(deadline.deadlineISO, nowMs)

    if (daysLeft < 0) {
      // Deadline passed
      if (deadline.requiresAssessment) {
        const req = FRAMEWORK_REQUIREMENTS.find((r) => r.framework === deadline.framework)
        const check = req?.stateCheck(input.state)
        if (check && !check.present) {
          issuesFound++
          actions.push({
            type: "escalation_raised",
            description: `Termen depășit: ${deadline.description} — expirat acum ${Math.abs(daysLeft)} zile. ${check.detail ?? "Evaluare necesară."}`,
            targetId: deadline.id,
            approvalLevel: 1,
            autoApplied: true,
          })
        }
      }
    } else if (daysLeft <= 30) {
      // Within 30 days — urgent warning
      issuesFound++
      actions.push({
        type: "notification_sent",
        description: `Termen iminent: ${deadline.description} — ${daysLeft} zile rămase. Verifică starea de conformitate.`,
        targetId: deadline.id,
        approvalLevel: 1,
        autoApplied: true,
      })
    } else if (daysLeft <= 90) {
      // Within 90 days — advisory
      actions.push({
        type: "alert_created",
        description: `Termen apropiat: ${deadline.description} — ${daysLeft} zile rămase.`,
        targetId: deadline.id,
        approvalLevel: 1,
        autoApplied: true,
      })
    }
  }

  // 2. Framework coverage gaps
  for (const req of FRAMEWORK_REQUIREMENTS) {
    itemsScanned++

    if (!applicableTags.includes(req.framework)) continue

    const check = req.stateCheck(input.state)
    if (!check.present) {
      issuesFound++
      actions.push({
        type: "finding_created",
        description: `Gap cadru legal: ${req.label} — ${check.detail ?? "Evaluare lipsă."}`,
        targetId: `framework-gap-${req.framework}`,
        approvalLevel: 1,
        autoApplied: true,
      })
    }
  }

  // 3. Check for stale legal status (proposed/draft that may have changed)
  for (const [key, meta] of Object.entries(FRAMEWORK_LEGAL_STATUS)) {
    itemsScanned++

    if (!applicableTags.includes(key as ApplicabilityTag)) continue

    if (meta.status === "proposed_eu" || meta.status === "draft_dnsc") {
      actions.push({
        type: "alert_created",
        description: `Legislație în evoluție: ${key.toUpperCase()} — "${meta.note}". Verificare manuală recomandată.`,
        targetId: `legal-status-${key}`,
        approvalLevel: 1,
        autoApplied: true,
      })
    }
  }

  // 4. Cross-check: AI systems present but no AI Act assessment
  const aiSystems = input.state.aiSystems ?? []
  if (aiSystems.length > 0) {
    itemsScanned++

    const highRiskSystems = aiSystems.filter((sys) => {
      const rl = (sys as Record<string, unknown>).riskLevel as string | undefined
      return rl === "high" || rl === "unacceptable"
    })

    if (highRiskSystems.length > 0) {
      // Check if org has documented compliance response
      const aiFindings = (input.state.findings ?? []).filter((f) => f.category === "EU_AI_ACT")
      const unresolvedAiFindings = aiFindings.filter((f) => !f.resolution?.closureEvidence)

      if (unresolvedAiFindings.length > 0) {
        issuesFound++
        actions.push({
          type: "escalation_raised",
          description: `${unresolvedAiFindings.length} finding(s) EU AI Act nerezolvate pentru ${highRiskSystems.length} sistem(e) AI high-risk. Art. 6 AI Act impune conformitate completă.`,
          targetId: "ai-act-unresolved-findings",
          approvalLevel: 2,
          autoApplied: false,
        })
      }
    }
  }

  // 5. NIS2 sector-specific checks
  const nis2Assessed = (input.state as Record<string, unknown>).nis2AssessmentCompletedAt as string | undefined
  if (nis2Assessed && applicableTags.includes("nis2")) {
    itemsScanned++
    const assessmentAge = daysSince(nis2Assessed, nowMs)

    // NIS2 requires annual review
    if (assessmentAge !== null && assessmentAge > 365) {
      issuesFound++
      actions.push({
        type: "finding_created",
        description: `Auto-evaluare NIS2 expirată — ${assessmentAge} zile de la ultima evaluare. OUG 155/2024 cere re-evaluare anuală.`,
        targetId: "nis2-assessment-expired",
        approvalLevel: 2,
        autoApplied: false,
      })
    }
  }

  // 6. GDPR compliance gap: no DPA but has vendors processing personal data
  const nis2Vendors = (input.state as Record<string, unknown>).nis2Vendors as unknown[] | undefined
  if (applicableTags.includes("gdpr") && nis2Vendors && nis2Vendors.length > 0) {
    itemsScanned++
    const generatedDocs = (input.state as Record<string, unknown>).generatedDocuments as
      | Array<{ type: string }> | undefined
    const hasDpa = generatedDocs?.some((d) => d.type === "dpa")
    if (!hasDpa) {
      issuesFound++
      actions.push({
        type: "finding_created",
        description: `GDPR Art. 28 — ${nis2Vendors.length} vendor(i) detectați, dar niciun DPA generat. Acord de prelucrare date obligatoriu.`,
        targetId: "gdpr-dpa-gap",
        approvalLevel: 2,
        autoApplied: false,
      })
    }
  }

  const reasoning = buildReasoning(actions, issuesFound, itemsScanned, applicableTags)

  return {
    agentType: "regulatory_radar",
    runId,
    status: actions.some((a) => !a.autoApplied) ? "awaiting_approval" : "completed",
    actions,
    confidence: issuesFound === 0 ? 0.85 : issuesFound <= 3 ? 0.7 : 0.55,
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

// ── Framework detection ──────────────────────────────────────────────────────

function detectApplicableFrameworks(state: ComplianceState): ApplicabilityTag[] {
  const tags: ApplicabilityTag[] = []

  // GDPR always applies to Romanian businesses
  tags.push("gdpr")

  // e-Factura: if org has any fiscal signals or is B2B
  const efacturaSignals = (state as Record<string, unknown>).efacturaSignals as unknown[] | undefined
  if (efacturaSignals && efacturaSignals.length > 0) {
    tags.push("efactura")
  }

  // NIS2: if assessment started or NIS2 vendors present
  const nis2Assessed = (state as Record<string, unknown>).nis2AssessmentCompletedAt
  const nis2Vendors = (state as Record<string, unknown>).nis2Vendors as unknown[] | undefined
  if (nis2Assessed || (nis2Vendors && nis2Vendors.length > 0)) {
    tags.push("nis2")
  }

  // AI Act: if AI systems registered
  if ((state.aiSystems ?? []).length > 0) {
    tags.push("ai-act")
  }

  return tags
}

// ── Reasoning builder ────────────────────────────────────────────────────────

function buildReasoning(
  actions: AgentAction[],
  issues: number,
  scanned: number,
  frameworks: ApplicabilityTag[],
): string {
  const parts: string[] = []
  parts.push(`Monitorizare legislativă: ${frameworks.length} cadre aplicabile (${frameworks.join(", ")}), ${scanned} verificări.`)

  if (issues === 0) {
    parts.push("Nu au fost detectate gap-uri legislative sau termene iminente.")
  } else {
    parts.push(`${issues} probleme detectate.`)

    const deadlines = actions.filter((a) => a.description.includes("Termen")).length
    const gaps = actions.filter((a) => a.description.includes("Gap")).length
    const escalations = actions.filter((a) => a.type === "escalation_raised").length
    const details: string[] = []
    if (deadlines > 0) details.push(`${deadlines} termene`)
    if (gaps > 0) details.push(`${gaps} gap-uri cadru`)
    if (escalations > 0) details.push(`${escalations} escalări`)
    if (details.length > 0) parts.push(`Detalii: ${details.join(", ")}.`)

    const pending = actions.filter((a) => !a.autoApplied).length
    if (pending > 0) parts.push(`${pending} acțiuni necesită aprobare umană.`)
  }

  return parts.join(" ")
}
