import { buildDetectedAISystemRecord } from "@/lib/compliance/ai-inventory"
import { simulateFindings } from "@/lib/compliance/engine"
import type {
  AISystemPurpose,
  ComplianceAlert,
  DetectedAISystemRecord,
  ScanFinding,
  ScanSourceKind,
} from "@/lib/compliance/types"
import {
  discoverAISystemsFromCompliScanYaml,
  isCompliScanYamlFileName,
  isYamlFileName,
} from "@/lib/server/compliscan-yaml"

type PackageRule = {
  packages: string[]
  provider?: string
  framework: string
  modelType: string
}

const PACKAGE_RULES: PackageRule[] = [
  {
    packages: ["openai", "@langchain/openai"],
    provider: "OpenAI",
    framework: "openai-sdk",
    modelType: "GPT family",
  },
  {
    packages: ["anthropic", "@langchain/anthropic"],
    provider: "Anthropic",
    framework: "anthropic-sdk",
    modelType: "Claude family",
  },
  {
    packages: ["@google/generative-ai", "google-generativeai", "vertexai", "google-cloud-aiplatform"],
    provider: "Google",
    framework: "gemini-sdk",
    modelType: "Gemini family",
  },
  {
    packages: ["cohere", "cohere-ai"],
    provider: "Cohere",
    framework: "cohere-sdk",
    modelType: "Cohere family",
  },
  {
    packages: ["ollama"],
    provider: "Ollama",
    framework: "ollama",
    modelType: "Local models",
  },
  {
    packages: ["langchain", "@langchain/core"],
    framework: "langchain",
    modelType: "LLM orchestration",
  },
  {
    packages: ["llamaindex", "gpt-index"],
    framework: "llamaindex",
    modelType: "RAG orchestration",
  },
  {
    packages: ["transformers", "sentence-transformers"],
    framework: "transformers",
    modelType: "Transformer models",
  },
  {
    packages: ["torch", "pytorch"],
    framework: "pytorch",
    modelType: "ML framework",
  },
  {
    packages: ["tensorflow"],
    framework: "tensorflow",
    modelType: "ML framework",
  },
]

const MODEL_PATTERNS = [
  { pattern: /gpt-4\.1|gpt-4o|gpt-4|gpt-3\.5/gi, label: "GPT family" },
  { pattern: /claude(?:-[\w.]+)?/gi, label: "Claude family" },
  { pattern: /gemini(?:-[\w.]+)?/gi, label: "Gemini family" },
  { pattern: /llama(?:-[\w.]+)?/gi, label: "Llama family" },
  { pattern: /mistral(?:-[\w.]+)?/gi, label: "Mistral family" },
]

export type ManifestDiscoveryResult = {
  sourceType: "manifest"
  sourceKind: ScanSourceKind
  packages: string[]
  providers: string[]
  frameworks: string[]
  candidates: DetectedAISystemRecord[]
  findings: ScanFinding[]
  alerts: ComplianceAlert[]
  summary: string[]
}

export function discoverAISystemsFromManifest(input: {
  documentName: string
  content: string
  sourceScanId?: string
  nowISO: string
}): ManifestDiscoveryResult {
  const forceYamlMode = isCompliScanYamlFileName(input.documentName)
  if (forceYamlMode || isYamlFileName(input.documentName)) {
    const yamlDiscovery = discoverAISystemsFromCompliScanYaml(input)
    if (forceYamlMode || yamlDiscovery.config) {
      return buildYamlDiscoveryResult(input, yamlDiscovery)
    }
  }

  const packages = extractPackageNames(input.documentName, input.content)
  const matches = PACKAGE_RULES.filter((rule) =>
    rule.packages.some((pkg) => packages.includes(pkg))
  )

  const providers = [...new Set(matches.map((item) => item.provider).filter(Boolean))] as string[]
  const frameworks = [...new Set(matches.map((item) => item.framework))]
  const purpose = inferPurpose(input.documentName, input.content, frameworks)
  const modelType = inferModelType(input.content, matches)
  const candidates = buildCandidates({
    documentName: input.documentName,
    content: input.content,
    sourceScanId: input.sourceScanId,
    nowISO: input.nowISO,
    purpose,
    providers,
    frameworks,
    modelType,
    packages,
  })
  const manifestSignals = [
    ...packages,
    ...frameworks,
    ...providers.map((provider) => provider.toLowerCase()),
    modelType.toLowerCase(),
  ]
  const compliance = simulateFindings(input.documentName, input.content, input.nowISO, input.sourceScanId, {
    manifestSignals,
  })

  const summary = [
    providers.length > 0
      ? `Provideri detectati: ${providers.join(", ")}`
      : "Nu am detectat un provider clar; exista doar framework-uri sau semnale partiale.",
    frameworks.length > 0
      ? `Framework-uri detectate: ${frameworks.join(", ")}`
      : "Nu am detectat framework-uri AI clare in manifest.",
    candidates.length > 0
      ? `${candidates.length} sistem${candidates.length === 1 ? "" : "e"} propus${candidates.length === 1 ? "" : "e"} pentru review.`
      : "Nicio propunere de sistem AI nu a iesit din manifestul incarcat.",
    compliance.findings.length > 0
      ? `${compliance.findings.length} finding${compliance.findings.length === 1 ? "" : "-uri"} cu mapare legala au fost generate din sursa tehnica.`
      : "Nu au fost detectate inca semnale de compliance suplimentare in manifest.",
  ]

  return {
    sourceType: "manifest",
    sourceKind: "manifest",
    packages,
    providers,
    frameworks,
    candidates,
    findings: compliance.findings,
    alerts: compliance.alerts,
    summary,
  }
}

function buildYamlDiscoveryResult(
  input: {
    documentName: string
    content: string
    sourceScanId?: string
    nowISO: string
  },
  yamlDiscovery: ReturnType<typeof discoverAISystemsFromCompliScanYaml>
): ManifestDiscoveryResult {
  const yamlSignals = buildYamlSignals(yamlDiscovery.config)
  const compliance = simulateFindings(input.documentName, input.content, input.nowISO, input.sourceScanId, {
    manifestSignals: yamlSignals,
  })

  return {
    sourceType: "manifest",
    sourceKind: "yaml",
    packages: [],
    providers: yamlDiscovery.config ? [yamlDiscovery.config.specs.provider] : [],
    frameworks: yamlDiscovery.config ? ["compliscan-yaml"] : [],
    candidates: yamlDiscovery.candidates,
    findings: compliance.findings,
    alerts: compliance.alerts,
    summary: [
      ...yamlDiscovery.summary,
      compliance.findings.length > 0
        ? `${compliance.findings.length} finding${compliance.findings.length === 1 ? "" : "-uri"} generate din configuratia YAML.`
        : "Nu au fost generate findings suplimentare din configuratia YAML.",
      ...yamlDiscovery.warnings,
      ...yamlDiscovery.errors,
    ],
  }
}

function buildYamlSignals(config?: {
  specs: {
    provider: string
    model: string
    capability: string[]
  }
  governance: {
    risk_class: string
    data_residency?: string
    personal_data_processed: boolean
    retention_days?: number
  }
  human_oversight: {
    required: boolean
    review_method?: string
    reviewer_role?: string
    alert_on_failure?: boolean
  }
}) {
  if (!config) return ["compliscan-yaml"]

  return [
    "compliscan-yaml",
    config.specs.provider.toLowerCase(),
    config.specs.model.toLowerCase(),
    config.governance.risk_class.toLowerCase(),
    ...config.specs.capability.map((item) => item.toLowerCase()),
    ...(config.governance.data_residency
      ? [config.governance.data_residency.toLowerCase(), `data_residency=${config.governance.data_residency.toLowerCase()}`]
      : []),
    `personal_data_processed=${String(config.governance.personal_data_processed).toLowerCase()}`,
    ...(typeof config.governance.retention_days === "number"
      ? [`retention_days=${String(config.governance.retention_days)}`]
      : []),
    `human_oversight.required=${String(config.human_oversight.required).toLowerCase()}`,
    ...(typeof config.human_oversight.alert_on_failure === "boolean"
      ? [`alert_on_failure=${String(config.human_oversight.alert_on_failure).toLowerCase()}`]
      : []),
  ]
}

function buildCandidates(input: {
  documentName: string
  content: string
  sourceScanId?: string
  nowISO: string
  purpose: AISystemPurpose
  providers: string[]
  frameworks: string[]
  modelType: string
  packages: string[]
}) {
  const providers = input.providers.length > 0 ? input.providers : ["Necunoscut"]

  return providers.map((provider) => {
    const draft = inferRiskSignals(input.purpose, input.content)
    const confidence = inferConfidence({
      provider,
      frameworks: input.frameworks,
      modelType: input.modelType,
    })

    return buildDetectedAISystemRecord(
      {
        name: buildCandidateName(input.purpose, provider),
        purpose: input.purpose,
        vendor: provider,
        modelType: input.modelType,
        usesPersonalData: draft.usesPersonalData,
        makesAutomatedDecisions: draft.makesAutomatedDecisions,
        impactsRights: draft.impactsRights,
        hasHumanReview: draft.hasHumanReview,
        discoveryMethod: input.frameworks.length > 1 ? "hybrid" : "auto",
        confidence,
        frameworks: input.frameworks,
        evidence: buildEvidenceList(provider, input.packages, input.frameworks),
        sourceScanId: input.sourceScanId,
        sourceDocument: input.documentName,
      },
      input.nowISO
    )
  })
}

function extractPackageNames(documentName: string, content: string) {
  const lowerName = documentName.toLowerCase()
  const packages = new Set<string>()

  if (lowerName.endsWith("package.json") || lowerName.endsWith("package-lock.json")) {
    try {
      const parsed = JSON.parse(content) as {
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
        packages?: Record<string, { version?: string }>
      }
      for (const key of Object.keys(parsed.dependencies ?? {})) packages.add(key)
      for (const key of Object.keys(parsed.devDependencies ?? {})) packages.add(key)
      for (const key of Object.keys(parsed.packages ?? {})) {
        const clean = key.replace(/^node_modules\//, "")
        if (clean) packages.add(clean)
      }
    } catch {
      // Falls back to line parsing below.
    }
  }

  if (lowerName.endsWith("requirements.txt") || lowerName.endsWith("poetry.lock")) {
    for (const line of content.split(/\r?\n/)) {
      const clean = line.trim().replace(/#.*/, "")
      if (!clean) continue
      const match = clean.match(/^([A-Za-z0-9@_.\-/]+)/)
      if (match) packages.add(match[1].toLowerCase())
    }
  }

  if (lowerName.endsWith("pyproject.toml")) {
    for (const match of content.matchAll(/([A-Za-z0-9_.\-/]+)\s*=\s*"[^"]+"/g)) {
      packages.add(match[1].toLowerCase())
    }
  }

  if (lowerName.endsWith("pnpm-lock.yaml") || lowerName.endsWith("yarn.lock")) {
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/@?([A-Za-z0-9_.\-/]+)(?=@|:)/)
      if (match) packages.add(match[1].toLowerCase())
    }
  }

  for (const rule of PACKAGE_RULES) {
    for (const pkg of rule.packages) {
      if (content.toLowerCase().includes(pkg.toLowerCase())) packages.add(pkg.toLowerCase())
    }
  }

  return [...packages]
}

function inferPurpose(documentName: string, content: string, frameworks: string[]): AISystemPurpose {
  const text = `${documentName} ${content} ${frameworks.join(" ")}`.toLowerCase()

  if (includesAny(text, ["resume", "candidate", "cv screening", "recruiting", "workforce"])) {
    return "hr-screening"
  }
  if (includesAny(text, ["credit", "eligibility", "credit scoring", "loan"])) {
    return "credit-scoring"
  }
  if (includesAny(text, ["biometric", "face recognition", "facial", "voiceprint"])) {
    return "biometric-identification"
  }
  if (includesAny(text, ["fraud", "transaction", "aml", "chargeback"])) return "fraud-detection"
  if (includesAny(text, ["marketing", "recommend", "segment", "personalization"])) {
    return "marketing-personalization"
  }
  if (includesAny(text, ["chat", "assistant", "support", "bot"])) return "support-chatbot"
  if (includesAny(text, ["rag", "document", "pdf", "retrieval", "embedding"])) {
    return "document-assistant"
  }
  return "other"
}

function inferRiskSignals(purpose: AISystemPurpose, content: string) {
  const text = content.toLowerCase()
  const usesPersonalData =
    includesAny(text, ["user", "customer", "client", "email", "profile", "message"]) ||
    purpose !== "other"
  const makesAutomatedDecisions = includesAny(text, [
    "score",
    "ranking",
    "decision",
    "eligibility",
    "approve",
    "deny",
  ]) || ["credit-scoring", "hr-screening", "fraud-detection"].includes(purpose)
  const impactsRights = ["credit-scoring", "hr-screening", "biometric-identification"].includes(purpose)
  const hasHumanReview = !makesAutomatedDecisions

  return {
    usesPersonalData,
    makesAutomatedDecisions,
    impactsRights,
    hasHumanReview,
  }
}

function inferModelType(content: string, matches: PackageRule[]) {
  for (const entry of MODEL_PATTERNS) {
    const found = content.match(entry.pattern)
    if (found?.[0]) return found[0]
  }

  return matches.find((rule) => rule.provider)?.modelType || "LLM / ML stack"
}

function inferConfidence(input: {
  provider: string
  frameworks: string[]
  modelType: string
}): "low" | "medium" | "high" {
  if (input.provider !== "Necunoscut" && input.frameworks.length > 0 && input.modelType !== "LLM / ML stack") {
    return "high"
  }
  if (input.provider !== "Necunoscut" || input.frameworks.length > 0) return "medium"
  return "low"
}

function buildCandidateName(purpose: AISystemPurpose, provider: string) {
  const purposeLabel = {
    "hr-screening": "HR screening",
    "credit-scoring": "Credit scoring",
    "biometric-identification": "Biometric ID",
    "fraud-detection": "Fraud detection",
    "marketing-personalization": "Marketing personalization",
    "support-chatbot": "Support assistant",
    "document-assistant": "Document assistant",
    other: "AI workflow",
  }[purpose]

  return `${purposeLabel} · ${provider}`
}

function buildEvidenceList(provider: string, packages: string[], frameworks: string[]) {
  const matchedPackages = packages.filter((pkg) => {
    if (provider === "Necunoscut") return frameworks.includes(pkg)
    return PACKAGE_RULES.some(
      (rule) => rule.provider === provider && rule.packages.includes(pkg)
    )
  })

  return [...new Set([...matchedPackages, ...frameworks])]
}

function includesAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle))
}
