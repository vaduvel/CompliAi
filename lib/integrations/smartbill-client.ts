// SmartBill REST API client (read-side pentru compliance use case).
//
// SmartBill API este self-serve: user-ul își ia tokenul din
// My Account > Integrations > API. Auth = HTTP Basic email:token base64.
// Rate limit oficial: 3 calls/sec.
//
// Acoperire (ce avem nevoie pentru compliance):
//   - getEFacturaStatus(series, number) — tracking status ANAF
//   - getInvoicePdf(series, number) — pentru audit pack
//   - listInvoices(period) — sync lunar
//   - listSeries() — descoperă seriile cabinetului
//
// Notă: SmartBill API e primary write-oriented (createInvoice/createPayment),
// dar expune și read pentru status și pdf. Pentru list invoices folosim
// query cu interval de date.
//
// Pure-function — caller-ul gestionează rate-limit retry și storage.

const SMARTBILL_BASE_URL = "https://ws.smartbill.ro/SBORO/api"

const SMARTBILL_RATE_LIMIT_PER_SEC = 3
const SMARTBILL_TIMEOUT_MS = 15_000

// ── Types ────────────────────────────────────────────────────────────────────

export type SmartBillCredentials = {
  email: string
  token: string
  cif: string  // CUI cabinet — folosit ca companyVatCode în query
}

export type SmartBillEFacturaStatus =
  | "de_trimis"        // De trimis
  | "in_curs"          // In curs de trimitere
  | "in_validare"      // In validare ANAF
  | "valida"           // Valida (acceptată)
  | "cu_eroare"        // Cu eroare (respinsă)
  | "necunoscut"       // Status nemapat

export type SmartBillInvoice = {
  series: string
  number: string
  issueDate: string         // ISO date
  total: number
  totalVat: number
  currency: string
  clientName?: string
  clientCif?: string
  efacturaStatus?: SmartBillEFacturaStatus
  efacturaErrorMessage?: string
  paymentStatus?: "achitata" | "neachitata" | "partial"
  pdfUrl?: string
}

export type SmartBillSeries = {
  name: string                  // ex: "FACT"
  type: "factura" | "proforma" | "chitanta" | "aviz" | "other"
  nextNumber: number
}

export type SmartBillError = {
  code: string
  message: string
  httpStatus?: number
}

export type SmartBillResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: SmartBillError }

// ── Auth ─────────────────────────────────────────────────────────────────────

function buildBasicAuthHeader(email: string, token: string): string {
  const raw = `${email}:${token}`
  // Encode în base64 (Web-compatible, nu Node Buffer)
  const encoded =
    typeof btoa === "function"
      ? btoa(raw)
      : Buffer.from(raw, "utf-8").toString("base64")
  return `Basic ${encoded}`
}

function statusFromSmartBillLabel(label: string | undefined | null): SmartBillEFacturaStatus {
  if (!label) return "necunoscut"
  const normalized = label.toLowerCase().trim()
  if (normalized.includes("trimis") && !normalized.includes("curs")) return "de_trimis"
  if (normalized.includes("curs")) return "in_curs"
  if (normalized.includes("validare")) return "in_validare"
  if (normalized === "valida" || normalized.includes("validă")) return "valida"
  if (normalized.includes("eroare") || normalized.includes("respins")) return "cu_eroare"
  return "necunoscut"
}

// ── HTTP helper ──────────────────────────────────────────────────────────────

async function smartBillFetch<T>(
  creds: SmartBillCredentials,
  pathAndQuery: string,
  init: RequestInit = {},
): Promise<SmartBillResult<T>> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SMARTBILL_TIMEOUT_MS)

  try {
    const res = await fetch(`${SMARTBILL_BASE_URL}${pathAndQuery}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: buildBasicAuthHeader(creds.email, creds.token),
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    })

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        error: {
          code: "SB_UNAUTHORIZED",
          message: "Credențiale SmartBill invalide — verifică email + token în My Account > Integrations.",
          httpStatus: res.status,
        },
      }
    }

    if (res.status === 429) {
      return {
        ok: false,
        error: {
          code: "SB_RATE_LIMIT",
          message: "Limită SmartBill atinsă (3 cereri/sec). Reîncearcă în 1 secundă.",
          httpStatus: 429,
        },
      }
    }

    if (!res.ok) {
      return {
        ok: false,
        error: {
          code: "SB_HTTP_ERROR",
          message: `SmartBill HTTP ${res.status}.`,
          httpStatus: res.status,
        },
      }
    }

    const data = (await res.json()) as T
    return { ok: true, data }
  } catch (err) {
    return {
      ok: false,
      error: {
        code: "SB_NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Eroare de rețea către SmartBill.",
      },
    }
  } finally {
    clearTimeout(timeout)
  }
}

// ── Public methods ───────────────────────────────────────────────────────────

/**
 * Verifică credențialele prin apel /series. Dacă nu eșuează cu 401/403,
 * tokenul e valid.
 */
export async function verifySmartBillCredentials(
  creds: SmartBillCredentials,
): Promise<SmartBillResult<{ valid: boolean; seriesCount: number }>> {
  const result = await listSmartBillSeries(creds, "factura")
  if (!result.ok) return result
  return { ok: true, data: { valid: true, seriesCount: result.data.length } }
}

/**
 * Listează seriile de documente disponibile pentru companyVatCode.
 * Endpoint: /series?cif=...&type=...
 */
export async function listSmartBillSeries(
  creds: SmartBillCredentials,
  type: "factura" | "proforma" | "chitanta" | "aviz" = "factura",
): Promise<SmartBillResult<SmartBillSeries[]>> {
  const query = `/series?cif=${encodeURIComponent(creds.cif)}&type=${type}`
  type Raw = { list?: Array<{ name: string; nextNumber?: string | number; type?: string }> }
  const result = await smartBillFetch<Raw>(creds, query)
  if (!result.ok) return result

  const items = (result.data.list ?? []).map<SmartBillSeries>((row) => ({
    name: row.name,
    type:
      row.type === "factura" || row.type === "proforma" || row.type === "chitanta" || row.type === "aviz"
        ? row.type
        : "other",
    nextNumber: typeof row.nextNumber === "number" ? row.nextNumber : parseInt(String(row.nextNumber ?? "0"), 10) || 0,
  }))

  return { ok: true, data: items }
}

/**
 * Verifică statusul e-Factura pentru o factură anume.
 * Endpoint: /invoice/paymentstatus?cif=...&seriesname=...&number=...
 *
 * SmartBill returnează: { invoiceTotalAmount, paidAmount, unpaidAmount, paid }
 * Pentru e-Factura status concretă, folosim /invoice/efactura/status (similar pattern).
 */
export async function getEFacturaStatus(
  creds: SmartBillCredentials,
  series: string,
  number: string,
): Promise<SmartBillResult<{ status: SmartBillEFacturaStatus; rawLabel?: string; errorMessage?: string }>> {
  const query = `/invoice/efactura/status?cif=${encodeURIComponent(creds.cif)}&seriesname=${encodeURIComponent(series)}&number=${encodeURIComponent(number)}`
  type Raw = { status?: string; statusLabel?: string; errorMessage?: string }
  const result = await smartBillFetch<Raw>(creds, query)
  if (!result.ok) return result

  const rawLabel = result.data.statusLabel ?? result.data.status
  return {
    ok: true,
    data: {
      status: statusFromSmartBillLabel(rawLabel),
      rawLabel,
      errorMessage: result.data.errorMessage,
    },
  }
}

/**
 * Listare facturi într-un interval. Endpoint canonic SmartBill expune
 * /invoice/list cu query params: cif, startDate, endDate, page.
 *
 * NOTĂ: dacă SmartBill schimbă schema, fallback-ul e drag-drop XML.
 */
export async function listSmartBillInvoices(
  creds: SmartBillCredentials,
  startDateISO: string,
  endDateISO: string,
  page = 1,
): Promise<SmartBillResult<{ invoices: SmartBillInvoice[]; hasMore: boolean }>> {
  const query = `/invoice/list?cif=${encodeURIComponent(creds.cif)}&startDate=${startDateISO.slice(0, 10)}&endDate=${endDateISO.slice(0, 10)}&page=${page}`
  type Raw = {
    list?: Array<{
      seriesName?: string
      number?: string
      issueDate?: string
      total?: number
      vatTotal?: number
      currency?: string
      clientName?: string
      clientVatCode?: string
      efactura?: { status?: string; statusLabel?: string; errorMessage?: string }
      paid?: boolean
      partiallyPaid?: boolean
    }>
    hasMore?: boolean
  }
  const result = await smartBillFetch<Raw>(creds, query)
  if (!result.ok) return result

  const invoices = (result.data.list ?? []).map<SmartBillInvoice>((row) => {
    const efacturaStatus = row.efactura
      ? statusFromSmartBillLabel(row.efactura.statusLabel ?? row.efactura.status)
      : undefined
    return {
      series: row.seriesName ?? "",
      number: row.number ?? "",
      issueDate: row.issueDate ?? "",
      total: typeof row.total === "number" ? row.total : 0,
      totalVat: typeof row.vatTotal === "number" ? row.vatTotal : 0,
      currency: row.currency ?? "RON",
      clientName: row.clientName,
      clientCif: row.clientVatCode,
      efacturaStatus,
      efacturaErrorMessage: row.efactura?.errorMessage,
      paymentStatus: row.paid ? "achitata" : row.partiallyPaid ? "partial" : "neachitata",
    }
  })

  return {
    ok: true,
    data: {
      invoices,
      hasMore: result.data.hasMore === true,
    },
  }
}

/**
 * Descarcă PDF-ul unei facturi. Endpoint: /invoice/pdf?cif=...&seriesname=...&number=...
 * Returnează base64 string sau ArrayBuffer ce poate fi salvat în audit pack.
 */
export async function getSmartBillInvoicePdf(
  creds: SmartBillCredentials,
  series: string,
  number: string,
): Promise<SmartBillResult<{ pdfBase64: string }>> {
  const query = `/invoice/pdf?cif=${encodeURIComponent(creds.cif)}&seriesname=${encodeURIComponent(series)}&number=${encodeURIComponent(number)}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SMARTBILL_TIMEOUT_MS)
  try {
    const res = await fetch(`${SMARTBILL_BASE_URL}${query}`, {
      headers: {
        Authorization: buildBasicAuthHeader(creds.email, creds.token),
        Accept: "application/pdf, application/json",
      },
      signal: controller.signal,
    })

    if (!res.ok) {
      return {
        ok: false,
        error: {
          code: "SB_PDF_ERROR",
          message: `Nu am putut descărca PDF (HTTP ${res.status}).`,
          httpStatus: res.status,
        },
      }
    }

    const buf = await res.arrayBuffer()
    const bytes = new Uint8Array(buf)
    let binary = ""
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const pdfBase64 =
      typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64")

    return { ok: true, data: { pdfBase64 } }
  } catch (err) {
    return {
      ok: false,
      error: {
        code: "SB_PDF_NETWORK",
        message: err instanceof Error ? err.message : "Eroare de rețea la descărcare PDF.",
      },
    }
  } finally {
    clearTimeout(timeout)
  }
}

// ── Helpers exported for tests ───────────────────────────────────────────────

export const __test__ = {
  buildBasicAuthHeader,
  statusFromSmartBillLabel,
  SMARTBILL_BASE_URL,
  SMARTBILL_RATE_LIMIT_PER_SEC,
}
