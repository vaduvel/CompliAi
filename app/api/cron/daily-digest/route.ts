// POST /api/cron/daily-digest
// A4 — Conditional daily digest with anti-spam rule.
// Sends email ONLY when something changed: score drop, new findings, or upcoming deadlines.
// Invoked by Vercel Cron (daily 08:00 UTC).

export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { loadOrganizations } from "@/lib/server/auth"
import { normalizeComplianceState, computeDashboardSummary } from "@/lib/compliance/engine"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { readAlertPreferences } from "@/lib/server/alert-preferences-store"
import { getScoreDelta } from "@/lib/score-snapshot"
import { captureCronError, flushCronTelemetry } from "@/lib/server/sentry-cron"
import type { ComplianceState } from "@/lib/compliance/types"

const FROM_ADDRESS = process.env.ALERT_EMAIL_FROM ?? "CompliAI Digest <onboarding@resend.dev>"
const SCORE_DROP_THRESHOLD = -3
const DEADLINE_HORIZON_MS = 7 * 24 * 60 * 60 * 1000
const FINDING_RECENCY_MS = 24 * 60 * 60 * 1000

type DailyDigestPayload = {
  orgName: string
  scoreToday: number
  delta: number | null
  newFindings: number
  urgentDeadlines: string[]
}

function getNewFindingsCount(state: ComplianceState): number {
  const cutoff = Date.now() - FINDING_RECENCY_MS
  return state.findings.filter((f) => {
    const ts = new Date(f.createdAtISO).getTime()
    return Number.isFinite(ts) && ts > cutoff
  }).length
}

function getUrgentDeadlines(state: ComplianceState): string[] {
  const deadlines: string[] = []

  // Open high/critical drifts count as urgent deadlines
  const urgentDrifts = state.driftRecords.filter(
    (d) => d.open && (d.severity === "critical" || d.severity === "high")
  )
  for (const drift of urgentDrifts.slice(0, 3)) {
    deadlines.push(`Drift: ${drift.summary || "conformitate"}`)
  }

  // Open critical/high alerts
  const urgentAlerts = state.alerts.filter(
    (a) => a.open && (a.severity === "critical" || a.severity === "high")
  )
  for (const alert of urgentAlerts.slice(0, 2)) {
    deadlines.push(`Alertă: ${alert.message}`)
  }

  return deadlines.slice(0, 5)
}

function buildDailyDigestHtml(payload: DailyDigestPayload): string {
  const deltaText =
    payload.delta !== null && payload.delta < 0
      ? `<span style="color:#EF4444">↓ ${Math.abs(payload.delta)} puncte</span>`
      : payload.delta !== null && payload.delta > 0
        ? `<span style="color:#22C55E">↑ ${payload.delta} puncte</span>`
        : ""

  const findingsSection =
    payload.newFindings > 0
      ? `<p>📋 <strong>${payload.newFindings}</strong> findings noi în ultimele 24h</p>`
      : ""

  const deadlinesSection =
    payload.urgentDeadlines.length > 0
      ? `<p>⏰ <strong>${payload.urgentDeadlines.length}</strong> deadline-uri în 7 zile:</p>
         <ul>${payload.urgentDeadlines.map((d) => `<li>${d}</li>`).join("")}</ul>`
      : ""

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#1e293b;padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:18px">🛡 CompliAI · Digest zilnic</h1>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <h2 style="margin:0 0 8px;color:#0f172a">${payload.orgName}</h2>
    <p style="font-size:28px;font-weight:700;margin:0 0 8px;color:#0f172a">
      Scor: ${payload.scoreToday}/100 ${deltaText}
    </p>
    ${findingsSection}
    ${deadlinesSection}
    <a href="${process.env.NEXT_PUBLIC_URL ?? "https://compliai.ro"}/dashboard"
       style="display:inline-block;margin-top:16px;background:#34D399;color:#111;padding:10px 20px;
              border-radius:8px;text-decoration:none;font-weight:600">
      Deschide dashboard →
    </a>
    <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0">
    <p style="color:#94a3b8;font-size:12px;margin:0">
      Primești acest email doar când ceva se schimbă.
      <a href="${process.env.NEXT_PUBLIC_URL ?? "https://compliai.ro"}/dashboard/settings" style="color:#6366f1">Gestionează notificările</a>
    </p>
  </div>
</body>
</html>`
}

async function sendDailyDigestEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ ok: boolean; channel: "resend" | "console" }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log(`[DailyDigest] CONSOLE → ${to}\nSubiect: ${subject}`)
    return { ok: true, channel: "console" }
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      console.error(`[DailyDigest] Resend error ${res.status}`)
      return { ok: false, channel: "resend" }
    }
    return { ok: true, channel: "resend" }
  } catch (err) {
    console.error(`[DailyDigest] Resend exception: ${err instanceof Error ? err.message : String(err)}`)
    return { ok: false, channel: "resend" }
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
    const orgsToProcess = organizations.slice(0, 50)

    for (const org of orgsToProcess) {
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
        const { scoreToday, delta } = await getScoreDelta(org.id)

        const newFindings = getNewFindingsCount(state)
        const urgentDeadlines = getUrgentDeadlines(state)

        // ANTI-SPAM: only send when something actionable happened
        const hasScoreDrop = delta !== null && delta <= SCORE_DROP_THRESHOLD
        const hasNewFindings = newFindings > 0
        const hasDeadlines = urgentDeadlines.length > 0

        if (!hasScoreDrop && !hasNewFindings && !hasDeadlines) {
          results.push({ orgId: org.id, sent: false, reason: "nothing new" })
          continue
        }

        const deltaLabel = delta !== null && delta < 0 ? ` ↓${Math.abs(delta)}` : ""
        const subject = `CompliAI · Scor ${scoreToday ?? summary.score}${deltaLabel} · ${new Date().toLocaleDateString("ro-RO")}`

        const html = buildDailyDigestHtml({
          orgName: org.name,
          scoreToday: scoreToday ?? summary.score,
          delta,
          newFindings,
          urgentDeadlines,
        })

        const { ok } = await sendDailyDigestEmail(prefs.emailAddress, subject, html)
        results.push({ orgId: org.id, sent: ok })
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown"
        capturedCronErrors =
          captureCronError(err, {
            cron: "/api/cron/daily-digest",
            orgId: org.id,
            step: "org-run",
          }) || capturedCronErrors
        results.push({ orgId: org.id, sent: false, reason: msg })
      }
    }

    const sent = results.filter((r) => r.sent).length
    const skipped = results.filter((r) => !r.sent).length

    console.log(`[DailyDigest] Run completat: ${sent} trimise, ${skipped} sărite`)

    if (capturedCronErrors) {
      await flushCronTelemetry()
    }

    return NextResponse.json({ ok: true, sent, skipped, total: results.length })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown"
    console.error(`[DailyDigest] Eroare critică: ${msg}`)

    captureCronError(error, {
      cron: "/api/cron/daily-digest",
      step: "critical",
    })
    await flushCronTelemetry()

    return jsonError(`Eroare la daily digest: ${msg}`, 500, "DAILY_DIGEST_FAILED")
  }
}
