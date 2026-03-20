import type { OrgSector } from "@/lib/compliance/applicability"
import type { OrgProfilePrefill, PrefillSuggestion } from "@/lib/compliance/org-profile-prefill"
import { validateCUI } from "@/lib/server/request-validation"

const ANAF_COMPANY_LOOKUP_URL = "https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva"

type AnafLookupResponse = {
  found?: AnafCompanyEntry[]
  notFound?: number[]
}

type AnafCompanyEntry = {
  date_generale?: {
    data?: string
    cui?: number
    denumire?: string
    adresa?: string
    stare_inregistrare?: string
    forma_juridica?: string
    cod_CAEN?: string
    statusRO_e_Factura?: boolean
  }
  inregistrare_scop_Tva?: {
    scpTVA?: boolean
  }
  inregistrare_RTVAI?: {
    statusTvaIncasare?: boolean
  }
  stare_inactiv?: {
    statusInactivi?: boolean
  }
}

export async function lookupOrgProfilePrefillByCui(
  rawCui: string,
  fetchImpl: typeof fetch = fetch
): Promise<OrgProfilePrefill | null> {
  const normalizedCui = validateCUI(rawCui)
  if (!normalizedCui) return null

  const numericCui = Number(normalizedCui.replace(/^RO/i, ""))
  if (!Number.isFinite(numericCui)) return null

  const response = await fetchImpl(ANAF_COMPANY_LOOKUP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([
      {
        cui: numericCui,
        data: new Date().toISOString().slice(0, 10),
      },
    ]),
  })

  const payload = await parseLookupPayload(response)
  if (!payload) {
    throw new Error(`ANAF_COMPANY_LOOKUP_FAILED:${response.status}`)
  }

  const record = payload.found?.find((entry) => entry.date_generale?.cui === numericCui)
  if (!record?.date_generale?.denumire) return null

  return {
    source: "anaf_vat_registry",
    fetchedAtISO: new Date().toISOString(),
    normalizedCui,
    companyName: record.date_generale.denumire,
    address: sanitizeOptionalText(record.date_generale.adresa),
    legalForm: sanitizeOptionalText(record.date_generale.forma_juridica),
    mainCaen: sanitizeOptionalText(record.date_generale.cod_CAEN),
    fiscalStatus: sanitizeOptionalText(record.date_generale.stare_inregistrare),
    vatRegistered: Boolean(record.inregistrare_scop_Tva?.scpTVA),
    vatOnCashAccounting: Boolean(record.inregistrare_RTVAI?.statusTvaIncasare),
    efacturaRegistered: Boolean(record.date_generale.statusRO_e_Factura),
    inactive: Boolean(record.stare_inactiv?.statusInactivi),
    suggestions: {
      sector: inferSectorSuggestion(record.date_generale.cod_CAEN),
      requiresEfactura: inferEfacturaSuggestion(record),
    },
  }
}

async function parseLookupPayload(response: Response): Promise<AnafLookupResponse | null> {
  const text = await response.text()
  if (!text) return null

  try {
    const parsed = JSON.parse(text) as AnafLookupResponse
    if (!parsed || typeof parsed !== "object") return null
    if (!Array.isArray(parsed.found) && !Array.isArray(parsed.notFound)) return null
    return parsed
  } catch {
    return null
  }
}

function sanitizeOptionalText(value: string | undefined) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function inferSectorSuggestion(caenCode: string | undefined): PrefillSuggestion<OrgSector> | undefined {
  const prefix = Number.parseInt((caenCode ?? "").slice(0, 2), 10)
  if (!Number.isFinite(prefix)) return undefined

  if (prefix === 35) {
    return {
      value: "energy",
      confidence: "high",
      reason: "Codul CAEN principal indică activitate în energie.",
    }
  }
  if (prefix >= 49 && prefix <= 53) {
    return {
      value: "transport",
      confidence: "high",
      reason: "Codul CAEN principal indică transport sau logistică.",
    }
  }
  if (prefix === 64) {
    return {
      value: "banking",
      confidence: "high",
      reason: "Codul CAEN principal indică intermediere financiară bancară.",
    }
  }
  if (prefix === 65 || prefix === 66) {
    return {
      value: "finance",
      confidence: "high",
      reason: "Codul CAEN principal indică activitate financiară sau de asigurări.",
    }
  }
  if (prefix === 84) {
    return {
      value: "public-admin",
      confidence: "high",
      reason: "Codul CAEN principal indică administrație publică.",
    }
  }
  if (prefix === 86) {
    return {
      value: "health",
      confidence: "high",
      reason: "Codul CAEN principal indică servicii medicale.",
    }
  }
  if (prefix >= 61 && prefix <= 63) {
    return {
      value: "digital-infrastructure",
      confidence: "medium",
      reason: "Codul CAEN principal indică telecom, IT sau servicii digitale.",
    }
  }
  if (prefix >= 10 && prefix <= 33) {
    return {
      value: "manufacturing",
      confidence: "medium",
      reason: "Codul CAEN principal indică producție sau industrie.",
    }
  }
  if (prefix === 47) {
    return {
      value: "retail",
      confidence: "high",
      reason: "Codul CAEN principal indică retail direct către clienți finali.",
    }
  }
  if (prefix === 46) {
    return {
      value: "retail",
      confidence: "medium",
      reason: "Codul CAEN principal indică comerț; îl tratăm ca sector comercial până la confirmare.",
    }
  }
  if ((prefix >= 69 && prefix <= 74) || prefix === 78 || prefix === 82) {
    return {
      value: "professional-services",
      confidence: "medium",
      reason: "Codul CAEN principal indică servicii profesionale sau suport operațional.",
    }
  }

  return undefined
}

function inferEfacturaSuggestion(record: AnafCompanyEntry): PrefillSuggestion<boolean> | undefined {
  if (record.date_generale?.statusRO_e_Factura) {
    return {
      value: true,
      confidence: "high",
      reason: "Firma apare înregistrată în Registrul RO e-Factura ANAF.",
    }
  }

  if (record.inregistrare_scop_Tva?.scpTVA) {
    return {
      value: true,
      confidence: "medium",
      reason: "Firma apare înregistrată în scopuri de TVA; pentru multe fluxuri B2B obligația e-Factura este foarte probabilă.",
    }
  }

  return undefined
}
