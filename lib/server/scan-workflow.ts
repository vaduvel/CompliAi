import { createHash } from "node:crypto"

import {
  appendComplianceEvents,
  createComplianceEvent,
  type ComplianceEventActorInput,
} from "@/lib/compliance/events"
import { normalizeScanRecord, simulateFindings } from "@/lib/compliance/engine"
import { geminiSemanticAnalyze, llmAnalyzeScan } from "@/lib/compliance/llm-scan-analysis"
import type {
  ComplianceState,
  ScanFinding,
  ScanExtractionMethod,
  ScanRecord,
} from "@/lib/compliance/types"
import {
  extractTextFromPdfWithVision,
  extractTextWithVision,
  hasVisionConfig,
} from "@/lib/server/google-vision"
import {
  asTrimmedString,
  ensureBase64Like,
  estimateBase64Size,
  RequestValidationError,
} from "@/lib/server/request-validation"

export type ScanInputPayload = {
  clientId?: string
  documentName?: string
  content?: string
  imageBase64?: string
  pdfBase64?: string
}

export type ExtractionResult = {
  scan: ScanRecord
  ocrUsed: boolean
  ocrWarning: string | null
  extractedTextPreview: string
}

function computeRepeatableRunHash(documentName: string, content: string): string {
  return createHash("sha256").update(`${documentName}\n${content}`).digest("hex").slice(0, 16)
}

const MAX_DOCUMENT_NAME_LENGTH = 180
const MAX_CLIENT_ID_LENGTH = 120
const MAX_MANUAL_CONTENT_LENGTH = 50_000
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_PDF_BYTES = 10 * 1024 * 1024

type MergeFindingsResult = {
  findings: ScanFinding[]
  addedHighRiskCount: number
  addedLowRiskCount: number
}

export function validateScanInputPayload(payload: unknown): ScanInputPayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new RequestValidationError("Payload-ul de scanare trebuie sa fie un obiect JSON valid.")
  }

  const body = payload as Record<string, unknown>
  const documentName = asTrimmedString(body.documentName, MAX_DOCUMENT_NAME_LENGTH)
  const clientId = asTrimmedString(body.clientId, MAX_CLIENT_ID_LENGTH)
  const content = asTrimmedString(body.content, MAX_MANUAL_CONTENT_LENGTH)
  const imageBase64 = asTrimmedString(body.imageBase64, 20_000_000)
  const pdfBase64 = asTrimmedString(body.pdfBase64, 20_000_000)

  if (!content && !imageBase64 && !pdfBase64) {
    throw new RequestValidationError("Adauga text manual sau incarca un fisier inainte de scanare.")
  }

  if (imageBase64 && pdfBase64) {
    throw new RequestValidationError(
      "Trimite ori imagine, ori PDF la acelasi request. Nu ambele simultan."
    )
  }

  if (content && content.length > MAX_MANUAL_CONTENT_LENGTH) {
    throw new RequestValidationError(
      `Textul manual este prea lung. Limita curenta este ${MAX_MANUAL_CONTENT_LENGTH} caractere.`
    )
  }

  if (imageBase64) {
    ensureBase64Like(imageBase64, "Imaginea incarcata nu are format base64 valid.")
    if (estimateBase64Size(imageBase64) > MAX_IMAGE_BYTES) {
      throw new RequestValidationError("Imaginea este prea mare. Limita curenta este 10 MB.")
    }
  }

  if (pdfBase64) {
    ensureBase64Like(pdfBase64, "PDF-ul incarcat nu are format base64 valid.")
    if (estimateBase64Size(pdfBase64) > MAX_PDF_BYTES) {
      throw new RequestValidationError("PDF-ul este prea mare. Limita curenta este 10 MB.")
    }
  }

  return {
    clientId,
    documentName,
    content,
    imageBase64,
    pdfBase64,
  }
}

async function extractScanText(body: ScanInputPayload) {
  const documentName = body.documentName?.trim() || "Document fără nume"
  const manualContent = body.content?.trim() || ""
  const imageBase64 = body.imageBase64?.trim()
  const pdfBase64 = body.pdfBase64?.trim()
  let finalContent = manualContent
  let ocrUsed = false
  let ocrWarning: string | null = null
  let extractionMethod: ScanExtractionMethod = "manual"

  if (!manualContent && !imageBase64 && !pdfBase64) {
    throw new Error("Adauga text manual sau incarca un fisier inainte de scanare.")
  }

  if (imageBase64 || pdfBase64) {
    extractionMethod = pdfBase64 ? "ocr-vision-pdf" : "ocr-vision-image"
    if (hasVisionConfig()) {
      try {
        const ocrText = pdfBase64
          ? await extractTextFromPdfWithVision(pdfBase64)
          : await extractTextWithVision(imageBase64 as string)
        if (ocrText.trim()) {
          finalContent = ocrText
          ocrUsed = true
        } else {
          ocrWarning = "OCR nu a extras text din fișierul încărcat."
        }
      } catch (error) {
        ocrWarning =
          error instanceof Error ? error.message : "OCR indisponibil pentru acest fișier."
      }
    } else {
      ocrWarning =
        "Lipsește GOOGLE_CLOUD_VISION_API_KEY. OCR cloud (imagine/PDF) este dezactivat momentan."
    }
  }

  if (!finalContent.trim()) {
    const error = new Error(
      "Nu am extras continut util din fisier. Revizuieste OCR-ul sau adauga text manual inainte de analiza."
    ) as Error & { ocrWarning?: string | null }
    error.ocrWarning = ocrWarning
    throw error
  }

  return {
    clientId: body.clientId?.trim(),
    documentName,
    finalContent,
    extractionMethod,
    ocrUsed,
    ocrWarning,
  }
}

export async function createExtractedScan(
  current: ComplianceState,
  body: ScanInputPayload,
  actor?: ComplianceEventActorInput
): Promise<{ nextState: ComplianceState; result: ExtractionResult }> {
  const nowISO = new Date().toISOString()
  const extracted = await extractScanText(body)
  const duplicate = extracted.clientId
    ? current.scans.find((scan) => scan.clientId === extracted.clientId)
    : undefined

  if (duplicate) {
    return {
      nextState: current,
      result: {
        scan: normalizeScanRecord(duplicate),
        ocrUsed: extracted.ocrUsed,
        ocrWarning: extracted.ocrWarning,
        extractedTextPreview:
          duplicate.contentExtracted || duplicate.contentPreview || extracted.finalContent.slice(0, 800),
      },
    }
  }

  const scan = normalizeScanRecord({
    id: `scan-${Math.random().toString(36).slice(2, 10)}`,
    clientId: extracted.clientId,
    documentName: extracted.documentName,
    contentPreview: extracted.finalContent.slice(0, 220),
    contentExtracted: extracted.finalContent.slice(0, 4000),
    createdAtISO: nowISO,
    findingsCount: 0,
    sourceKind: "document",
    extractionMethod: extracted.extractionMethod,
    extractionStatus: extracted.ocrUsed ? "needs_review" : "completed",
    analysisStatus: "pending",
    reviewRequired: extracted.ocrUsed,
    repeatableRunHash: computeRepeatableRunHash(extracted.documentName, extracted.finalContent),
    baselineSnapshotId: current.validatedBaselineSnapshotId,
  })

  const nextState = {
    ...current,
    scans: [scan, ...current.scans].slice(0, 100),
    events: appendComplianceEvents(current, [
      createComplianceEvent({
        type: "scan.created",
        entityType: "scan",
        entityId: scan.id,
        message: `Scan nou creat pentru ${scan.documentName}.`,
        createdAtISO: nowISO,
        metadata: {
          extractionMethod: scan.extractionMethod ?? "manual",
          reviewRequired: scan.reviewRequired ?? false,
        },
      }, actor),
    ]),
  }

  return {
    nextState,
    result: {
      scan,
      ocrUsed: extracted.ocrUsed,
      ocrWarning: extracted.ocrWarning,
      extractedTextPreview: extracted.finalContent.slice(0, 800),
    },
  }
}

export async function analyzeExtractedScan(
  current: ComplianceState,
  scanId: string,
  reviewText: string | undefined,
  actor?: ComplianceEventActorInput
) {
  const nowISO = new Date().toISOString()
  const scan = current.scans.find((item) => item.id === scanId)

  if (!scan) {
    throw new Error("SCAN_NOT_FOUND")
  }

  if (scan.analysisStatus === "completed") {
    throw new Error("SCAN_ALREADY_ANALYZED")
  }

  const finalContent =
    reviewText?.trim() || scan.contentExtracted?.trim() || scan.contentPreview.trim()

  if (!finalContent) {
    throw new Error("SCAN_EMPTY_CONTENT")
  }

  // B1: Gemini semantic analysis is PRIMARY
  const geminiResult = await geminiSemanticAnalyze({
    documentName: scan.documentName,
    content: finalContent,
    nowISO,
    scanId: scan.id,
  })

  // Keyword matching as FALLBACK/COMPLEMENT
  const keywordResult = simulateFindings(scan.documentName, finalContent, nowISO, scan.id)

  // Collect all rule IDs already found by Gemini + keyword
  const allRuleIds = new Set([
    ...geminiResult.findings.map((f) => f.provenance?.ruleId ?? "").filter(Boolean),
    ...keywordResult.findings.map((f) => f.provenance?.ruleId ?? "").filter(Boolean),
  ])

  // Legacy LLM supplement — catches rule-library matches both engines missed
  const llmResult = await llmAnalyzeScan({
    documentName: scan.documentName,
    content: finalContent,
    nowISO,
    scanId: scan.id,
    existingRuleIds: allRuleIds,
  })

  // Merge: Gemini (primary) → keyword (complement) → legacy LLM (supplement)
  // Deduplicate within the batch on (title, sourceDocument) before persisting
  const rawFindings = [...geminiResult.findings, ...keywordResult.findings, ...llmResult.findings]
  const seenFindingKeys = new Set<string>()
  const dedupedFindings = rawFindings.filter((f) => {
    const key = `${f.title.toLowerCase().trim()}__${(f.sourceDocument ?? "").toLowerCase().trim()}`
    if (seenFindingKeys.has(key)) return false
    seenFindingKeys.add(key)
    return true
  })

  const rawAlerts = keywordResult.alerts
  const seenAlertKeys = new Set<string>()
  const dedupedAlerts = rawAlerts.filter((a) => {
    const key = `${a.message.toLowerCase().trim()}__${a.scanId ?? ""}`
    if (seenAlertKeys.has(key)) return false
    seenAlertKeys.add(key)
    return true
  })

  const result = {
    findings: dedupedFindings,
    alerts: dedupedAlerts,
    highRiskDelta: keywordResult.highRiskDelta,
    lowRiskDelta: keywordResult.lowRiskDelta,
  }
  const events = [
    createComplianceEvent({
      type: "scan.analyzed",
      entityType: "scan",
      entityId: scan.id,
      message: `Scan analizat pentru ${scan.documentName}.`,
      createdAtISO: nowISO,
      metadata: {
        findingsCount: result.findings.length,
        alertsCount: result.alerts.length,
      },
    }, actor),
    ...result.findings.map((finding) =>
      createComplianceEvent({
        type: "finding.generated",
        entityType: "finding",
        entityId: finding.id,
        message: finding.title,
        createdAtISO: nowISO,
        metadata: {
          category: finding.category,
          severity: finding.severity,
          risk: finding.risk,
          ruleId: finding.provenance?.ruleId || "n/a",
        },
      }, actor)
    ),
    ...result.alerts.map((alert) =>
      createComplianceEvent({
        type: "alert.created",
        entityType: "alert",
        entityId: alert.id,
        message: alert.message,
        createdAtISO: nowISO,
        metadata: {
          severity: alert.severity,
          scanId,
        },
      }, actor)
    ),
  ]

  const mergedFindings = mergeFindingsDeduplicated(current.findings, result.findings)

  return {
    ...current,
    scannedDocuments: current.scannedDocuments + 1,
    highRisk: current.highRisk + mergedFindings.addedHighRiskCount,
    lowRisk: current.lowRisk + mergedFindings.addedLowRiskCount,
    findings: mergedFindings.findings.slice(0, 100),
    alerts: [...result.alerts, ...current.alerts].slice(0, 100),
    scans: current.scans.map((item) =>
      item.id === scan.id
        ? normalizeScanRecord({
            ...item,
            contentPreview: finalContent.slice(0, 220),
            contentExtracted: finalContent.slice(0, 4000),
            findingsCount: result.findings.length,
            extractionStatus: "completed",
            analysisStatus: "completed",
            analyzedAtISO: nowISO,
            reviewRequired: false,
          })
        : item
    ),
    events: appendComplianceEvents(current, events),
  }
}

export function mergeFindingsDeduplicated(
  existingFindings: ScanFinding[],
  incomingFindings: ScanFinding[]
): MergeFindingsResult {
  const existingByFingerprint = new Map(existingFindings.map((finding) => [findingFingerprint(finding), finding]))
  const consumedExisting = new Set<string>()
  const mergedIncoming: ScanFinding[] = []
  let addedHighRiskCount = 0
  let addedLowRiskCount = 0

  for (const incoming of incomingFindings) {
    const fingerprint = findingFingerprint(incoming)
    const existing = existingByFingerprint.get(fingerprint) ?? findSemanticGeminiDuplicate(existingFindings, incoming, consumedExisting)

    if (existing) {
      consumedExisting.add(existing.id)
      mergedIncoming.push({
        ...existing,
        ...incoming,
        id: existing.id,
        severity: pickMoreSevereSeverity(existing.severity, incoming.severity),
        risk: pickMoreSevereRisk(existing.risk, incoming.risk),
        findingStatus: existing.findingStatus ?? incoming.findingStatus,
        findingStatusUpdatedAtISO: existing.findingStatusUpdatedAtISO ?? incoming.findingStatusUpdatedAtISO,
      })
      continue
    }

    mergedIncoming.push(incoming)
    if (incoming.category === "EU_AI_ACT" && incoming.risk === "high") {
      addedHighRiskCount += 1
    } else if (incoming.risk === "low") {
      addedLowRiskCount += 1
    }
  }

  const untouchedExisting = existingFindings.filter((finding) => !consumedExisting.has(finding.id))

  return {
    findings: [...mergedIncoming, ...untouchedExisting],
    addedHighRiskCount,
    addedLowRiskCount,
  }
}

function findingFingerprint(finding: ScanFinding) {
  const ruleId = normalizeStableRuleId(finding.provenance?.ruleId)
  const title = normalizeFingerprintPart(finding.title)
  const category = normalizeFingerprintPart(finding.category)
  const legalReference = normalizeFingerprintPart(finding.legalReference)
  const textAnchor = normalizeFingerprintPart(normalizeFindingTextAnchor(finding))

  return [category, ruleId || legalReference || title, textAnchor || title].join("::")
}

function normalizeFingerprintPart(value: string | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeStableRuleId(ruleId: string | undefined) {
  const normalized = normalizeFingerprintPart(ruleId)
  return normalized.startsWith("gemini-") ? "" : normalized
}

function findSemanticGeminiDuplicate(
  existingFindings: ScanFinding[],
  incoming: ScanFinding,
  consumedExisting: Set<string>
) {
  if (!isGeminiSemanticFinding(incoming)) {
    return undefined
  }

  const incomingAnchor = normalizeFingerprintPart(normalizeFindingTextAnchor(incoming))
  const incomingDocumentType = normalizeFingerprintPart(incoming.suggestedDocumentType)
  const incomingSemanticTokens = semanticTitleTokens(incoming.title)

  if (!incomingAnchor || incomingSemanticTokens.size === 0) {
    return undefined
  }

  for (const existing of existingFindings) {
    if (consumedExisting.has(existing.id) || !isGeminiSemanticFinding(existing)) {
      continue
    }

    if (normalizeFingerprintPart(existing.category) !== normalizeFingerprintPart(incoming.category)) {
      continue
    }

    const existingAnchor = normalizeFingerprintPart(normalizeFindingTextAnchor(existing))
    const existingDocumentType = normalizeFingerprintPart(existing.suggestedDocumentType)
    if (incomingDocumentType && existingDocumentType && incomingDocumentType !== existingDocumentType) {
      continue
    }

    const similarity = semanticTokenSimilarity(incomingSemanticTokens, semanticTitleTokens(existing.title))
    const sameAnchor = Boolean(existingAnchor && existingAnchor === incomingAnchor)
    const sameLegalReference =
      Boolean(incoming.legalReference) &&
      normalizeFingerprintPart(existing.legalReference) === normalizeFingerprintPart(incoming.legalReference)

    if ((sameAnchor && similarity >= 0.4) || (sameLegalReference && similarity >= 0.6)) {
      return existing
    }
  }

  return undefined
}

function isGeminiSemanticFinding(finding: ScanFinding) {
  const ruleId = normalizeFingerprintPart(finding.provenance?.ruleId)
  return ruleId.startsWith("gemini-")
}

function semanticTitleTokens(value: string | undefined) {
  const normalized = normalizeFingerprintPart(stripRomanianDiacritics(value))
  const tokens = normalized
    .split(/[^a-z0-9]+/)
    .map((token) => normalizeSemanticToken(token))
    .filter((token) => token.length >= 4 && !SEMANTIC_STOPWORDS.has(token))

  return new Set(tokens)
}

function semanticTokenSimilarity(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) {
    return 0
  }

  let overlap = 0
  for (const token of a) {
    if (b.has(token)) {
      overlap += 1
    }
  }

  return overlap / Math.min(a.size, b.size)
}

function normalizeSemanticToken(token: string) {
  return token
    .replace(/(urile|ilor|elor|ului|ul|ele|ile|ii|ei|ea|ie|ia|a|e|i|u)$/g, "")
    .slice(0, 8)
}

function stripRomanianDiacritics(value: string | undefined) {
  return (value ?? "")
    .replace(/[ăâ]/g, "a")
    .replace(/î/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
}

const SEMANTIC_STOPWORDS = new Set([
  "lips",
  "priv",
  "sist",
  "date",
  "ceea",
  "pentru",
  "care",
  "este",
  "unei",
  "unui",
  "prin",
  "privi",
  "deta",
])

function normalizeFindingTextAnchor(finding: ScanFinding) {
  const rawAnchor = finding.sourceParagraph ?? finding.provenance?.excerpt ?? finding.detail ?? ""
  const documentName = finding.sourceDocument?.trim()

  const withoutDocumentName = documentName && rawAnchor.startsWith(documentName)
    ? rawAnchor.slice(documentName.length)
    : rawAnchor

  return withoutDocumentName.replace(/^[\s:/-]+/, "").trim()
}

const FINDING_SEVERITY_ORDER = ["low", "medium", "high", "critical"] as const
const FINDING_RISK_ORDER = ["low", "high"] as const

function pickMoreSevereSeverity(current: ScanFinding["severity"], incoming: ScanFinding["severity"]) {
  return pickHigherRank(current, incoming, FINDING_SEVERITY_ORDER)
}

function pickMoreSevereRisk(current: ScanFinding["risk"], incoming: ScanFinding["risk"]) {
  return pickHigherRank(current, incoming, FINDING_RISK_ORDER)
}

function pickHigherRank<T extends string>(current: T, incoming: T, order: readonly T[]) {
  const currentRank = order.indexOf(current)
  const incomingRank = order.indexOf(incoming)

  if (incomingRank === -1) {
    return current
  }

  if (currentRank === -1 || incomingRank > currentRank) {
    return incoming
  }

  return current
}
