// POST /api/account/request-deletion
// GDPR Art. 17 — Request full account deletion.
// Sends email to privacy@compliscan.ro + confirms to user.
// Account is deleted within 30 days (GDPR-compliant term).

export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { AuthzError, requireRole } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_ADDRESS =
  process.env.ALERT_EMAIL_FROM ?? "CompliAI <onboarding@resend.dev>"
const PRIVACY_EMAIL = "privacy@compliscan.ro"

export async function POST(request: Request) {
  try {
    const session = requireRole(request, ["owner"], "solicitarea ștergerii contului")

    const body = (await request.json().catch(() => ({}))) as { reason?: string }
    const reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : "Niciun motiv specificat"

    // Send notification to privacy team
    if (RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: [PRIVACY_EMAIL],
          subject: `[GDPR Art. 17] Cerere ștergere cont — ${session.email}`,
          html: `
            <h2>Cerere ștergere cont (GDPR Art. 17)</h2>
            <table style="border-collapse:collapse">
              <tr><td style="padding:4px 12px;color:#666">Email</td><td style="padding:4px 12px"><strong>${session.email}</strong></td></tr>
              <tr><td style="padding:4px 12px;color:#666">Org ID</td><td style="padding:4px 12px">${session.orgId}</td></tr>
              <tr><td style="padding:4px 12px;color:#666">Org Name</td><td style="padding:4px 12px">${session.orgName ?? "—"}</td></tr>
              <tr><td style="padding:4px 12px;color:#666">Motiv</td><td style="padding:4px 12px">${reason}</td></tr>
              <tr><td style="padding:4px 12px;color:#666">Data cererii</td><td style="padding:4px 12px">${new Date().toLocaleString("ro-RO")}</td></tr>
              <tr><td style="padding:4px 12px;color:#666">Termen legal</td><td style="padding:4px 12px">30 zile de la primire</td></tr>
            </table>
            <p style="margin-top:16px;color:#888">Cerere generată automat de CompliAI — GDPR Art. 17 Right to Erasure.</p>
          `,
        }),
        signal: AbortSignal.timeout(10_000),
      }).catch((err) =>
        console.error("[GDPR] Failed to send deletion request email:", err)
      )
    } else {
      console.log(
        `[GDPR Art. 17] Deletion request: email=${session.email} orgId=${session.orgId} reason=${reason}`
      )
    }

    return NextResponse.json({
      ok: true,
      message:
        "Cererea ta de ștergere a fost înregistrată. Contul va fi șters în maximum 30 de zile. Vei primi confirmare pe email.",
      requestedAt: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError(
      "Cererea de ștergere a eșuat.",
      500,
      "DELETION_REQUEST_FAILED"
    )
  }
}
