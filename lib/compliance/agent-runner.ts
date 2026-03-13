import type {
  SourceEnvelope,
  IntakeProposal,
  FindingProposal,
  DriftProposal,
  EvidenceProposal,
  AgentValidationResult,
} from "@/lib/compliance/agent-os"
import { simulateFindings } from "@/lib/compliance/engine"
import { classifyAISystem } from "@/lib/compliance/ai-inventory"
import type { AISystemPurpose } from "@/lib/compliance/types"

/**
 * Intake Agent:
 * Analizează sursa (document, manifest, text) pentru a propune sisteme AI și a face pre-fill.
 */
export async function runIntakeAgent(envelope: SourceEnvelope): Promise<IntakeProposal> {
  const proposedSystems: IntakeProposal["proposedSystems"] = []
  
  // 1. Detectare din Manifest (package.json, requirements.txt, etc.)
  if (envelope.sourceType === "manifest" && envelope.parsedManifest) {
    const manifestStr = JSON.stringify(envelope.parsedManifest).toLowerCase()
    
    // Heuristică simplă pentru V1: detectează OpenAI/Langchain
    if (manifestStr.includes("openai") || manifestStr.includes("gpt")) {
      const classification = classifyAISystem({
        name: "Detected AI System",
        purpose: "support-chatbot" as AISystemPurpose,
        vendor: "OpenAI",
        modelType: "GPT-4",
        usesPersonalData: false,
        makesAutomatedDecisions: false,
        impactsRights: false,
        hasHumanReview: false
      })

      proposedSystems.push({
        tempId: crypto.randomUUID(),
        systemName: "AI Copilot (Detected)",
        provider: "OpenAI",
        model: "gpt-4",
        purpose: "support-chatbot",
        riskClassSuggested: classification.riskLevel,
        dataUsed: [],
        humanOversight: "required",
        fieldStatus: {
          provider: "detected",
          model: "inferred",
          purpose: "inferred",
          risk_class: "inferred"
        },
        sourceSignals: ["dependency:openai", "manifest:package.json"],
        confidence: "medium"
      })
    }

    // Detectare Anthropic / Claude
    if (manifestStr.includes("anthropic") || manifestStr.includes("claude")) {
      const classification = classifyAISystem({
        name: "Anthropic Integration",
        purpose: "support-chatbot" as AISystemPurpose,
        vendor: "Anthropic",
        modelType: "Claude-3",
        usesPersonalData: false,
        makesAutomatedDecisions: false,
        impactsRights: false,
        hasHumanReview: false
      })

      proposedSystems.push({
        tempId: crypto.randomUUID(),
        systemName: "Claude AI Assistant",
        provider: "Anthropic",
        model: "claude-3-opus",
        purpose: "support-chatbot",
        riskClassSuggested: classification.riskLevel,
        dataUsed: [],
        humanOversight: "required",
        fieldStatus: {
          provider: "detected",
          model: "inferred",
          purpose: "inferred",
          risk_class: "inferred"
        },
        sourceSignals: ["dependency:anthropic", "manifest:package.json"],
        confidence: "medium"
      })
    }

    // Detectare Local ML (Transformers / Torch)
    if (manifestStr.includes("transformers") || manifestStr.includes("torch") || manifestStr.includes("scikit-learn")) {
      const classification = classifyAISystem({
        name: "Local ML Model",
        purpose: "other" as AISystemPurpose,
        vendor: "Open Source / Local",
        modelType: "Custom/HuggingFace",
        usesPersonalData: true, // Presumptie de prudenta pentru modele locale
        makesAutomatedDecisions: false,
        impactsRights: false,
        hasHumanReview: false
      })

      proposedSystems.push({
        tempId: crypto.randomUUID(),
        systemName: "Custom ML Pipeline",
        provider: "Internal",
        model: "Transformers/Custom",
        purpose: "other",
        riskClassSuggested: classification.riskLevel,
        dataUsed: ["training-data", "inference-data"],
        humanOversight: "unknown",
        fieldStatus: {
          provider: "inferred",
          model: "detected",
          purpose: "missing",
          risk_class: "inferred"
        },
        sourceSignals: ["dependency:transformers", "manifest:package.json"],
        confidence: "low"
      })
    }

    // Detectare Orchestration / RAG (LangChain / LlamaIndex)
    if (manifestStr.includes("langchain") || manifestStr.includes("llamaindex")) {
      const classification = classifyAISystem({
        name: "RAG / Orchestration System",
        purpose: "document-assistant" as AISystemPurpose,
        vendor: "Meta-Framework (LangChain/Llama)",
        modelType: "Orchestrator",
        usesPersonalData: true, // RAG usually touches internal docs
        makesAutomatedDecisions: false,
        impactsRights: false,
        hasHumanReview: false
      })

      proposedSystems.push({
        tempId: crypto.randomUUID(),
        systemName: "Knowledge Assistant (RAG)",
        provider: "Internal/Hybrid",
        model: "RAG Pipeline",
        purpose: "document-assistant",
        riskClassSuggested: classification.riskLevel,
        dataUsed: ["internal-documents", "knowledge-base"],
        humanOversight: "required", // Hallucination risk
        fieldStatus: {
          provider: "inferred",
          model: "detected",
          purpose: "inferred",
          risk_class: "inferred"
        },
        sourceSignals: ["dependency:langchain/llamaindex", "manifest:package.json"],
        confidence: "medium"
      })
    }
  }

  // 2. Detectare din Document/Text (keywords)
  if ((envelope.sourceType === "document" || envelope.sourceType === "text") && envelope.rawText) {
    const text = envelope.rawText.toLowerCase()
    if (text.includes("decizie automată") || text.includes("scoring")) {
        const classification = classifyAISystem({
            name: "High-Risk Scoring System",
            purpose: "credit-scoring" as AISystemPurpose,
            vendor: "Internal/Unknown",
            modelType: "Classifier",
            usesPersonalData: true,
            makesAutomatedDecisions: true,
            impactsRights: true,
            hasHumanReview: false
        })

        proposedSystems.push({
            tempId: crypto.randomUUID(),
            systemName: envelope.sourceName.replace(/\.[^/.]+$/, "") + " System",
            provider: "Internal",
            model: "Scoring Model",
            purpose: "credit-scoring",
            riskClassSuggested: classification.riskLevel,
            dataUsed: ["financial-data", "personal-data"],
            humanOversight: "missing",
            fieldStatus: {
                provider: "inferred",
                model: "missing",
                purpose: "inferred",
                risk_class: "inferred"
            },
            sourceSignals: ["keyword:decizie automată", "keyword:scoring"],
            confidence: "low"
        })
    }

    // Detectare Biometric / High Risk
    if (text.includes("biometric") || text.includes("recunoaștere facială") || text.includes("facial recognition")) {
        proposedSystems.push({
            tempId: crypto.randomUUID(),
            systemName: "Biometric ID System",
            provider: "Unknown",
            model: "Vision Model",
            purpose: "biometric-identification",
            riskClassSuggested: "high",
            dataUsed: ["biometric-data", "images"],
            humanOversight: "required",
            fieldStatus: {
                provider: "missing",
                model: "inferred",
                purpose: "detected",
                risk_class: "inferred"
            },
            sourceSignals: ["keyword:biometric", "keyword:recunoaștere facială"],
            confidence: "high"
        })
    }

    // Detectare HR / Recruitment / CV Screening (High Risk Annex III)
    if (text.includes("screening cv") || text.includes("selecție candidați") || text.includes("recrutare automată") || text.includes("analiză cv")) {
        proposedSystems.push({
            tempId: crypto.randomUUID(),
            systemName: "HR CV Screening AI",
            provider: "Unknown",
            model: "Resume Parser",
            purpose: "hr-screening",
            riskClassSuggested: "high", // Explicit High Risk
            dataUsed: ["cv-data", "employment-history", "personal-profiles"],
            humanOversight: "required",
            fieldStatus: {
                provider: "missing",
                model: "inferred",
                purpose: "detected",
                risk_class: "inferred"
            },
            sourceSignals: ["keyword:screening cv", "keyword:recrutare", "context:hr"],
            confidence: "high"
        })
    }
  }

  return {
    proposedSystems,
    sourceSummary: `Analiza Intake completă pentru ${envelope.sourceName}. Au fost propuse ${proposedSystems.length} sisteme candidate.`
  }
}

/**
 * Findings Agent:
 * Transformă semnalele din sursă în constatări (findings) standardizate.
 * Refolosește motorul robust simulateFindings din engine.ts.
 */
export async function runFindingsAgent(envelope: SourceEnvelope): Promise<FindingProposal[]> {
  const content = envelope.rawText || JSON.stringify(envelope.parsedManifest || {}) || ""
  const manifestSignals: string[] = []
  let declaredRiskClass: string | undefined

  // Extract dependencies as signals for Rule Library
  if (envelope.sourceType === "manifest" && envelope.parsedManifest) {
    const deps = {
      ...(envelope.parsedManifest.dependencies as Record<string, string>),
      ...(envelope.parsedManifest.devDependencies as Record<string, string>),
    }
    manifestSignals.push(...Object.keys(deps))
  }

  // Extract governance config as signals
  if (envelope.sourceType === "yaml" && envelope.parsedYaml) {
    const gov = toGovernanceRecord(envelope.parsedYaml.governance)
    if (gov && typeof gov === "object") {
      if (gov.data_residency) {
        manifestSignals.push(String(gov.data_residency))
      }
      if (gov.risk_class) {
        declaredRiskClass = String(gov.risk_class).toLowerCase()
      }
    }
  }

  const result = simulateFindings(
    envelope.sourceName,
    content,
    new Date().toISOString(),
    undefined,
    { manifestSignals }
  )

  const proposals: FindingProposal[] = result.findings.map(f => ({
    findingId: f.id,
    issue: f.title,
    severity: f.severity,
    principle: f.principles?.[0] || "accountability",
    evidence: f.evidenceRequired ? [f.evidenceRequired] : [],
    recommendedFix: f.remediationHint || "Revizuiește cerințele de conformitate.",
    lawReference: f.legalReference,
    ownerSuggestion: f.ownerSuggestion,
    rationale: f.impactSummary || f.detail,
    confidence: f.verdictConfidence || "medium",
    sourceSignals: f.provenance ? [f.provenance.matchedKeyword].filter(Boolean) as string[] : []
  }))

  // Validare strictă: Detectare Biometrie în sistem Low Risk (YAML)
  if (envelope.sourceType === "yaml" && declaredRiskClass) {
    const isLowRisk = ["minimal", "limited"].includes(declaredRiskClass)
    const textLower = content.toLowerCase()
    
    const biometricKeywords = [
      "biometric", 
      "facial recognition", 
      "recunoaștere facială", 
      "face detection", 
      "iris scan", 
      "voice print",
      "liveness detection"
    ]

    const detectedSignal = biometricKeywords.find(k => textLower.includes(k))

    if (isLowRisk && detectedSignal) {
      proposals.push({
        findingId: crypto.randomUUID(),
        issue: "Discordanță critică: Biometrie în sistem Low Risk",
        severity: "critical",
        principle: "accountability",
        evidence: ["compliscan.yaml", "Conținut detectat"],
        recommendedFix: "Actualizează 'risk_class' la 'high' și completează Annex III.",
        lawReference: "AI Act Annex III",
        ownerSuggestion: "DPO + Product Owner",
        rationale: `Sistemul este declarat '${declaredRiskClass}' în YAML, dar conținutul sugerează utilizarea de date biometrice ('${detectedSignal}'). AI Act clasifică identificarea biometrică drept High Risk.`,
        confidence: "high",
        sourceSignals: [`keyword:${detectedSignal}`, `yaml:risk_class=${declaredRiskClass}`]
      })
    }
  }

  return proposals
}

export async function runDriftAgent(envelope: SourceEnvelope): Promise<DriftProposal[]> {
  const proposals: DriftProposal[] = []

  // 1. Detectare schimbări critice în YAML (Simulare Drift vs Baseline implicit "Safe")
  if (envelope.sourceType === "yaml" && envelope.parsedYaml) {
    // Detectare ridicare risc
    const riskClass = (envelope.parsedYaml.risk_class as string) || ""
    if (riskClass.toLowerCase() === "high") {
      proposals.push({
        driftId: crypto.randomUUID(),
        driftType: "risk_class_changed",
        before: { risk_class: "limited" }, // Presupunem baseline safe
        after: { risk_class: "high" },
        severity: "critical",
        impactSummary: "Sistemul a fost clasificat High-Risk. Se activează cerințe stricte de conformitate (AI Act Art. 9).",
        nextAction: "Confirmă evaluarea de impact și procedura de management al riscului.",
        evidenceRequired: ["Evaluare de impact", "Procedură Risk Management"],
        lawReference: "AI Act Art. 9",
        rationale: "Configurația declară explicit nivelul de risc ridicat."
      })
    }

    // Detectare eliminare human oversight
    const ho = envelope.parsedYaml.human_oversight
    if (ho && typeof ho === "object" && "required" in ho && ho.required === false) {
      proposals.push({
        driftId: crypto.randomUUID(),
        driftType: "human_review_removed",
        before: { human_oversight: true },
        after: { human_oversight: false },
        severity: "high",
        impactSummary: "Dezactivarea explicită a supravegherii umane crește riscul de autonomie necontrolată.",
        nextAction: "Reintrodu un pas de validare umană sau justifică excepția.",
        evidenceRequired: ["Justificare tehnică", "Log de monitorizare automată"],
        lawReference: "AI Act Art. 14",
        rationale: "Configurația dezactivează explicit cerința de human oversight."
      })
    }

    // Detectare procesare date personale (auto-activata)
    if (envelope.parsedYaml.personal_data_processed === true) {
      proposals.push({
        driftId: crypto.randomUUID(),
        driftType: "personal_data_detected",
        before: { personal_data_processed: false },
        after: { personal_data_processed: true },
        severity: "high",
        impactSummary: "Sistemul a fost marcat ca procesând date personale. Se activează cerințe GDPR (Art. 6, Art. 13).",
        nextAction: "Verifică temeiul legal și actualizează Registrul de Evidență.",
        evidenceRequired: ["Temei Legal", "Notificare Privacy"],
        lawReference: "GDPR Art. 6",
        rationale: "Configurația declară explicit procesarea de date personale."
      })
    }

    // Detectare schimbare data residency (non-EU)
    const driftGovernance = toGovernanceRecord(envelope.parsedYaml.governance)
    if (driftGovernance && "data_residency" in driftGovernance) {
      const residency = String(driftGovernance.data_residency).toLowerCase()
      if (residency && !residency.includes("eu") && !residency.includes("eea") && !residency.includes("romania")) {
        const transferMechanism = String(driftGovernance.transfer_mechanism || "").toLowerCase()
        const hasValidMechanism = ["scc", "dpf", "bcr"].includes(transferMechanism)

        if (residency.includes("us") && !hasValidMechanism) {
          proposals.push({
            driftId: crypto.randomUUID(),
            driftType: "data_residency_changed",
            before: { data_residency: "EU", transfer_mechanism: "N/A" },
            after: { data_residency: residency, transfer_mechanism: "missing" },
            severity: "critical",
            impactSummary: `Datele sunt procesate în ${residency} (US) fără un mecanism de transfer valid (SCC/DPF) declarat.`,
            nextAction: "Adaugă Clauze Contractuale Standard (SCC) sau certificare Data Privacy Framework (DPF) și declară mecanismul în compliscan.yaml.",
            evidenceRequired: ["Dovada mecanism de transfer (SCC/DPF)", "Transfer Impact Assessment (TIA)"],
            lawReference: "GDPR Chapter V",
            rationale: `Transferul de date către SUA necesită o bază legală explicită conform GDPR, care pare să lipsească din configurația declarată.`
          })
        } else {
          proposals.push({
            driftId: crypto.randomUUID(),
            driftType: "data_residency_changed",
            before: { data_residency: "EU" },
            after: { data_residency: residency },
            severity: "critical",
            impactSummary: `Datele sunt stocate/procesate în ${residency} (Non-EU). Necesită analiză de transfer (TIA).`,
            nextAction: "Justifică transferul datelor și verifică clauzele SCC.",
            evidenceRequired: ["Transfer Impact Assessment", "Clauze Contractuale Standard"],
            lawReference: "GDPR Chapter V",
            rationale: `Regiunea detectată (${residency}) este în afara spațiului economic european.`
          })
        }
      }
    }

    // Detectare purpose change critic (trecere spre High Risk)
    if (envelope.parsedYaml.purpose && envelope.parsedYaml.purpose !== "other") {
       const sensitivePurposes = ["hr-screening", "credit-scoring", "biometric-identification"]
       const purposeStr = String(envelope.parsedYaml.purpose)
       if (sensitivePurposes.includes(purposeStr)) {
          proposals.push({
            driftId: crypto.randomUUID(),
            driftType: "purpose_changed",
            before: { purpose: "support-chatbot" }, // Presupunem baseline safe
            after: { purpose: purposeStr },
            severity: "critical",
            impactSummary: `Scopul declarat s-a schimbat în ${purposeStr}. Asta activează automat cerințe High-Risk (Annex III).`,
            nextAction: "Oprește fluxul până la re-validarea legală completă.",
            evidenceRequired: ["Noua evaluare de conformitate", "Justificare business"],
            lawReference: "AI Act Annex III",
            rationale: "Schimbarea scopului în zonă sensibilă (High-Risk) invalidează analiza anterioară."
          })
       }
    }

    // Detectare stergere retention policy (GDPR risk)
    if (driftGovernance) {
        if (driftGovernance.retention_days === null || driftGovernance.retention_days === undefined || driftGovernance.retention_days === "forever") {
             proposals.push({
                driftId: crypto.randomUUID(),
                driftType: "operational_drift", // generic fallback
                before: { retention_days: 30 },
                after: { retention_days: "missing" },
                severity: "high",
                impactSummary: "Politica de retenție a datelor a fost eliminată sau setată indefinit.",
                nextAction: "Definește un termen clar de ștergere a datelor.",
                evidenceRequired: ["Politica de Retenție", "Job de curățare date"],
                lawReference: "GDPR Art. 5(1)(e)",
                rationale: "Principiul limitării legate de stocare necesită termene clare."
             })
        }
    }
  }

  // 2. Detectare Provider nou în Manifest (Heuristică)
  if (envelope.sourceType === "manifest" && envelope.parsedManifest) {
    const str = JSON.stringify(envelope.parsedManifest).toLowerCase()
    // Exemplu simplu: dacă apare Anthropic și presupunem că nu era standard
    if (str.includes("anthropic") || str.includes("@anthropic-ai/sdk")) {
      proposals.push({
        driftId: crypto.randomUUID(),
        driftType: "provider_added",
        before: {},
        after: { provider: "Anthropic" },
        severity: "medium",
        impactSummary: "A fost detectat un furnizor AI (Anthropic) care necesită review de DPA și Data Residency.",
        nextAction: "Actualizează inventarul și verifică clauzele de procesare a datelor.",
        evidenceRequired: ["DPA Furnizor", "Arhitectură actualizată"],
        lawReference: "GDPR Chapter V",
        rationale: "Dependință nouă detectată în manifest."
      })
    }
  }

  return proposals
}

function toGovernanceRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

export async function runEvidenceAgent(envelope: SourceEnvelope): Promise<EvidenceProposal> {
  const missing: string[] = []
  const checklist: string[] = []
  
  // 1. Analiză structurală
  if (envelope.sourceType === "manifest") {
    missing.push("Configurație compliscan.yaml")
    checklist.push("Creează fișierul compliscan.yaml pentru a declara guvernanța sistemului.")
  }
  
  // 2. Data Residency Evidence din YAML
  if (envelope.sourceType === "yaml" && envelope.parsedYaml) {
    const gov = envelope.parsedYaml.governance
    if (gov && typeof gov === "object" && "data_residency" in gov) {
      const dataResidency = String(gov.data_residency || "").toLowerCase()
      if (dataResidency && !dataResidency.includes("eu") && !dataResidency.includes("eea")) {
        missing.push("Dovadă transfer date (SCC / DPF)")
        checklist.push("Documentează baza legală pentru transferul datelor în afara UE.")
      }
    }
  }

  // 3. Analiză semantică pe conținut (Signals -> Evidence Needs)
  const text = (envelope.rawText || "").toLowerCase()
  const signals = envelope.sourceSignals || []

  // GDPR Evidence
  if (text.includes("personal data") || text.includes("gdpr") || text.includes("date personale") || signals.includes("gdpr")) {
    missing.push("Politica de Confidențialitate (Actualizată)")
    missing.push("Registrul de Evidență a Prelucrărilor")
    checklist.push("Verifică temeiul legal pentru procesarea datelor.")
  }

  // e-Factura Evidence
  if (text.includes("invoice") || text.includes("factura") || text.includes("anaf") || text.includes("xml")) {
    missing.push("Log transmitere e-Factura")
    missing.push("Confirmare arhivare XML")
    checklist.push("Validează XML-ul e-Factura pentru erori de structură.")
  }

  // AI Act Evidence
  if (text.includes("scoring") || text.includes("automated decision") || text.includes("decizie automată")) {
    missing.push("Procedură de Human Oversight")
    checklist.push("Documentează rolul operatorului uman în bucla de decizie.")
  }

  // High Risk Evidence (Surgical precision on Annex IV / GDPR Art 35)
  const isHighRiskSignal = text.includes("high risk") || text.includes("impact ridicat") || signals.includes("biometric") || signals.includes("hr-screening") || (envelope.parsedYaml?.risk_class === "high")

  if (isHighRiskSignal) {
    // Nu cerem doar "DPIA", cerem componentele specifice pentru audit
    missing.push("DPIA: Analiza necesității și proporționalității (GDPR Art. 35(7)(b))")
    missing.push("DPIA: Evaluarea riscurilor pentru drepturile persoanelor (GDPR Art. 35(7)(c))")
    
    // Annex IV breakdown pentru AI Act
    missing.push("Annex IV: Descrierea generală a sistemului și scopul")
    missing.push("Annex IV: Descrierea datelor de antrenare, validare și testare")
    missing.push("Annex IV: Logica sistemului și algoritmii folosiți")
    missing.push("Annex IV: Măsurile de supraveghere umană (instrucțiuni de utilizare)")
    
    // QMS
    missing.push("Certificare QMS / Procedură de management al calității")
    checklist.push("Instituie un sistem de management al riscului (Art. 9) și rulează DPIA.")
  }

  const isReady = missing.length === 0

  return {
    auditReadiness: isReady ? "ready" : "partial",
    missingEvidence: missing,
    reusableEvidenceIds: [],
    controlCoverage: [],
    executiveSummaryDraft: isReady 
      ? "Sursa analizată pare să aibă acoperire documentară completă pentru scopul detectat."
      : `Sursa necesită atenție. Lipsesc ${missing.length} tipuri de evidență critice pentru a fi audit-ready.`,
    stakeholderChecklist: checklist.length > 0 ? checklist : ["Revizuiește manual sursa pentru alte cerințe."]
  }
}

export function validateAgentOutput(
  type: "intake" | "findings" | "drift" | "evidence",
  payload: unknown
): AgentValidationResult {
  const errors: string[] = []
  
  if (type === "intake") {
    const p = payload as IntakeProposal
    if (!Array.isArray(p.proposedSystems)) errors.push("proposedSystems trebuie să fie un array")
  }
  
  if (type === "findings") {
    if (!Array.isArray(payload)) errors.push("Findings payload trebuie să fie un array")
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings: [],
    normalizedPayload: payload
  }
}
