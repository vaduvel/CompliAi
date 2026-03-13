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
