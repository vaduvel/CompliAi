import {
  appendComplianceEvents,
  createComplianceEvent,
  type ComplianceEventActorInput,
} from "@/lib/compliance/events"
import { normalizeScanRecord, simulateFindings } from "@/lib/compliance/engine"
import { geminiSemanticAnalyze, llmAnalyzeScan } from "@/lib/compliance/llm-scan-analysis"
import type {
  ComplianceState,
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

const MAX_DOCUMENT_NAME_LENGTH = 180
const MAX_CLIENT_ID_LENGTH = 120
const MAX_MANUAL_CONTENT_LENGTH = 50_000
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_PDF_BYTES = 10 * 1024 * 1024

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
  const result = {
    findings: [...geminiResult.findings, ...keywordResult.findings, ...llmResult.findings],
    alerts: keywordResult.alerts,
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

  return {
    ...current,
    scannedDocuments: current.scannedDocuments + 1,
    highRisk: current.highRisk + result.highRiskDelta,
    lowRisk: current.lowRisk + result.lowRiskDelta,
    findings: [...result.findings, ...current.findings].slice(0, 100),
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
