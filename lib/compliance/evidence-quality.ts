import type {
  EvidenceQualityAssessment,
  EvidenceQualityReasonCode,
  TaskEvidenceAttachment,
  TaskEvidenceKind,
} from "@/lib/compliance/types"

type AssessEvidenceQualityInput = {
  fileName: string
  mimeType: string
  sizeBytes: number
  kind: TaskEvidenceKind
  uploadedAtISO: string
}

const GENERIC_FILE_NAMES = new Set([
  "evidence",
  "proof",
  "document",
  "document-bundle",
  "screenshot",
  "image",
  "scan",
  "file",
  "untitled",
  "attachment",
])

const MIN_BYTES_BY_KIND: Record<TaskEvidenceKind, number> = {
  screenshot: 24 * 1024,
  policy_text: 512,
  log_export: 256,
  yaml_evidence: 64,
  document_bundle: 1024,
  other: 1024,
}

export function assessEvidenceQuality(
  input: AssessEvidenceQualityInput
): EvidenceQualityAssessment {
  const reasons: EvidenceQualityReasonCode[] = []
  const normalizedMime = input.mimeType.trim().toLowerCase()
  const extension = extractExtension(input.fileName)
  const baseName = input.fileName
    .slice(0, Math.max(0, input.fileName.length - extension.length))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  if (input.kind === "other") {
    reasons.push("generic_kind")
  }

  if (!normalizedMime || normalizedMime === "application/octet-stream") {
    reasons.push("unknown_mime")
  }

  if (GENERIC_FILE_NAMES.has(baseName)) {
    reasons.push("generic_filename")
  }

  const minBytes = MIN_BYTES_BY_KIND[input.kind]
  if (input.sizeBytes < minBytes) {
    reasons.push(input.kind === "document_bundle" ? "tiny_bundle" : "very_small_file")
  }

  if (
    (input.kind === "policy_text" ||
      input.kind === "log_export" ||
      input.kind === "yaml_evidence") &&
    input.sizeBytes < 128
  ) {
    reasons.push("tiny_text_payload")
  }

  const uniqueReasons = [...new Set(reasons)]
  return {
    status: uniqueReasons.length > 0 ? "weak" : "sufficient",
    summary:
      uniqueReasons.length > 0
        ? `Dovada cere review: ${uniqueReasons.map(formatEvidenceQualityReason).join(", ")}.`
        : "Dovada pare suficientă pentru tipul selectat și poate intra în pachetul de audit.",
    reasonCodes: uniqueReasons,
    checkedAtISO: input.uploadedAtISO,
  }
}

export function formatEvidenceQualityReason(reason: EvidenceQualityReasonCode) {
  if (reason === "generic_kind") return "tip generic de dovadă"
  if (reason === "generic_filename") return "nume de fișier prea generic"
  if (reason === "unknown_mime") return "MIME neclar"
  if (reason === "very_small_file") return "fișier foarte mic"
  if (reason === "tiny_text_payload") return "payload text prea mic"
  return "bundle prea mic"
}

export function formatEvidenceQualityStatus(value?: EvidenceQualityAssessment["status"]) {
  if (value === "sufficient") return "suficientă"
  if (value === "weak") return "slabă"
  return "n/a"
}

export function getEvidenceQualitySummary(
  evidence?: Pick<TaskEvidenceAttachment, "quality">
): string | null {
  if (!evidence?.quality) return null
  return evidence.quality.summary
}

function extractExtension(fileName: string) {
  const normalized = fileName.trim()
  const lastDot = normalized.lastIndexOf(".")
  if (lastDot <= 0 || lastDot === normalized.length - 1) {
    return ""
  }

  return normalized.slice(lastDot)
}

// ── D1 — Extended Evidence Quality Rules ────────────────────────────────────

export type EvidenceValidationVerdict = "passed" | "needs_review" | "failed"

export type EvidenceValidationResult = {
  verdict: EvidenceValidationVerdict
  reasons: string[]
  checkedAtISO: string
}

type ValidateEvidenceInput = {
  fileName: string
  mimeType: string
  sizeBytes: number
  kind: TaskEvidenceKind
  uploadedAtISO: string
  /** Expected document type (e.g., "dpa", "privacy-policy") */
  expectedDocumentType?: string
  /** Finding creation date */
  findingCreatedAtISO?: string
  /** Is the finding linked to this evidence? */
  findingLinked?: boolean
}

// Expected MIME types per document type
const EXPECTED_MIMES: Record<string, string[]> = {
  "dpa": ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  "privacy-policy": ["application/pdf", "text/html", "text/plain"],
  "cookie-policy": ["application/pdf", "text/html", "text/plain"],
  "nis2-incident-response": ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  "ai-governance": ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
}

const MS_PER_DAY = 86_400_000
const MAX_EVIDENCE_AGE_DAYS = 365 // evidence older than 1 year relative to finding → needs review

/**
 * D1: Comprehensive evidence validation.
 * Validates: file type match, real size, recency, finding linkage.
 * Returns: passed | needs_review | failed + reasons.
 */
export function validateEvidence(input: ValidateEvidenceInput): EvidenceValidationResult {
  const reasons: string[] = []
  const normalizedMime = input.mimeType.trim().toLowerCase()
  const nowISO = new Date().toISOString()

  // 1. File type matches expected document type
  if (input.expectedDocumentType) {
    const expectedMimes = EXPECTED_MIMES[input.expectedDocumentType]
    if (expectedMimes && !expectedMimes.includes(normalizedMime)) {
      // Images are never acceptable for legal documents
      if (normalizedMime.startsWith("image/")) {
        reasons.push(
          `Tip fișier neacceptat: imagine (${normalizedMime}) pentru ${input.expectedDocumentType}. Se cere PDF sau document.`
        )
      } else {
        reasons.push(
          `Tip fișier neașteptat: ${normalizedMime} pentru ${input.expectedDocumentType}.`
        )
      }
    }
  }

  // 2. Real file size (not empty or suspiciously small)
  if (input.sizeBytes === 0) {
    reasons.push("Fișier gol (0 bytes).")
  } else if (input.sizeBytes < 100) {
    reasons.push(`Fișier suspect de mic (${input.sizeBytes} bytes).`)
  }

  // 3. Document date is recent relative to finding
  if (input.findingCreatedAtISO) {
    const findingDate = new Date(input.findingCreatedAtISO).getTime()
    const uploadDate = new Date(input.uploadedAtISO).getTime()

    if (!isNaN(findingDate) && !isNaN(uploadDate)) {
      // Evidence uploaded before finding was created → suspicious
      if (uploadDate < findingDate - MS_PER_DAY) {
        const daysBefore = Math.floor((findingDate - uploadDate) / MS_PER_DAY)
        reasons.push(
          `Dovada încărcată cu ${daysBefore} zile înainte de identificarea problemei. Verifică relevanța.`
        )
      }

      // Evidence too old (> 1 year from finding)
      if (uploadDate < findingDate - MAX_EVIDENCE_AGE_DAYS * MS_PER_DAY) {
        reasons.push(
          `Dovada are peste ${MAX_EVIDENCE_AGE_DAYS} zile de la crearea finding-ului. Posibil expirată.`
        )
      }
    }
  }

  // 4. Link to finding documented
  if (input.findingLinked === false) {
    reasons.push("Dovada nu este legată de un finding specific. Adaugă referința.")
  }

  // Determine verdict
  let verdict: EvidenceValidationVerdict = "passed"
  if (reasons.length > 0) {
    const hasCritical = reasons.some(
      (r) => r.includes("Fișier gol") || r.includes("neacceptat") || r.includes("expirată")
    )
    verdict = hasCritical ? "failed" : "needs_review"
  }

  return { verdict, reasons, checkedAtISO: nowISO }
}
