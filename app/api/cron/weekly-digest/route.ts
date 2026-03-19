// POST /api/cron/weekly-digest
// Sprint 13 — Weekly Digest Email cron endpoint.
// Invocat de Vercel Cron (luni 08:00 UTC) sau extern.
// Iterează org-urile cu emailEnabled + weeklyDigestEnabled, trimite via Resend.
//
// Securitate: verifică CRON_SECRET din Authorization header.
// Fără CRON_SECRET configurat → accesibil doar local (dev).

export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { loadOrganizations } from "@/lib/server/auth"
import { readAlertPreferences } from "@/lib/server/alert-preferences-store"
import { normalizeComplianceState, computeDashboardSummary } from "@/lib/compliance/engine"
import { readNis2State } from "@/lib/server/nis2-store"
import { buildDigestEmail, type WeeklyDigest, type DigestFinding } from "@/lib/server/weekly-digest"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { captureCronError, flushCronTelemetry } from "@/lib/server/sentry-cron"

const FROM_ADDRESS = process.env.ALERT_EMAIL_FROM ?? "CompliAI Digest <onboarding@resend.dev>"

async function sendDigestEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ ok: boolean; channel: "resend" | "console" }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log(`[WeeklyDigest] CONSOLE → ${to}\nSubiect: ${subject}`)
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
      console.error(`[WeeklyDigest] Resend error ${res.status}`)
      return { ok: false, channel: "resend" }
    }
    return { ok: true, channel: "resend" }
  } catch (err) {
    console.error(`[WeeklyDigest] Resend exception: ${err instanceof Error ? err.message : String(err)}`)
    return { ok: false, channel: "resend" }
  }
}

export async function POST(request: Request) {
  // Verifică CRON_SECRET (dacă e configurat)
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("Authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return jsonError("Unauthorized.", 401, "UNAUTHORIZED")
    }
  }

  const generatedAt = new Date().toISOString()
  const results: { orgId: string; sent: boolean; reason?: string }[] = []
  let capturedCronErrors = false

  try {
    const organizations = await loadOrganizations()

    // Procesează maxim 50 org-uri per run (limită de siguranță)
    const orgsToProcess = organizations.slice(0, 50)

    for (const org of orgsToProcess) {
      try {
        const prefs = await readAlertPreferences(org.id)

        // Sări dacă email nu e configurat sau digest e dezactivat
        if (!prefs.emailEnabled || !prefs.emailAddress) {
          results.push({ orgId: org.id, sent: false, reason: "email disabled" })
          continue
        }
        if (prefs.weeklyDigestEnabled === false) {
          results.push({ orgId: org.id, sent: false, reason: "digest disabled" })
          continue
        }

        // Construiește digest-ul
        const rawState = await readStateForOrg(org.id)
        if (!rawState) {
          results.push({ orgId: org.id, sent: false, reason: "no state" })
          continue
        }

        const state = normalizeComplianceState(rawState)
        const summary = computeDashboardSummary(state)
        const nis2State = await readNis2State(org.id)

        const openFindings: DigestFinding[] = state.findings
          .filter((f) => state.alerts.some((a) => a.findingId === f.id && a.open))
          .slice(0, 5)
          .map((f) => ({ title: f.title, category: f.category, severity: f.severity }))

        const digest: WeeklyDigest = {
          orgName: org.name,
          orgId: org.id,
          emailAddress: prefs.emailAddress,
          currentScore: summary.score,
          riskLabel: summary.riskLabel,
          openAlerts: summary.openAlerts,
          redAlerts: summary.redAlerts,
          openFindings,
          nis2: {
            openIncidents: nis2State.incidents.filter((i) => i.status === "open").length,
            pendingVendors: nis2State.vendors.filter(
              (v) => !v.hasSecurityClause || !v.hasIncidentNotification
            ).length,
            dnscStatus: nis2State.dnscRegistrationStatus ?? "not-started",
          },
          generatedAt,
        }

        const html = buildDigestEmail(digest)
        const { ok } = await sendDigestEmail(
          prefs.emailAddress,
          `[CompliAI] Digest săptămânal · ${org.name}`,
          html
        )

        results.push({ orgId: org.id, sent: ok })
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown"
        capturedCronErrors =
          captureCronError(err, {
            cron: "/api/cron/weekly-digest",
            orgId: org.id,
            step: "org-run",
          }) || capturedCronErrors
        results.push({ orgId: org.id, sent: false, reason: msg })
      }
    }

    const sent = results.filter((r) => r.sent).length
    const skipped = results.filter((r) => !r.sent).length

    console.log(`[WeeklyDigest] Run completat: ${sent} trimise, ${skipped} sărite`)

    if (capturedCronErrors) {
      await flushCronTelemetry()
    }

    return NextResponse.json({
      ok: true,
      sent,
      skipped,
      total: results.length,
      generatedAt,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown"
    console.error(`[WeeklyDigest] Eroare critică: ${msg}`)

    captureCronError(error, {
      cron: "/api/cron/weekly-digest",
      step: "critical",
    })
    await flushCronTelemetry()

    return jsonError(`Eroare la generarea digest-ului: ${msg}`, 500, "WEEKLY_DIGEST_FAILED")
  }
}
