// F2 — Import NIS2@RO Tool Oficial (OCR + Prefill)
// Pipeline: OCR → Gemini field mapping → CUI cross-check → wizard prefill
// Each field gets a confidence score. Fields < 70% → "completează manual".
// No field is applied without user confirmation.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite"

// ── Types ───────────────────────────────────────────────────────────────────

export type Nis2ImportField = {
  fieldName: string
  value: string
  confidence: number // 0-100
  source: "ocr" | "gemini" | "anaf-crosscheck"
  requiresManualInput: boolean
}

export type Nis2ImportResult = {
  success: boolean
  fields: Nis2ImportField[]
  ocrText: string
  warnings: string[]
}

// ── Gemini field extraction ─────────────────────────────────────────────────

const NIS2_FIELD_PROMPT = `
Ești expert NIS2 și analizezi un document oficial NIS2@RO (tool de auto-evaluare).
Extrage câmpurile relevante din textul OCR de mai jos.

Returnează JSON cu array de câmpuri:
[{
  "fieldName": "companyName" | "cui" | "sector" | "entityType" | "employeeCount" |
               "annualRevenue" | "essentialService" | "digitalInfrastructure" |
               "incidentResponsePlan" | "riskAssessmentDate" | "securityOfficer" |
               "supplierCount" | "certifications",
  "value": "valoarea extrasă",
  "confidence": număr 0-100
}]

Reguli:
- Dacă un câmp nu este clar în text, pune confidence sub 50.
- Dacă un câmp pare prezent dar ambiguu, pune confidence 50-70.
- Dacă câmpul e clar, pune confidence > 70.
- Returnează DOAR JSON valid, fără text suplimentar.
- Dacă nu găsești nimic util, returnează [].

Text OCR:
`

async function extractFieldsWithGemini(
  ocrText: string
): Promise<Array<{ fieldName: string; value: string; confidence: number }>> {
  if (!GEMINI_API_KEY) return []

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: NIS2_FIELD_PROMPT + ocrText.slice(0, 6000) }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
        }),
      }
    )

    if (!res.ok) return []

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }

    const raw =
      json.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("")
        .trim() ?? ""

    if (!raw) return []

    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
    const parsed = JSON.parse(cleaned) as unknown[]

    return parsed
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === "object")
      .map((item) => ({
        fieldName: String(item.fieldName ?? ""),
        value: String(item.value ?? ""),
        confidence: typeof item.confidence === "number" ? item.confidence : 50,
      }))
      .filter((f) => f.fieldName && f.value)
  } catch {
    return []
  }
}

// ── Main import function ────────────────────────────────────────────────────

/**
 * F2: Process OCR text from NIS2@RO official tool document.
 * Returns structured fields with confidence scores.
 * Fields with confidence < 70% are marked as requiresManualInput.
 */
export async function importNis2OfficialTool(
  ocrText: string,
  anafCui?: string
): Promise<Nis2ImportResult> {
  const warnings: string[] = []

  if (!ocrText || ocrText.trim().length < 50) {
    return {
      success: false,
      fields: [],
      ocrText: ocrText ?? "",
      warnings: ["Text OCR insuficient pentru extracție."],
    }
  }

  // Step 1: Extract fields with Gemini
  const geminiFields = await extractFieldsWithGemini(ocrText)

  if (geminiFields.length === 0) {
    warnings.push("Gemini nu a putut extrage câmpuri din text. Completare manuală necesară.")
  }

  // Step 2: Build import fields
  const fields: Nis2ImportField[] = geminiFields.map((f) => ({
    fieldName: f.fieldName,
    value: f.value,
    confidence: f.confidence,
    source: "gemini" as const,
    requiresManualInput: f.confidence < 70,
  }))

  // Step 3: Cross-check CUI if provided
  if (anafCui) {
    const cuiField = fields.find((f) => f.fieldName === "cui")
    if (cuiField) {
      if (cuiField.value.replace(/\D/g, "") === anafCui.replace(/\D/g, "")) {
        cuiField.confidence = 95
        cuiField.source = "anaf-crosscheck"
        cuiField.requiresManualInput = false
      } else {
        warnings.push(
          `CUI din document (${cuiField.value}) diferă de CUI-ul organizației (${anafCui}). Verifică.`
        )
        cuiField.requiresManualInput = true
      }
    }
  }

  return {
    success: fields.length > 0,
    fields,
    ocrText,
    warnings,
  }
}
