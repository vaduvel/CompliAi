// S1.8 — Email notifications cabinet on patron magic-link action.
// Trimitere email branduit cabinet (white-label) când patronul:
//  - aproba documentul       → POST /api/shared/[token]/approve
//  - respinge cu motivare    → POST /api/shared/[token]/reject
//  - trimite comentariu      → POST /api/shared/[token]/comment
//
// Folosește Resend HTTP API. Fallback console.log dacă RESEND_API_KEY lipsește.

import { getOrganizationOwnership } from "@/lib/server/auth"
import { getWhiteLabelConfig, type WhiteLabelConfig } from "@/lib/server/white-label"

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_ADDRESS =
  process.env.COMPLISCAN_CABINET_EMAIL_FROM ??
  process.env.ALERT_EMAIL_FROM ??
  "CompliScan <onboarding@resend.dev>"

export type MagicLinkEventType = "approved" | "rejected" | "commented"

export type MagicLinkEmailPayload = {
  documentId: string
  documentTitle: string
  documentType: string
  recipientType: "accountant" | "counsel" | "partner"
  occurredAtISO: string
  // doar pentru rejected/commented
  comment?: string
  authorName?: string
}

const EVENT_LABEL: Record<MagicLinkEventType, string> = {
  approved: "Document aprobat de patron",
  rejected: "Document respins de patron",
  commented: "Comentariu nou de la patron",
}

const EVENT_TONE: Record<MagicLinkEventType, { color: string; emoji: string; verb: string }> = {
  approved: { color: "#10b981", emoji: "✅", verb: "a aprobat" },
  rejected: { color: "#ef4444", emoji: "❌", verb: "a respins" },
  commented: { color: "#6366f1", emoji: "💬", verb: "a trimis un comentariu pentru" },
}

const RECIPIENT_LABEL: Record<MagicLinkEmailPayload["recipientType"], string> = {
  accountant: "Contabil",
  counsel: "Consilier juridic",
  partner: "Partener",
}

function envValue(name: string): string | null {
  return process.env[name]?.trim() || null
}

/**
 * Determină destinatarul emailului (cabinet/consultant).
 * Prioritate: env override → owner.email din auth graph.
 * Returnează null dacă nu există destinatar valid.
 */
async function resolveCabinetEmail(orgId: string): Promise<string | null> {
  const envOverride = envValue("COMPLISCAN_CABINET_NOTIFICATION_EMAIL")
  if (envOverride) return envOverride

  try {
    const ownership = await getOrganizationOwnership(orgId)
    if (ownership.ownerState === "claimed" && ownership.owner.type === "user") {
      return ownership.owner.email
    }
  } catch {
    // ownership lookup failed — silent fallback
  }

  // ultimul resort: env consultant (folosit pe pagina /shared)
  return envValue("COMPLISCAN_CONSULTANT_EMAIL")
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function buildEmailHtml(
  event: MagicLinkEventType,
  payload: MagicLinkEmailPayload,
  whiteLabel: WhiteLabelConfig,
  orgName: string
): string {
  const tone = EVENT_TONE[event]
  const cabinetName = whiteLabel.partnerName?.trim() || "Cabinet DPO"
  const brandColor = whiteLabel.brandColor || "#6366f1"
  const recipientLabel = RECIPIENT_LABEL[payload.recipientType]
  const occurred = new Date(payload.occurredAtISO).toLocaleString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const commentBlock =
    payload.comment && payload.comment.trim()
      ? `
    <div style="margin:18px 0;padding:16px 18px;background:#f8fafc;border-left:3px solid ${brandColor};border-radius:0 6px 6px 0">
      ${payload.authorName ? `<p style="margin:0 0 6px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.06em">${escapeHtml(payload.authorName)}</p>` : ""}
      <p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeHtml(payload.comment.trim())}</p>
    </div>`
      : ""

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a">
  <div style="background:${brandColor};padding:18px 24px;border-radius:8px 8px 0 0;display:flex;align-items:center;gap:10px">
    <span style="font-size:18px">${tone.emoji}</span>
    <h1 style="color:#fff;margin:0;font-size:16px;font-weight:600">${escapeHtml(cabinetName)}</h1>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;background:#fff">
    <p style="margin:0 0 6px;color:${tone.color};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em">${EVENT_LABEL[event]}</p>
    <h2 style="margin:0 0 14px;color:#0f172a;font-size:18px;font-weight:600;line-height:1.35">
      ${escapeHtml(recipientLabel)}-ul ${tone.verb} <span style="color:${brandColor}">${escapeHtml(payload.documentTitle)}</span>
    </h2>
    <p style="margin:0 0 4px;color:#64748b;font-size:13px">
      Client: <strong style="color:#0f172a">${escapeHtml(orgName)}</strong>
    </p>
    <p style="margin:0;color:#64748b;font-size:13px">
      Data: <strong style="color:#0f172a">${occurred}</strong>
    </p>
    ${commentBlock}
    <hr style="margin:22px 0;border:none;border-top:1px solid #e2e8f0">
    <p style="color:#64748b;font-size:13px;margin:0 0 14px">
      Vezi statusul complet și istoricul magic links în dashboard:
    </p>
    <a href="https://compliscanag.vercel.app/dashboard/magic-links" style="display:inline-block;padding:10px 18px;background:${brandColor};color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">
      Deschide dashboard
    </a>
    <p style="color:#94a3b8;font-size:11px;margin:22px 0 0">
      Notificare automată CompliScan · acțiunea e deja salvată în Audit Trail
    </p>
  </div>
</body>
</html>`
}

export async function sendCabinetMagicLinkEmail(
  orgId: string,
  event: MagicLinkEventType,
  payload: MagicLinkEmailPayload
): Promise<{ ok: boolean; channel: "resend" | "console" | "skipped"; error?: string }> {
  const to = await resolveCabinetEmail(orgId)
  if (!to) {
    console.warn(`[cabinet-magic-link-email] No recipient for org ${orgId} (event=${event})`)
    return { ok: false, channel: "skipped", error: "no recipient" }
  }

  const whiteLabel = await getWhiteLabelConfig(orgId).catch(() => null)
  // orgName: cab name (white-label.partnerName) sau fallback la organization.name
  let orgName = whiteLabel?.partnerName?.trim() || ""
  if (!orgName) {
    try {
      const ownership = await getOrganizationOwnership(orgId)
      orgName = ownership.orgName
    } catch {
      orgName = orgId
    }
  }

  const subject = `[${EVENT_LABEL[event]}] ${payload.documentTitle}`
  const html = buildEmailHtml(
    event,
    payload,
    whiteLabel ?? {
      orgId,
      partnerName: "",
      tagline: null,
      logoUrl: null,
      brandColor: "#6366f1",
      aiEnabled: true,
      signatureUrl: null,
      signerName: null,
      icpSegment: null,
      updatedAtISO: null,
    },
    orgName
  )

  if (!RESEND_API_KEY) {
    console.log(
      `[cabinet-magic-link-email] EMAIL → ${to} | event=${event} | doc=${payload.documentTitle} | orgId=${orgId}`
    )
    return { ok: true, channel: "console" }
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject,
        html,
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`[cabinet-magic-link-email] Resend error ${res.status}: ${err}`)
      return { ok: false, channel: "resend", error: `HTTP ${res.status}: ${err}` }
    }

    const data = (await res.json()) as { id?: string }
    console.log(`[cabinet-magic-link-email] Email trimis → ${to} (id=${data.id ?? "?"})`)
    return { ok: true, channel: "resend" }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch failed"
    console.error(`[cabinet-magic-link-email] Resend exception: ${msg}`)
    return { ok: false, channel: "resend", error: msg }
  }
}
