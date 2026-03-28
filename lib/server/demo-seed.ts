// lib/server/demo-seed.ts
// Date demo pre-sedate pentru 3 scenarii (IMM, NIS2, Partner).
// Folosite de /api/demo/[scenario] pentru a popula orgs demo.
// NU conține date reale — doar date fictive cu disclaimer.

import { evaluateApplicability } from "@/lib/compliance/applicability"
import type { ComplianceState, ScanFinding, EFacturaValidationRecord, GeneratedDocumentRecord, ComplianceDriftRecord } from "@/lib/compliance/types"
import type { OrgProfile } from "@/lib/compliance/applicability"
import type { ETVADiscrepancy } from "@/lib/compliance/etva-discrepancy"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"
import type { Nis2OrgState, Nis2Vendor, Nis2Incident, BoardMember, MaturityAssessment } from "@/lib/server/nis2-store"

export type DemoScenario = "imm" | "nis2" | "partner" | "revalidation"

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
  revalidation: {
    orgId: "org-demo-revalidation",
    orgName: "Demo Revalidation SRL",
    email: "demo@demo-revalidation.compliscan.ro",
    role: "owner",
  },
}

// ── Scenariul A — IMM clasic (GDPR + e-Factura + Fiscal) ─────────────────────

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
      suggestedDocumentType: "privacy-policy",
      impactSummary: "Amendă potențială: 2% din cifra de afaceri sau 10M EUR (Art. 83 GDPR).",
      remediationHint:
        "Generează politica de confidențialitate direct din cockpitul cazului și public-o.",
      resolution: {
        problem: "Lipsă politică de confidențialitate publicată",
        impact: "Amendă potențială GDPR Art. 83",
        action: "Generează politica din cockpit, public-o pe website și salvează dovada la dosar",
        closureEvidence: "Link public la politica publicată sau PDF semnat și datat",
      },
    },
    {
      id: "demo-gdpr-2",
      title: "Registru de prelucrare date personale incomplet",
      detail:
        "Registrul intern de prelucrare date (Art. 30 GDPR) nu include toate categoriile de date procesate.",
      category: "GDPR",
      severity: "medium",
      risk: "high",
      principles: ["privacy_data_governance", "accountability"],
      createdAtISO: "2026-03-15T10:30:00.000Z",
      sourceDocument: "demo-scan",
      legalReference: "GDPR Art. 30",
      impactSummary: "Obligatoriu pentru organizații cu >250 angajați sau prelucrări cu risc.",
      remediationHint:
        "Completați registrul cu toate categoriile de date prelucrate, scopuri și baze legale.",
      resolution: {
        problem: "Registru Art. 30 incomplet",
        impact: "Neconformitate GDPR — risc la control ANSPDCP",
        action: "Completați registrul din secțiunea Documente asistate",
        closureEvidence: "Registru Art. 30 complet semnat de DPO/administrator",
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
    {
      id: "demo-eval-2",
      documentName: "FACT-2026-0019.xml",
      valid: true,
      invoiceNumber: "FACT-2026-0019",
      issueDate: "2026-03-10",
      supplierName: "Demo Retail SRL",
      supplierCui: "RO12345678",
      customerName: "Furnizor Demo SRL",
      customerCui: "RO11223344",
      errors: [],
      warnings: ["W3: Câmpul PaymentMeans opțional recomandat"],
      createdAtISO: "2026-03-11T09:00:00.000Z",
    },
  ]

  const generatedDocuments: GeneratedDocumentRecord[] = [
    {
      id: "demo-doc-privacy",
      documentType: "privacy-policy",
      title: "Politica de Confidențialitate — Demo Retail SRL",
      generatedAtISO: "2026-03-16T14:00:00.000Z",
      llmUsed: true,
      expiresAtISO: "2027-03-16T14:00:00.000Z",
      refreshStatus: "current",
    },
    {
      id: "demo-doc-cookie",
      documentType: "cookie-policy",
      title: "Politica de Cookie-uri — Demo Retail SRL",
      generatedAtISO: "2026-03-16T14:30:00.000Z",
      llmUsed: true,
      expiresAtISO: "2027-03-16T14:30:00.000Z",
      refreshStatus: "current",
    },
  ]

  // Fiscal: discrepanțe e-TVA + filing records
  const etvaDiscrepancies: ETVADiscrepancy[] = [
    {
      id: "demo-etva-1",
      type: "sum_mismatch",
      severity: "high",
      status: "acknowledged",
      period: "2026-Q1",
      description: "Diferență TVA colectat vs. TVA declarat. Suma diferă cu 2.340 RON.",
      amountDifference: 2340,
      vatAmountDifference: 445,
      detectedAtISO: "2026-03-12T08:00:00.000Z",
      deadlineISO: "2026-04-11T23:59:59.000Z",
    },
    {
      id: "demo-etva-2",
      type: "missing_invoice",
      severity: "medium",
      status: "resolved",
      period: "2026-02",
      description: "Factură FACT-2026-0015 lipsă din declarația 300 pentru februarie.",
      amountDifference: 890,
      detectedAtISO: "2026-03-05T10:00:00.000Z",
      resolvedAtISO: "2026-03-08T16:00:00.000Z",
      revalidationDueISO: "2026-06-08T16:00:00.000Z",
    },
  ]

  const filingRecords: FilingRecord[] = [
    {
      id: "demo-filing-1",
      type: "d300_tva",
      period: "2026-02",
      status: "on_time",
      dueISO: "2026-03-25T23:59:59.000Z",
      filedAtISO: "2026-03-20T14:00:00.000Z",
    },
    {
      id: "demo-filing-2",
      type: "d394_local",
      period: "2026-02",
      status: "late",
      dueISO: "2026-03-25T23:59:59.000Z",
      filedAtISO: "2026-03-28T10:00:00.000Z",
      note: "Întârziere 3 zile — contabil în concediu",
    },
    {
      id: "demo-filing-3",
      type: "efactura_monthly",
      period: "2026-03",
      status: "upcoming",
      dueISO: "2026-04-25T23:59:59.000Z",
    },
    {
      id: "demo-filing-4",
      type: "saft",
      period: "2026-Q1",
      status: "upcoming",
      dueISO: "2026-04-30T23:59:59.000Z",
    },
  ]

  const events = [
    {
      id: "demo-ev-1",
      type: "scan_completed",
      entityType: "scan" as const,
      entityId: "demo-scan-1",
      message: "Scanare document: Contract_furnizor_2026.pdf",
      createdAtISO: "2026-03-10T14:00:00.000Z",
      actorSource: "system" as const,
      actorId: "scanner",
    },
    {
      id: "demo-ev-2",
      type: "document_generated",
      entityType: "system" as const,
      entityId: "demo-doc-privacy",
      message: "Politica de Confidențialitate generată cu AI",
      createdAtISO: "2026-03-16T14:00:00.000Z",
      actorSource: "session" as const,
      actorId: "demo-user-imm",
    },
    {
      id: "demo-ev-3",
      type: "alert_created",
      entityType: "alert" as const,
      entityId: "demo-alert-1",
      message: "Factură FACT-2026-0021 respinsă de ANAF",
      createdAtISO: "2026-03-17T09:00:00.000Z",
      actorSource: "system" as const,
      actorId: "efactura-monitor",
    },
  ]

  const base: ComplianceState = {
    highRisk: 2,
    lowRisk: 1,
    gdprProgress: 45,
    efacturaSyncedAtISO: "2026-03-15T08:00:00.000Z",
    efacturaConnected: false,
    efacturaSignalsCount: 3,
    scannedDocuments: 3,
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
      {
        id: "demo-alert-3",
        message: "Discrepanță e-TVA detectată pentru Q1 2026 — diferență 2.340 RON.",
        severity: "high",
        open: true,
        createdAtISO: "2026-03-12T08:30:00.000Z",
      },
    ],
    findings,
    scans: [
      {
        id: "demo-scan-1",
        documentName: "Contract_furnizor_2026.pdf",
        contentPreview: "Contract de furnizare servicii — [DEMO]",
        createdAtISO: "2026-03-10T14:00:00.000Z",
        findingsCount: 1,
      },
      {
        id: "demo-scan-2",
        documentName: "Regulament_intern_GDPR.pdf",
        contentPreview: "Regulament intern privind protecția datelor cu caracter personal — [DEMO]",
        createdAtISO: "2026-03-12T09:00:00.000Z",
        findingsCount: 2,
      },
    ],
    generatedDocuments,
    chat: [],
    taskState: {
      "demo-efactura-1": {
        status: "done",
        updatedAtISO: "2026-03-18T10:00:00.000Z",
        attachedEvidence: "Factură FACT-2026-0021 retrimisă și acceptată SPV.",
      },
      "demo-gdpr-1": {
        status: "todo",
        updatedAtISO: "2026-03-16T14:30:00.000Z",
      },
    },
    aiComplianceFieldOverrides: {},
    traceabilityReviews: {},
    aiSystems: [],
    detectedAISystems: [],
    efacturaValidations,
    driftRecords: [],
    driftSettings: { severityOverrides: {} },
    snapshotHistory: [],
    validatedBaselineSnapshotId: undefined,
    events,
  }

  // Attach fiscal data as extended fields (same pattern as API routes)
  const stateWithFiscal = base as ComplianceState & {
    etvaDiscrepancies: ETVADiscrepancy[]
    filingRecords: FilingRecord[]
  }
  stateWithFiscal.etvaDiscrepancies = etvaDiscrepancies
  stateWithFiscal.filingRecords = filingRecords

  return stateWithFiscal
}

// ── Scenariul B — Firmă eligibilă NIS2 ────────────────────────────────────────

function buildNis2ComplianceState(): ComplianceState {
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
      id: "nis2-finding-nis2-rm-01",
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
    {
      id: "nis2-gdpr-dpo-gap",
      title: "DPO nedesemnat sau fără notificare ANSPDCP",
      detail: "Organizația procesează date personale la scară mare dar nu are DPO desemnat conform GDPR Art. 37.",
      category: "GDPR",
      severity: "high",
      risk: "high",
      principles: ["privacy_data_governance", "oversight"],
      createdAtISO: "2026-02-20T11:00:00.000Z",
      sourceDocument: "demo-nis2-assessment",
      legalReference: "GDPR Art. 37-39",
      impactSummary: "Obligație legală neîndeplinită — risc amendă ANSPDCP.",
      remediationHint: "Desemnați un DPO intern sau extern și notificați ANSPDCP.",
      resolution: {
        problem: "DPO nedesemnat",
        impact: "Neconformitate GDPR Art. 37 — amendă potențială",
        action: "Desemnați DPO, notificați ANSPDCP",
        closureEvidence: "Confirmare notificare ANSPDCP + contract DPO",
      },
    },
    {
      id: "nis2-ai-act-inventory",
      title: "Inventar sisteme AI incomplet — GitHub Copilot neclasificat",
      detail: "Sistemul AI 'GitHub Copilot' este inventariat dar nu are evaluare completă a riscului conform EU AI Act.",
      category: "EU_AI_ACT",
      severity: "medium",
      risk: "low",
      principles: ["transparency", "oversight"],
      createdAtISO: "2026-03-01T10:00:00.000Z",
      sourceDocument: "demo-ai-inventory",
      legalReference: "EU AI Act Art. 6 + Annex III",
      impactSummary: "Obligație de inventar și clasificare risc pentru sisteme AI utilizate.",
      remediationHint: "Completați evaluarea de risc din panoul Sisteme AI.",
      resolution: {
        problem: "Sistem AI neclasificat complet",
        impact: "Risc de neconformitate EU AI Act",
        action: "Completați evaluarea de risc în inventarul AI",
        closureEvidence: "Fișă risc completată cu clasificare și măsuri",
      },
    },
  ]

  const generatedDocuments: GeneratedDocumentRecord[] = [
    {
      id: "demo-nis2-doc-ir",
      documentType: "nis2-incident-response",
      title: "Plan de Răspuns la Incidente — Demo Manufacturing SA",
      generatedAtISO: "2026-03-05T10:00:00.000Z",
      llmUsed: true,
      expiresAtISO: "2027-03-05T10:00:00.000Z",
      refreshStatus: "current",
    },
    {
      id: "demo-nis2-doc-dpa",
      documentType: "dpa",
      title: "Template DPA — Furnizori cloud",
      generatedAtISO: "2026-03-10T14:00:00.000Z",
      llmUsed: true,
      expiresAtISO: "2027-03-10T14:00:00.000Z",
      refreshStatus: "current",
    },
    {
      id: "demo-nis2-doc-ai-gov",
      documentType: "ai-governance",
      title: "Politica de Guvernanță AI — Demo Manufacturing SA",
      generatedAtISO: "2026-03-12T09:00:00.000Z",
      llmUsed: true,
      expiresAtISO: "2027-03-12T09:00:00.000Z",
      refreshStatus: "current",
    },
  ]

  const driftRecords: ComplianceDriftRecord[] = [
    {
      id: "demo-drift-1",
      snapshotId: "demo-snap-2",
      comparedToSnapshotId: "demo-snap-1",
      type: "compliance_drift",
      change: "risk_class_changed",
      severity: "medium",
      summary: "Scor conformitate scăzut de la 62% la 55% după descoperirea gap-urilor NIS2.",
      severityReason: "Scădere >5% pe scor global",
      impactSummary: "Gap-uri NIS2 identificate reduc scorul — necesită remediere.",
      nextAction: "Completați politica de management risc + plan IR.",
      lawReference: "OUG 155/2024 Art. 21",
      lifecycleStatus: "open",
      blocksAudit: false,
      blocksBaseline: false,
      detectedAtISO: "2026-03-15T08:00:00.000Z",
      open: true,
    },
  ]

  const events = [
    {
      id: "demo-nis2-ev-1",
      type: "scan_completed",
      entityType: "scan" as const,
      entityId: "demo-nis2-scan-1",
      message: "Evaluare NIS2 inițială completată — 5 findings identificate",
      createdAtISO: "2026-02-20T10:30:00.000Z",
      actorSource: "system" as const,
      actorId: "nis2-assessment",
    },
    {
      id: "demo-nis2-ev-2",
      type: "document_generated",
      entityType: "system" as const,
      entityId: "demo-nis2-doc-ir",
      message: "Plan de Răspuns la Incidente generat",
      createdAtISO: "2026-03-05T10:00:00.000Z",
      actorSource: "session" as const,
      actorId: "demo-user-nis2",
    },
    {
      id: "demo-nis2-ev-3",
      type: "drift_detected",
      entityType: "drift" as const,
      entityId: "demo-drift-1",
      message: "Drift detectat: scor conformitate scăzut cu 7%",
      createdAtISO: "2026-03-15T08:00:00.000Z",
      actorSource: "system" as const,
      actorId: "drift-engine",
    },
  ]

  return {
    highRisk: 4,
    lowRisk: 1,
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
      {
        id: "demo-n-alert-3",
        message: "Incident ransomware activ — deadline raportare DNSC 24h se apropie.",
        severity: "critical",
        open: true,
        createdAtISO: "2026-03-18T14:00:00.000Z",
      },
    ],
    findings,
    scans: [
      {
        id: "demo-nis2-scan-1",
        documentName: "Evaluare_NIS2_initiala.pdf",
        contentPreview: "Evaluare conformitate NIS2 — gap analysis — [DEMO]",
        createdAtISO: "2026-02-20T10:00:00.000Z",
        findingsCount: 3,
      },
      {
        id: "demo-nis2-scan-2",
        documentName: "Contract_Microsoft_Enterprise.pdf",
        contentPreview: "Enterprise Agreement — cloud services — [DEMO]",
        createdAtISO: "2026-02-25T14:00:00.000Z",
        findingsCount: 1,
      },
      {
        id: "demo-nis2-scan-3",
        documentName: "Registru_AI_intern.xlsx",
        contentPreview: "Inventar sisteme AI utilizate intern — [DEMO]",
        createdAtISO: "2026-03-01T09:00:00.000Z",
        findingsCount: 1,
      },
    ],
    generatedDocuments,
    chat: [],
    taskState: {
      "nis2-incident-response-gap": {
        status: "done",
        updatedAtISO: "2026-03-05T10:30:00.000Z",
        attachedEvidence: "Plan IR generat și aprobat de conducere.",
      },
      "nis2-finding-nis2-rm-01": {
        status: "todo",
        updatedAtISO: "2026-03-06T08:00:00.000Z",
      },
      "nis2-supply-chain-gap": {
        status: "todo",
        updatedAtISO: "2026-03-10T10:00:00.000Z",
      },
    },
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
      {
        id: "demo-ai-2",
        name: "ChatGPT Enterprise",
        vendor: "OpenAI",
        purpose: "document-assistant",
        modelType: "LLM generalist",
        riskLevel: "limited",
        usesPersonalData: true,
        makesAutomatedDecisions: false,
        impactsRights: false,
        hasHumanReview: true,
        recommendedActions: ["Verificați DPA cu OpenAI", "Monitorizați ce date sunt transmise"],
        createdAtISO: "2026-02-01T10:00:00.000Z",
      },
    ],
    detectedAISystems: [],
    efacturaValidations: [],
    driftRecords,
    driftSettings: { severityOverrides: {} },
    snapshotHistory: [],
    validatedBaselineSnapshotId: undefined,
    events,
  }
}

// ── NIS2 state (separate store) for scenario B ────────────────────────────────

function buildNis2OrgState(): Nis2OrgState {
  const now = "2026-03-18T14:00:00.000Z"

  const vendors: Nis2Vendor[] = [
    {
      id: "demo-vendor-ms",
      name: "Microsoft Corporation",
      cui: undefined,
      service: "Azure Cloud + M365 + GitHub Enterprise",
      riskLevel: "high",
      hasSecurityClause: true,
      hasIncidentNotification: true,
      hasAuditRight: false,
      contractReviewAtISO: "2025-12-01T00:00:00.000Z",
      notes: "⚠️ Furnizor tech/cloud identificat cu certitudine. DPA necesar conform GDPR Art. 28 + NIS2.",
      techConfidence: "high",
      techDetectionReason: "Microsoft Corporation — L1 match",
      hasDPA: false,
      hasSecuritySLA: true,
      dataProcessingVolume: "high",
      lastReviewDate: "2025-12-01",
      nextReviewDue: "2026-12-01",
      createdAtISO: "2026-02-20T10:00:00.000Z",
      updatedAtISO: "2026-03-10T10:00:00.000Z",
    },
    {
      id: "demo-vendor-aws",
      name: "Amazon Web Services EMEA SARL",
      cui: undefined,
      service: "AWS Cloud Infrastructure (EC2, S3, RDS)",
      riskLevel: "high",
      hasSecurityClause: true,
      hasIncidentNotification: true,
      hasAuditRight: true,
      contractReviewAtISO: "2026-01-15T00:00:00.000Z",
      notes: "⚠️ Furnizor cloud critic — DPA necesită actualizare. SOC2 Type II verificat.",
      techConfidence: "high",
      techDetectionReason: "Amazon Web Services — L1 match",
      hasDPA: false,
      hasSecuritySLA: true,
      dataProcessingVolume: "high",
      lastReviewDate: "2026-01-15",
      nextReviewDue: "2027-01-15",
      createdAtISO: "2026-02-20T10:00:00.000Z",
      updatedAtISO: "2026-03-10T10:00:00.000Z",
    },
    {
      id: "demo-vendor-local",
      name: "IT Solutions România SRL",
      cui: "RO33445566",
      service: "Mentenanță sisteme ERP + suport IT nivel 2",
      riskLevel: "medium",
      hasSecurityClause: false,
      hasIncidentNotification: false,
      hasAuditRight: false,
      notes: "Furnizor local IT — necesită clauze de securitate și notificare incidente conform NIS2.",
      techConfidence: "medium",
      techDetectionReason: "IT Solutions — keyword match",
      hasDPA: true,
      hasSecuritySLA: false,
      dataProcessingVolume: "low",
      lastReviewDate: "2025-06-01",
      nextReviewDue: "2026-06-01",
      createdAtISO: "2026-02-25T10:00:00.000Z",
      updatedAtISO: "2026-03-10T10:00:00.000Z",
    },
  ]

  const incidents: Nis2Incident[] = [
    {
      id: "demo-incident-1",
      title: "Atac ransomware detectat pe serverul de fișiere",
      description:
        "Ransomware LockBit detectat pe serverul de fișiere intern. 15 stații de lucru afectate. Backup-urile sunt intacte. Echipa IT a izolat serverul.",
      severity: "critical",
      status: "open",
      detectedAtISO: "2026-03-18T06:00:00.000Z",
      deadline24hISO: "2026-03-19T06:00:00.000Z",
      deadline72hISO: "2026-03-21T06:00:00.000Z",
      deadlineFinalISO: "2026-04-20T06:00:00.000Z",
      affectedSystems: ["server-files-01", "ws-prod-01..15"],
      attackType: "ransomware",
      attackVector: "Email phishing cu atașament .exe deghizat ca factură",
      operationalImpact: "partial",
      operationalImpactDetails: "Producția continuă parțial. Acces fișiere blocat temporar.",
      measuresTaken: "Server izolat de rețea. Backup-uri verificate. Echipa forensic contactată.",
      createdAtISO: "2026-03-18T06:30:00.000Z",
      updatedAtISO: "2026-03-18T14:00:00.000Z",
    },
  ]

  const boardMembers: BoardMember[] = [
    {
      id: "demo-board-1",
      name: "Andrei Popescu",
      role: "Director General / Administrator",
      nis2TrainingCompleted: "2026-01-20T00:00:00.000Z",
      nis2TrainingExpiry: "2027-01-20T00:00:00.000Z",
      notes: "Răspunzător legal NIS2 conform OUG 155/2024.",
      createdAtISO: "2026-02-15T10:00:00.000Z",
      updatedAtISO: "2026-02-15T10:00:00.000Z",
    },
    {
      id: "demo-board-2",
      name: "Maria Ionescu",
      role: "Responsabil Securitate IT (CISO)",
      nis2TrainingCompleted: "2026-02-10T00:00:00.000Z",
      nis2TrainingExpiry: "2027-02-10T00:00:00.000Z",
      cisoCertification: "CompTIA Security+",
      cisoCertExpiry: "2028-06-15T00:00:00.000Z",
      notes: "CISO desemnat. Coordonator IR Plan.",
      createdAtISO: "2026-02-15T10:00:00.000Z",
      updatedAtISO: "2026-02-15T10:00:00.000Z",
    },
  ]

  const maturityAssessment: MaturityAssessment = {
    level: "important",
    completedAt: "2026-03-01T10:00:00.000Z",
    overallScore: 42,
    answers: {
      "gov-1": "partial",
      "gov-2": "no",
      "risk-1": "partial",
      "risk-2": "no",
      "inc-1": "yes",
      "inc-2": "partial",
      "sc-1": "no",
      "sc-2": "no",
    },
    domains: [
      { id: "governance", name: "Guvernanță", score: 50, status: "partial" },
      { id: "risk-management", name: "Management Risc", score: 30, status: "non_compliant" },
      { id: "incident-response", name: "Răspuns la Incidente", score: 60, status: "partial" },
      { id: "supply-chain", name: "Lanț de Aprovizionare", score: 25, status: "non_compliant" },
      { id: "business-continuity", name: "Continuitate Operațională", score: 45, status: "partial" },
    ],
    remediationPlanDue: "2026-03-31T10:00:00.000Z",
  }

  return {
    assessment: {
      sector: "general",
      answers: {
        employees250: "yes",
        annualRevenue: "yes",
        essentialServices: "no",
        criticalInfra: "no",
      },
      savedAtISO: "2026-02-15T10:30:00.000Z",
      score: 75,
      maturityLabel: "Entitate importantă NIS2",
    },
    incidents,
    vendors,
    updatedAtISO: now,
    dnscRegistrationStatus: "in-progress",
    maturityAssessment,
    boardMembers,
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

  const findings: ScanFinding[] = [
    {
      id: "partner-gdpr-dpa",
      title: "Template DPA necesită actualizare pentru clienți noi",
      detail: "Template-ul DPA utilizat pentru clienții noi nu include clauzele actualizate privind transferul internațional de date.",
      category: "GDPR",
      severity: "medium",
      risk: "low",
      principles: ["privacy_data_governance", "accountability"],
      createdAtISO: "2026-03-01T10:00:00.000Z",
      sourceDocument: "demo-partner-audit",
      legalReference: "GDPR Art. 28 + Art. 46",
      impactSummary: "DPA incomplet poate expune firma la risc la audit.",
      remediationHint: "Actualizați template-ul DPA cu clauzele SCC actualizate.",
      resolution: {
        problem: "DPA template neactualizat",
        impact: "Risc la audit ANSPDCP pentru clienți gestionați",
        action: "Regenerați DPA template din CompliAI Generator",
        closureEvidence: "DPA actualizat semnat cu cel puțin 1 client",
      },
    },
    {
      id: "partner-efactura-client",
      title: "3 clienți cu facturi e-Factura respinse în ultima lună",
      detail: "Clienții Demo Retail SRL, Demo Tech SRL și Demo Food SRL au facturi respinse de ANAF.",
      category: "E_FACTURA",
      severity: "medium",
      risk: "high",
      principles: ["accountability"],
      createdAtISO: "2026-03-15T08:00:00.000Z",
      sourceDocument: "demo-partner-efactura-monitor",
      legalReference: "OUG 120/2021",
      impactSummary: "Clienți cu facturi neconforme — risc de pierdere client.",
      remediationHint: "Contactați clienții afectați și corectați facturile.",
      resolution: {
        problem: "Facturi e-Factura respinse la 3 clienți",
        impact: "Facturile sunt nevalide legal — TVA nu poate fi dedus",
        action: "Corectați și retrimiteți facturile prin SPV",
        closureEvidence: "Confirmare acceptare SPV pentru toate facturile corectate",
      },
    },
  ]

  const generatedDocuments: GeneratedDocumentRecord[] = [
    {
      id: "demo-partner-doc-dpa",
      documentType: "dpa",
      title: "Template DPA Multi-client — Demo Contabil & Asociații",
      generatedAtISO: "2026-02-15T10:00:00.000Z",
      llmUsed: true,
      expiresAtISO: "2027-02-15T10:00:00.000Z",
      refreshStatus: "refresh-candidate",
    },
    {
      id: "demo-partner-doc-privacy",
      documentType: "privacy-policy",
      title: "Politica de Confidențialitate — Demo Contabil & Asociații",
      generatedAtISO: "2026-01-20T14:00:00.000Z",
      llmUsed: true,
      expiresAtISO: "2027-01-20T14:00:00.000Z",
      refreshStatus: "current",
    },
  ]

  const events = [
    {
      id: "demo-partner-ev-1",
      type: "document_generated",
      entityType: "system" as const,
      entityId: "demo-partner-doc-dpa",
      message: "Template DPA generat pentru clienți",
      createdAtISO: "2026-02-15T10:00:00.000Z",
      actorSource: "session" as const,
      actorId: "demo-user-partner",
    },
    {
      id: "demo-partner-ev-2",
      type: "alert_created",
      entityType: "alert" as const,
      entityId: "demo-p-alert-2",
      message: "3 clienți cu facturi e-Factura respinse",
      createdAtISO: "2026-03-15T08:30:00.000Z",
      actorSource: "system" as const,
      actorId: "efactura-monitor",
    },
  ]

  const filingRecords: FilingRecord[] = [
    {
      id: "demo-partner-filing-1",
      type: "d300_tva",
      period: "2026-02",
      status: "on_time",
      dueISO: "2026-03-25T23:59:59.000Z",
      filedAtISO: "2026-03-18T10:00:00.000Z",
    },
    {
      id: "demo-partner-filing-2",
      type: "d390_recap",
      period: "2026-02",
      status: "on_time",
      dueISO: "2026-03-25T23:59:59.000Z",
      filedAtISO: "2026-03-19T09:00:00.000Z",
    },
    {
      id: "demo-partner-filing-3",
      type: "saft",
      period: "2026-Q1",
      status: "upcoming",
      dueISO: "2026-04-30T23:59:59.000Z",
    },
  ]

  const base: ComplianceState = {
    highRisk: 0,
    lowRisk: 2,
    gdprProgress: 80,
    efacturaSyncedAtISO: "2026-03-15T08:00:00.000Z",
    efacturaConnected: false,
    efacturaSignalsCount: 2,
    scannedDocuments: 4,
    orgProfile: profile,
    applicability,
    alerts: [
      {
        id: "demo-p-alert-1",
        message: "Template DPA expiră în 30 de zile — actualizare recomandată.",
        severity: "medium",
        open: true,
        createdAtISO: "2026-03-15T09:00:00.000Z",
      },
      {
        id: "demo-p-alert-2",
        message: "3 clienți cu facturi e-Factura respinse în ultima lună.",
        severity: "medium",
        open: true,
        createdAtISO: "2026-03-15T08:30:00.000Z",
      },
    ],
    findings,
    scans: [
      {
        id: "demo-partner-scan-1",
        documentName: "Audit_GDPR_anual_2025.pdf",
        contentPreview: "Raport audit GDPR annual — [DEMO]",
        createdAtISO: "2026-01-15T14:00:00.000Z",
        findingsCount: 1,
      },
      {
        id: "demo-partner-scan-2",
        documentName: "Proceduri_contabile_interne.pdf",
        contentPreview: "Proceduri interne de facturare și declarații — [DEMO]",
        createdAtISO: "2026-02-10T09:00:00.000Z",
        findingsCount: 0,
      },
    ],
    generatedDocuments,
    chat: [],
    taskState: {
      "partner-gdpr-dpa": {
        status: "todo",
        updatedAtISO: "2026-03-15T10:00:00.000Z",
      },
      "partner-efactura-client": {
        status: "done",
        updatedAtISO: "2026-03-17T16:00:00.000Z",
        attachedEvidence: "Facturile au fost corectate și acceptate SPV pentru 2 din 3 clienți.",
      },
    },
    aiComplianceFieldOverrides: {},
    traceabilityReviews: {},
    aiSystems: [
      {
        id: "demo-partner-ai-1",
        name: "CompliAI Assistant",
        vendor: "CompliScan",
        purpose: "document-assistant",
        modelType: "LLM compliance assistant",
        riskLevel: "minimal",
        usesPersonalData: false,
        makesAutomatedDecisions: false,
        impactsRights: false,
        hasHumanReview: true,
        recommendedActions: [],
        createdAtISO: "2026-01-10T10:00:00.000Z",
      },
    ],
    detectedAISystems: [],
    efacturaValidations: [
      {
        id: "demo-partner-eval-1",
        documentName: "FACT-2026-C001.xml",
        valid: true,
        invoiceNumber: "FACT-2026-C001",
        issueDate: "2026-03-10",
        supplierName: "Demo Contabil & Asociații",
        supplierCui: "RO99000003",
        customerName: "Client A SRL",
        customerCui: "RO11111111",
        errors: [],
        warnings: [],
        createdAtISO: "2026-03-11T09:00:00.000Z",
      },
    ],
    driftRecords: [],
    driftSettings: { severityOverrides: {} },
    snapshotHistory: [],
    validatedBaselineSnapshotId: undefined,
    events,
  }

  // Attach fiscal data
  const stateWithFiscal = base as ComplianceState & { filingRecords: FilingRecord[] }
  stateWithFiscal.filingRecords = filingRecords

  return stateWithFiscal
}

// ── Scenariul D — Revalidare / SYS-002 ───────────────────────────────────────

function buildRevalidationState(): ComplianceState {
  const profile: OrgProfile = {
    sector: "retail",
    employeeCount: "10-49",
    usesAITools: false,
    requiresEfactura: true,
    cui: "RO99000004",
    completedAtISO: "2026-03-10T10:00:00.000Z",
  }
  const applicability = evaluateApplicability(profile)

  const findings: ScanFinding[] = [
    {
      id: "demo-review-1",
      title: "Dovadă veche / necesită revalidare",
      detail:
        "Politica publicată și dovada din dosar trebuie reconfirmate înainte să rămână în monitorizare.",
      category: "GDPR",
      severity: "medium",
      risk: "high",
      principles: ["privacy_data_governance", "transparency"],
      createdAtISO: "2026-03-22T10:00:00.000Z",
      sourceDocument: "vault",
      legalReference: "GDPR Art. 5 și Art. 24",
      impactSummary: "Poți rămâne cu o dovadă veche în dosar și cu monitoring fals.",
      remediationHint: "Reconfirmă acum dovada și setează următorul review.",
      resolution: {
        problem: "Dovadă veche pentru politica de confidențialitate",
        impact: "Monitorizarea continuă nu mai are o urmă de control actuală.",
        action: "Reconfirmă dovada și stabilește următorul review.",
        closureEvidence: "Politică publicată și revizuită anterior",
        revalidation: "Reconfirmare trimestrială sau după schimbări majore în website.",
        reviewedAtISO: "2025-09-22T09:00:00.000Z",
      },
      findingStatus: "open",
      findingStatusUpdatedAtISO: "2026-03-22T10:00:00.000Z",
      nextMonitoringDateISO: "2026-03-20T00:00:00.000Z",
      operationalEvidenceNote:
        "Politica este publicată la https://demo-retail.example/privacy și ultima revizuire confirmată în dosar este din 22.09.2025.",
    },
  ]

  const generatedDocuments: GeneratedDocumentRecord[] = [
    {
      id: "demo-review-doc-1",
      documentType: "privacy-policy",
      title: "Politica de Confidențialitate — Demo Revalidation SRL",
      generatedAtISO: "2025-09-22T09:00:00.000Z",
      llmUsed: true,
      approvalStatus: "approved_as_evidence",
      approvedAtISO: "2025-09-22T09:15:00.000Z",
      approvedByEmail: "demo@demo-revalidation.compliscan.ro",
      validationStatus: "passed",
      validatedAtISO: "2025-09-22T09:10:00.000Z",
      sourceFindingId: "demo-review-1",
      refreshStatus: "refresh-candidate",
      nextReviewDateISO: "2026-03-20T00:00:00.000Z",
      evidenceNote:
        "Versiunea din dosar folosită la ultima confirmare. Necesită reverificare periodică.",
    },
  ]

  const events = [
    {
      id: "demo-review-ev-1",
      type: "document_generated",
      entityType: "system" as const,
      entityId: "demo-review-doc-1",
      message: "Politica de confidențialitate a fost confirmată anterior ca dovadă.",
      createdAtISO: "2025-09-22T09:15:00.000Z",
      actorSource: "session" as const,
      actorId: "demo-user-revalidation",
    },
    {
      id: "demo-review-ev-2",
      type: "alert_created",
      entityType: "alert" as const,
      entityId: "demo-review-alert-1",
      message: "Review-ul politicii a expirat și dovada trebuie reconfirmată.",
      createdAtISO: "2026-03-22T10:00:00.000Z",
      actorSource: "system" as const,
      actorId: "revalidation-engine",
    },
  ]

  return {
    highRisk: 1,
    lowRisk: 0,
    gdprProgress: 78,
    efacturaSyncedAtISO: "2026-03-20T08:00:00.000Z",
    efacturaConnected: true,
    efacturaSignalsCount: 0,
    scannedDocuments: 1,
    orgProfile: profile,
    applicability,
    alerts: [
      {
        id: "demo-review-alert-1",
        message: "Politica de confidențialitate trebuie reconfirmată și primește un review nou.",
        severity: "medium",
        open: true,
        createdAtISO: "2026-03-22T10:00:00.000Z",
        findingId: "demo-review-1",
      },
    ],
    findings,
    scans: [
      {
        id: "demo-review-scan-1",
        documentName: "Vault_Privacy_Policy_2025.pdf",
        contentPreview: "Versiunea din dosar a politicii publicate — [DEMO]",
        createdAtISO: "2025-09-22T09:00:00.000Z",
        findingsCount: 1,
      },
    ],
    generatedDocuments,
    chat: [],
    taskState: {
      "demo-review-1": {
        status: "todo",
        updatedAtISO: "2026-03-22T10:00:00.000Z",
      },
    },
    aiComplianceFieldOverrides: {},
    traceabilityReviews: {},
    aiSystems: [],
    detectedAISystems: [],
    efacturaValidations: [],
    driftRecords: [],
    driftSettings: { severityOverrides: {} },
    snapshotHistory: [],
    validatedBaselineSnapshotId: undefined,
    events,
  }
}

// ── Public factory ────────────────────────────────────────────────────────────

export function buildDemoState(scenario: DemoScenario): ComplianceState {
  switch (scenario) {
    case "imm":
      return buildImmState()
    case "nis2":
      return buildNis2ComplianceState()
    case "partner":
      return buildPartnerState()
    case "revalidation":
      return buildRevalidationState()
  }
}

/**
 * Build NIS2 org state for demo scenario.
 * Returns null for scenarios that don't need NIS2 seeding.
 */
export function buildDemoNis2State(scenario: DemoScenario): Nis2OrgState | null {
  if (scenario === "nis2") return buildNis2OrgState()
  return null
}

export const DEMO_SCENARIOS: DemoScenario[] = ["imm", "nis2", "partner", "revalidation"]

export const DEMO_SCENARIO_LABELS: Record<DemoScenario, string> = {
  imm: "IMM clasic (GDPR + e-Factura)",
  nis2: "Firmă eligibilă NIS2",
  partner: "Partener / Contabil",
  revalidation: "Revalidare / SYS-002",
}
