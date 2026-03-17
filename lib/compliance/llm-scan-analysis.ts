// LLM-based compliance analysis using Gemini API.
// Supplements keyword matching — returns findings for rules the keyword matcher missed.
// Silently returns [] when GEMINI_API_KEY is absent or the call fails.

import type { ScanFinding } from "@/lib/compliance/types"
import { COMPLIANCE_RULE_LIBRARY } from "@/lib/compliance/rule-library"
import { buildFindingConfidenceReason, inferFindingConfidence } from "@/lib/compliance/finding-confidence"
import { severityToLegacyRisk } from "@/lib/compliance/constitution"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite"

type LlmMatchedRule = {
  ruleId: string
  confidence: "high" | "medium" | "low"
  excerpt: string
  reason: string
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function buildRuleListForPrompt(): string {
  return COMPLIANCE_RULE_LIBRARY.map(
    (r) => `${r.ruleId} | ${r.category} | ${r.title} | keywords: ${r.keywords.slice(0, 3).join(", ")}`
  ).join("\n")
}

function buildPrompt(documentName: string, content: string): string {
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

async function callGemini(prompt: string): Promise<LlmMatchedRule[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, topP: 0.9, maxOutputTokens: 1024 },
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

  const raw =
    json.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim() ?? ""

  if (!raw) return []

  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()

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
    matchedRules = await callGemini(buildPrompt(params.documentName, params.content))
  } catch {
    return { findings: [], llmUsed: false }
  }

  const findings: ScanFinding[] = []

  for (const match of matchedRules) {
    // Skip rules already detected by keyword matching — no duplication
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
    })
  }

  return { findings, llmUsed: true }
}
