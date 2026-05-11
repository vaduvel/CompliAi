// Saga upload endpoint — primește fișiere XML Saga native, le parsează cu
// parserul dedicat (Antet/Detalii/Sumar) și produce findings + statistică.
//
// POST acceptă fie:
//   - multipart/form-data cu un fișier ZIP (mai multe XML-uri Saga)
//   - JSON cu { files: [{xml, fileName}] } pentru un singur XML sau câteva
//
// Fiecare XML detectat ca Saga native este parsat + validat. Restul XML-urilor
// (UBL CIUS-RO sau SAF-T) sunt redirecționate la endpoint-urile existente
// (validate/saft-upload). Așa că un singur upload poate conține mix.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import {
  isSagaInvoiceXml,
  parseSagaInvoice,
  validateSagaInvoice,
  type SagaParserResult,
  type SagaValidationFinding,
} from "@/lib/integrations/saga-xml-parser"
import { detectSagaExport } from "@/lib/integrations/saga-format-detect"
import JSZip from "jszip"

const WRITE_ROLES = ["owner", "partner_manager", "compliance"] as const

const MAX_FILES = 200
const MAX_TOTAL_BYTES = 50 * 1024 * 1024  // 50 MB

type FilePayload = { fileName: string; xml: string }

type SagaResultPerFile = {
  fileName: string
  detectedAs: string
  ok: boolean
  parserErrors: string[]
  parserWarnings: string[]
  validationFindings: SagaValidationFinding[]
  invoice: {
    number: string
    date: string
    supplierName: string
    supplierCif: string
    customerName: string
    customerCif: string
    grandTotal: number
    efacturaSubmitted: boolean
  } | null
}

type SagaUploadSummary = {
  totalFiles: number
  sagaNativeCount: number
  ublCount: number
  saftCount: number
  unknownCount: number
  validInvoices: number
  invalidInvoices: number
  totalErrors: number
  totalWarnings: number
  results: SagaResultPerFile[]
  durationMs: number
}

function processSagaFile(file: FilePayload): SagaResultPerFile {
  const detection = detectSagaExport(file.fileName, file.xml)

  if (detection.type !== "saga_native_invoice") {
    return {
      fileName: file.fileName,
      detectedAs: detection.type,
      ok: false,
      parserErrors: [
        `Tip detectat: ${detection.type}. Trimite la endpoint-ul corect — ${detection.hint ?? ""}`,
      ],
      parserWarnings: [],
      validationFindings: [],
      invoice: null,
    }
  }

  const parsed: SagaParserResult = parseSagaInvoice(file.xml, file.fileName)
  if (!parsed.ok) {
    return {
      fileName: file.fileName,
      detectedAs: "saga_native_invoice",
      ok: false,
      parserErrors: parsed.errors,
      parserWarnings: parsed.warnings,
      validationFindings: [],
      invoice: null,
    }
  }

  const validationFindings = validateSagaInvoice(parsed.invoice)

  return {
    fileName: file.fileName,
    detectedAs: "saga_native_invoice",
    ok: validationFindings.filter((f) => f.severity === "error").length === 0,
    parserErrors: [],
    parserWarnings: parsed.warnings,
    validationFindings,
    invoice: {
      number: parsed.invoice.number,
      date: parsed.invoice.date,
      supplierName: parsed.invoice.supplier.name,
      supplierCif: parsed.invoice.supplier.cif,
      customerName: parsed.invoice.customer.name,
      customerCif: parsed.invoice.customer.cif,
      grandTotal: parsed.invoice.grandTotal,
      efacturaSubmitted: !!parsed.invoice.efacturaSpvIndex,
    },
  }
}

async function unzipXmlFiles(zipBuffer: ArrayBuffer): Promise<FilePayload[]> {
  const zip = await JSZip.loadAsync(zipBuffer)
  const out: FilePayload[] = []
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue
    if (entry.name.startsWith("__MACOSX/") || entry.name.includes("/.")) continue
    if (!/\.xml$/i.test(entry.name)) continue
    if (out.length >= MAX_FILES) break
    const xml = await entry.async("string")
    out.push({ fileName: entry.name, xml })
  }
  return out
}

function summarize(results: SagaResultPerFile[], durationMs: number): SagaUploadSummary {
  const sagaNativeCount = results.filter((r) => r.detectedAs === "saga_native_invoice").length
  const ublCount = results.filter(
    (r) => r.detectedAs === "ubl_generic" || r.detectedAs === "saga_efactura_ubl",
  ).length
  const saftCount = results.filter(
    (r) => r.detectedAs === "saft_generic" || r.detectedAs === "saga_saft_d406",
  ).length
  const unknownCount = results.length - sagaNativeCount - ublCount - saftCount
  const validInvoices = results.filter((r) => r.ok && r.detectedAs === "saga_native_invoice").length
  const invalidInvoices = results.filter(
    (r) => !r.ok && r.detectedAs === "saga_native_invoice",
  ).length
  const totalErrors = results.reduce((s, r) => s + r.parserErrors.length, 0)
  const totalWarnings = results.reduce((s, r) => s + r.parserWarnings.length, 0)

  return {
    totalFiles: results.length,
    sagaNativeCount,
    ublCount,
    saftCount,
    unknownCount,
    validInvoices,
    invalidInvoices,
    totalErrors,
    totalWarnings,
    results,
    durationMs,
  }
}

export async function POST(request: Request) {
  requireRole(request, [...WRITE_ROLES], "upload Saga XML")

  const start = Date.now()
  const contentType = request.headers.get("content-type") ?? ""
  let files: FilePayload[] = []

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const file = formData.get("file")
      if (!(file instanceof File)) {
        return jsonError("Lipsește fișierul.", 400, "SAGA_NO_FILE")
      }
      if (file.size > MAX_TOTAL_BYTES) {
        return jsonError(
          `Fișier prea mare (>${MAX_TOTAL_BYTES / 1024 / 1024} MB).`,
          413,
          "SAGA_TOO_LARGE",
        )
      }
      const buf = await file.arrayBuffer()

      if (/\.zip$/i.test(file.name)) {
        files = await unzipXmlFiles(buf)
      } else if (/\.xml$/i.test(file.name)) {
        const xml = new TextDecoder("utf-8").decode(buf)
        files = [{ fileName: file.name, xml }]
      } else {
        return jsonError(
          "Doar XML și ZIP. Pentru DBF, exportă din Saga ca XML.",
          400,
          "SAGA_INVALID_FILE_TYPE",
        )
      }
    } else if (contentType.includes("application/json")) {
      const body = (await request.json()) as { files?: FilePayload[] }
      if (!Array.isArray(body.files) || body.files.length === 0) {
        return jsonError("Body invalid: așteptăm { files: [{xml, fileName}] }.", 400, "SAGA_INVALID_BODY")
      }
      files = body.files.slice(0, MAX_FILES)
    } else {
      return jsonError(
        "Content-Type invalid. Folosește multipart/form-data (ZIP/XML) sau application/json.",
        400,
        "SAGA_INVALID_CT",
      )
    }
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Eroare la citirea fișierului.",
      400,
      "SAGA_READ_ERROR",
    )
  }

  if (files.length === 0) {
    return jsonError("Niciun XML găsit în upload.", 400, "SAGA_NO_XML")
  }

  const results = files.map(processSagaFile)
  const summary = summarize(results, Date.now() - start)

  return NextResponse.json({ ok: true, summary })
}
