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
    signal: AbortSignal.timeout(8_000),
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
    caenDescription: getCaenDescription(record.date_generale.cod_CAEN),
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
      source: "anaf_vat_registry",
    }
  }
  if (prefix >= 49 && prefix <= 53) {
    return {
      value: "transport",
      confidence: "high",
      reason: "Codul CAEN principal indică transport sau logistică.",
      source: "anaf_vat_registry",
    }
  }
  if (prefix === 64) {
    return {
      value: "banking",
      confidence: "high",
      reason: "Codul CAEN principal indică intermediere financiară bancară.",
      source: "anaf_vat_registry",
    }
  }
  if (prefix === 65 || prefix === 66) {
    return {
      value: "finance",
      confidence: "high",
      reason: "Codul CAEN principal indică activitate financiară sau de asigurări.",
      source: "anaf_vat_registry",
    }
  }
  if (prefix === 84) {
    return {
      value: "public-admin",
      confidence: "high",
      reason: "Codul CAEN principal indică administrație publică.",
      source: "anaf_vat_registry",
    }
  }
  if (prefix === 86) {
    return {
      value: "health",
      confidence: "high",
      reason: "Codul CAEN principal indică servicii medicale.",
      source: "anaf_vat_registry",
    }
  }
  if (prefix >= 61 && prefix <= 63) {
    return {
      value: "digital-infrastructure",
      confidence: "medium",
      reason: "Codul CAEN principal indică telecom, IT sau servicii digitale.",
      source: "anaf_vat_registry",
    }
  }
  if (prefix >= 10 && prefix <= 33) {
    return {
      value: "manufacturing",
      confidence: "medium",
      reason: "Codul CAEN principal indică producție sau industrie.",
      source: "anaf_vat_registry",
    }
  }
  if (prefix === 47) {
    return {
      value: "retail",
      confidence: "high",
      reason: "Codul CAEN principal indică retail direct către clienți finali.",
      source: "anaf_vat_registry",
    }
  }
  if (prefix === 46) {
    return {
      value: "retail",
      confidence: "medium",
      reason: "Codul CAEN principal indică comerț; îl tratăm ca sector comercial până la confirmare.",
      source: "anaf_vat_registry",
    }
  }
  if (prefix === 73) {
    return {
      value: "professional-services",
      confidence: "medium",
      reason: "Codul CAEN principal indică activități de publicitate, marketing sau studii de piață (div. 73).",
      source: "anaf_vat_registry",
    }
  }
  if ((prefix >= 69 && prefix <= 74) || prefix === 78 || prefix === 82) {
    return {
      value: "professional-services",
      confidence: "medium",
      reason: "Codul CAEN principal indică servicii profesionale (juridice, contabile, consultanță, design, IT).",
      source: "anaf_vat_registry",
    }
  }

  return undefined
}

// CAEN descriptions for the most common codes (Romanian)
const CAEN_DESCRIPTIONS: Record<string, string> = {
  // IT & Digital
  "6201": "Activități de realizare a soft-ului la comandă",
  "6202": "Activități de consultanță în tehnologia informației",
  "6203": "Activități de management al resurselor informatice",
  "6209": "Alte activități de servicii privind tehnologia informației",
  "6311": "Prelucrarea datelor, administrarea paginilor web și activități conexe",
  "6312": "Activități ale portalurilor web",
  "6391": "Activități ale agențiilor de știri",
  "6399": "Alte servicii informaționale n.c.a.",
  // Marketing & Advertising
  "7311": "Activități de publicitate și marketing",
  "7312": "Servicii de reprezentare în media",
  "7320": "Activități de studiere a pieței și de sondare a opiniei publice",
  // Professional services
  "6910": "Activități juridice",
  "6920": "Activități de contabilitate, audit financiar și consultanță fiscală",
  "7010": "Activități ale sediilor centrale",
  "7021": "Activități de consultanță în domeniul relațiilor publice",
  "7022": "Activități de consultanță pentru afaceri și management",
  "7111": "Activități de arhitectură",
  "7112": "Activități de inginerie și consultanță tehnică",
  "7410": "Activități de design specializat",
  "7420": "Activități fotografice",
  "7430": "Activități de traducere și interpretare",
  "7490": "Alte activități profesionale, științifice și tehnice n.c.a.",
  // Retail
  "4711": "Comerț cu amănuntul în magazine nespecializate",
  "4719": "Comerț cu amănuntul în magazine nespecializate (altele)",
  "4791": "Comerț cu amănuntul prin case de comenzi sau prin internet",
  // Finance & Insurance
  "6411": "Activități ale băncilor centrale",
  "6419": "Alte activități de intermedieri monetare",
  "6491": "Activități de leasing financiar",
  "6499": "Alte intermedieri financiare n.c.a.",
  "6512": "Alte activități de asigurări (cu excepția asigurărilor de viață)",
  // Health
  "8610": "Activități ale spitalelor",
  "8621": "Activități de asistență medicală generală",
  "8622": "Activități de asistență medicală specializată",
  "8690": "Alte activități referitoare la sănătatea umană",
  // Education
  "8530": "Învățământ secundar tehnic, profesional",
  "8541": "Învățământ superior",
  "8559": "Alte forme de învățământ n.c.a.",
  // Transport & Logistics
  "4941": "Transporturi rutiere de mărfuri",
  "4950": "Transporturi prin conducte",
  "5210": "Depozitări",
  "5320": "Alte activități poștale și de curier",
  // Construction
  "4120": "Lucrări de construcție a clădirilor rezidențiale și nerezidențiale",
  "4311": "Lucrări de demolare a construcțiilor",
  // Food & HoReCa
  "5610": "Restaurante",
  "5630": "Baruri și alte activități de servire a băuturilor",
  "5510": "Hoteluri și alte facilități de cazare similare",
  // Real estate
  "6810": "Cumpărarea și vânzarea de bunuri imobiliare proprii",
  "6820": "Închirierea și subînchirierea bunurilor imobiliare proprii",
  "6831": "Activități ale agențiilor imobiliare",
}

function getCaenDescription(caenCode: string | undefined): string | null {
  if (!caenCode) return null
  return CAEN_DESCRIPTIONS[caenCode] ?? null
}

function inferEfacturaSuggestion(record: AnafCompanyEntry): PrefillSuggestion<boolean> | undefined {
  if (record.date_generale?.statusRO_e_Factura) {
    return {
      value: true,
      confidence: "high",
      reason: "Firma apare înregistrată în Registrul RO e-Factura ANAF.",
      source: "anaf_vat_registry",
    }
  }

  if (record.inregistrare_scop_Tva?.scpTVA) {
    return {
      value: true,
      confidence: "medium",
      reason: "Firma apare înregistrată în scopuri de TVA; pentru multe fluxuri B2B obligația e-Factura este foarte probabilă.",
      source: "anaf_vat_registry",
    }
  }

  return undefined
}
