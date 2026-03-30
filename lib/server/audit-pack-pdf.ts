import type { AuditPackV2 } from "@/lib/compliance/audit-pack"
import { buildPDFFromMarkdown } from "@/lib/server/pdf-generator"

export async function generateAuditPackPdfBuffer(auditPack: AuditPackV2): Promise<Buffer> {
  const md: string[] = []

  md.push(`# Dosar de Audit: ${auditPack.workspace.name}`)
  md.push(`Generat la: ${new Date(auditPack.generatedAt).toLocaleString("ro-RO")}`)
  md.push("")
  md.push("---")
  md.push("")

  md.push("## 1. Rezumat Executiv")
  md.push(`> Readiness: ${auditPack.executiveSummary.auditReadiness}`)
  md.push(`> Scor Conformitate: ${auditPack.executiveSummary.complianceScore ?? "n/a"}%`)
  md.push(`> Drift Activ: ${auditPack.executiveSummary.activeDrifts}`)
  md.push("")

  if (auditPack.executiveSummary.topBlockers.length > 0) {
    md.push("### Top Blocaje")
    auditPack.executiveSummary.topBlockers.forEach((blocker) => {
      md.push(`- ${blocker}`)
    })
    md.push("")
  }

  md.push("## 2. Sisteme in Scope")
  if (auditPack.systemRegister.length === 0) {
    md.push("Nu există sisteme analizate în acest pachet.")
  } else {
    auditPack.systemRegister.forEach((sys, i) => {
      md.push(`### 2.${i + 1}. ${sys.systemName}`)
      md.push(`Provider: ${sys.provider} / ${sys.model}`)
      md.push(`Clasa Risc: ${sys.riskClass}`)
      md.push(`Total Findings Deschise: ${sys.openFindings}`)
      md.push("")
    })
  }
  md.push("")

  md.push("## 3. Matricea de Controale")
  if (auditPack.controlsMatrix.length === 0) {
    md.push("Niciun control activ.")
  } else {
    auditPack.controlsMatrix.forEach((ctrl) => {
      md.push(`### ${ctrl.title}`)
      md.push(`Severitate: ${ctrl.severity} | Owner: ${ctrl.owner}`)
      md.push(`Status Audit: ${ctrl.auditDecision}`)
      md.push(`Dovada necesara: ${ctrl.evidenceRequired}`)
      if (ctrl.lawReference) md.push(`Referinta legala: ${ctrl.lawReference}`)
      md.push("")
      md.push(`Context: ${ctrl.why}`)
      md.push("")
      md.push("---")
      md.push("")
    })
  }

  md.push("## 4. Drift si Incidente Active")
  if (auditPack.driftRegister.length === 0) {
    md.push("Niciun drift sau incident detectat în acest moment.")
  } else {
    auditPack.driftRegister.forEach((drift) => {
      md.push(`### [${drift.severity.toUpperCase()}] ${drift.summary}`)
      md.push(`Sistem: ${drift.systemLabel ?? drift.sourceDocument}`)
      md.push(`Tip Modificare: ${drift.type} -> ${drift.change}`)
      md.push(`Impact: ${drift.impactSummary ?? "neevaluat"}`)
      md.push("")
    })
  }
  md.push("")

  md.push("## 5. Dovezi Colectate")
  if (auditPack.evidenceLedger.length === 0) {
    md.push("Nicio dovada atasata.")
  } else {
    auditPack.evidenceLedger.forEach((ev) => {
      md.push(`- **${ev.title}**: [Status: ${ev.validationStatus}] - Calitate: ${ev.evidenceQuality?.status ?? "necunoscuta"}`)
    })
  }
  md.push("")

  const contentStr = md.join("\n")

  return buildPDFFromMarkdown(contentStr, {
    orgName: auditPack.workspace.name,
    documentType: "Audit Pack Dosar",
    generatedAt: auditPack.generatedAt,
  })
}
