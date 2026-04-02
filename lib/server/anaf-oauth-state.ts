import crypto from "node:crypto"

import { sanitizeInternalRoute } from "@/lib/compliscan/internal-route"

export type AnafOauthState = {
  orgId: string
  returnTo: string
  issuedAtISO: string
}

const OAUTH_STATE_SECRET =
  process.env.COMPLISCAN_SESSION_SECRET?.trim() || "compliscan-local-anaf-oauth-state"

export function encodeAnafOauthState(payload: AnafOauthState): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")
  const signature = signPayload(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export function decodeAnafOauthState(value: string | null | undefined): AnafOauthState | null {
  if (!value) return null
  const [encodedPayload, signature] = value.split(".")
  if (!encodedPayload || !signature) return null
  const expectedSignature = signPayload(encodedPayload)
  if (signature.length !== expectedSignature.length) {
    return null
  }
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<AnafOauthState>
    if (!parsed.orgId || !parsed.returnTo || !parsed.issuedAtISO) return null
    const issuedAtMs = new Date(parsed.issuedAtISO).getTime()
    if (!Number.isFinite(issuedAtMs) || Date.now() - issuedAtMs > 30 * 60 * 1000) {
      return null
    }
    return {
      orgId: parsed.orgId,
      returnTo: sanitizeInternalReturnTo(parsed.returnTo),
      issuedAtISO: parsed.issuedAtISO,
    }
  } catch {
    return null
  }
}

export function sanitizeInternalReturnTo(value: string | null | undefined): string {
  return sanitizeInternalRoute(value, "/dashboard/fiscal?tab=transmitere")
}

function signPayload(value: string): string {
  return crypto.createHmac("sha256", OAUTH_STATE_SECRET).update(value).digest("base64url")
}
