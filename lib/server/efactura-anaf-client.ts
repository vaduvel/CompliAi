// ANAF SPV e-Factura client.
// Operates in two modes controlled by environment variables:
//   mock  — current behaviour (no ANAF credentials configured)
//   real  — live ANAF SPV API calls when ANAF_CLIENT_ID + ANAF_CLIENT_SECRET are set
//
// OAuth2 token endpoint: https://logincert.anaf.ro/anaf-oauth2/v1/token
// Upload endpoint:       https://api.anaf.ro/prod/FCTEL/rest/upload
// Status endpoint:       https://api.anaf.ro/prod/FCTEL/rest/stareMesaj?id_incarcare=...

const ANAF_CLIENT_ID = process.env.ANAF_CLIENT_ID
const ANAF_CLIENT_SECRET = process.env.ANAF_CLIENT_SECRET
const ANAF_REDIRECT_URI = process.env.ANAF_REDIRECT_URI ?? "https://app.compliscan.ro/api/integrations/efactura/callback"
const ANAF_TOKEN_URL = "https://logincert.anaf.ro/anaf-oauth2/v1/token"
const ANAF_UPLOAD_URL = "https://api.anaf.ro/prod/FCTEL/rest/upload"
const ANAF_STATUS_URL = "https://api.anaf.ro/prod/FCTEL/rest/stareMesaj"

export type AnafMode = "mock" | "real"

export function getAnafMode(): AnafMode {
  return ANAF_CLIENT_ID && ANAF_CLIENT_SECRET ? "real" : "mock"
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
  assertRealMode()

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
  assertRealMode()

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
 * Submit a UBL XML invoice to ANAF SPV.
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

  const url = `${ANAF_UPLOAD_URL}?standard=UBL&cif=${params.cif}`
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

  const url = `${ANAF_STATUS_URL}?id_incarcare=${params.uploadIndex}`
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

function assertRealMode() {
  if (getAnafMode() !== "real") {
    throw new AnafClientError(
      "ANAF_CLIENT_ID și ANAF_CLIENT_SECRET nu sunt configurate.",
      "E002"
    )
  }
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
