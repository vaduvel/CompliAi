// Pay Transparency — ITM PDF export
// Generează raport ITM-shaped din PayGapReport. Reuse pdf-generator existent
// (Markdown → PDF cu CompliSans font + header/footer + audit-ready watermark).
// White-label: pull logo + signature din WhiteLabelConfig.

import {
  buildPayGapReportMarkdown,
  type PayGapReport,
} from "@/lib/server/pay-transparency-store"
import { buildPDFFromMarkdown } from "@/lib/server/pdf-generator"
import type { WhiteLabelConfig } from "@/lib/server/white-label"

export type ItmPdfInput = {
  report: PayGapReport
  orgName: string
  whiteLabel?: WhiteLabelConfig | null
}

/**
 * Build ITM-shaped Markdown din PayGapReport. Headers, citate Directiva,
 * white-label aliasing.
 */
export function buildItmReportMarkdown(input: ItmPdfInput): string {
  const { report, orgName, whiteLabel } = input
  const partnerName = whiteLabel?.partnerName?.trim() || orgName
  const tagline = whiteLabel?.tagline?.trim()
  const signer = whiteLabel?.signerName?.trim()

  const header = [
    `# Raport Pay Transparency — Conform Directivei (UE) 2023/970`,
    ``,
    `**Organizație:** ${orgName}`,
    `**Întocmit de:** ${partnerName}`,
    tagline ? `**Tagline:** ${tagline}` : null,
    `**Perioadă raportată:** ${report.periodYear}`,
    `**Data generării:** ${new Date(report.generatedAtISO).toLocaleDateString("ro-RO")}`,
    `**Status:** ${report.status}`,
    ``,
    `---`,
    ``,
  ]
    .filter((l): l is string => typeof l === "string")
    .join("\n")

  const sumarExecutiv = [
    `## Sumar executiv`,
    ``,
    `- **Total angajați incluși:** ${report.totalEmployees}`,
    `- **Salariu mediu (M):** ${report.avgSalaryM.toLocaleString("ro-RO")} RON`,
    `- **Salariu mediu (F):** ${report.avgSalaryF.toLocaleString("ro-RO")} RON`,
    `- **Ecart salarial (gap):** ${report.gapPercent.toFixed(2)}%`,
    `- **Nivel de risc:** ${riskLabel(report.riskLevel)}`,
    `- **Prag obligație îndeplinit:** ${report.obligationMet ? "DA — sub 5%" : "NU — peste 5%, evaluare comună necesară"}`,
    ``,
  ].join("\n")

  const interpretation = report.gapPercent > 5
    ? [
        `## Interpretare conformitate`,
        ``,
        `Ecartul salarial calculat (${report.gapPercent.toFixed(2)}%) depășește pragul de 5% prevăzut`,
        `de Directiva (UE) 2023/970, art. 10. Conform legislației, organizația trebuie să:`,
        ``,
        `1. Inițieze evaluarea comună cu reprezentanții salariaților.`,
        `2. Identifice cauzele obiective ale ecartului.`,
        `3. Adopte măsuri corective documentate.`,
        `4. Păstreze evidența procesului pentru raportarea ITM.`,
        ``,
      ].join("\n")
    : [
        `## Interpretare conformitate`,
        ``,
        `Ecartul salarial calculat (${report.gapPercent.toFixed(2)}%) este sub pragul de 5%`,
        `prevăzut de Directiva (UE) 2023/970. Nu este necesară evaluare comună,`,
        `dar organizația continuă monitorizarea și raportarea conform calendarului prevăzut.`,
        ``,
      ].join("\n")

  const gapByRole = report.gapByRole.length === 0
    ? "*Nu există suficiente date pe roluri pentru comparație granulară.*"
    : report.gapByRole.map((role) => `- **${role.role}:** ${role.gapPercent.toFixed(2)}%`).join("\n")

  const rolesSection = [
    `## Ecart pe roluri`,
    ``,
    gapByRole,
    ``,
  ].join("\n")

  const departmentsSection = report.gapByDepartment && report.gapByDepartment.length > 0
    ? [
        `## Ecart pe departamente`,
        ``,
        ...report.gapByDepartment.map((d) => `- **${d.dept}:** ${d.gapPercent.toFixed(2)}%`),
        ``,
      ].join("\n")
    : ""

  const recommendationsSection = report.recommendations.length === 0
    ? ""
    : [
        `## Recomandări`,
        ``,
        ...report.recommendations.map((r, i) => `${i + 1}. ${r}`),
        ``,
      ].join("\n")

  const legalRef = [
    `## Referințe legale`,
    ``,
    `- **Directiva (UE) 2023/970** privind transparența salarială și mecanismele de aplicare.`,
    `- **Codul Muncii al României** (Legea 53/2003), art. relevante privind nediscriminarea.`,
    `- **Legea Egalității de Șanse** (Legea 202/2002).`,
    ``,
  ].join("\n")

  const footer = [
    `---`,
    ``,
    signer
      ? `**Semnat:** ${signer}, ${partnerName}`
      : `**Întocmit de:** ${partnerName}`,
    ``,
    `**Disclaimer:** Acest raport a fost generat automat de CompliScan pe baza datelor furnizate. Pentru valoare legală integrală, raportul trebuie revizuit și aprobat intern, conform procedurilor organizației și consultanței juridice/expertise contabilă.`,
    ``,
  ].join("\n")

  return [
    header,
    sumarExecutiv,
    interpretation,
    rolesSection,
    departmentsSection,
    recommendationsSection,
    legalRef,
    footer,
  ].join("\n")
}

/**
 * Build PDF binary from PayGapReport. Uses existing pdf-generator infra.
 */
export async function buildItmReportPdf(input: ItmPdfInput): Promise<Buffer> {
  const markdown = buildItmReportMarkdown(input)
  return buildPDFFromMarkdown(markdown, {
    orgName: input.orgName,
    documentType: "Pay Transparency · Raport ITM",
    generatedAt: input.report.generatedAtISO,
    auditReadiness: input.report.status === "published" ? "audit_ready" : "review_required",
    signerName: input.whiteLabel?.signerName ?? null,
  })
}

function riskLabel(level: PayGapReport["riskLevel"]): string {
  switch (level) {
    case "low":
      return "scăzut"
    case "medium":
      return "mediu"
    case "high":
      return "ridicat"
    default:
      return level
  }
}

// Re-export for tests + convenience
export { buildPayGapReportMarkdown }
