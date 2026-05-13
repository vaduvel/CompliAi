// Parser AGA (Hotărâre Adunarea Generală Asociați) — format free-form RO.
//
// Documente AGA nu au standard ANAF — fiecare cabinet/avocat redactează diferit.
// Folosim Gemini (sau Mistral / Gemma local) pentru extracție structurată a:
//   - asociați (nume + CNP/CUI + procent deținere)
//   - dividende per asociat (sumă)
//   - data hotărârii
//   - perioada exercițiu financiar
//   - sumă totală distribuită
//
// CRITICAL: extractor-ul NU validează automat — utilizatorul TREBUIE să
// confirme câmpurile extrase înainte ca acestea să intre în cross-correlation.
// Accuracy realistă: ~75-85% pe AGA-uri standard, scade pe scanări proaste.
//
// Fundație pentru R2 (AGA ↔ stat plată ↔ D205) și R3 (AGA procent ↔ ONRC).

import { generateContent, type AIProviderId } from "@/lib/server/ai-provider"

// ── Tipuri ──────────────────────────────────────────────────────────────────

export type AgaAssociate = {
  /** Tip identificator. */
  idType: "CNP" | "CUI" | "unknown"
  /** Identificator (CNP 13 cifre sau CUI). */
  id: string | null
  /** Nume complet sau denumire firmă. */
  name: string | null
  /** Procent deținere (0-100). */
  ownershipPercent: number | null
  /** Sumă dividende distribuită (RON). */
  dividendsAmount: number | null
  /** Procent din dividende (0-100). Egal cu ownership doar dacă distribuție pro-rata. */
  dividendsPercent: number | null
}

export type AgaExtractedData = {
  /** Data hotărârii AGA (YYYY-MM-DD). */
  resolutionDate: string | null
  /** Exercițiu financiar (an pentru care se distribuie dividende). */
  financialYear: number | null
  /** Tip hotărâre detectat. */
  resolutionType:
    | "AGA-ordinara"
    | "AGA-extraordinara"
    | "AGOA"
    | "AGEA"
    | "decizie-asociat-unic"
    | "necunoscut"
  /** Asociați + dividende. */
  associates: AgaAssociate[]
  /** Sumă totală dividende distribuite (RON). */
  totalDividendsAmount: number | null
  /** Profit net repartizat (RON), dacă apare. */
  netProfit: number | null
  /** Profit reportat anterior, dacă apare. */
  retainedEarnings: number | null
  /** Provider AI folosit. */
  aiProvider: AIProviderId
  /** Confidence score (0-1) — auto-estimat de extractor. */
  confidence: number
  /** Erori extracție. */
  errors: string[]
  /** Warnings + ambiguități semnalate. */
  warnings: string[]
}

// ── Prompt template pentru Gemini ───────────────────────────────────────────

const EXTRACTION_PROMPT = `Extragi date structurate dintr-o hotărâre AGA (Adunarea Generală Asociați) sau decizie asociat unic din România.

INPUT: text complet hotărâre AGA (extras din PDF/Word).

OUTPUT: răspunde EXACT cu JSON valid (fără markdown wrapper, fără explicații), structura:
{
  "resolutionDate": "YYYY-MM-DD sau null",
  "financialYear": număr an (ex 2024) sau null,
  "resolutionType": unul din "AGA-ordinara" | "AGA-extraordinara" | "AGOA" | "AGEA" | "decizie-asociat-unic" | "necunoscut",
  "associates": [
    {
      "idType": "CNP" | "CUI" | "unknown",
      "id": "string CNP 13 cifre sau CUI sau null",
      "name": "nume complet PF sau denumire SRL",
      "ownershipPercent": număr 0-100 sau null,
      "dividendsAmount": număr RON sau null,
      "dividendsPercent": număr 0-100 sau null
    }
  ],
  "totalDividendsAmount": număr total dividende RON sau null,
  "netProfit": număr profit net repartizat RON sau null,
  "retainedEarnings": număr profit reportat RON sau null,
  "warnings": ["text warning în RO dacă ambiguitate"],
  "confidence": număr 0-1 (auto-estimat: 1 = clar, 0.5 = ambiguu, 0 = nesigur)
}

REGULI:
1. RON pentru sume (convertește din EUR/USD dacă e cazul, marchează în warnings).
2. CNP-uri 13 cifre — extract complet, NU mascat.
3. Procente: 50% = 50, NU 0.5.
4. Dacă lipsește total dividende dar avem per asociat, sumează tu.
5. "Asociat unic" = un singur asociat în array.
6. Hotărârile pot menționa "distribuție 50/50" fără procente explicite → derivă-le.
7. Profit reportat ≠ profit net ≠ dividende distribuite. Distinge-le.
8. Confidence < 0.7 dacă ai dubii.

INPUT:
---
{TEXT}
---

JSON output:`

// ── Parser principal ────────────────────────────────────────────────────────

export async function extractAgaFromText(
  text: string,
  opts: { provider?: AIProviderId } = {},
): Promise<AgaExtractedData> {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length < 50) {
    return emptyResult(
      ["Text prea scurt sau gol pentru extracție AGA."],
      "gemini",
    )
  }
  if (trimmed.length > 50_000) {
    return emptyResult(
      [`Text prea lung (${(trimmed.length / 1024).toFixed(0)} KB). Maxim 50 KB pentru extracție.`],
      "gemini",
    )
  }

  const prompt = EXTRACTION_PROMPT.replace("{TEXT}", trimmed)

  let result
  try {
    result = await generateContent({
      prompt,
      provider: opts.provider,
      temperature: 0.1, // determinism crescut pentru extracție structurată
      maxOutputTokens: 2048,
      label: "fiscal:aga-extract",
    })
  } catch (err) {
    return emptyResult(
      [`Eroare AI provider: ${err instanceof Error ? err.message : "necunoscut"}`],
      "gemini",
    )
  }

  // Parse JSON din răspuns
  let parsed: Partial<AgaExtractedData> & { warnings?: string[] }
  try {
    // Curățăm markdown wrapper dacă există
    const cleaned = result.content
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
    parsed = JSON.parse(cleaned)
  } catch (err) {
    return {
      ...emptyResult([`Răspuns AI invalid JSON: ${err instanceof Error ? err.message : "?"}`], result.provider),
      aiProvider: result.provider,
    }
  }

  // Normalizăm rezultatul
  const associates = Array.isArray(parsed.associates) ? parsed.associates : []
  const normalizedAssociates: AgaAssociate[] = associates.map((a) => ({
    idType: ["CNP", "CUI", "unknown"].includes(a.idType as string)
      ? (a.idType as AgaAssociate["idType"])
      : "unknown",
    id: typeof a.id === "string" ? a.id : null,
    name: typeof a.name === "string" ? a.name : null,
    ownershipPercent: clampPercent(a.ownershipPercent),
    dividendsAmount: typeof a.dividendsAmount === "number" ? a.dividendsAmount : null,
    dividendsPercent: clampPercent(a.dividendsPercent),
  }))

  const warnings = Array.isArray(parsed.warnings) ? parsed.warnings : []

  // Sanity checks după extracție
  const totalOwnership = normalizedAssociates.reduce(
    (sum, a) => sum + (a.ownershipPercent ?? 0),
    0,
  )
  if (normalizedAssociates.length > 0 && totalOwnership > 0 && Math.abs(totalOwnership - 100) > 2) {
    warnings.push(
      `Suma procente deținere = ${totalOwnership.toFixed(1)}% (așteptat ~100%). Verifică manual.`,
    )
  }

  const totalDividendsFromAssociates = normalizedAssociates.reduce(
    (sum, a) => sum + (a.dividendsAmount ?? 0),
    0,
  )
  if (
    parsed.totalDividendsAmount &&
    totalDividendsFromAssociates > 0 &&
    Math.abs(parsed.totalDividendsAmount - totalDividendsFromAssociates) > 1
  ) {
    warnings.push(
      `Total dividende din header (${parsed.totalDividendsAmount}) ≠ sumă per asociat (${totalDividendsFromAssociates}).`,
    )
  }

  // Detect distribuție pro-rata vs derogatorie
  for (const a of normalizedAssociates) {
    if (
      a.ownershipPercent !== null &&
      a.dividendsPercent !== null &&
      Math.abs(a.ownershipPercent - a.dividendsPercent) > 0.5
    ) {
      warnings.push(
        `${a.name ?? a.id ?? "Asociat"}: distribuție ${a.dividendsPercent}% diferă de procent deținere ${a.ownershipPercent}% — derogare AGA art. 67 Legea 31/1990.`,
      )
    }
  }

  return {
    resolutionDate: typeof parsed.resolutionDate === "string" ? parsed.resolutionDate : null,
    financialYear:
      typeof parsed.financialYear === "number" ? parsed.financialYear : null,
    resolutionType:
      typeof parsed.resolutionType === "string"
        ? (parsed.resolutionType as AgaExtractedData["resolutionType"])
        : "necunoscut",
    associates: normalizedAssociates,
    totalDividendsAmount:
      typeof parsed.totalDividendsAmount === "number" ? parsed.totalDividendsAmount : null,
    netProfit: typeof parsed.netProfit === "number" ? parsed.netProfit : null,
    retainedEarnings:
      typeof parsed.retainedEarnings === "number" ? parsed.retainedEarnings : null,
    aiProvider: result.provider,
    confidence:
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5,
    errors: [],
    warnings,
  }
}

function clampPercent(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

function emptyResult(errors: string[], provider: AIProviderId): AgaExtractedData {
  return {
    resolutionDate: null,
    financialYear: null,
    resolutionType: "necunoscut",
    associates: [],
    totalDividendsAmount: null,
    netProfit: null,
    retainedEarnings: null,
    aiProvider: provider,
    confidence: 0,
    errors,
    warnings: [],
  }
}

// ── Helpers cross-correlation ───────────────────────────────────────────────

/**
 * Returnează lista CNP-urilor asociaților dintr-o hotărâre AGA — pentru R3
 * (matching procent AGA ↔ procent ONRC) și R4 (beneficiari plătiți ↔ asociați).
 */
export function getAgaAssociatesCnps(extracted: AgaExtractedData): string[] {
  return extracted.associates
    .filter((a) => a.idType === "CNP" && a.id)
    .map((a) => a.id as string)
}

/**
 * Verifică dacă o hotărâre AGA distribuie pro-rata cu ownership — folosit
 * pentru a marca distribuție derogatorie (art. 67 Legea 31/1990).
 */
export function isAgaDistributionPropRata(extracted: AgaExtractedData): boolean {
  if (extracted.associates.length === 0) return false
  for (const a of extracted.associates) {
    if (a.ownershipPercent === null || a.dividendsPercent === null) continue
    if (Math.abs(a.ownershipPercent - a.dividendsPercent) > 0.5) return false
  }
  return true
}
