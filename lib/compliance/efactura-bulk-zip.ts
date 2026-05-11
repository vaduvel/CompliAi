// GAP #6 (Sprint 5) — Bulk ZIP parser pentru e-Factura.
//
// Acceptă ZIP cu multiple XML-uri, extrage și validează în paralel folosind
// validateEFacturaXml() existent. Util pentru contabili cu 50+ facturi/lună.

import JSZip from "jszip"

import type { EFacturaValidationRecord } from "@/lib/compliance/types"
import { validateEFacturaXml } from "@/lib/compliance/efactura-validator"

export type BulkValidationResult = {
  fileName: string
  valid: boolean
  validation: EFacturaValidationRecord | null
  error: string | null
}

export type BulkValidationSummary = {
  totalFiles: number
  xmlFiles: number
  skippedFiles: number
  validCount: number
  invalidCount: number
  errorCount: number
  results: BulkValidationResult[]
  durationMs: number
}

const MAX_FILES_PER_ZIP = 200
const MAX_INDIVIDUAL_FILE_BYTES = 5 * 1024 * 1024 // 5 MB per XML

function isXmlEntry(name: string): boolean {
  if (!name) return false
  if (name.startsWith("__MACOSX/") || name.includes("/.")) return false
  return /\.xml$/i.test(name)
}

export async function processEFacturaZip(
  zipBuffer: ArrayBuffer | Uint8Array | Buffer,
  nowISO: string,
): Promise<BulkValidationSummary> {
  const start = Date.now()
  const zip = await JSZip.loadAsync(zipBuffer)

  const allEntries = Object.values(zip.files).filter((f) => !f.dir)
  const xmlEntries = allEntries.filter((f) => isXmlEntry(f.name)).slice(0, MAX_FILES_PER_ZIP)
  const skipped = allEntries.length - xmlEntries.length

  const results = await Promise.all(
    xmlEntries.map(async (entry): Promise<BulkValidationResult> => {
      try {
        const xml = await entry.async("string")
        if (xml.length > MAX_INDIVIDUAL_FILE_BYTES) {
          return {
            fileName: entry.name,
            valid: false,
            validation: null,
            error: `Fișier prea mare (>${MAX_INDIVIDUAL_FILE_BYTES / 1024 / 1024}MB).`,
          }
        }

        const validation = validateEFacturaXml({
          documentName: entry.name,
          xml,
          nowISO,
        })

        return {
          fileName: entry.name,
          valid: validation.valid,
          validation,
          error: null,
        }
      } catch (err) {
        return {
          fileName: entry.name,
          valid: false,
          validation: null,
          error: err instanceof Error ? err.message : "Eroare la procesarea XML.",
        }
      }
    }),
  )

  const validCount = results.filter((r) => r.valid).length
  const invalidCount = results.filter((r) => !r.valid && !r.error).length
  const errorCount = results.filter((r) => r.error !== null).length

  return {
    totalFiles: allEntries.length,
    xmlFiles: xmlEntries.length,
    skippedFiles: skipped,
    validCount,
    invalidCount,
    errorCount,
    results,
    durationMs: Date.now() - start,
  }
}
