import type { AISystemRiskLevel } from "@/lib/compliance/types"

export type CompliScanYamlDocument = {
  version: string
  system_id: string
  name: string
  specs: {
    provider: string
    model: string
    capability: string[]
    temperature_limit?: number
    filters_enabled?: boolean
  }
  governance: {
    risk_class: AISystemRiskLevel
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
  mapping: {
    regulations: string[]
    articles: string[]
  }
}

export type CompliScanYamlParseResult =
  | {
      ok: true
      config: CompliScanYamlDocument
      warnings: string[]
    }
  | {
      ok: false
      errors: string[]
      warnings: string[]
    }

export const COMPLISCAN_YAML_REQUIRED_ROOT_KEYS = ["version", "system_id", "name"] as const
export const COMPLISCAN_YAML_REQUIRED_SECTIONS = [
  "specs",
  "governance",
  "human_oversight",
  "mapping",
] as const
