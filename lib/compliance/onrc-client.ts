// Client ONRC unificat — fetch info firmă din surse multiple.
//
// Strategie layered:
//   1. ANAF v9 (free): denumire, CUI, status TVA, CAEN, status e-Factura.
//   2. ONRC RECOM SOAP (paid, opțional): asociați + cote dacă creds setate.
//   3. Manual: utilizatorul adaugă asociați după certificat ONRC printat.
//
// Pentru R3 (AGA procent ↔ ONRC procent) avem NEVOIE de asociați. Dacă lipsesc
// din ANAF (mereu lipsesc) și RECOM SOAP nu e disponibil → UI cere manual input.

import type {
  OnrcAssociate,
  OnrcDataSource,
  OnrcSnapshotRecord,
} from "@/lib/compliance/onrc-snapshot"
import { normalizeCui } from "@/lib/compliance/onrc-snapshot"

const ANAF_V9_URL = "https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva"

// ── ANAF v9 lookup ──────────────────────────────────────────────────────────

type AnafV9Response = {
  found?: Array<{
    date_generale?: {
      cui?: number
      denumire?: string
      adresa?: string
      forma_juridica?: string
      cod_CAEN?: string
      stare_inregistrare?: string
      statusRO_e_Factura?: boolean
      nrRegCom?: string
    }
    inregistrare_scop_Tva?: { scpTVA?: boolean }
    stare_inactiv?: { statusInactivi?: boolean }
  }>
  notFound?: number[]
}

export type AnafFetchResult = {
  ok: boolean
  data?: {
    cui: string
    companyName: string | null
    mainCaen: string | null
    legalForm: string | null
    registeredAddress: string | null
    fiscalStatus: string | null
    vatRegistered: boolean
    efacturaRegistered: boolean
    registrationNumber: string | null
  }
  error?: string
}

export async function fetchAnafCompany(
  rawCui: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AnafFetchResult> {
  const cui = normalizeCui(rawCui)
  if (!/^\d{2,10}$/.test(cui)) {
    return { ok: false, error: "CUI invalid (trebuie 2-10 cifre)." }
  }
  const numericCui = Number(cui)
  try {
    const response = await fetchImpl(ANAF_V9_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        { cui: numericCui, data: new Date().toISOString().slice(0, 10) },
      ]),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) {
      return { ok: false, error: `ANAF HTTP ${response.status}` }
    }
    const text = await response.text()
    if (!text) return { ok: false, error: "ANAF răspuns gol." }
    const payload = JSON.parse(text) as AnafV9Response
    if (Array.isArray(payload.notFound) && payload.notFound.includes(numericCui)) {
      return { ok: false, error: `CUI ${cui} negăsit în ANAF.` }
    }
    const record = payload.found?.find((e) => e.date_generale?.cui === numericCui)
    if (!record?.date_generale) {
      return { ok: false, error: "ANAF nu a returnat date pentru CUI." }
    }
    return {
      ok: true,
      data: {
        cui,
        companyName: record.date_generale.denumire ?? null,
        mainCaen: record.date_generale.cod_CAEN ?? null,
        legalForm: record.date_generale.forma_juridica ?? null,
        registeredAddress: record.date_generale.adresa ?? null,
        fiscalStatus: record.stare_inactiv?.statusInactivi
          ? "INACTIVĂ"
          : (record.date_generale.stare_inregistrare ?? null),
        vatRegistered: Boolean(record.inregistrare_scop_Tva?.scpTVA),
        efacturaRegistered: Boolean(record.date_generale.statusRO_e_Factura),
        registrationNumber: record.date_generale.nrRegCom ?? null,
      },
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "ANAF fetch error.",
    }
  }
}

// ── ONRC RECOM SOAP (gated by env, paid subscription) ──────────────────────
//
// Endpoint real: https://portaljust.ro/api/recom (necesită OAuth2 + plată).
// Pentru MVP, dacă ONRC_RECOM_TOKEN nu e setat, returnăm not-implemented.
// În producție, partner SaaS poate adăuga subscripția lor și folosi pass-through.

const RECOM_API_URL = process.env.ONRC_RECOM_API_URL ?? "https://portaljust.ro/api/recom/v1"
const RECOM_TOKEN = process.env.ONRC_RECOM_TOKEN

export type RecomFetchResult = {
  ok: boolean
  associates?: OnrcAssociate[]
  error?: string
  /** Mod operare: "live" = chemat API real, "missing-creds" = nu există token. */
  mode: "live" | "missing-creds" | "error"
}

/**
 * Apel RECOM real — necesită ONRC_RECOM_TOKEN env var. În absența acestuia
 * returnăm un mode="missing-creds" pentru ca UI să afișeze flow manual input.
 *
 * Implementare placeholder: dacă token-ul există, încercăm un GET simplu.
 * Realul API RECOM este SOAP/XML și schema variază — partener trebuie să-l
 * customizeze cu credențialele lor.
 */
export async function fetchRecomAssociates(
  rawCui: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RecomFetchResult> {
  const cui = normalizeCui(rawCui)
  if (!RECOM_TOKEN) {
    return {
      ok: false,
      mode: "missing-creds",
      error:
        "ONRC RECOM nu este conectat (necesită subscripție portaljust.ro). Introdu asociații manual din certificatul ONRC.",
    }
  }
  try {
    const response = await fetchImpl(
      `${RECOM_API_URL}/companies/${cui}/associates`,
      {
        headers: {
          Authorization: `Bearer ${RECOM_TOKEN}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15_000),
      },
    )
    if (!response.ok) {
      return {
        ok: false,
        mode: "error",
        error: `RECOM HTTP ${response.status}`,
      }
    }
    const json = (await response.json().catch(() => null)) as
      | { associates?: Array<{ idType?: string; id?: string; name?: string; ownershipPercent?: number; role?: string }> }
      | null
    if (!json || !Array.isArray(json.associates)) {
      return { ok: false, mode: "error", error: "RECOM payload invalid." }
    }
    const associates: OnrcAssociate[] = json.associates
      .filter((a) => a && typeof a.name === "string" && typeof a.ownershipPercent === "number")
      .map((a) => ({
        idType: a.idType === "CNP" || a.idType === "CUI" ? a.idType : "unknown",
        id: typeof a.id === "string" ? a.id : null,
        name: a.name!,
        ownershipPercent: Math.max(0, Math.min(100, a.ownershipPercent ?? 0)),
        role: a.role,
      }))
    return { ok: true, mode: "live", associates }
  } catch (err) {
    return {
      ok: false,
      mode: "error",
      error: err instanceof Error ? err.message : "RECOM fetch error.",
    }
  }
}

// ── Combined snapshot builder ──────────────────────────────────────────────

export type BuildSnapshotInput = {
  cui: string
  /** Asociați introduși manual de user (din certificat ONRC). */
  manualAssociates?: OnrcAssociate[]
  /** Forțează refresh ANAF chiar dacă există snapshot recent. */
  forceRefresh?: boolean
}

export type BuildSnapshotResult = {
  ok: boolean
  snapshot?: Omit<OnrcSnapshotRecord, "id" | "parsedAtISO">
  error?: string
}

export async function buildOnrcSnapshot(
  input: BuildSnapshotInput,
  fetchImpl: typeof fetch = fetch,
): Promise<BuildSnapshotResult> {
  const cui = normalizeCui(input.cui)
  if (!/^\d{2,10}$/.test(cui)) {
    return { ok: false, error: "CUI invalid (2-10 cifre)." }
  }

  const anaf = await fetchAnafCompany(cui, fetchImpl)
  const sources: OnrcDataSource[] = []
  const errors: string[] = []
  const warnings: string[] = []

  if (!anaf.ok) {
    errors.push(anaf.error ?? "ANAF eșuat.")
  } else {
    sources.push("anaf-v9")
  }

  // Try RECOM SOAP — optional
  const recom = await fetchRecomAssociates(cui, fetchImpl)
  let associates: OnrcAssociate[] = []
  if (recom.ok && recom.associates && recom.associates.length > 0) {
    associates = recom.associates
    sources.push("recom-soap")
  } else if (recom.mode === "error") {
    warnings.push(`RECOM eroare: ${recom.error ?? "?"}`)
  }

  // Manual asociați (suprascriu RECOM dacă există)
  if (input.manualAssociates && input.manualAssociates.length > 0) {
    associates = input.manualAssociates.map((a) => ({
      ...a,
      ownershipPercent: Math.max(0, Math.min(100, a.ownershipPercent)),
    }))
    if (sources.includes("recom-soap")) sources.push("mixt")
    else sources.push("manual")
  } else if (associates.length === 0 && anaf.ok) {
    warnings.push(
      "Asociații nu pot fi extrași din ANAF. Introdu-i manual din certificatul ONRC pentru a permite cross-correlation R3.",
    )
  }

  const totalOwnership = associates.reduce(
    (s, a) => s + (a.ownershipPercent ?? 0),
    0,
  )
  if (associates.length > 0 && Math.abs(totalOwnership - 100) > 2) {
    warnings.push(
      `Suma cote asociați = ${totalOwnership.toFixed(1)}% (așteptat ~100%). Verifică datele.`,
    )
  }

  const snapshot: Omit<OnrcSnapshotRecord, "id" | "parsedAtISO"> = {
    cui,
    companyName: anaf.data?.companyName ?? null,
    mainCaen: anaf.data?.mainCaen ?? null,
    legalForm: anaf.data?.legalForm ?? null,
    registeredAddress: anaf.data?.registeredAddress ?? null,
    fiscalStatus: anaf.data?.fiscalStatus ?? null,
    vatRegistered: anaf.data?.vatRegistered ?? false,
    efacturaRegistered: anaf.data?.efacturaRegistered ?? false,
    registrationNumber: anaf.data?.registrationNumber ?? null,
    associates,
    sources,
    anafFetchedAtISO: anaf.ok ? new Date().toISOString() : null,
    associatesConfirmedAtISO:
      input.manualAssociates && input.manualAssociates.length > 0
        ? new Date().toISOString()
        : null,
    // computed below by computeSnapshotDerived
    totalOwnershipPercent: 0,
    majorityOwner: null,
    isComplete: false,
    errors,
    warnings,
  }

  return { ok: true, snapshot }
}
