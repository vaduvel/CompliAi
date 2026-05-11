// GAP #6 (Sprint 5) — e-Factura bulk ZIP upload endpoint.
//
// Acceptă multipart/form-data cu un fișier ZIP, extrage XML-urile,
// rulează validatorul UBL CIUS-RO pe fiecare în paralel, returnează
// summary + results pentru fiecare fișier.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { processEFacturaZip } from "@/lib/compliance/efactura-bulk-zip"

const WRITE_ROLES = ["owner", "partner_manager", "compliance"] as const

const MAX_ZIP_BYTES = 50 * 1024 * 1024 // 50 MB

export async function POST(request: Request) {
  requireRole(request, [...WRITE_ROLES], "bulk upload e-Factura ZIP")

  const contentType = request.headers.get("content-type") ?? ""

  let zipBuffer: ArrayBuffer
  let fileName = "upload.zip"

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const file = formData.get("file")
      if (!(file instanceof File)) {
        return jsonError("Lipsește fișierul ZIP în câmpul 'file'.", 400, "BULK_NO_FILE")
      }
      if (file.size > MAX_ZIP_BYTES) {
        return jsonError(
          `Fișier prea mare (>${MAX_ZIP_BYTES / 1024 / 1024} MB).`,
          413,
          "BULK_TOO_LARGE",
        )
      }
      fileName = file.name || "upload.zip"
      zipBuffer = await file.arrayBuffer()
    } else if (
      contentType.includes("application/zip") ||
      contentType.includes("application/octet-stream")
    ) {
      zipBuffer = await request.arrayBuffer()
      if (zipBuffer.byteLength > MAX_ZIP_BYTES) {
        return jsonError(
          `Fișier prea mare (>${MAX_ZIP_BYTES / 1024 / 1024} MB).`,
          413,
          "BULK_TOO_LARGE",
        )
      }
    } else {
      return jsonError(
        "Content-Type invalid. Folosește multipart/form-data cu câmp 'file' sau application/zip.",
        400,
        "BULK_INVALID_CONTENT_TYPE",
      )
    }
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Eroare la citirea ZIP.",
      400,
      "BULK_READ_ERROR",
    )
  }

  const nowISO = new Date().toISOString()
  try {
    const summary = await processEFacturaZip(zipBuffer, nowISO)
    return NextResponse.json({
      ok: true,
      fileName,
      summary,
    })
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Eroare la procesarea ZIP.",
      400,
      "BULK_PROCESS_ERROR",
    )
  }
}
