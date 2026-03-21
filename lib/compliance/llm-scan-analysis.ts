// B1 — Gemini as Primary Scan Engine with framework-specific prompts.
// Gemini is the primary engine. Keyword matching is the fallback/complement.
// Each finding has a confidenceScore (0-100).
// Findings with confidence < 80 or severity critical → requiresHumanReview = true.

import type { ScanFinding, FindingCategory } from "@/lib/compliance/types"
import type { ComplianceSeverity } from "@/lib/compliance/constitution"
import { COMPLIANCE_RULE_LIBRARY } from "@/lib/compliance/rule-library"
import { buildFindingConfidenceReason, inferFindingConfidence } from "@/lib/compliance/finding-confidence"
import { severityToLegacyRisk } from "@/lib/compliance/constitution"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite"

// ── Framework-specific prompts (B1 spec) ────────────────────────────────────

const FRAMEWORK_PROMPTS: Record<string, string> = {
  GDPR: `
Ești un expert GDPR cu 10 ani experiență în drept european.
Analizează textul și identifică problemele de conformitate GDPR.

Pentru fiecare problemă returnează JSON:
{
  "title": "titlul problemei în română",
  "description": "descriere clară",
  "article": "articolul GDPR (ex: Art. 28)",
  "severity": "critical | high | medium | low",
  "confidence": număr 0-100,
  "reasoning": "de ce ai identificat această problemă",
  "sourceParagraph": "fragmentul exact din text",
  "recommendation": "ce trebuie făcut concret",
  "suggestedDocumentType": "dpa | privacy-policy | cookie-policy | null",
  "requiresHumanReview": true dacă confidence < 80 sau severity critical
}

Returnează DOAR array JSON valid, fără text suplimentar.
Dacă nu există probleme returnează [].
`,

  NIS2: `
Ești expert NIS2 (Directiva 2022/2555) și securitate cibernetică.
Verifică în special: politici securitate, incident response, gestiunea riscurilor,
criptografie, continuitate activitate, securitate furnizori.

Pentru fiecare problemă returnează JSON:
{
  "title": "titlul problemei în română",
  "description": "descriere clară",
  "article": "articolul NIS2 (ex: Art. 21(2)(a))",
  "severity": "critical | high | medium | low",
  "confidence": număr 0-100,
  "reasoning": "de ce ai identificat această problemă",
  "sourceParagraph": "fragmentul exact din text",
  "recommendation": "ce trebuie făcut concret",
  "suggestedDocumentType": "incident-response-plan | risk-assessment | security-policy | null",
  "requiresHumanReview": true dacă confidence < 80 sau severity critical
}

Returnează DOAR array JSON valid, fără text suplimentar.
Dacă nu există probleme returnează [].
`,

  AI_ACT: `
Ești expert EU AI Act (Regulamentul 2024/1689).
Identifică: sisteme AI nedeclarate, potențial high-risk, lipsă transparență,
lipsă human oversight documentat.

Pentru fiecare problemă returnează JSON:
{
  "title": "titlul problemei în română",
  "description": "descriere clară",
  "article": "articolul AI Act relevant",
  "severity": "critical | high | medium | low",
  "confidence": număr 0-100,
  "reasoning": "de ce ai identificat această problemă",
  "sourceParagraph": "fragmentul exact din text",
  "recommendation": "ce trebuie făcut concret",
  "suggestedDocumentType": "ai-risk-assessment | ai-transparency-notice | null",
  "requiresHumanReview": true dacă confidence < 80 sau severity critical
}

Returnează DOAR array JSON valid, fără text suplimentar.
Dacă nu există probleme returnează [].
`,

  EFACTURA: `
Ești expert e-Factura și fiscalitate română.
Verifică: structura UBL CIUS-RO, câmpuri obligatorii, CUI/CIF, TVA, termene.

Pentru fiecare problemă returnează JSON:
{
  "title": "titlul problemei în română",
  "description": "descriere clară",
  "article": "referința legală relevantă",
  "severity": "critical | high | medium | low",
  "confidence": număr 0-100,
  "reasoning": "de ce ai identificat această problemă",
  "sourceParagraph": "fragmentul exact din text",
  "recommendation": "ce trebuie făcut concret",
  "suggestedDocumentType": null,
  "requiresHumanReview": true dacă confidence < 80 sau severity critical
}

Returnează DOAR array JSON valid, fără text suplimentar.
Dacă nu există probleme returnează [].
`,
}

// ── Legacy rule-based prompt (fallback complement) ──────────────────────────

type LlmMatchedRule = {
  ruleId: string
  confidence: "high" | "medium" | "low"
  excerpt: string
  reason: string
}

// ── Types ───────────────────────────────────────────────────────────────────

type GeminiSemanticFinding = {
  title: string
  description: string
  article?: string
  severity: string
  confidence: number
  reasoning: string
  sourceParagraph: string
  recommendation: string
  suggestedDocumentType: string | null
  requiresHumanReview?: boolean
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function buildRuleListForPrompt(): string {
  return COMPLIANCE_RULE_LIBRARY.map(
    (r) => `${r.ruleId} | ${r.category} | ${r.title} | keywords: ${r.keywords.slice(0, 3).join(", ")}`
  ).join("\n")
}

function buildLegacyPrompt(documentName: string, content: string): string {
  return [
    "You are a compliance analysis engine for Romanian SMEs.",
    "Analyze the document below for EU compliance issues: GDPR, EU AI Act, e-Factura.",
    "",
    `Document: ${documentName}`,
    "Content:",
    content.slice(0, 4000),
    "",
    "Available rules (ruleId | category | title | sample keywords):",
    buildRuleListForPrompt(),
    "",
    "Instructions:",
    "- Only include rules where the document content contains a real signal.",
    "- Be conservative — false positives are worse than false negatives.",
    "- For each match include the exact excerpt (max 200 chars) from the document.",
    "- Return ONLY valid JSON, no markdown fences, no explanation.",
    "",
    'Format: { "matchedRules": [{ "ruleId": "...", "confidence": "high|medium|low", "excerpt": "...", "reason": "..." }] }',
  ].join("\n")
}

// ── Gemini API call ─────────────────────────────────────────────────────────

async function callGeminiRaw(prompt: string, temperature = 0.1): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature, topP: 0.9, maxOutputTokens: 2048 },
      }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini ${response.status}`)
  }

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }

  return (
    json.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim() ?? ""
  )
}

function cleanJsonResponse(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
}

// ── B1: Semantic framework analysis (PRIMARY) ───────────────────────────────

function detectFrameworks(content: string): string[] {
  const frameworks: string[] = []
  const lower = content.toLowerCase()

  // Always check GDPR — applies to all
  frameworks.push("GDPR")

  // NIS2 signals
  if (
    lower.includes("nis2") || lower.includes("securitate") ||
    lower.includes("incident") || lower.includes("criptare") ||
    lower.includes("risc cibernetic") || lower.includes("furnizori") ||
    lower.includes("continuitate")
  ) {
    frameworks.push("NIS2")
  }

  // AI Act signals
  if (
    lower.includes("ai") || lower.includes("inteligență artificială") ||
    lower.includes("machine learning") || lower.includes("sistem automat") ||
    lower.includes("algoritm") || lower.includes("ai act")
  ) {
    frameworks.push("AI_ACT")
  }

  // e-Factura signals
  if (
    lower.includes("factur") || lower.includes("ubl") ||
    lower.includes("cius-ro") || lower.includes("tva") ||
    lower.includes("cui") || lower.includes("anaf")
  ) {
    frameworks.push("EFACTURA")
  }

  return frameworks
}

function normalizeSeverity(s: string): ComplianceSeverity {
  const lower = s?.toLowerCase?.() ?? "medium"
  if (lower === "critical") return "critical"
  if (lower === "high") return "high"
  if (lower === "low") return "low"
  return "medium"
}

function mapFrameworkToCategory(framework: string): FindingCategory {
  switch (framework) {
    case "GDPR": return "GDPR"
    case "NIS2": return "NIS2"
    case "AI_ACT": return "EU_AI_ACT"
    case "EFACTURA": return "E_FACTURA"
    default: return "GDPR"
  }
}

async function analyzeWithGeminiSemantic(
  text: string,
  frameworks: string[],
  nowISO: string,
  scanId?: string
): Promise<ScanFinding[]> {
  const allFindings: ScanFinding[] = []

  for (const framework of frameworks) {
    const promptTemplate = FRAMEWORK_PROMPTS[framework]
    if (!promptTemplate) continue

    try {
      const prompt = promptTemplate + "\n\nText:\n" + text.slice(0, 6000)
      const raw = await callGeminiRaw(prompt, 0.1)
      if (!raw) continue

      const cleaned = cleanJsonResponse(raw)
      let parsed: unknown[]
      try {
        const result = JSON.parse(cleaned)
        parsed = Array.isArray(result) ? result : []
      } catch {
        continue
      }

      for (const item of parsed) {
        if (!item || typeof item !== "object") continue
        const f = item as Record<string, unknown>
        if (typeof f.title !== "string" || !f.title.trim()) continue

        const confidence = typeof f.confidence === "number" ? Math.min(100, Math.max(0, f.confidence)) : 50
        const severity = normalizeSeverity(String(f.severity ?? "medium"))
        const needsReview = confidence < 80 || severity === "critical"

        allFindings.push({
          id: uid("finding"),
          title: String(f.title).slice(0, 200),
          detail: String(f.description ?? f.title).slice(0, 500),
          category: mapFrameworkToCategory(framework),
          severity,
          verdictConfidence: confidence >= 80 ? "high" : confidence >= 50 ? "medium" : "low",
          verdictConfidenceReason: String(f.reasoning ?? "").slice(0, 300),
          risk: severityToLegacyRisk(severity),
          principles: [],
          createdAtISO: nowISO,
          sourceDocument: "",
          scanId,
          legalReference: typeof f.article === "string" ? f.article : undefined,
          remediationHint: typeof f.recommendation === "string" ? f.recommendation.slice(0, 300) : undefined,
          // B1 fields
          confidenceScore: confidence,
          requiresHumanReview: needsReview,
          reasoning: typeof f.reasoning === "string" ? f.reasoning.slice(0, 300) : undefined,
          sourceParagraph: typeof f.sourceParagraph === "string" ? f.sourceParagraph.slice(0, 500) : undefined,
          suggestedDocumentType:
            typeof f.suggestedDocumentType === "string" && f.suggestedDocumentType !== "null"
              ? f.suggestedDocumentType
              : undefined,
          provenance: {
            ruleId: `gemini-${framework.toLowerCase()}-${uid("r")}`,
            matchedKeyword: "gemini-semantic",
            excerpt: typeof f.sourceParagraph === "string" ? f.sourceParagraph.slice(0, 300) : "",
            signalSource: "keyword" as const,
            verdictBasis: "inferred_signal" as const,
            signalConfidence: confidence >= 80 ? "high" as const : "medium" as const,
          },
        })
      }
    } catch (err) {
      console.error(`[B1] Gemini semantic analysis failed for ${framework}, will use keyword fallback`)
    }
  }

  return deduplicateFindings(allFindings)
}

function deduplicateFindings(findings: ScanFinding[]): ScanFinding[] {
  const seen = new Set<string>()
  return findings.filter((f) => {
    const key = `${f.title}::${f.category}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── Legacy rule-based analysis (FALLBACK) ───────────────────────────────────

async function callGeminiLegacy(prompt: string): Promise<LlmMatchedRule[]> {
  const raw = await callGeminiRaw(prompt)
  if (!raw) return []

  const cleaned = cleanJsonResponse(raw)

  let parsed: { matchedRules?: unknown[] }
  try {
    parsed = JSON.parse(cleaned) as { matchedRules?: unknown[] }
  } catch {
    return []
  }

  if (!Array.isArray(parsed.matchedRules)) return []

  return parsed.matchedRules.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const r = item as Record<string, unknown>
    if (typeof r.ruleId !== "string" || !r.ruleId.trim()) return []
    const confidence =
      r.confidence === "high" || r.confidence === "medium" || r.confidence === "low"
        ? r.confidence
        : "medium"
    return [
      {
        ruleId: r.ruleId.trim(),
        confidence,
        excerpt: typeof r.excerpt === "string" ? r.excerpt.slice(0, 300) : "",
        reason: typeof r.reason === "string" ? r.reason.slice(0, 200) : "",
      } satisfies LlmMatchedRule,
    ]
  })
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * B1: Primary semantic analysis with Gemini.
 * Called BEFORE keyword matching. Returns framework-specific findings.
 */
export async function geminiSemanticAnalyze(params: {
  documentName: string
  content: string
  nowISO: string
  scanId?: string
}): Promise<{ findings: ScanFinding[]; llmUsed: boolean }> {
  if (!GEMINI_API_KEY) {
    return { findings: [], llmUsed: false }
  }

  try {
    const frameworks = detectFrameworks(params.content)
    const findings = await analyzeWithGeminiSemantic(
      params.content,
      frameworks,
      params.nowISO,
      params.scanId
    )

    // Set sourceDocument on all findings
    for (const f of findings) {
      f.sourceDocument = params.documentName
    }

    return { findings, llmUsed: true }
  } catch {
    return { findings: [], llmUsed: false }
  }
}

/**
 * Legacy: Supplement keyword matching — returns findings for rules keyword missed.
 * Now used as fallback/complement AFTER geminiSemanticAnalyze.
 */
export async function llmAnalyzeScan(params: {
  documentName: string
  content: string
  nowISO: string
  scanId?: string
  existingRuleIds: Set<string>
}): Promise<{ findings: ScanFinding[]; llmUsed: boolean }> {
  if (!GEMINI_API_KEY) {
    return { findings: [], llmUsed: false }
  }

  let matchedRules: LlmMatchedRule[]
  try {
    matchedRules = await callGeminiLegacy(buildLegacyPrompt(params.documentName, params.content))
  } catch {
    return { findings: [], llmUsed: false }
  }

  const findings: ScanFinding[] = []

  for (const match of matchedRules) {
    // Skip rules already detected by keyword matching or Gemini semantic — no duplication
    if (params.existingRuleIds.has(match.ruleId)) continue

    const rule = COMPLIANCE_RULE_LIBRARY.find((r) => r.ruleId === match.ruleId)
    if (!rule) continue

    const provenance = {
      ruleId: rule.ruleId,
      matchedKeyword: match.reason || "llm-detected",
      excerpt: match.excerpt || match.reason,
      signalSource: "keyword" as const,
      verdictBasis: "inferred_signal" as const,
      signalConfidence: (match.confidence === "high" ? "high" : "medium") as "high" | "medium",
    }

    const confidenceScore = match.confidence === "high" ? 85 : match.confidence === "medium" ? 65 : 40

    findings.push({
      id: uid("finding"),
      title: rule.title,
      detail: rule.detail,
      category: rule.category,
      severity: rule.severity,
      verdictConfidence: inferFindingConfidence(provenance),
      verdictConfidenceReason: buildFindingConfidenceReason({
        title: rule.title,
        sourceDocument: params.documentName,
        provenance,
      }),
      risk: severityToLegacyRisk(rule.severity),
      principles: rule.principles,
      createdAtISO: params.nowISO,
      sourceDocument: params.documentName,
      scanId: params.scanId,
      legalReference: rule.legalReference,
      impactSummary: rule.impactSummary,
      remediationHint: rule.remediationHint,
      legalMappings: rule.legalMappings,
      ownerSuggestion: rule.ownerSuggestion,
      evidenceRequired: rule.evidenceRequired,
      evidenceTypes: rule.evidenceTypes,
      rescanHint: rule.rescanHint,
      readyTextLabel: rule.readyTextLabel,
      readyText: rule.readyText,
      provenance,
      // B1 fields
      confidenceScore,
      requiresHumanReview: confidenceScore < 80 || rule.severity === "critical",
    })
  }

  return { findings, llmUsed: true }
}
