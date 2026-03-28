import type { ScanFinding } from "@/lib/compliance/types"

const MAX_TRIAGE_COPY_LENGTH = 132

function normalizeWhitespace(value?: string) {
  return (value ?? "").replace(/\s+/g, " ").trim()
}

function stripLegalSuffix(text: string) {
  return text
    .split(/\s+(?:Bază:|Mapare legală:)/i)[0]
    .trim()
}

function firstSentence(text: string) {
  const match = text.match(/^.+?(?:[.!?](?=\s|$)|$)/)
  return (match?.[0] ?? text).trim()
}

function truncateAtWordBoundary(text: string, maxLength: number) {
  if (text.length <= maxLength) return text

  const shortened = text.slice(0, maxLength).trimEnd()
  const lastSpace = shortened.lastIndexOf(" ")
  const base = (lastSpace > 48 ? shortened.slice(0, lastSpace) : shortened).trimEnd()
  return `${base}…`
}

export function describeFindingRiskForTriage(finding: ScanFinding) {
  const source =
    normalizeWhitespace(finding.resolution?.impact) ||
    normalizeWhitespace(finding.impactSummary) ||
    normalizeWhitespace(finding.detail)

  if (!source) {
    return "Există un risc activ care cere confirmare și rezolvare din cockpit."
  }

  const simplified = stripLegalSuffix(firstSentence(source))
  return truncateAtWordBoundary(simplified, MAX_TRIAGE_COPY_LENGTH)
}

export function sortFindingsForTriage(findings: ScanFinding[]) {
  const severityRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

  return [...findings].sort((left, right) => {
    const severityDelta = (severityRank[left.severity] ?? 4) - (severityRank[right.severity] ?? 4)
    if (severityDelta !== 0) return severityDelta
    return right.createdAtISO.localeCompare(left.createdAtISO)
  })
}
