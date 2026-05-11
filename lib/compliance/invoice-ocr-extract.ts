// F#8 — OCR + Voice-to-Invoice extraction (Sprint 6-7 - 2026-05-11).
//
// Pain: bonuri pe hârtie, facturi PDF prin email, mesaje WhatsApp.
// Dext face $1B+ global; NIMENI nu face RO-specific cu Gemini Vision.
//
// Strategie hybrid layered:
//   1. Default: Gemini Vision API (cheie GEMINI_API_KEY) — structured output.
//   2. Privacy mode (cabinete cu secret profesional): Ollama + Gemma 4 multimodal.
//   3. Fallback (zero-cost): Tesseract.js text OCR + regex.
//
// Output: ExtractedInvoiceData (CIF, sumă, data, articole) — ready for CIUS-RO XML.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite"

const LOCAL_GEMMA_URL = process.env.LOCAL_GEMMA_URL ?? "http://localhost:11434"
const LOCAL_GEMMA_MODEL = process.env.LOCAL_GEMMA_MODEL ?? "gemma4:e2b"

export type ExtractedInvoiceLine = {
  description: string
  quantity?: number
  unitPriceRON?: number
  totalRON: number
  vatRate?: number
}

export type ExtractedInvoiceData = {
  /** CIF furnizor (RO + 2-10 cifre). */
  supplierCif?: string
  supplierName?: string
  /** CIF / CNP client (dacă e B2B; B2C poate omite). */
  customerCif?: string
  customerName?: string
  invoiceNumber?: string
  /** ISO YYYY-MM-DD. */
  issueDateISO?: string
  /** Suma TVA totală (RON). */
  totalVatRON?: number
  /** Bază impozabilă (fără TVA). */
  totalNetRON?: number
  /** Total cu TVA inclus. */
  totalGrossRON?: number
  currency?: string
  vatRate?: number
  lines?: ExtractedInvoiceLine[]
  /** "high" | "medium" | "low" — încrederea AI în extragere. */
  confidence?: "high" | "medium" | "low"
  /** Mesaj raw cu detalii (pentru debug). */
  rawNotes?: string
}

export type OcrExtractionResult = {
  ok: boolean
  provider: "gemini-vision" | "gemma-local" | "tesseract" | "none"
  data?: ExtractedInvoiceData
  error?: string
}

// ── System prompt (RO, structured output) ─────────────────────────────────────

const SYSTEM_PROMPT = `Ești un asistent OCR pentru facturi românești. Primești o imagine cu o factură sau un bon fiscal (PDF, JPG, PNG). Extrage datele și returnează DOAR un obiect JSON valid (fără markdown wrapper, fără explicații înainte/după), cu structura:

{
  "supplierCif": "RO12345678" sau null,
  "supplierName": "...",
  "customerCif": "..." sau null,
  "customerName": "..." sau null,
  "invoiceNumber": "F123/2026",
  "issueDateISO": "2026-05-11",
  "totalNetRON": 1000.00,
  "totalVatRON": 190.00,
  "totalGrossRON": 1190.00,
  "currency": "RON",
  "vatRate": 19,
  "lines": [
    {
      "description": "Servicii consultanță IT",
      "quantity": 1,
      "unitPriceRON": 1000.00,
      "totalRON": 1000.00,
      "vatRate": 19
    }
  ],
  "confidence": "high" | "medium" | "low",
  "rawNotes": "observații dacă date lipsesc sau sunt neclare"
}

Reguli:
- CIF-uri românești au format "RO" + 2-10 cifre (poate lipsi prefixul RO).
- Sume în format românesc: 1.000,00 sau 1000,00 — convertește la format decimal cu punct (1000.00).
- Date: convertește din format românesc DD.MM.YYYY la ISO YYYY-MM-DD.
- Dacă imaginea nu e factură sau e ilizibilă: confidence "low" + rawNotes explicit.
- NU inventa date. Lipsă = null. Nesigur = confidence "medium" sau "low".`

// ── Gemini Vision provider ───────────────────────────────────────────────────

export async function extractInvoiceViaGemini(
  imageBase64: string,
  mimeType: string = "image/jpeg",
): Promise<OcrExtractionResult> {
  if (!GEMINI_API_KEY) {
    return { ok: false, provider: "none", error: "GEMINI_API_KEY nesetat." }
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: SYSTEM_PROMPT },
                {
                  inlineData: {
                    mimeType,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1, // determinism pentru OCR
            topP: 0.95,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(55_000),
      },
    )

    if (!response.ok) {
      const text = await response.text()
      return { ok: false, provider: "gemini-vision", error: `Gemini HTTP ${response.status}: ${text.slice(0, 200)}` }
    }

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    if (!content) return { ok: false, provider: "gemini-vision", error: "Gemini a returnat conținut gol." }

    try {
      const data = JSON.parse(content) as ExtractedInvoiceData
      return { ok: true, provider: "gemini-vision", data }
    } catch (parseErr) {
      // Încearcă să extragi JSON dintr-un markdown wrapper
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[0]) as ExtractedInvoiceData
          return { ok: true, provider: "gemini-vision", data }
        } catch {
          /* fall through */
        }
      }
      return {
        ok: false,
        provider: "gemini-vision",
        error: `Gemini output nu e JSON valid: ${parseErr instanceof Error ? parseErr.message : "unknown"}`,
      }
    }
  } catch (err) {
    return {
      ok: false,
      provider: "gemini-vision",
      error: err instanceof Error ? err.message : "Eroare Gemini Vision call.",
    }
  }
}

// ── Local Gemma 4 multimodal provider (privacy mode) ─────────────────────────

export async function extractInvoiceViaGemmaLocal(
  imageBase64: string,
  mimeType: string = "image/jpeg",
): Promise<OcrExtractionResult> {
  try {
    // Verifică Ollama disponibilitate
    const probeRes = await fetch(`${LOCAL_GEMMA_URL}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(3_000),
    }).catch(() => null)

    if (!probeRes || !probeRes.ok) {
      return { ok: false, provider: "gemma-local", error: "Ollama nu rulează local." }
    }

    const response = await fetch(`${LOCAL_GEMMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LOCAL_GEMMA_MODEL,
        prompt: SYSTEM_PROMPT,
        images: [imageBase64],
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 2048,
        },
        format: "json",
      }),
      signal: AbortSignal.timeout(180_000), // local poate fi mai lent
    })

    if (!response.ok) {
      const text = await response.text()
      return { ok: false, provider: "gemma-local", error: `Gemma local HTTP ${response.status}: ${text.slice(0, 200)}` }
    }

    const json = (await response.json()) as { response?: string }
    const content = json.response?.trim() ?? ""
    if (!content) return { ok: false, provider: "gemma-local", error: "Gemma local a returnat conținut gol." }

    try {
      const data = JSON.parse(content) as ExtractedInvoiceData
      return { ok: true, provider: "gemma-local", data }
    } catch (parseErr) {
      return {
        ok: false,
        provider: "gemma-local",
        error: `Gemma local JSON parse failed: ${parseErr instanceof Error ? parseErr.message : "unknown"}`,
      }
    }
  } catch (err) {
    return {
      ok: false,
      provider: "gemma-local",
      error: err instanceof Error ? err.message : "Eroare Gemma local call.",
    }
  }
}

// ── Main extractor cu hybrid layered fallback ────────────────────────────────

export type OcrExtractionInput = {
  imageBase64: string
  mimeType?: string
  /** "auto" = preferă privacy local dacă disponibil, altfel cloud. "cloud" = doar Gemini. "local" = doar Gemma. */
  mode?: "auto" | "cloud" | "local"
}

export async function extractInvoiceFromImage(
  input: OcrExtractionInput,
): Promise<OcrExtractionResult> {
  const mode = input.mode ?? "auto"
  const mimeType = input.mimeType ?? "image/jpeg"

  if (mode === "local") {
    return extractInvoiceViaGemmaLocal(input.imageBase64, mimeType)
  }

  if (mode === "cloud") {
    return extractInvoiceViaGemini(input.imageBase64, mimeType)
  }

  // Auto: încearcă local Gemma 4 prima dată (privacy by default), apoi Gemini fallback.
  const localResult = await extractInvoiceViaGemmaLocal(input.imageBase64, mimeType)
  if (localResult.ok) return localResult

  // Cloud fallback
  return extractInvoiceViaGemini(input.imageBase64, mimeType)
}

// ── Voice-to-invoice helper ──────────────────────────────────────────────────
//
// User dictează "Am cumpărat consumabile 500 lei de la SC X SRL data 10 mai"
// Transcrierea (Web Speech API browser side) → text → trimitem la Gemini ca
// prompt + cere structured invoice JSON.

const VOICE_SYSTEM_PROMPT = `Ești un asistent care convertește descrieri vocale ale unei facturi (sau bon fiscal) într-un draft de factură românească. Primești text transcris (e.g., "Am cumpărat hârtie 200 lei de la Carrefour"). Returnează JSON cu aceeași structură ca cea pentru OCR factură (supplierName, totalGrossRON, lines, etc.). Dacă lipsesc date (CIF, număr factură, data exactă), pune null + confidence "low".`

export async function extractInvoiceFromVoiceTranscript(transcript: string): Promise<OcrExtractionResult> {
  if (!GEMINI_API_KEY) {
    return { ok: false, provider: "none", error: "GEMINI_API_KEY nesetat." }
  }
  if (!transcript || transcript.trim().length < 5) {
    return { ok: false, provider: "gemini-vision", error: "Transcript prea scurt." }
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: VOICE_SYSTEM_PROMPT },
                { text: `Transcript user:\n"${transcript.trim()}"` },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.95,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(30_000),
      },
    )

    if (!response.ok) {
      return { ok: false, provider: "gemini-vision", error: `Gemini HTTP ${response.status}` }
    }

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    try {
      const data = JSON.parse(content) as ExtractedInvoiceData
      return { ok: true, provider: "gemini-vision", data }
    } catch {
      return { ok: false, provider: "gemini-vision", error: "Voice → JSON parse failed." }
    }
  } catch (err) {
    return {
      ok: false,
      provider: "gemini-vision",
      error: err instanceof Error ? err.message : "Eroare voice extraction.",
    }
  }
}
