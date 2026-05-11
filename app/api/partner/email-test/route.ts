import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole, resolveUserMode } from "@/lib/server/auth"
import { sendEmailAlert } from "@/lib/server/email-alerts"
import { getWhiteLabelConfig } from "@/lib/server/white-label"

function normalizeRecipient(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback
  const trimmed = value.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : fallback
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager"],
      "testarea emailului live"
    )
    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      return jsonError("Testul de email este disponibil doar în modul partner.", 403, "PARTNER_ONLY")
    }

    const body = (await request.json().catch(() => ({}))) as { to?: string }
    const defaultRecipient =
      process.env.COMPLISCAN_EMAIL_TEST_TO?.trim() ||
      process.env.EMAIL_TEST_TO?.trim() ||
      session.email
    const to = normalizeRecipient(body.to, defaultRecipient)
    const whiteLabel = await getWhiteLabelConfig(session.orgId).catch(() => null)
    const cabinetName = whiteLabel?.partnerName?.trim() || session.orgName
    const result = await sendEmailAlert(to, "alert.critical", session.orgId, {
      cabinet: cabinetName,
      purpose: "DPO OS email live test",
      sentBy: session.email,
      generatedAtISO: new Date().toISOString(),
    })

    return NextResponse.json({
      ok: result.ok,
      channel: result.channel,
      resendConfigured: result.channel === "resend",
      recipient: to,
      from: process.env.ALERT_EMAIL_FROM ?? "CompliScan Alerts <onboarding@resend.dev>",
      error: result.error,
      message:
        result.ok && result.channel === "resend"
          ? "Email test trimis prin Resend."
          : result.channel === "resend"
            ? "Resend este configurat, dar trimiterea testului a fost refuzată."
            : "RESEND_API_KEY lipsește; testul a fost logat în consolă pentru dev/local.",
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError(
      error instanceof Error ? error.message : "Testul de email a eșuat.",
      500,
      "EMAIL_TEST_FAILED"
    )
  }
}
