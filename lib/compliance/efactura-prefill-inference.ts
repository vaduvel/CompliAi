// Addon 3 — Smart Prefill din Facturi e-Factura
// Analyses product names from last 20 invoices with Gemini
// to auto-fill fields about tools, cloud, antivirus.
// All values are 'suggested', never 'confirmed' — user decides.
// Does NOT store raw invoice product names — only the inference result.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite"

// ── Types ───────────────────────────────────────────────────────────────────

export type InferencePrefill = {
  cloudProviders: string[]
  securityTools: string[]
  productivityTools: string[]
  aiTools: string[]
  dataCategories: string[]
  serverLocations: string[]
  confidencePerField: Record<string, number>
  source: "efactura-inference"
  status: "suggested"
  timestamp: string
}

// ── Gemini prompt ───────────────────────────────────────────────────────────

const PREFILL_INFERENCE_PROMPT = `
Ești expert senior în conformitate GDPR/NIS2 cu acces la date de facturare.
Analizează denumirile produselor/serviciilor din facturile următoare
și deduce ce tool-uri și servicii folosește firma.

Returnează DOAR JSON valid:
{
  "cloudProviders": ["AWS", "Microsoft 365", "Google Cloud"] sau [],
  "securityTools": ["Bitdefender", "Kaspersky", "CrowdStrike"] sau [],
  "productivityTools": ["Microsoft 365", "Slack", "Zoom"] sau [],
  "aiTools": ["ChatGPT", "GitHub Copilot", "Cursor"] sau [],
  "dataCategories": ["date contact", "date financiare", "date clienți"] sau [],
  "serverLocations": ["România", "UE", "SUA"] sau [],
  "confidencePerField": {
    "cloudProviders": 85,
    "securityTools": 70,
    "aiTools": 90
  }
}

Reguli:
- Returnează doar ce poți deduce cu certitudine rezonabilă
- Nu inventa ce nu e în text
- Toate valorile sunt 'suggested' — userul confirmă
- Dacă nu poți deduce nimic util, returnează JSON cu array-uri goale
- Returnează DOAR JSON valid, fără text suplimentar

Denumiri produse din facturi:
`

// ── Main inference function ─────────────────────────────────────────────────

/**
 * Addon 3: Infer tool/service usage from invoice product names.
 * Returns null if Gemini is unavailable or no useful data is found.
 * All returned values have status: 'suggested' — never 'confirmed'.
 */
export async function inferPrefillFromInvoices(
  invoiceItems: string[]
): Promise<InferencePrefill | null> {
  if (!invoiceItems || invoiceItems.length === 0) return null
  if (!GEMINI_API_KEY) return null

  // Take at most 20 items, truncate long names
  const text = invoiceItems
    .slice(0, 20)
    .map((item) => item.slice(0, 200))
    .join("\n")

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: PREFILL_INFERENCE_PROMPT + text }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
        }),
      }
    )

    if (!res.ok) return null

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }

    const raw =
      json.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("")
        .trim() ?? ""

    if (!raw) return null

    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim()

    const parsed = JSON.parse(cleaned) as Record<string, unknown>

    return {
      cloudProviders: asStringArray(parsed.cloudProviders),
      securityTools: asStringArray(parsed.securityTools),
      productivityTools: asStringArray(parsed.productivityTools),
      aiTools: asStringArray(parsed.aiTools),
      dataCategories: asStringArray(parsed.dataCategories),
      serverLocations: asStringArray(parsed.serverLocations),
      confidencePerField: (typeof parsed.confidencePerField === "object" && parsed.confidencePerField !== null
        ? parsed.confidencePerField
        : {}) as Record<string, number>,
      source: "efactura-inference",
      status: "suggested",    // always suggested — user confirms
      timestamp: new Date().toISOString(),
    }
  } catch {
    return null // silent fallback — fields remain empty
  }
}

function asStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return []
  return val.filter((v): v is string => typeof v === "string")
}
