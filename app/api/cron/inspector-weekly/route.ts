// POST /api/cron/inspector-weekly
// A5 — Weekly inspector simulation.
// Runs inspector mode for each org, emails only if verdict !== 'ready'.
// Invoked by Vercel Cron (Wednesdays 09:00 UTC).

export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { loadOrganizations } from "@/lib/server/auth"
import { normalizeComplianceState } from "@/lib/compliance/engine"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { readNis2State } from "@/lib/server/nis2-store"
import { readAlertPreferences } from "@/lib/server/alert-preferences-store"
import { runInspectorSimulation } from "@/lib/compliance/inspector-mode"
import { captureCronError, flushCronTelemetry } from "@/lib/server/sentry-cron"
import { safeRecordCronRun } from "@/lib/server/cron-status-store"

const FROM_ADDRESS = process.env.ALERT_EMAIL_FROM ?? "CompliScan Inspector <onboarding@resend.dev>"
const APP_URL = process.env.NEXT_PUBLIC_URL ?? "https://compliscan.ro"

function buildInspectorEmailHtml(
  orgName: string,
  verdict: string,
  readinessScore: number,
  criticalGaps: { topic: string; description: string }[]
): string {
  const verdictColor =
    verdict === "partial" ? "#EAB308" : "#EF4444"
  const verdictLabel =
    verdict === "partial" ? "Parțial pregătit" : "Nepregătit"

  const gapsHtml =
    criticalGaps.length > 0
      ? `<ul style="padding-left:20px">${criticalGaps
          .slice(0, 5)
          .map((g) => `<li style="margin-bottom:4px"><strong>${g.topic}</strong>: ${g.description}</li>`)
          .join("")}</ul>`
      : "<p>Nu au fost identificate gaps critice.</p>"

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#1e293b;padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:18px">CompliScan · Inspector Mode</h1>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <h2 style="margin:0 0 8px;color:#0f172a">${orgName}</h2>
    <p style="font-size:20px;font-weight:700;margin:0 0 16px">
      Verdict: <span style="color:${verdictColor}">${verdictLabel}</span>
      · Readiness: ${readinessScore}/100
    </p>
    <h3 style="margin:0 0 8px;color:#334155">Gaps critice:</h3>
    ${gapsHtml}
    <a href="${APP_URL}/dashboard/resolve"
       style="display:inline-block;margin-top:16px;background:#34D399;color:#111;padding:10px 20px;
              border-radius:8px;text-decoration:none;font-weight:600">
      Rezolvă gaps →
    </a>
    <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0">
    <p style="color:#94a3b8;font-size:12px;margin:0">
      Primești acest email doar când nu ești complet pregătit.
      <a href="${APP_URL}/dashboard/settings" style="color:#6366f1">Gestionează notificările</a>
    </p>
  </div>
</body>
</html>`
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log(`[InspectorWeekly] CONSOLE → ${to}\nSubiect: ${subject}`)
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

  const nowISO = new Date().toISOString()
  const startMs = Date.now()
  const results: { orgId: string; verdict: string | null; sent: boolean }[] = []
  let capturedCronErrors = false

  try {
    const organizations = await loadOrganizations()

    for (const org of organizations.slice(0, 50)) {
      try {
        const prefs = await readAlertPreferences(org.id)
        if (!prefs.emailEnabled || !prefs.emailAddress) {
          results.push({ orgId: org.id, verdict: null, sent: false })
          continue
        }

        const rawState = await readStateForOrg(org.id)
        if (!rawState) {
          results.push({ orgId: org.id, verdict: null, sent: false })
          continue
        }

        const state = normalizeComplianceState(rawState)
        const nis2State = await readNis2State(org.id)
        const result = runInspectorSimulation(state, nis2State, nowISO)

        // Only email if not ready
        if (result.overallVerdict === "ready") {
          results.push({ orgId: org.id, verdict: "ready", sent: false })
          continue
        }

        const criticalGaps = result.criticalGaps.map((gap) => ({
          topic: gap.topic,
          description: gap.description,
        }))

        const html = buildInspectorEmailHtml(
          org.name,
          result.overallVerdict,
          result.readinessScore,
          criticalGaps
        )

        const ok = await sendEmail(
          prefs.emailAddress,
          `[CompliScan] Inspector: ${result.overallVerdict === "partial" ? "Parțial pregătit" : "Nepregătit"} · ${org.name}`,
          html
        )

        results.push({ orgId: org.id, verdict: result.overallVerdict, sent: ok })
      } catch (err) {
        captureCronError(err, {
            cron: "/api/cron/inspector-weekly",
            orgId: org.id,
            step: "org-run",
          })
        capturedCronErrors = true
        results.push({ orgId: org.id, verdict: null, sent: false })
      }
    }

    if (capturedCronErrors) await flushCronTelemetry()

    const sent = results.filter((r) => r.sent).length
    const ready = results.filter((r) => r.verdict === "ready").length
    const partial = results.filter((r) => r.verdict === "partial").length
    const notReady = results.filter((r) => r.verdict && r.verdict !== "ready" && r.verdict !== "partial").length
    console.log(`[InspectorWeekly] ${sent} alerte, ${results.length - sent} sărite`)

    await safeRecordCronRun({
      name: "inspector-weekly",
      lastRunAtISO: nowISO,
      ok: !capturedCronErrors,
      durationMs: Date.now() - startMs,
      summary: `${sent} alerte trimise (${partial} partial, ${notReady} nepregătiți), ${ready} ready, ${results.length - sent} sărite.`,
      stats: {
        sent,
        ready,
        partial,
        notReady,
        total: results.length,
      },
      errorMessage: capturedCronErrors ? "One or more orgs failed (see Sentry)" : undefined,
    })

    return NextResponse.json({ ok: true, sent, total: results.length })
  } catch (error) {
    captureCronError(error, { cron: "/api/cron/inspector-weekly", step: "critical" })
    await flushCronTelemetry()
    const msg = error instanceof Error ? error.message : "unknown"
    await safeRecordCronRun({
      name: "inspector-weekly",
      lastRunAtISO: nowISO,
      ok: false,
      durationMs: Date.now() - startMs,
      summary: `Eroare critică: ${msg}`,
      stats: { processed: results.length },
      errorMessage: msg,
    })
    return jsonError("Eroare la inspector weekly.", 500, "INSPECTOR_WEEKLY_FAILED")
  }
}
