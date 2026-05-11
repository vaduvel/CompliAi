// Email alert dispatch — Resend HTTP API
// Falls back to console.log if RESEND_API_KEY is not configured.
//
// Setup:
//   1. Create free account at resend.com
//   2. Add RESEND_API_KEY=re_... to .env.local
//   3. Optionally set ALERT_EMAIL_FROM (default: alerts@compliscan.ro)

import type { AlertEventType } from "@/lib/server/alert-preferences-store"

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_ADDRESS = process.env.ALERT_EMAIL_FROM ?? "CompliScan Alerts <onboarding@resend.dev>"

const EVENT_LABELS: Record<AlertEventType, string> = {
  "drift.detected": "Drift de conformitate detectat",
  "task.overdue": "Sarcina de remediere depășită",
  "alert.critical": "Alertă critică de conformitate",
  "score.dropped": "Scorul de conformitate a scăzut",
}

function buildEmailHtml(event: AlertEventType, orgId: string, payload: Record<string, unknown>): string {
  const label = EVENT_LABELS[event] ?? event
  const payloadLines = Object.entries(payload)
    .map(([k, v]) => `<tr><td style="padding:4px 8px;color:#666">${k}</td><td style="padding:4px 8px">${String(v)}</td></tr>`)
    .join("")

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#1e293b;padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:18px">CompliScan</h1>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <h2 style="margin:0 0 16px;color:#0f172a">${label}</h2>
    <p style="color:#475569;margin:0 0 16px">
      Organizatie: <strong>${orgId}</strong><br>
      Data: <strong>${new Date().toLocaleString("ro-RO")}</strong>
    </p>
    ${payloadLines ? `
    <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:6px">
      ${payloadLines}
    </table>
    ` : ""}
    <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0">
    <p style="color:#94a3b8;font-size:12px;margin:0">
      Notificare automata CompliScan &mdash;
      <a href="https://compliscan.ro/dashboard/settings" style="color:#6366f1">Gestioneaza notificarile</a>
    </p>
  </div>
</body>
</html>`
}

export async function sendEmailAlert(
  to: string,
  event: AlertEventType,
  orgId: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; channel: "resend" | "console"; error?: string }> {
  const label = EVENT_LABELS[event] ?? event

  if (!RESEND_API_KEY) {
    // Fallback: log la stdout (util in dev fara Resend configurat)
    console.log(
      `[CompliScan Alert] EMAIL → ${to} | event=${event} | org=${orgId} | payload=${JSON.stringify(payload)}`
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
        subject: `[CompliScan] ${label}`,
        html: buildEmailHtml(event, orgId, payload),
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`[CompliScan Alert] Resend error ${res.status}: ${err}`)
      return { ok: false, channel: "resend", error: `HTTP ${res.status}: ${err}` }
    }

    const data = await res.json() as { id?: string }
    console.log(`[CompliScan Alert] Email trimis via Resend → ${to} (id=${data.id})`)
    return { ok: true, channel: "resend" }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch failed"
    console.error(`[CompliScan Alert] Resend exception: ${msg}`)
    return { ok: false, channel: "resend", error: msg }
  }
}
