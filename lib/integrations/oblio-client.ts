// Oblio REST API client — OAuth 2.0 (client_credentials grant).
//
// Oblio API: https://www.oblio.eu/api
// Token: POST /api/authorize/token cu { client_id (email), client_secret (token) }
// Răspuns: { access_token, expires_in, token_type }
// Read endpoints: GET /api/docs/invoice, /api/docs/invoice/list — Bearer auth.
//
// Rate limits: 30/10s pentru read, 30/100s pentru document generation.
// Free pentru toate integrările.

const OBLIO_BASE_URL = "https://www.oblio.eu/api"
const OBLIO_TIMEOUT_MS = 15_000
const OBLIO_TOKEN_REFRESH_BUFFER_SEC = 60 // refresh dacă mai puțin de 60s rămase

// ── Types ────────────────────────────────────────────────────────────────────

export type OblioCredentials = {
  email: string
  token: string  // client_secret din Oblio Settings > Account Details
  cif: string
}

export type OblioAccessToken = {
  accessToken: string
  expiresAtISO: string
  tokenType: string
}

export type OblioEFacturaStatus =
  | "trimis"        // Trimis la ANAF, în așteptare validare
  | "validat"       // Validat ANAF (acceptat în SPV)
  | "respins"       // Respins ANAF (eroare validare)
  | "neconectat"    // Oblio neconectat la ANAF SPV
  | "necunoscut"

export type OblioInvoice = {
  series: string
  number: string
  issueDate: string
  total: number
  totalVat: number
  currency: string
  clientName?: string
  clientCif?: string
  efacturaStatus?: OblioEFacturaStatus
  efacturaErrorMessage?: string
  collectStatus?: "achitata" | "neachitata" | "partial"
  pdfLink?: string
}

export type OblioError = {
  code: string
  message: string
  httpStatus?: number
}

export type OblioResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: OblioError }

// ── Status mapping ───────────────────────────────────────────────────────────

function statusFromOblioLabel(label: string | undefined | null): OblioEFacturaStatus {
  if (!label) return "necunoscut"
  const n = label.toLowerCase().trim()
  if (n.includes("validat") || n.includes("acceptat")) return "validat"
  if (n.includes("respins") || n.includes("eroare")) return "respins"
  if (n.includes("trimis")) return "trimis"
  if (n.includes("neconectat") || n.includes("not connected")) return "neconectat"
  return "necunoscut"
}

// ── OAuth token exchange ─────────────────────────────────────────────────────

export async function fetchOblioAccessToken(
  creds: OblioCredentials,
): Promise<OblioResult<OblioAccessToken>> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), OBLIO_TIMEOUT_MS)

  try {
    const body = new URLSearchParams({
      client_id: creds.email,
      client_secret: creds.token,
    })

    const res = await fetch(`${OBLIO_BASE_URL}/authorize/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
      signal: controller.signal,
    })

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        error: {
          code: "OB_UNAUTHORIZED",
          message: "Credențiale Oblio invalide — verifică email + token în Settings > Account Details.",
          httpStatus: res.status,
        },
      }
    }

    if (!res.ok) {
      return {
        ok: false,
        error: {
          code: "OB_TOKEN_HTTP_ERROR",
          message: `Eroare la token Oblio (HTTP ${res.status}).`,
          httpStatus: res.status,
        },
      }
    }

    const json = (await res.json()) as {
      access_token?: string
      expires_in?: number
      token_type?: string
    }

    if (!json.access_token) {
      return {
        ok: false,
        error: {
          code: "OB_NO_TOKEN",
          message: "Răspunsul Oblio nu conține access_token.",
        },
      }
    }

    const expiresAt = new Date(Date.now() + (json.expires_in ?? 3600) * 1000).toISOString()
    return {
      ok: true,
      data: {
        accessToken: json.access_token,
        expiresAtISO: expiresAt,
        tokenType: json.token_type ?? "Bearer",
      },
    }
  } catch (err) {
    return {
      ok: false,
      error: {
        code: "OB_TOKEN_NETWORK",
        message: err instanceof Error ? err.message : "Eroare de rețea la token Oblio.",
      },
    }
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Returnează tokenul valid — dacă cel existent e expirat sau aproape, refresh.
 */
export async function ensureValidOblioToken(
  creds: OblioCredentials,
  existing: OblioAccessToken | undefined,
): Promise<OblioResult<OblioAccessToken>> {
  if (existing) {
    const expiresMs = new Date(existing.expiresAtISO).getTime()
    const nowMs = Date.now()
    if (expiresMs - nowMs > OBLIO_TOKEN_REFRESH_BUFFER_SEC * 1000) {
      return { ok: true, data: existing }
    }
  }
  return fetchOblioAccessToken(creds)
}

// ── HTTP helper ──────────────────────────────────────────────────────────────

async function oblioFetch<T>(
  token: OblioAccessToken,
  pathAndQuery: string,
): Promise<OblioResult<T>> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), OBLIO_TIMEOUT_MS)

  try {
    const res = await fetch(`${OBLIO_BASE_URL}${pathAndQuery}`, {
      headers: {
        Accept: "application/json",
        Authorization: `${token.tokenType} ${token.accessToken}`,
      },
      signal: controller.signal,
    })

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        error: {
          code: "OB_UNAUTHORIZED",
          message: "Token Oblio expirat sau invalid.",
          httpStatus: res.status,
        },
      }
    }

    if (res.status === 429) {
      return {
        ok: false,
        error: {
          code: "OB_RATE_LIMIT",
          message: "Limită Oblio atinsă (30/10s). Reîncearcă în 10 secunde.",
          httpStatus: 429,
        },
      }
    }

    if (!res.ok) {
      return {
        ok: false,
        error: {
          code: "OB_HTTP_ERROR",
          message: `Oblio HTTP ${res.status}.`,
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
        code: "OB_NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Eroare de rețea către Oblio.",
      },
    }
  } finally {
    clearTimeout(timeout)
  }
}

// ── Public methods ───────────────────────────────────────────────────────────

/**
 * Listare facturi într-un interval. /api/docs/invoice/list?cif=...&issuedAfter=...&issuedBefore=...
 */
export async function listOblioInvoices(
  token: OblioAccessToken,
  cif: string,
  startDateISO: string,
  endDateISO: string,
  page = 1,
): Promise<OblioResult<{ invoices: OblioInvoice[]; hasMore: boolean }>> {
  const query = `/docs/invoice/list?cif=${encodeURIComponent(cif)}&issuedAfter=${startDateISO.slice(0, 10)}&issuedBefore=${endDateISO.slice(0, 10)}&page=${page}`

  type Raw = {
    status?: string
    statusMessage?: string
    data?: Array<{
      seriesName?: string
      number?: string
      issueDate?: string
      total?: number
      totalVat?: number
      currency?: string
      client?: { name?: string; cif?: string }
      efactura?: { status?: string; statusMessage?: string; errorMessage?: string }
      collect?: { status?: string }
      link?: string
    }>
    nrPages?: number
  }

  const result = await oblioFetch<Raw>(token, query)
  if (!result.ok) return result

  const invoices = (result.data.data ?? []).map<OblioInvoice>((row) => {
    const collectStatusRaw = row.collect?.status?.toLowerCase() ?? ""
    let collectStatus: OblioInvoice["collectStatus"] = "neachitata"
    if (collectStatusRaw.includes("achitat") && !collectStatusRaw.includes("partial")) {
      collectStatus = "achitata"
    } else if (collectStatusRaw.includes("partial")) {
      collectStatus = "partial"
    }

    return {
      series: row.seriesName ?? "",
      number: row.number ?? "",
      issueDate: row.issueDate ?? "",
      total: typeof row.total === "number" ? row.total : 0,
      totalVat: typeof row.totalVat === "number" ? row.totalVat : 0,
      currency: row.currency ?? "RON",
      clientName: row.client?.name,
      clientCif: row.client?.cif,
      efacturaStatus: row.efactura
        ? statusFromOblioLabel(row.efactura.statusMessage ?? row.efactura.status)
        : undefined,
      efacturaErrorMessage: row.efactura?.errorMessage,
      collectStatus,
      pdfLink: row.link,
    }
  })

  const hasMore = (result.data.nrPages ?? 1) > page
  return { ok: true, data: { invoices, hasMore } }
}

/**
 * Detalii pentru o factură anume.
 */
export async function getOblioInvoice(
  token: OblioAccessToken,
  cif: string,
  series: string,
  number: string,
): Promise<OblioResult<OblioInvoice>> {
  const query = `/docs/invoice?cif=${encodeURIComponent(cif)}&seriesName=${encodeURIComponent(series)}&number=${encodeURIComponent(number)}`

  type Raw = {
    data?: {
      seriesName?: string
      number?: string
      issueDate?: string
      total?: number
      totalVat?: number
      currency?: string
      client?: { name?: string; cif?: string }
      efactura?: { status?: string; statusMessage?: string; errorMessage?: string }
      link?: string
    }
  }

  const result = await oblioFetch<Raw>(token, query)
  if (!result.ok) return result
  if (!result.data.data) {
    return { ok: false, error: { code: "OB_NOT_FOUND", message: "Factura nu există în Oblio." } }
  }

  const r = result.data.data
  return {
    ok: true,
    data: {
      series: r.seriesName ?? series,
      number: r.number ?? number,
      issueDate: r.issueDate ?? "",
      total: typeof r.total === "number" ? r.total : 0,
      totalVat: typeof r.totalVat === "number" ? r.totalVat : 0,
      currency: r.currency ?? "RON",
      clientName: r.client?.name,
      clientCif: r.client?.cif,
      efacturaStatus: r.efactura
        ? statusFromOblioLabel(r.efactura.statusMessage ?? r.efactura.status)
        : undefined,
      efacturaErrorMessage: r.efactura?.errorMessage,
      pdfLink: r.link,
    },
  }
}

// ── Helpers exported for tests ───────────────────────────────────────────────

export const __test__ = {
  statusFromOblioLabel,
  OBLIO_BASE_URL,
}
