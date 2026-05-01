// Pay Transparency — Anti-Confidentiality contract checker
// Scan text contracts pentru clauze confidențialitate salarială (interzise
// din 7 iunie 2026 conform Directivei (UE) 2023/970, art. 7).

export type CheckSeverity = "ok" | "warning" | "critical"

export type ConfidentialityFinding = {
  /** Index unde apare match-ul în text. */
  matchIndex: number
  /** Pattern care a declanșat detection. */
  pattern: string
  /** Snippet text cu match-ul (~80 chars în jurul match-ului). */
  excerpt: string
  /** Recomandare actionable. */
  recommendation: string
}

export type ConfidentialityCheckResult = {
  findings: ConfidentialityFinding[]
  /** Overall severity bazat pe numărul + tipul findings. */
  severity: CheckSeverity
  /** True dacă textul nu conține clauze interzise. */
  directiveCompliant: boolean
}

// Patterns interzise — combinații care indică restricționarea discuțiilor salariale.
// Toate sunt evaluate case-insensitive pe text normalized (whitespace collapsed).
type Pattern = {
  regex: RegExp
  label: string
}

const PATTERNS: Pattern[] = [
  // Combinații confidențialitate + salariu/remunerație
  {
    regex: /confiden[țt]ialitate\s+salarial[ăa]/iu,
    label: "confidențialitate salarială",
  },
  {
    regex: /confiden[țt]ialitate\s+(?:cu\s+privire\s+la\s+)?salariu/iu,
    label: "confidențialitate cu privire la salariu",
  },
  {
    regex: /salariu(?:l)?\s+(?:este|r[ăa]m[âa]ne|sunt)\s+confiden[țt]ial/iu,
    label: "salariul este/rămâne confidențial",
  },
  {
    regex: /(?:informa[țt]ii|date)\s+privind\s+salariu(?:l)?\s+(?:sunt|este)?\s*confiden[țt]ial/iu,
    label: "informații privind salariul sunt confidențiale",
  },
  // Restricții explicite de comunicare
  {
    regex: /(?:nu\s+(?:are|au)\s+dreptul|este\s+interzis)\s+(?:s[ăa]\s+)?comunic[ae]\s+nivelul\s+(?:salarial|de\s+plat[ăa]|remunerat[iț]ie)/iu,
    label: "interdicție comunicare nivel salarial",
  },
  // Nedivulgare remunerație
  {
    regex: /nedivulg(?:are|[ăa])\s+(?:a\s+)?remunerat[iț]ie/iu,
    label: "nedivulgare remunerație",
  },
  {
    regex: /nedivulg(?:are|[ăa])\s+(?:a\s+)?salariu/iu,
    label: "nedivulgare salariu",
  },
  // Sume + confidențial
  {
    regex: /sumel[ae]\s+(?:salariale|de\s+remunerat[iț]ie)\s+(?:sunt|r[ăa]m[âa]n)\s+confiden[țt]ial/iu,
    label: "sumele salariale sunt confidențiale",
  },
  // Variants cu sporuri/bonusuri
  {
    regex: /(?:salariu|sporuri|bonusuri|beneficii)\s+(?:sunt|r[ăa]m[âa]n)\s+confiden[țt]iale/iu,
    label: "salariu/sporuri/bonusuri confidențiale",
  },
]

const RECOMMENDATION_BASE =
  "Șterge clauza din contract și înlocuiește-o cu o formulare neutră (ex: „Salariații pot discuta liber salariul lor cu alți angajați.”). Conform Directivei (UE) 2023/970 și legislației naționale în vigoare din 7 iunie 2026, restricționarea discuțiilor salariale este interzisă."

export function checkContractConfidentiality(text: string): ConfidentialityCheckResult {
  if (!text || !text.trim()) {
    return { findings: [], severity: "ok", directiveCompliant: true }
  }

  const findings: ConfidentialityFinding[] = []

  for (const pattern of PATTERNS) {
    const match = pattern.regex.exec(text)
    if (match && match.index >= 0) {
      const start = Math.max(0, match.index - 40)
      const end = Math.min(text.length, match.index + match[0].length + 40)
      const excerpt = text.slice(start, end).replace(/\s+/g, " ").trim()
      findings.push({
        matchIndex: match.index,
        pattern: pattern.label,
        excerpt,
        recommendation: RECOMMENDATION_BASE,
      })
    }
  }

  // Deduplicate by overlapping matches (keep first per ~50 char window)
  const dedupedFindings = dedupeFindings(findings)

  let severity: CheckSeverity = "ok"
  if (dedupedFindings.length === 1) severity = "warning"
  if (dedupedFindings.length > 1) severity = "critical"
  if (dedupedFindings.length >= 1) severity = "critical" // any match = non-compliant

  return {
    findings: dedupedFindings,
    severity,
    directiveCompliant: dedupedFindings.length === 0,
  }
}

function dedupeFindings(findings: ConfidentialityFinding[]): ConfidentialityFinding[] {
  if (findings.length <= 1) return findings
  const sorted = [...findings].sort((a, b) => a.matchIndex - b.matchIndex)
  const result: ConfidentialityFinding[] = []
  for (const f of sorted) {
    const last = result[result.length - 1]
    if (last && Math.abs(f.matchIndex - last.matchIndex) < 50) {
      continue // skip overlapping
    }
    result.push(f)
  }
  return result
}
