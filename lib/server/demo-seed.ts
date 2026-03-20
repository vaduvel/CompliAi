// lib/server/demo-seed.ts
// Date demo pre-sedate pentru 3 scenarii (IMM, NIS2, Partner).
// Folosite de /api/demo/[scenario] pentru a popula orgs demo.
// NU conține date reale — doar date fictive cu disclaimer.

import { evaluateApplicability } from "@/lib/compliance/applicability"
import type { ComplianceState, ScanFinding, EFacturaValidationRecord } from "@/lib/compliance/types"
import type { OrgProfile } from "@/lib/compliance/applicability"

export type DemoScenario = "imm" | "nis2" | "partner"

export type DemoOrgConfig = {
  orgId: string
  orgName: string
  email: string
  role: "owner"
}

// ── Demo org identifiers ──────────────────────────────────────────────────────

export const DEMO_ORG: Record<DemoScenario, DemoOrgConfig> = {
  imm: {
    orgId: "org-demo-imm",
    orgName: "Demo Retail SRL",
    email: "demo@demo-imm.compliscan.ro",
    role: "owner",
  },
  nis2: {
    orgId: "org-demo-nis2",
    orgName: "Demo Manufacturing SA",
    email: "demo@demo-nis2.compliscan.ro",
    role: "owner",
  },
  partner: {
    orgId: "org-demo-partner",
    orgName: "Demo Contabil & Asociații",
    email: "demo@demo-partner.compliscan.ro",
    role: "owner",
  },
}

// ── Scenariul A — IMM clasic (GDPR + e-Factura) ───────────────────────────────

function buildImmState(): ComplianceState {
  const profile: OrgProfile = {
    sector: "retail",
    employeeCount: "10-49",
    usesAITools: false,
    requiresEfactura: true,
    cui: "RO99000001",
    completedAtISO: "2026-03-01T10:00:00.000Z",
  }
  const applicability = evaluateApplicability(profile)

  const findings: ScanFinding[] = [
    {
      id: "demo-gdpr-1",
      title: "Politica de confidențialitate lipsă sau neactualizată",
      detail:
        "Organizația nu are o politică de confidențialitate conformă GDPR publicată și accesibilă clienților.",
      category: "GDPR",
      severity: "high",
      risk: "high",
      principles: ["privacy_data_governance", "transparency"],
      createdAtISO: "2026-03-15T10:00:00.000Z",
      sourceDocument: "demo-scan",
      legalReference: "GDPR Art. 13",
      impactSummary: "Amendă potențială: 2% din cifra de afaceri sau 10M EUR (Art. 83 GDPR).",
      remediationHint:
        "Generați și publicați o politică de confidențialitate cu CompliAI Generator.",
      resolution: {
        problem: "Lipsă politică de confidențialitate publicată",
        impact: "Amendă potențială GDPR Art. 83",
        action: "Generați politica din CompliAI Generator, publicați pe website",
        closureEvidence: "Link public la politica publicată sau PDF semnat și datat",
      },
    },
    {
      id: "demo-efactura-1",
      title: "Factură ANAF respinsă — FACT-2026-0021",
      detail:
        "Factura FACT-2026-0021 a fost respinsă de SPV ANAF. Codul de eroare E1 indică probleme cu câmpul TaxTotal.",
      category: "E_FACTURA",
      severity: "medium",
      risk: "high",
      principles: ["accountability"],
      createdAtISO: "2026-03-17T08:00:00.000Z",
      sourceDocument: "FACT-2026-0021.xml",
      legalReference: "OUG 120/2021 + Ordinul 1.179/2021",
      impactSummary: "Factura nu este legal valabilă până la retransmitere corectă.",
      remediationHint: "Corectați câmpul TaxTotal și retrimiteți factura în SPV ANAF.",
      resolution: {
        problem: "Factură respinsă de ANAF SPV cu codul E1",
        impact: "Factură nevalidă — nu poate fi dedusă TVA",
        action: "Corectați câmpul TaxTotal și retrimiteți în SPV",
        closureEvidence: "Confirmare acceptare SPV (status: VALID sau APROBAT)",
      },
    },
  ]

  const efacturaValidations: EFacturaValidationRecord[] = [
    {
      id: "demo-eval-1",
      documentName: "FACT-2026-0021.xml",
      valid: false,
      invoiceNumber: "FACT-2026-0021",
      issueDate: "2026-03-16",
      supplierName: "Demo Retail SRL",
      supplierCui: "RO12345678",
      customerName: "Client Demo SRL",
      customerCui: "RO87654321",
      errors: ["E1: TaxTotal lipsă sau incorect formatat"],
      warnings: [],
      createdAtISO: "2026-03-17T08:00:00.000Z",
    },
  ]

  return {
    highRisk: 1,
    lowRisk: 1,
    gdprProgress: 35,
    efacturaSyncedAtISO: "2026-03-15T08:00:00.000Z",
    efacturaConnected: false,
    efacturaSignalsCount: 3,
    scannedDocuments: 2,
    orgProfile: profile,
    applicability,
    alerts: [
      {
        id: "demo-alert-1",
        message: "Factura FACT-2026-0021 a fost respinsă de SPV ANAF cu codul E1.",
        severity: "high",
        open: true,
        createdAtISO: "2026-03-17T09:00:00.000Z",
        findingId: "demo-efactura-1",
      },
      {
        id: "demo-alert-2",
        message: "Ultima actualizare a politicii de confidențialitate depășește 12 luni.",
        severity: "medium",
        open: true,
        createdAtISO: "2026-03-10T09:00:00.000Z",
      },
    ],
    findings,
    scans: [
      {
        id: "demo-scan-1",
        documentName: "Contract_furnizor_2026.pdf",
        contentPreview: "Contract de furnizare servicii — [DEMO]",
        createdAtISO: "2026-03-10T14:00:00.000Z",
        findingsCount: 0,
      },
    ],
    generatedDocuments: [],
    chat: [],
    taskState: {},
    aiComplianceFieldOverrides: {},
    traceabilityReviews: {},
    aiSystems: [],
    detectedAISystems: [],
    efacturaValidations,
    driftRecords: [],
    driftSettings: { severityOverrides: {} },
    snapshotHistory: [],
    validatedBaselineSnapshotId: undefined,
    events: [],
  }
}

// ── Scenariul B — Firmă eligibilă NIS2 ────────────────────────────────────────

function buildNis2State(): ComplianceState {
  const profile: OrgProfile = {
    sector: "manufacturing",
    employeeCount: "50-249",
    usesAITools: true,
    requiresEfactura: true,
    cui: "RO99000002",
    completedAtISO: "2026-02-15T10:00:00.000Z",
  }
  const applicability = evaluateApplicability(profile)

  const findings: ScanFinding[] = [
    {
      id: "nis2-risk-management-gap",
      title: "Politica de management al riscului cibernetic lipsă",
      detail:
        "Organizația nu are o politică formală de management al riscului conform NIS2 Art. 21(2)(a).",
      category: "NIS2",
      severity: "high",
      risk: "high",
      principles: ["robustness", "accountability"],
      createdAtISO: "2026-02-20T10:00:00.000Z",
      sourceDocument: "demo-nis2-assessment",
      legalReference: "OUG 155/2024 Art. 21(2)(a)",
      impactSummary: "Risc de sancțiune administrativă. NIS2 impune măsuri tehnice documentate.",
      remediationHint: "Elaborați o politică de management al riscului validată de conducere.",
      resolution: {
        problem: "Lipsă politică formală de management risc cibernetic",
        impact: "Neconformitate NIS2 Art. 21 — risc de sancțiune",
        action: "Elaborați și aprobați politica cu conducerea + CISO",
        closureEvidence: "Document aprobat de conducere + dată intrare în vigoare",
      },
    },
    {
      id: "nis2-incident-response-gap",
      title: "Plan de răspuns la incidente cibernetice nedocumentat",
      detail: "Organizația nu are un plan formal de IR conform NIS2.",
      category: "NIS2",
      severity: "high",
      risk: "high",
      principles: ["robustness", "oversight"],
      createdAtISO: "2026-02-20T10:00:00.000Z",
      sourceDocument: "demo-nis2-assessment",
      legalReference: "OUG 155/2024 Art. 21(2)(b)",
      impactSummary: "Lipsa planului IR crește timpul de recuperare și atrage sancțiuni.",
      remediationHint: "Generați Planul IR din CompliAI Generator, adaptați și aprobați.",
      resolution: {
        problem: "Lipsă plan formal de răspuns la incidente",
        impact: "Neconformitate NIS2 + risc operațional crescut la incident real",
        action: "Generați Planul IR din CompliAI Generator, adaptați, test tabletop",
        closureEvidence: "Plan IR semnat + test tabletop efectuat și documentat",
      },
    },
    {
      id: "nis2-supply-chain-gap",
      title: "2 furnizori tehnici fără DPA semnat",
      detail: "Microsoft și AWS apar în registrul furnizorilor fără DPA actualizat.",
      category: "NIS2",
      severity: "medium",
      risk: "high",
      principles: ["privacy_data_governance", "accountability"],
      createdAtISO: "2026-02-25T10:00:00.000Z",
      sourceDocument: "demo-nis2-vendor-scan",
      legalReference: "GDPR Art. 28 + OUG 155/2024 Art. 21(2)(d)",
      impactSummary: "Risc GDPR + risc NIS2 supply chain.",
      remediationHint: "Solicitați DPA actualizat de la Microsoft și AWS.",
      resolution: {
        problem: "Furnizori tehnici fără DPA semnat",
        impact: "Risc GDPR Art.28 + risc NIS2 supply chain",
        action: "Generați DPA template din CompliAI, trimiteți Microsoft + AWS",
        closureEvidence: "DPA semnat + dată semnare în registrul furnizorilor",
      },
    },
  ]

  return {
    highRisk: 3,
    lowRisk: 0,
    gdprProgress: 55,
    efacturaSyncedAtISO: "2026-03-14T10:00:00.000Z",
    efacturaConnected: false,
    efacturaSignalsCount: 1,
    scannedDocuments: 5,
    orgProfile: profile,
    applicability,
    alerts: [
      {
        id: "demo-n-alert-1",
        message: "Organizația este eligibilă NIS2 — înregistrare DNSC nu a fost finalizată.",
        severity: "high",
        open: true,
        createdAtISO: "2026-03-01T09:00:00.000Z",
      },
      {
        id: "demo-n-alert-2",
        message: "Furnizor Microsoft apare fără DPA actualizat în registrul NIS2.",
        severity: "medium",
        open: true,
        createdAtISO: "2026-03-10T09:00:00.000Z",
      },
    ],
    findings,
    scans: [],
    generatedDocuments: [],
    chat: [],
    taskState: {},
    aiComplianceFieldOverrides: {},
    traceabilityReviews: {},
    aiSystems: [
      {
        id: "demo-ai-1",
        name: "GitHub Copilot",
        vendor: "Microsoft",
        purpose: "other",
        modelType: "LLM code assistant",
        riskLevel: "limited",
        usesPersonalData: false,
        makesAutomatedDecisions: false,
        impactsRights: false,
        hasHumanReview: true,
        recommendedActions: [],
        createdAtISO: "2026-01-15T10:00:00.000Z",
      },
    ],
    detectedAISystems: [],
    efacturaValidations: [],
    driftRecords: [],
    driftSettings: { severityOverrides: {} },
    snapshotHistory: [],
    validatedBaselineSnapshotId: undefined,
    events: [],
  }
}

// ── Scenariul C — Partner / Contabil ──────────────────────────────────────────

function buildPartnerState(): ComplianceState {
  const profile: OrgProfile = {
    sector: "professional-services",
    employeeCount: "10-49",
    usesAITools: true,
    requiresEfactura: true,
    cui: "RO99000003",
    completedAtISO: "2026-01-10T10:00:00.000Z",
  }
  const applicability = evaluateApplicability(profile)

  return {
    highRisk: 0,
    lowRisk: 0,
    gdprProgress: 80,
    efacturaSyncedAtISO: "",
    efacturaConnected: false,
    efacturaSignalsCount: 0,
    scannedDocuments: 0,
    orgProfile: profile,
    applicability,
    alerts: [],
    findings: [],
    scans: [],
    generatedDocuments: [],
    chat: [],
    taskState: {},
    aiComplianceFieldOverrides: {},
    traceabilityReviews: {},
    aiSystems: [],
    detectedAISystems: [],
    efacturaValidations: [],
    driftRecords: [],
    driftSettings: { severityOverrides: {} },
    snapshotHistory: [],
    validatedBaselineSnapshotId: undefined,
    events: [],
  }
}

// ── Public factory ────────────────────────────────────────────────────────────

export function buildDemoState(scenario: DemoScenario): ComplianceState {
  switch (scenario) {
    case "imm":
      return buildImmState()
    case "nis2":
      return buildNis2State()
    case "partner":
      return buildPartnerState()
  }
}

export const DEMO_SCENARIOS: DemoScenario[] = ["imm", "nis2", "partner"]

export const DEMO_SCENARIO_LABELS: Record<DemoScenario, string> = {
  imm: "IMM clasic (GDPR + e-Factura)",
  nis2: "Firmă eligibilă NIS2",
  partner: "Partener / Contabil",
}
