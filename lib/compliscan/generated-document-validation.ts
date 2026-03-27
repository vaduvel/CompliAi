import type { DocumentType } from "@/lib/server/document-generator"

export type GeneratedDocumentValidationCheck = {
  id: string
  label: string
  help: string
  passed: boolean
}

export type GeneratedDocumentValidationResult = {
  status: "valid" | "invalid"
  summary: string
  checks: GeneratedDocumentValidationCheck[]
}

export type GeneratedDocumentValidationInput = {
  documentType: DocumentType
  title: string
  content: string
  orgName: string
  orgWebsite?: string
  counterpartyName?: string
}

function normalizeHostname(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .toLowerCase()
}

function buildSpecificContextCheck(input: GeneratedDocumentValidationInput) {
  const content = input.content.toLowerCase()

  if (input.documentType === "dpa" && input.counterpartyName?.trim()) {
    const vendor = input.counterpartyName.trim().toLowerCase()
    return {
      id: "specific-context",
      label: "Procesatorul detectat apare în draft",
      help: "DPA-ul trebuie să numească furnizorul sau procesatorul vizat.",
      passed: content.includes(vendor),
    } satisfies GeneratedDocumentValidationCheck
  }

  if (
    (input.documentType === "privacy-policy" || input.documentType === "cookie-policy") &&
    input.orgWebsite?.trim()
  ) {
    const host = normalizeHostname(input.orgWebsite)
    return {
      id: "specific-context",
      label: "Website-ul scanat este ancorat în draft",
      help: "Politica trebuie să vorbească despre site-ul sau domeniul pentru care o folosești.",
      passed: content.includes(host),
    } satisfies GeneratedDocumentValidationCheck
  }

  return null
}

export function validateGeneratedDocumentEvidence(
  input: GeneratedDocumentValidationInput
): GeneratedDocumentValidationResult {
  const normalizedContent = input.content.trim()
  const contentLower = normalizedContent.toLowerCase()
  const titleLower = input.title.trim().toLowerCase()
  const orgLower = input.orgName.trim().toLowerCase()

  const checks: GeneratedDocumentValidationCheck[] = [
    {
      id: "structure",
      label: "Draftul are structură minimă auditabilă",
      help: "Trebuie să aibă titlu clar, heading principal și conținut suficient pentru review.",
      passed:
        normalizedContent.length >= 400 &&
        /^#\s+/m.test(normalizedContent) &&
        contentLower.includes(titleLower),
    },
    {
      id: "dating",
      label: "Draftul are dată și ancoră de revizuire",
      help: "Documentul trebuie să afișeze explicit data generării sau ultima actualizare.",
      passed:
        contentLower.includes("ultima actualizare") ||
        contentLower.includes("data generării") ||
        contentLower.includes("data generarii"),
    },
    {
      id: "org-context",
      label: "Draftul este ancorat în organizația ta",
      help: "Numele firmei trebuie să fie prezent în documentul care va merge la dosar.",
      passed: Boolean(orgLower) && contentLower.includes(orgLower),
    },
    {
      id: "review-warning",
      label: "Draftul păstrează avertismentul de review uman",
      help: "Dovada rămâne validă doar după verificare umană și aprobare explicită.",
      passed:
        contentLower.includes("generat cu ajutorul ai") &&
        contentLower.includes("verifică cu un specialist"),
    },
  ]

  const specificContextCheck = buildSpecificContextCheck(input)
  if (specificContextCheck) {
    checks.push(specificContextCheck)
  }

  const failedChecks = checks.filter((check) => !check.passed)

  return {
    status: failedChecks.length === 0 ? "valid" : "invalid",
    summary:
      failedChecks.length === 0
        ? "Draftul trece verificarea rapidă și poate merge la confirmarea finală."
        : "Draftul nu poate intra încă la dosar. Corectează punctele picate sau regenerează documentul.",
    checks,
  }
}
