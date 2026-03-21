// POST /api/cron/audit-pack-monthly
// A5 — Monthly audit pack generation reminder.
// Emails orgs with Pro/Partner plan a link to download their audit pack.
// Invoked by Vercel Cron (1st of month, 09:00 UTC).

export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { loadOrganizations } from "@/lib/server/auth"
import { readAlertPreferences } from "@/lib/server/alert-preferences-store"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { normalizeComplianceState, computeDashboardSummary } from "@/lib/compliance/engine"
import { captureCronError, flushCronTelemetry } from "@/lib/server/sentry-cron"

const FROM_ADDRESS = process.env.ALERT_EMAIL_FROM ?? "CompliAI Audit <onboarding@resend.dev>"
const APP_URL = process.env.NEXT_PUBLIC_URL ?? "https://compliai.ro"

function buildAuditPackEmailHtml(orgName: string, score: number, riskLabel: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#1e293b;padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:18px">🛡 CompliAI · Audit Pack lunar</h1>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <h2 style="margin:0 0 8px;color:#0f172a">${orgName}</h2>
    <p style="color:#475569">Audit Pack-ul lunar este disponibil pentru descărcare.</p>
    <p style="color:#475569">Scor curent: <strong>${score}/100</strong> · ${riskLabel}</p>
    <a href="${APP_URL}/dashboard/reports/vault"
       style="display:inline-block;margin-top:16px;background:#34D399;color:#111;padding:10px 20px;
              border-radius:8px;text-decoration:none;font-weight:600">
      Descarcă Audit Pack →
    </a>
    <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0">
    <p style="color:#94a3b8;font-size:12px;margin:0">
      Email lunar automat CompliAI &mdash;
      <a href="${APP_URL}/dashboard/settings" style="color:#6366f1">Gestionează notificările</a>
    </p>
  </div>
</body>
</html>`
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log(`[AuditPackMonthly] CONSOLE → ${to}\nSubiect: ${subject}`)
    return true
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
      signal: AbortSignal.timeout(10_000),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("Authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return jsonError("Unauthorized.", 401, "UNAUTHORIZED")
    }
  }

  const results: { orgId: string; sent: boolean; reason?: string }[] = []
  let capturedCronErrors = false

  try {
    const organizations = await loadOrganizations()

    for (const org of organizations.slice(0, 50)) {
      try {
        const prefs = await readAlertPreferences(org.id)
        if (!prefs.emailEnabled || !prefs.emailAddress) {
          results.push({ orgId: org.id, sent: false, reason: "email disabled" })
          continue
        }

        const rawState = await readStateForOrg(org.id)
        if (!rawState) {
          results.push({ orgId: org.id, sent: false, reason: "no state" })
          continue
        }

        const state = normalizeComplianceState(rawState)
        const summary = computeDashboardSummary(state)

        const html = buildAuditPackEmailHtml(org.name, summary.score, summary.riskLabel)
        const monthLabel = new Date().toLocaleDateString("ro-RO", { month: "long", year: "numeric" })
        const ok = await sendEmail(
          prefs.emailAddress,
          `[CompliAI] Audit Pack ${monthLabel} · ${org.name}`,
          html
        )

        results.push({ orgId: org.id, sent: ok })
      } catch (err) {
        captureCronError(err, {
            cron: "/api/cron/audit-pack-monthly",
            orgId: org.id,
            step: "org-run",
          })
        capturedCronErrors = true
        results.push({ orgId: org.id, sent: false, reason: String(err) })
      }
    }

    if (capturedCronErrors) await flushCronTelemetry()

    const sent = results.filter((r) => r.sent).length
    console.log(`[AuditPackMonthly] ${sent} trimise, ${results.length - sent} sărite`)

    return NextResponse.json({ ok: true, sent, total: results.length })
  } catch (error) {
    captureCronError(error, { cron: "/api/cron/audit-pack-monthly", step: "critical" })
    await flushCronTelemetry()
    return jsonError("Eroare la audit pack monthly.", 500, "AUDIT_PACK_MONTHLY_FAILED")
  }
}
