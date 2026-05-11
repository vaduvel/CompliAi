// ANAF SPV e-Factura client.
// Operates in three explicit modes controlled by environment variables:
//   mock  — no ANAF credentials configured
//   test  — ANAF OAuth active, but all FCTEL calls go to the official ANAF test endpoints
//   real  — ANAF OAuth active and FCTEL calls go to production, only when explicitly unlocked
//
// OAuth2 token endpoint: https://logincert.anaf.ro/anaf-oauth2/v1/token
// Upload endpoints (OAuth-protected host):
//   test: https://api.anaf.ro/test/FCTEL/rest/upload
//   prod: https://api.anaf.ro/prod/FCTEL/rest/upload
// Status endpoints:
//   test: https://api.anaf.ro/test/FCTEL/rest/stareMesaj?id_incarcare=...
//   prod: https://api.anaf.ro/prod/FCTEL/rest/stareMesaj?id_incarcare=...

const ANAF_CLIENT_ID = process.env.ANAF_CLIENT_ID
const ANAF_CLIENT_SECRET = process.env.ANAF_CLIENT_SECRET
const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL ?? "https://compliscan.ro"
const ANAF_REDIRECT_URI = process.env.ANAF_REDIRECT_URI ?? `${NEXT_PUBLIC_URL}/api/anaf/callback`
const ANAF_ENV = normalizeAnafEnvironment(process.env.ANAF_ENV)
const ANAF_ALLOW_REAL_SUBMIT = process.env.ANAF_ALLOW_REAL_SUBMIT === "true"
const ANAF_TOKEN_URL = "https://logincert.anaf.ro/anaf-oauth2/v1/token"
const ANAF_FCTEL_BASE_URLS = {
  test: "https://api.anaf.ro/test/FCTEL/rest",
  prod: "https://api.anaf.ro/prod/FCTEL/rest",
} as const

export type AnafMode = "mock" | "test" | "real"
export type AnafEnvironment = "test" | "prod"

export function getAnafMode(): AnafMode {
  if (!ANAF_CLIENT_ID || !ANAF_CLIENT_SECRET) {
    return "mock"
  }

  if (ANAF_ENV === "prod" && ANAF_ALLOW_REAL_SUBMIT) {
    return "real"
  }

  return "test"
}

export function getAnafEnvironment(): AnafEnvironment {
  return ANAF_ENV
}

export function isAnafProductionUnlocked(): boolean {
  return getAnafMode() === "real"
}

export function getAnafFctelBaseUrl(): string {
  return ANAF_FCTEL_BASE_URLS[isAnafProductionUnlocked() ? "prod" : "test"]
}

// ── OAuth2 token management ──────────────────────────────────────────────────

export type AnafTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope?: string
}

/** Exchange an authorization code for an access token. */
export async function exchangeAnafCode(code: string): Promise<AnafTokenResponse> {
  assertConfiguredMode()

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: ANAF_REDIRECT_URI,
    client_id: ANAF_CLIENT_ID!,
    client_secret: ANAF_CLIENT_SECRET!,
  })

  const response = await fetch(ANAF_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new AnafClientError(`Token exchange failed ${response.status}: ${text}`, "E001")
  }

  return (await response.json()) as AnafTokenResponse
}

/** Refresh an expired access token. */
export async function refreshAnafToken(refreshToken: string): Promise<AnafTokenResponse> {
  assertConfiguredMode()

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: ANAF_CLIENT_ID!,
    client_secret: ANAF_CLIENT_SECRET!,
  })

  const response = await fetch(ANAF_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new AnafClientError(`Token refresh failed ${response.status}: ${text}`, "E003")
  }

  return (await response.json()) as AnafTokenResponse
}

// ── Invoice upload ────────────────────────────────────────────────────────────

export type AnafUploadResult = {
  /** ANAF index of charge (id_incarcare) — used to poll status */
  uploadIndex: string
  /** Raw ANAF response for audit trail */
  rawResponse: string
}

export type AnafUploadMockResult = {
  uploadIndex: "mock-0000000001"
  rawResponse: "mock"
  mock: true
}

/**
 * Detect the ANAF upload standard parameter from the XML root element.
 * Confirmed live with sandbox 2026-05-11: a CreditNote XML submitted with
 * `?standard=UBL` is rejected at XSD level ("Cannot find the declaration of
 * element 'CreditNote'"). The endpoint requires `standard=CN` for credit
 * notes — same path, different schema selector.
 */
export function detectAnafUploadStandard(xmlContent: string): "UBL" | "CN" {
  return /<(?:[\w-]+:)?CreditNote[\s>]/i.test(xmlContent) ? "CN" : "UBL"
}

/**
 * Submit a UBL XML invoice (or CreditNote) to ANAF SPV.
 * In mock mode returns a fake upload index without making any network call.
 */
export async function uploadInvoiceToAnaf(params: {
  xmlContent: string
  accessToken: string
  /** CUI of the submitting company (no RO prefix) */
  cif: string
}): Promise<AnafUploadResult | AnafUploadMockResult> {
  if (getAnafMode() === "mock") {
    return { uploadIndex: "mock-0000000001", rawResponse: "mock", mock: true }
  }

  const standard = detectAnafUploadStandard(params.xmlContent)
  const url = `${getAnafFctelBaseUrl()}/upload?standard=${standard}&cif=${params.cif}`
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/xml",
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: params.xmlContent,
    cache: "no-store",
  })

  const rawResponse = await response.text()

  if (!response.ok) {
    const code = extractAnafErrorCode(rawResponse) ?? "T001"
    throw new AnafClientError(
      `Upload failed ${response.status}: ${rawResponse.slice(0, 200)}`,
      code
    )
  }

  // ANAF returns XML with <header xmlns="mfp:anaf:dgti:efactura:răspunsUpload:v1">
  const uploadIndex = extractXmlValue(rawResponse, "index_incarcare")
  if (!uploadIndex) {
    throw new AnafClientError("Upload succeeded but no index_incarcare in response.", "T001")
  }

  return { uploadIndex, rawResponse }
}

// ── Status polling ─────────────────────────────────────────────────────────────

export type AnafInvoiceStatus =
  | "ok"
  | "nok"
  | "in_prelucrare"
  | "xml_erori"
  | "drept_id_incarcare"
  | "unknown"

export type AnafStatusResult = {
  status: AnafInvoiceStatus
  /** ANAF message in Romanian */
  message: string
  /** Downloadable response ZIP ID (when status === "ok") */
  downloadId?: string
  rawResponse: string
}

/**
 * Poll the status of a previously submitted invoice.
 * In mock mode returns a simulated "ok" response.
 */
export async function getInvoiceStatus(params: {
  uploadIndex: string
  accessToken: string
}): Promise<AnafStatusResult> {
  if (getAnafMode() === "mock" || params.uploadIndex.startsWith("mock-")) {
    return {
      status: "ok",
      message: "Mod local: factura ar fi fost acceptata.",
      rawResponse: "mock",
    }
  }

  const url = `${getAnafFctelBaseUrl()}/stareMesaj?id_incarcare=${params.uploadIndex}`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${params.accessToken}` },
    cache: "no-store",
  })

  const rawResponse = await response.text()

  if (!response.ok) {
    throw new AnafClientError(
      `Status check failed ${response.status}`,
      extractAnafErrorCode(rawResponse) ?? "T001"
    )
  }

  const statusRaw = extractXmlValue(rawResponse, "stare") ?? ""
  const message = extractXmlValue(rawResponse, "mesaj") ?? rawResponse.slice(0, 200)
  const downloadId = extractXmlValue(rawResponse, "id_descarcare")

  const status = normalizeAnafStatus(statusRaw)

  return { status, message, downloadId: downloadId || undefined, rawResponse }
}

// ── OAuth2 authorization URL builder ────────────────────────────────────────

/** Build the ANAF SPV authorization URL to redirect the user to. */
export function buildAnafAuthUrl(state: string): string {
  const base = "https://logincert.anaf.ro/anaf-oauth2/v1/authorize"
  const params = new URLSearchParams({
    response_type: "code",
    client_id: ANAF_CLIENT_ID ?? "",
    redirect_uri: ANAF_REDIRECT_URI,
    token_content_type: "jwt",
    state,
  })
  return `${base}?${params.toString()}`
}

// ── Internal helpers ──────────────────────────────────────────────────────────

export class AnafClientError extends Error {
  constructor(
    message: string,
    public readonly anafCode: string
  ) {
    super(message)
    this.name = "AnafClientError"
  }
}

function assertConfiguredMode() {
  if (getAnafMode() === "mock") {
    throw new AnafClientError(
      "ANAF_CLIENT_ID și ANAF_CLIENT_SECRET nu sunt configurate.",
      "E002"
    )
  }
}

function normalizeAnafEnvironment(value: string | undefined): AnafEnvironment {
  const normalized = value?.trim().toLowerCase()
  if (normalized === "prod" || normalized === "production" || normalized === "live") {
    return "prod"
  }
  return "test"
}

function extractXmlValue(xml: string, tag: string): string | null {
  const pattern = new RegExp(`<[^>]*${tag}[^>]*>([^<]+)<`, "i")
  return xml.match(pattern)?.[1]?.trim() ?? null
}

function extractAnafErrorCode(text: string): string | null {
  const match = text.match(/\b([A-Z]\d{3})\b/)
  return match?.[1] ?? null
}

function normalizeAnafStatus(raw: string): AnafInvoiceStatus {
  const s = raw.toLowerCase().trim()
  if (s === "ok") return "ok"
  if (s === "nok") return "nok"
  if (s.includes("prelucrare")) return "in_prelucrare"
  if (s.includes("erori")) return "xml_erori"
  if (s.includes("drept")) return "drept_id_incarcare"
  return "unknown"
}
