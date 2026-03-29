import type { IntakeQuestion } from "@/lib/compliance/intake-engine"

export type IntakeFlowStep =
  | "intake-core-data"
  | "intake-core-ops"
  | "intake-hr"
  | "intake-gdpr"
  | "intake-ai"
  | "intake-vendors"
  | "intake-site"
  | "review"

type IntakeFlowStepDefinition = {
  id: IntakeFlowStep
  label: string
  questionIds: string[]
}

export const INTAKE_FLOW_STEP_LABELS: Record<IntakeFlowStep, string> = {
  "intake-core-data": "Date și prelucrări",
  "intake-core-ops": "Site, contracte și furnizori",
  "intake-hr": "Confirmări HR",
  "intake-gdpr": "Confirmări GDPR",
  "intake-ai": "Confirmări AI",
  "intake-vendors": "Confirmări furnizori",
  "intake-site": "Confirmări site",
  review: "Revizuire finală",
}

export const INTAKE_CORE_STEP_DEFINITIONS: IntakeFlowStepDefinition[] = [
  {
    id: "intake-core-data",
    label: INTAKE_FLOW_STEP_LABELS["intake-core-data"],
    questionIds: ["sellsToConsumers", "hasEmployees", "processesPersonalData"],
  },
  {
    id: "intake-core-ops",
    label: INTAKE_FLOW_STEP_LABELS["intake-core-ops"],
    questionIds: ["usesExternalVendors", "hasSiteWithForms", "hasStandardContracts"],
  },
]

export const INTAKE_CONDITIONAL_STEP_DEFINITIONS: IntakeFlowStepDefinition[] = [
  {
    id: "intake-hr",
    label: INTAKE_FLOW_STEP_LABELS["intake-hr"],
    questionIds: ["hasJobDescriptions", "hasEmployeeRegistry", "hasInternalProcedures"],
  },
  {
    id: "intake-gdpr",
    label: INTAKE_FLOW_STEP_LABELS["intake-gdpr"],
    questionIds: ["hasPrivacyPolicy", "hasDsarProcess", "hasVendorDpas", "hasRetentionSchedule"],
  },
  {
    id: "intake-ai",
    label: INTAKE_FLOW_STEP_LABELS["intake-ai"],
    questionIds: ["aiUsesConfidentialData", "hasAiPolicy"],
  },
  {
    id: "intake-vendors",
    label: INTAKE_FLOW_STEP_LABELS["intake-vendors"],
    questionIds: ["hasVendorDocumentation", "vendorsSendPersonalData"],
  },
  {
    id: "intake-site",
    label: INTAKE_FLOW_STEP_LABELS["intake-site"],
    questionIds: ["hasSitePrivacyPolicy", "hasCookiesConsent", "collectsLeads"],
  },
]

export function getQuestionIdsForIntakeFlowStep(step: IntakeFlowStep) {
  return (
    INTAKE_CORE_STEP_DEFINITIONS.find((definition) => definition.id === step)?.questionIds ??
    INTAKE_CONDITIONAL_STEP_DEFINITIONS.find((definition) => definition.id === step)?.questionIds ??
    []
  )
}

export function getVisibleConditionalIntakeSteps(
  visibleConditionalQuestions: Pick<IntakeQuestion, "id">[]
): IntakeFlowStep[] {
  const visibleIds = new Set<string>(visibleConditionalQuestions.map((question) => question.id))

  return INTAKE_CONDITIONAL_STEP_DEFINITIONS.filter((definition) =>
    definition.questionIds.some((questionId) => visibleIds.has(questionId))
  ).map((definition) => definition.id)
}
