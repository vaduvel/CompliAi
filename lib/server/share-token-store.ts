// Sprint 9 — Signed share tokens for public compliance sharing
// Self-contained (no storage needed): token embeds orgId + recipientType + expiry + HMAC.
// Works on Vercel without persistent storage.

import { createHmac } from "crypto"

export type ShareTokenPayload = {
  orgId: string
  recipientType: "accountant" | "counsel" | "partner"
  documentId?: string
  documentTitle?: string
  createdAtISO: string
  expiresAtISO: string
}

function getShareSecret(): string {
  return (
    process.env.SHARE_TOKEN_SECRET ??
    process.env.CRON_SECRET ??
    "compli-share-dev-fallback"
  )
}

function b64url(s: string): string {
  return Buffer.from(s, "utf-8").toString("base64url")
}

function fromB64url(s: string): string {
  return Buffer.from(s, "base64url").toString("utf-8")
}

/**
 * Generate a signed share token (self-contained, no storage needed).
 * Format: base64url(JSON payload) + "." + base64url(HMAC-SHA256)
 */
export function generateSignedShareToken(
  orgId: string,
  recipientType: ShareTokenPayload["recipientType"],
  nowISO: string,
  document?: { documentId?: string | null; documentTitle?: string | null }
): string {
  const expiresAt = new Date(new Date(nowISO).getTime() + 72 * 3_600_000)
  const payload: ShareTokenPayload = {
    orgId,
    recipientType,
    ...(document?.documentId ? { documentId: document.documentId } : {}),
    ...(document?.documentTitle ? { documentTitle: document.documentTitle } : {}),
    createdAtISO: nowISO,
    expiresAtISO: expiresAt.toISOString(),
  }

  const encoded = b64url(JSON.stringify(payload))
  const sig = createHmac("sha256", getShareSecret()).update(encoded).digest("base64url")
  return `${encoded}.${sig}`
}

/**
 * Resolve and validate a signed share token.
 * Returns null if signature invalid or token expired.
 */
export function resolveSignedShareToken(token: string): ShareTokenPayload | null {
  try {
    const lastDot = token.lastIndexOf(".")
    if (lastDot === -1) return null

    const encoded = token.slice(0, lastDot)
    const sig = token.slice(lastDot + 1)

    const expected = createHmac("sha256", getShareSecret()).update(encoded).digest("base64url")

    // Constant-time comparison
    if (expected.length !== sig.length) return null
    let diff = 0
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
    }
    if (diff !== 0) return null

    const json = fromB64url(encoded)
    const payload = JSON.parse(json) as ShareTokenPayload

    if (!payload.orgId || !payload.recipientType || !payload.expiresAtISO) return null
    if (new Date(payload.expiresAtISO).getTime() < Date.now()) return null

    return payload
  } catch {
    return null
  }
}
