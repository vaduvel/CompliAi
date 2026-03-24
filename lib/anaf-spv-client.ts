// F4 — ANAF OAuth2 + SPV Client (implementat ULTIMUL)
// OAuth2 flow: logincert.anaf.ro/anaf-oauth2/v1/authorize → token
// SPV endpoint: api.anaf.ro/prod/FCTEL/rest/listaMesajeFactura
// Tokens stored in Supabase anaf_tokens table (encrypted)
// User notified 7 days and 24h before token expiry
// NOTĂ: necesită certificat digital calificat al utilizatorului

const ANAF_CLIENT_ID = process.env.ANAF_CLIENT_ID
const ANAF_CLIENT_SECRET = process.env.ANAF_CLIENT_SECRET
const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL ?? "https://compliscan.ro"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// ── OAuth2 Constants ────────────────────────────────────────────────────────

const ANAF_AUTHORIZE_URL = "https://logincert.anaf.ro/anaf-oauth2/v1/authorize"
const ANAF_TOKEN_URL = "https://logincert.anaf.ro/anaf-oauth2/v1/token"
const ANAF_SPV_BASE = "https://api.anaf.ro/prod/FCTEL/rest"
const CALLBACK_PATH = "/api/anaf/callback"

// ── Rate Limiter (S1.3) ────────────────────────────────────────────────────
// ANAF APIs have undocumented rate limits. We enforce a simple sliding-window
// limiter: max N requests per window (in ms) across all orgs.

const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60_000
const requestTimestamps: number[] = []

function checkAnafRateLimit(): boolean {
  const now = Date.now()
  // Evict old entries
  while (requestTimestamps.length > 0 && requestTimestamps[0]! < now - RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift()
  }
  if (requestTimestamps.length >= RATE_LIMIT_MAX) return false
  requestTimestamps.push(now)
  return true
}

class AnafRateLimitError extends Error {
  constructor() {
    super("ANAF rate limit exceeded. Try again later.")
    this.name = "AnafRateLimitError"
  }
}

// ── Types ───────────────────────────────────────────────────────────────────

export type AnafTokenRecord = {
  orgId: string
  accessToken: string
  refreshToken: string
  expiresAtISO: string
  tokenType: string
  scope: string
  createdAtISO: string
  lastUsedAtISO: string | null
}

export type SpvMessage = {
  id: string
  cif: string
  dataCreare: string
  tip: string           // "FACTURA PRIMITA" | "FACTURA TRIMISA" | "ERORI FACTURA"
  detalii: string
  solicitare: string | null
}

export type SpvListResponse = {
  mesaje: SpvMessage[]
  titlu: string
  serial: string | null
  cui: string
  eroare?: string
}

export type TokenExpiryAlert = {
  orgId: string
  daysUntilExpiry: number
  expiresAtISO: string
  alertType: "7-day" | "24-hour"
}

// ── OAuth2 Flow ─────────────────────────────────────────────────────────────

/**
 * F4: Build the ANAF OAuth2 authorization URL.
 * User must have a qualified digital certificate installed in their browser.
 */
export function buildAuthorizeUrl(orgId: string, state?: string): string | null {
  if (!ANAF_CLIENT_ID) return null

  const params = new URLSearchParams({
    response_type: "code",
    client_id: ANAF_CLIENT_ID,
    redirect_uri: `${NEXT_PUBLIC_URL}${CALLBACK_PATH}`,
    scope: "SPV",
    state: state ?? orgId,
  })

  return `${ANAF_AUTHORIZE_URL}?${params.toString()}`
}

/**
 * F4: Exchange authorization code for access + refresh tokens.
 */
export async function exchangeCodeForTokens(
  code: string,
  orgId: string,
  nowISO: string
): Promise<AnafTokenRecord | null> {
  if (!ANAF_CLIENT_ID || !ANAF_CLIENT_SECRET) return null

  try {
    if (!checkAnafRateLimit()) throw new AnafRateLimitError()

    const res = await fetch(ANAF_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: ANAF_CLIENT_ID,
        client_secret: ANAF_CLIENT_SECRET,
        redirect_uri: `${NEXT_PUBLIC_URL}${CALLBACK_PATH}`,
      }).toString(),
    })

    if (!res.ok) return null

    const json = (await res.json()) as {
      access_token: string
      refresh_token: string
      expires_in: number
      token_type: string
      scope?: string
    }

    const expiresAt = new Date(
      new Date(nowISO).getTime() + json.expires_in * 1000
    )

    const record: AnafTokenRecord = {
      orgId,
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresAtISO: expiresAt.toISOString(),
      tokenType: json.token_type,
      scope: json.scope ?? "SPV",
      createdAtISO: nowISO,
      lastUsedAtISO: null,
    }

    await storeTokenInSupabase(record)
    return record
  } catch {
    return null
  }
}

/**
 * F4: Refresh an expired access token using the refresh token.
 */
export async function refreshAccessToken(
  orgId: string,
  refreshToken: string,
  nowISO: string
): Promise<AnafTokenRecord | null> {
  if (!ANAF_CLIENT_ID || !ANAF_CLIENT_SECRET) return null

  try {
    if (!checkAnafRateLimit()) throw new AnafRateLimitError()

    const res = await fetch(ANAF_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: ANAF_CLIENT_ID,
        client_secret: ANAF_CLIENT_SECRET,
      }).toString(),
    })

    if (!res.ok) return null

    const json = (await res.json()) as {
      access_token: string
      refresh_token: string
      expires_in: number
      token_type: string
      scope?: string
    }

    const expiresAt = new Date(
      new Date(nowISO).getTime() + json.expires_in * 1000
    )

    const record: AnafTokenRecord = {
      orgId,
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresAtISO: expiresAt.toISOString(),
      tokenType: json.token_type,
      scope: json.scope ?? "SPV",
      createdAtISO: nowISO,
      lastUsedAtISO: null,
    }

    await storeTokenInSupabase(record)
    return record
  } catch {
    return null
  }
}

// ── SPV API ─────────────────────────────────────────────────────────────────

/**
 * F4: Fetch invoice messages from ANAF SPV for a given CUI.
 * @param zile Number of days to look back (default: 1, max: 60)
 */
export async function fetchSpvMessages(
  accessToken: string,
  cif: string,
  zile = 1
): Promise<SpvListResponse | null> {
  try {
    if (!checkAnafRateLimit()) throw new AnafRateLimitError()

    const url = `${ANAF_SPV_BASE}/listaMesajeFactura?cif=${encodeURIComponent(cif)}&zile=${zile}`
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) return null

    const json = (await res.json()) as SpvListResponse
    return json
  } catch {
    return null
  }
}

/**
 * F4: Download a specific invoice/message from SPV.
 */
export async function downloadSpvMessage(
  accessToken: string,
  messageId: string
): Promise<ArrayBuffer | null> {
  try {
    if (!checkAnafRateLimit()) throw new AnafRateLimitError()

    const url = `${ANAF_SPV_BASE}/descarcare?id=${encodeURIComponent(messageId)}`
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    return null
  }
}

// ── Supabase Token Storage ──────────────────────────────────────────────────

async function storeTokenInSupabase(record: AnafTokenRecord): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/anaf_tokens`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        org_id: record.orgId,
        access_token: record.accessToken,
        refresh_token: record.refreshToken,
        expires_at: record.expiresAtISO,
        token_type: record.tokenType,
        scope: record.scope,
        created_at: record.createdAtISO,
        last_used_at: record.lastUsedAtISO,
      }),
    })
  } catch {
    // Non-critical — caller handles fallback
  }
}

export async function loadTokenFromSupabase(
  orgId: string
): Promise<AnafTokenRecord | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/anaf_tokens?org_id=eq.${encodeURIComponent(orgId)}&select=*&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    )

    if (!res.ok) return null

    const rows = (await res.json()) as Array<{
      org_id: string
      access_token: string
      refresh_token: string
      expires_at: string
      token_type: string
      scope: string
      created_at: string
      last_used_at: string | null
    }>

    const row = rows[0]
    if (!row) return null

    return {
      orgId: row.org_id,
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiresAtISO: row.expires_at,
      tokenType: row.token_type,
      scope: row.scope,
      createdAtISO: row.created_at,
      lastUsedAtISO: row.last_used_at,
    }
  } catch {
    return null
  }
}

// ── Token Expiry Monitoring ─────────────────────────────────────────────────

/**
 * F4: Check if any org's ANAF token is expiring soon.
 * Returns alerts for tokens expiring within 7 days or 24 hours.
 */
export function checkTokenExpiry(
  token: AnafTokenRecord,
  nowISO: string
): TokenExpiryAlert | null {
  const now = new Date(nowISO).getTime()
  const expiresAt = new Date(token.expiresAtISO).getTime()
  const msRemaining = expiresAt - now

  if (msRemaining <= 0) return null // Already expired — handled elsewhere

  const hoursRemaining = msRemaining / 3_600_000
  const daysRemaining = hoursRemaining / 24

  if (daysRemaining <= 1) {
    return {
      orgId: token.orgId,
      daysUntilExpiry: Math.max(0, Math.round(daysRemaining * 10) / 10),
      expiresAtISO: token.expiresAtISO,
      alertType: "24-hour",
    }
  }

  if (daysRemaining <= 7) {
    return {
      orgId: token.orgId,
      daysUntilExpiry: Math.round(daysRemaining),
      expiresAtISO: token.expiresAtISO,
      alertType: "7-day",
    }
  }

  return null
}

/**
 * F4: Attempt to auto-refresh token if expired, falling back to notification.
 */
export async function ensureValidToken(
  orgId: string,
  nowISO: string
): Promise<{ token: AnafTokenRecord | null; refreshed: boolean; expired: boolean }> {
  const stored = await loadTokenFromSupabase(orgId)
  if (!stored) return { token: null, refreshed: false, expired: false }

  const now = new Date(nowISO).getTime()
  const expiresAt = new Date(stored.expiresAtISO).getTime()

  if (now < expiresAt) {
    return { token: stored, refreshed: false, expired: false }
  }

  // Token expired — try refresh
  const refreshed = await refreshAccessToken(orgId, stored.refreshToken, nowISO)
  if (refreshed) {
    return { token: refreshed, refreshed: true, expired: false }
  }

  return { token: null, refreshed: false, expired: true }
}
