// Sprint 6 follow-up — Magic link pentru share finding cu contabilul intern
// al clientului.
//
// POST cu opțional { recipientEmail, recipientType, sendEmail }. Generează
// share token (HMAC-SHA256, expiry 72h) + opțional trimite email via Resend.
// Returnează URL public.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { generateSignedShareToken, type ShareTokenPayload } from "@/lib/server/share-token-store"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import type { ComplianceState } from "@/lib/compliance/types"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.compliscan.ro"
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_ADDRESS =
  process.env.ALERT_EMAIL_FROM ?? "CompliScan <onboarding@resend.dev>"

const VALID_RECIPIENT_TYPES: ShareTokenPayload["recipientType"][] = [
  "accountant",
  "counsel",
  "partner",
]

function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!local || !domain) return email
  return `${local.slice(0, 2)}***@${domain}`
}

async function sendMagicLinkEmail(
  to: string,
  url: string,
  findingTitle: string,
  orgName: string,
  expiresAt: string,
): Promise<{ ok: boolean; reason?: string }> {
  if (!RESEND_API_KEY) {
    console.log(
      `[CompliScan Magic Link] EMAIL → ${to} | url=${url} | finding="${findingTitle}"`,
    )
    return { ok: true, reason: "console-fallback" }
  }

  const expiresFormatted = new Date(expiresAt).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  })

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:18px">CompliScan Fiscal — finding partajat</h1>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;background:#fff">
    <p style="color:#475569;margin:0 0 16px;line-height:1.6">
      Cabinetul <strong>${orgName}</strong> ți-a trimis un finding fiscal pentru revizuire:
    </p>
    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:6px;padding:12px;margin-bottom:24px">
      <strong style="color:#0f172a">${findingTitle}</strong>
    </div>
    <div style="text-align:center;margin:24px 0">
      <a href="${url}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600">
        Deschide finding-ul →
      </a>
    </div>
    <p style="color:#94a3b8;font-size:12px;margin:0">
      Link-ul expiră pe <strong>${expiresFormatted}</strong>. Nu necesită cont CompliScan.
    </p>
  </div>
</body></html>`

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
        subject: `[CompliScan] Finding fiscal partajat — ${findingTitle.slice(0, 60)}`,
        html,
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      const txt = await res.text()
      return { ok: false, reason: `HTTP ${res.status}: ${txt.slice(0, 100)}` }
    }
    return { ok: true, reason: "resend" }
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "fetch failed" }
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "partajare finding fiscal",
    )
    const { id: findingId } = await context.params

    let body: {
      recipientType?: ShareTokenPayload["recipientType"]
      recipientEmail?: string
      sendEmail?: boolean
    } = {}
    try {
      body = await request.json()
    } catch {
      // empty body OK — defaults
    }

    const recipientType: ShareTokenPayload["recipientType"] =
      body.recipientType && VALID_RECIPIENT_TYPES.includes(body.recipientType)
        ? body.recipientType
        : "accountant"

    const recipientEmail = body.recipientEmail?.trim()
    const sendEmail = body.sendEmail !== false && !!recipientEmail

    const state = (await readStateForOrg(session.orgId)) as ComplianceState | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const finding = (state.findings ?? []).find((f) => f.id === findingId)
    if (!finding) {
      return jsonError("Finding-ul nu a fost găsit.", 404, "FINDING_NOT_FOUND")
    }

    const nowISO = new Date().toISOString()
    const token = generateSignedShareToken(session.orgId, recipientType, nowISO, {
      documentId: findingId,
      documentTitle: finding.title,
    })
    const url = `${APP_URL}/shared-finding/${encodeURIComponent(token)}`
    const expiresAtISO = new Date(Date.now() + 72 * 3_600_000).toISOString()

    let emailResult: { ok: boolean; reason?: string } = { ok: false, reason: "not-requested" }
    if (sendEmail && recipientEmail) {
      emailResult = await sendMagicLinkEmail(
        recipientEmail,
        url,
        finding.title,
        session.orgName,
        expiresAtISO,
      )
    }

    const actor = await resolveOptionalEventActor(request)
    const auditEvent = createComplianceEvent(
      {
        type: "fiscal.finding.shared",
        entityType: "finding",
        entityId: findingId,
        message: `Finding partajat cu ${recipientType}${recipientEmail ? ` (${maskEmail(recipientEmail)})` : ""} — link expiră 72h.`,
        createdAtISO: nowISO,
        metadata: {
          findingId,
          recipientType,
          recipientEmailMasked: recipientEmail ? maskEmail(recipientEmail) : "",
          emailSent: emailResult.ok && sendEmail,
          emailReason: emailResult.reason ?? "",
          expiresAtISO,
        },
      },
      actor,
    )

    const updated: ComplianceState = {
      ...state,
      events: appendComplianceEvents(state, [auditEvent]),
    }
    await writeStateForOrg(session.orgId, updated, session.orgName)

    return NextResponse.json({
      ok: true,
      url,
      expiresAtISO,
      recipientType,
      emailSent: emailResult.ok && sendEmail,
      emailReason: emailResult.reason ?? null,
    })
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Eroare la share.",
      500,
      "SHARE_FAILED",
    )
  }
}
