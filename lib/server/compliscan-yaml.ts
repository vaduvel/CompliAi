import { buildDetectedAISystemRecord } from "@/lib/compliance/ai-inventory"
import type { AISystemPurpose, DetectedAISystemRecord } from "@/lib/compliance/types"
import type {
  CompliScanYamlDocument,
  CompliScanYamlParseResult,
} from "@/lib/compliscan/yaml-schema"
import {
  COMPLISCAN_YAML_REQUIRED_ROOT_KEYS,
  COMPLISCAN_YAML_REQUIRED_SECTIONS,
} from "@/lib/compliscan/yaml-schema"

type DiscoverFromYamlInput = {
  documentName: string
  content: string
  sourceScanId?: string
  nowISO: string
}

type DiscoverFromYamlResult = {
  summary: string[]
  candidates: DetectedAISystemRecord[]
  config?: CompliScanYamlDocument
  warnings: string[]
  errors: string[]
}

type ParsedValue = string | number | boolean | string[]

const SECTION_KEYS = new Set<string>(COMPLISCAN_YAML_REQUIRED_SECTIONS)

export function isCompliScanYamlFileName(documentName: string) {
  return /compliscan(?:[-_.][\w-]+)*\.(yaml|yml)$/i.test(documentName.trim())
}

export function isYamlFileName(documentName: string) {
  return /\.(yaml|yml)$/i.test(documentName.trim())
}

export function parseCompliScanYaml(content: string): CompliScanYamlParseResult {
  const warnings: string[] = []
  const errors: string[] = []
  const draft: Record<string, unknown> = {}
  let currentSection: string | null = null

  const lines = content.replace(/\t/g, "  ").split(/\r?\n/)

  for (const [index, rawLine] of lines.entries()) {
    const lineNumber = index + 1
    const line = stripComment(rawLine)
    if (!line.trim()) continue

    const indent = rawLine.match(/^\s*/)?.[0].length ?? 0
    const trimmed = line.trim()

    if (indent === 0) {
      currentSection = null

      if (trimmed.endsWith(":") && !trimmed.includes(": ")) {
        const sectionName = trimmed.slice(0, -1).trim()
        if (!SECTION_KEYS.has(sectionName)) {
          warnings.push(`Sectiune necunoscuta ignorata la linia ${lineNumber}: ${sectionName}`)
          continue
        }
        currentSection = sectionName
        draft[sectionName] = {}
        continue
      }

      const entry = parseKeyValue(trimmed)
      if (!entry) {
        errors.push(`Linie invalida la nivel root (${lineNumber}): ${trimmed}`)
        continue
      }

      draft[entry.key] = entry.value
      continue
    }

    if (!currentSection) {
      errors.push(`Cheie fara sectiune activa la linia ${lineNumber}: ${trimmed}`)
      continue
    }

    const entry = parseKeyValue(trimmed)
    if (!entry) {
      errors.push(`Linie invalida in sectiunea ${currentSection} (${lineNumber}): ${trimmed}`)
      continue
    }

    const section = (draft[currentSection] ?? {}) as Record<string, ParsedValue>
    section[entry.key] = entry.value
    draft[currentSection] = section
  }

  for (const key of COMPLISCAN_YAML_REQUIRED_ROOT_KEYS) {
    if (!draft[key]) errors.push(`Lipseste cheia obligatorie: ${key}`)
  }

  for (const section of COMPLISCAN_YAML_REQUIRED_SECTIONS) {
    if (!draft[section]) errors.push(`Lipseste sectiunea obligatorie: ${section}`)
  }

  const config = coerceYamlDraft(draft, errors)
  if (!config || errors.length > 0) {
    return {
      ok: false,
      errors,
      warnings,
    }
  }

  return {
    ok: true,
    config,
    warnings,
  }
}

export function discoverAISystemsFromCompliScanYaml(
  input: DiscoverFromYamlInput
): DiscoverFromYamlResult {
  const parsed = parseCompliScanYaml(input.content)
  if (!parsed.ok) {
    return {
      summary: ["Fișierul compliscan.yaml nu a putut fi validat."],
      candidates: [],
      warnings: parsed.warnings,
      errors: parsed.errors,
    }
  }

  const config = parsed.config
  const purpose = inferPurposeFromConfig(config)
  const candidate = buildDetectedAISystemRecord(
    {
      name: config.name,
      purpose,
      vendor: config.specs.provider,
      modelType: config.specs.model,
      usesPersonalData: config.governance.personal_data_processed,
      makesAutomatedDecisions: makesAutomatedDecisions(config),
      impactsRights: impactsRights(config, purpose),
      hasHumanReview: config.human_oversight.required,
      discoveryMethod: "hybrid",
      confidence: "high",
      frameworks: ["compliscan-yaml"],
      evidence: buildYamlEvidence(config),
      sourceScanId: input.sourceScanId,
      sourceDocument: input.documentName,
    },
    input.nowISO
  )

  const normalizedCandidate: DetectedAISystemRecord = {
    ...candidate,
    riskLevel: config.governance.risk_class,
  }

  return {
    config,
    candidates: [normalizedCandidate],
    warnings: parsed.warnings,
    errors: [],
    summary: [
      `Config valid detectat pentru sistemul ${config.name}.`,
      `Provider: ${config.specs.provider} · model: ${config.specs.model}.`,
      `Risk class declarata: ${config.governance.risk_class}.`,
    ],
  }
}

function coerceYamlDraft(
  draft: Record<string, unknown>,
  errors: string[]
): CompliScanYamlDocument | null {
  const specs = asObject(draft.specs)
  const governance = asObject(draft.governance)
  const humanOversight = asObject(draft.human_oversight)
  const mapping = asObject(draft.mapping)

  if (!specs || !governance || !humanOversight || !mapping) {
    errors.push("Una sau mai multe sectiuni compliscan.yaml nu au format obiect valid.")
    return null
  }

  const riskClass = asString(governance.risk_class)
  if (!riskClass || !["minimal", "limited", "high"].includes(riskClass)) {
    errors.push("governance.risk_class trebuie sa fie unul dintre: minimal, limited, high.")
  }

  const config: CompliScanYamlDocument = {
    version: asString(draft.version) || "",
    system_id: asString(draft.system_id) || "",
    name: asString(draft.name) || "",
    specs: {
      provider: asString(specs.provider) || "",
      model: asString(specs.model) || "",
      capability: asStringArray(specs.capability),
      temperature_limit: asNumber(specs.temperature_limit),
      filters_enabled: asBoolean(specs.filters_enabled),
    },
    governance: {
      risk_class: (riskClass as CompliScanYamlDocument["governance"]["risk_class"]) || "minimal",
      data_residency: asString(governance.data_residency),
      personal_data_processed: asBoolean(governance.personal_data_processed) ?? false,
      retention_days: asNumber(governance.retention_days),
    },
    human_oversight: {
      required: asBoolean(humanOversight.required) ?? false,
      review_method: asString(humanOversight.review_method),
      reviewer_role: asString(humanOversight.reviewer_role),
      alert_on_failure: asBoolean(humanOversight.alert_on_failure),
    },
    mapping: {
      regulations: asStringArray(mapping.regulations),
      articles: asStringArray(mapping.articles),
    },
  }

  if (!config.specs.provider) errors.push("Lipseste specs.provider.")
  if (!config.specs.model) errors.push("Lipseste specs.model.")
  if (config.specs.capability.length === 0) errors.push("Lipseste specs.capability.")
  if (config.mapping.regulations.length === 0) errors.push("Lipseste mapping.regulations.")

  return config
}

function parseKeyValue(line: string) {
  const index = line.indexOf(":")
  if (index === -1) return null

  const key = line.slice(0, index).trim()
  const rawValue = line.slice(index + 1).trim()
  if (!key) return null

  return {
    key,
    value: parseScalarValue(rawValue),
  }
}

function parseScalarValue(rawValue: string): ParsedValue {
  if (!rawValue) return ""

  if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
    const inner = rawValue.slice(1, -1).trim()
    if (!inner) return []
    return inner
      .split(",")
      .map((item) => stripWrappingQuotes(item.trim()))
      .filter(Boolean)
  }

  if (rawValue === "true") return true
  if (rawValue === "false") return false
  if (/^-?\d+(?:\.\d+)?$/.test(rawValue)) return Number(rawValue)

  return stripWrappingQuotes(rawValue)
}

function stripComment(line: string) {
  const hashIndex = line.indexOf("#")
  if (hashIndex === -1) return line
  return line.slice(0, hashIndex)
}

function stripWrappingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

function asObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : undefined
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
}

function inferPurposeFromConfig(config: CompliScanYamlDocument): AISystemPurpose {
  const text = [
    config.name,
    config.specs.provider,
    config.specs.model,
    ...config.specs.capability,
    ...config.mapping.regulations,
    ...config.mapping.articles,
  ]
    .join(" ")
    .toLowerCase()

  if (includesAny(text, ["hr", "candidate", "cv", "screening", "recruit"])) return "hr-screening"
  if (includesAny(text, ["credit", "loan", "eligibility", "scoring"])) return "credit-scoring"
  if (includesAny(text, ["biometric", "face", "facial", "voiceprint"])) {
    return "biometric-identification"
  }
  if (includesAny(text, ["fraud", "aml", "chargeback"])) return "fraud-detection"
  if (includesAny(text, ["marketing", "recommend", "personalization", "segment"])) {
    return "marketing-personalization"
  }
  if (includesAny(text, ["document", "pdf", "retrieval", "rag"])) return "document-assistant"
  if (includesAny(text, ["chat", "assistant", "support", "bot"])) return "support-chatbot"
  return "other"
}

function makesAutomatedDecisions(config: CompliScanYamlDocument) {
  return includesAny(config.specs.capability.join(" ").toLowerCase(), [
    "decision",
    "decisioning",
    "scoring",
    "ranking",
    "eligibility",
  ])
}

function impactsRights(config: CompliScanYamlDocument, purpose: AISystemPurpose) {
  return (
    config.governance.risk_class === "high" ||
    ["credit-scoring", "hr-screening", "biometric-identification"].includes(purpose)
  )
}

function buildYamlEvidence(config: CompliScanYamlDocument) {
  const evidence = [
    `system_id=${config.system_id}`,
    `provider=${config.specs.provider}`,
    `model=${config.specs.model}`,
    `risk_class=${config.governance.risk_class}`,
    `personal_data_processed=${String(config.governance.personal_data_processed)}`,
    `human_oversight.required=${String(config.human_oversight.required)}`,
  ]

  if (config.governance.data_residency) {
    evidence.push(`data_residency=${config.governance.data_residency}`)
  }

  return evidence
}

function includesAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle))
}
