import { COMPLIANCE_RULE_LIBRARY } from "@/lib/compliance/rule-library"

export type ComplianceSignalSource = "keyword" | "manifest"
export type ComplianceVerdictBasis = "direct_signal" | "inferred_signal"
export type ComplianceSignalConfidence = "high" | "medium"

export type DetectedComplianceSignal = {
  ruleId: string
  keyword: string
  excerpt: string
  startChar?: number
  endChar?: number
  signalSource: ComplianceSignalSource
  verdictBasis: ComplianceVerdictBasis
  signalConfidence: ComplianceSignalConfidence
}

export function detectComplianceSignals(input: {
  documentName: string
  content: string
  manifestSignals?: string[]
}) {
  const sourceText = `${input.documentName} ${input.content}`
  const text = sourceText.toLowerCase()
  const manifestSignals = new Set(
    (input.manifestSignals ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean)
  )

  const signals: DetectedComplianceSignal[] = []

  for (const rule of COMPLIANCE_RULE_LIBRARY) {
    const signal = findFirstRuleSignal(text, sourceText, rule.keywords, rule.manifestKeys, manifestSignals)
    if (!signal) continue

    signals.push({
      ruleId: rule.ruleId,
      ...signal,
    })
  }

  return signals
}

function findFirstRuleSignal(
  text: string,
  sourceText: string,
  keywords: string[],
  manifestKeys: string[] | undefined,
  manifestSignals: Set<string>
): Omit<DetectedComplianceSignal, "ruleId"> | null {
  for (const keyword of keywords) {
    const startChar = text.indexOf(keyword)
    if (startChar === -1) continue

    return {
      keyword,
      startChar,
      endChar: startChar + keyword.length,
      excerpt: buildExcerpt(sourceText, startChar, startChar + keyword.length),
      signalSource: "keyword",
      verdictBasis: "direct_signal",
      signalConfidence: "high",
    }
  }

  for (const manifestKey of manifestKeys ?? []) {
    const normalized = manifestKey.toLowerCase()
    if (!manifestSignals.has(normalized)) continue

    const startChar = text.indexOf(normalized)
    if (startChar !== -1) {
      return {
        keyword: manifestKey,
        startChar,
        endChar: startChar + normalized.length,
        excerpt: buildExcerpt(sourceText, startChar, startChar + normalized.length),
        signalSource: "manifest",
        verdictBasis: "inferred_signal",
        signalConfidence: "medium",
      }
    }

    return {
      keyword: manifestKey,
      startChar: undefined,
      endChar: undefined,
      excerpt: `Semnal tehnic detectat in manifest/config: ${manifestKey}`,
      signalSource: "manifest",
      verdictBasis: "inferred_signal",
      signalConfidence: "medium",
    }
  }

  return null
}

function buildExcerpt(text: string, startChar: number, endChar: number) {
  const padding = 64
  const start = Math.max(0, startChar - padding)
  const end = Math.min(text.length, endChar + padding)
  return text.slice(start, end).replace(/\s+/g, " ").trim()
}
