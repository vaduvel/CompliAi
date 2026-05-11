// F#8 — OCR + Voice-to-Invoice API.
//
// POST body (JSON):
//   { imageBase64: string, mimeType?: string, mode?: "auto" | "cloud" | "local" }
//   OR
//   { transcript: string }  → voice transcript → invoice draft JSON.
//
// Returns: OcrExtractionResult (ExtractedInvoiceData + provider used).
//
// Hybrid layered fallback: privacy local Gemma 4 first, then Gemini Vision cloud.

import { NextResponse } from "next/server"

import {
  extractInvoiceFromImage,
  extractInvoiceFromVoiceTranscript,
  type OcrExtractionInput,
} from "@/lib/compliance/invoice-ocr-extract"
import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"

const MAX_BASE64_SIZE = 12 * 1024 * 1024 // ~9 MB binary after base64 decode

export async function POST(request: Request) {
  try {
    await requireFreshAuthenticatedSession(request, "OCR invoice extract")
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      const e = err as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Auth eșuată.", 401, "OCR_AUTH_FAILED")
  }

  let body: {
    imageBase64?: string
    mimeType?: string
    mode?: OcrExtractionInput["mode"]
    transcript?: string
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return jsonError("Body invalid (JSON).", 400, "OCR_INVALID_BODY")
  }

  // Voice → invoice draft
  if (body.transcript && typeof body.transcript === "string") {
    if (body.transcript.length > 4_000) {
      return jsonError("Transcript prea lung (max 4000 chars).", 413, "OCR_TRANSCRIPT_TOO_LARGE")
    }
    const result = await extractInvoiceFromVoiceTranscript(body.transcript)
    return NextResponse.json({
      ...result,
      inputMode: "voice",
      note: "Draft generat din voce — verifică manual câmpurile înainte de confirmare contabilă (CECCAR Art. 14).",
    })
  }

  // Image → invoice extract
  if (!body.imageBase64 || typeof body.imageBase64 !== "string") {
    return jsonError("imageBase64 (string) sau transcript obligatoriu.", 400, "OCR_NO_INPUT")
  }
  if (body.imageBase64.length > MAX_BASE64_SIZE) {
    return jsonError("Imagine prea mare (max ~9 MB).", 413, "OCR_IMAGE_TOO_LARGE")
  }

  const mode: OcrExtractionInput["mode"] =
    body.mode === "local" || body.mode === "cloud" || body.mode === "auto"
      ? body.mode
      : "auto"

  const result = await extractInvoiceFromImage({
    imageBase64: body.imageBase64,
    mimeType: body.mimeType ?? "image/jpeg",
    mode,
  })

  return NextResponse.json({
    ...result,
    inputMode: "image",
    note: "Extragere AI informativă — verifică manual câmpurile (CIF, sume, date) înainte de validare e-Factura (CECCAR Art. 14).",
  })
}
