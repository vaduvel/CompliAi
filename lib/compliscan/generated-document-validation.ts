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

function normalizeLooseText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(si|de|a|al|ale|la|cu|din)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function hasAuditTitleAnchor(content: string, title: string) {
  const normalizedTitle = normalizeLooseText(title)
  if (!normalizedTitle) return false

  const normalizedContent = normalizeLooseText(content)
  if (normalizedContent.includes(normalizedTitle)) {
    return true
  }

  const firstHeading = content.match(/^#\s+(.+)$/m)?.[1] ?? ""
  const normalizedHeading = normalizeLooseText(firstHeading)
  if (!normalizedHeading) return false

  const titleTokens = normalizedTitle
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 4)

  return titleTokens.length > 0 && titleTokens.every((token) => normalizedHeading.includes(token))
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

// ── GDPR Art. 13/14 Privacy Policy Completeness ─────────────────────────────

type GdprRequirement = {
  id: string
  label: string
  help: string
  keywords: string[]
}

const GDPR_PRIVACY_REQUIREMENTS: GdprRequirement[] = [
  {
    id: "gdpr-identity",
    label: "Art. 13(1)(a) — Identitatea operatorului",
    help: "Politica trebuie să conțină identitatea și datele de contact ale operatorului de date.",
    keywords: ["operator", "titular", "date de contact", "sediu"],
  },
  {
    id: "gdpr-dpo",
    label: "Art. 13(1)(b) — Contact DPO / responsabil",
    help: "Trebuie indicat DPO-ul sau persoana responsabilă de protecția datelor.",
    keywords: ["responsabil", "dpo", "protecția datelor", "protectia datelor"],
  },
  {
    id: "gdpr-purposes",
    label: "Art. 13(1)(c) — Scopurile prelucrării",
    help: "Trebuie enumerate scopurile pentru care sunt prelucrate datele personale.",
    keywords: ["scop", "prelucrare", "procesare", "colectare"],
  },
  {
    id: "gdpr-legal-basis",
    label: "Art. 13(1)(c) — Temeiul juridic",
    help: "Trebuie specificat temeiul legal al prelucrării (consimțământ, contract, interes legitim etc.).",
    keywords: ["temei", "baza legala", "bază legală", "consimtamant", "consimțământ", "interes legitim", "obligatie legala"],
  },
  {
    id: "gdpr-recipients",
    label: "Art. 13(1)(e) — Destinatari / categorii de destinatari",
    help: "Trebuie menționați destinatarii sau categoriile de destinatari ai datelor.",
    keywords: ["destinatar", "impartasire", "împărtășire", "partener", "furnizor", "tert", "terț"],
  },
  {
    id: "gdpr-retention",
    label: "Art. 13(2)(a) — Perioada de stocare",
    help: "Trebuie precizată perioada de stocare sau criteriile folosite pentru stabilirea ei.",
    keywords: ["stocare", "retentie", "retenție", "pastrare", "păstrare", "durata", "perioada"],
  },
  {
    id: "gdpr-rights",
    label: "Art. 13(2)(b) — Drepturile persoanei vizate",
    help: "Trebuie enumerate drepturile: acces, rectificare, ștergere, portabilitate, opoziție.",
    keywords: ["drept", "acces", "rectificare", "stergere", "ștergere", "portabilitate", "opozitie", "opoziție"],
  },
  {
    id: "gdpr-withdraw",
    label: "Art. 13(2)(c) — Retragere consimțământ",
    help: "Dacă prelucrarea se bazează pe consimțământ, trebuie menționat dreptul de retragere.",
    keywords: ["retragere", "revocare", "retrage consimtamant", "retrage consimțământ"],
  },
  {
    id: "gdpr-complaint",
    label: "Art. 13(2)(d) — Plângere la autoritatea de supraveghere",
    help: "Trebuie menționat dreptul de a depune plângere la ANSPDCP.",
    keywords: ["plangere", "plângere", "anspdcp", "autoritate", "supraveghere"],
  },
  {
    id: "gdpr-transfers",
    label: "Art. 13(1)(f) — Transferuri internaționale",
    help: "Dacă există transferuri în afara SEE, trebuie menționate garanțiile adecvate.",
    keywords: ["transfer", "international", "internațional", "see", "eea", "tara terta", "țară terță", "garantii adecvate"],
  },
]

function checkPrivacyPolicyCompleteness(contentLower: string): GeneratedDocumentValidationCheck[] {
  return GDPR_PRIVACY_REQUIREMENTS.map((req) => ({
    id: req.id,
    label: req.label,
    help: req.help,
    passed: req.keywords.some((kw) => contentLower.includes(kw)),
  }))
}

export function validateGeneratedDocumentEvidence(
  input: GeneratedDocumentValidationInput
): GeneratedDocumentValidationResult {
  const normalizedContent = input.content.trim()
  const contentLower = normalizedContent.toLowerCase()
  const orgLower = input.orgName.trim().toLowerCase()

  const checks: GeneratedDocumentValidationCheck[] = [
    {
      id: "structure",
      label: "Draftul are structură minimă auditabilă",
      help: "Trebuie să aibă titlu clar, heading principal și conținut suficient pentru review.",
      passed:
        normalizedContent.length >= 400 &&
        /^#\s+/m.test(normalizedContent) &&
        hasAuditTitleAnchor(normalizedContent, input.title),
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
        (contentLower.includes("generat cu ajutorul ai") &&
          contentLower.includes("verifică cu un specialist")) ||
        (contentLower.includes("draft") &&
          (contentLower.includes("validarea consultantului") ||
            contentLower.includes("validare înainte de utilizare oficială"))),
    },
  ]

  const specificContextCheck = buildSpecificContextCheck(input)
  if (specificContextCheck) {
    checks.push(specificContextCheck)
  }

  // GDPR Art. 13/14 completeness check for privacy policies
  if (input.documentType === "privacy-policy") {
    const gdprChecks = checkPrivacyPolicyCompleteness(contentLower)
    checks.push(...gdprChecks)
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
