// Faza 2 — TASK 5: Monthly Digest Email
// POST /api/cron/monthly-digest
// Trimite un email lunar cu un eveniment extern real + statusul firmei.
// Sursa principală: comunicat ANSPDCP / schimbare legislativă / semnal ANAF.
// Invocat de Vercel Cron pe 3 a lunii la 09:00 UTC.

export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { loadOrganizations } from "@/lib/server/auth"
import { readAlertPreferences } from "@/lib/server/alert-preferences-store"
import { normalizeComplianceState, computeDashboardSummary } from "@/lib/compliance/engine"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { safeListNotifications } from "@/lib/server/notifications-store"
import { readDsarState } from "@/lib/server/dsar-store"
import {
  buildMonthlyDigestEmail,
  buildMonthlySubject,
  type MonthlyDigest,
  type MonthlyExternalEvent,
  type MonthlyStatusItem,
} from "@/lib/server/monthly-digest"
import { captureCronError, flushCronTelemetry } from "@/lib/server/sentry-cron"

const FROM_ADDRESS = process.env.ALERT_EMAIL_FROM ?? "CompliAI <onboarding@resend.dev>"

// ── Helpers ──────────────────────────────────────────────────────────────────

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ ok: boolean; channel: "resend" | "console" }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log(`[MonthlyDigest] CONSOLE → ${to}\nSubiect: ${subject}`)
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
      console.error(`[MonthlyDigest] Resend error ${res.status}`)
      return { ok: false, channel: "resend" }
    }
    return { ok: true, channel: "resend" }
  } catch (err) {
    console.error(`[MonthlyDigest] Resend exception: ${err instanceof Error ? err.message : String(err)}`)
    return { ok: false, channel: "resend" }
  }
}

function extractExternalEvent(
  notifications: Array<{ title: string; message: string; type: string; createdAt: string }>
): MonthlyExternalEvent | null {
  // 30-day window
  const cutoff = Date.now() - 30 * 86_400_000

  // Priority 1: ANSPDCP communication
  const anspdcp = notifications.find(
    (n) =>
      n.title.includes("ANSPDCP") &&
      new Date(n.createdAt).getTime() > cutoff
  )
  if (anspdcp) {
    return {
      type: "anspdcp",
      headline: anspdcp.message.slice(0, 150),
      cause: "Sancțiune ANSPDCP publicată pe dataprotection.ro",
      sourceLabel: "ANSPDCP",
    }
  }

  // Priority 2: Legislation change
  const legis = notifications.find(
    (n) =>
      n.title.startsWith("Schimbare legislativă") &&
      new Date(n.createdAt).getTime() > cutoff
  )
  if (legis) {
    const sursa = legis.title.replace("Schimbare legislativă: ", "")
    return {
      type: "legislation",
      headline: legis.message.slice(0, 150),
      cause: `Schimbare detectată pe sursa oficială ${sursa}`,
      sourceLabel: sursa,
    }
  }

  // Priority 3: ANAF fiscal signal
  const anaf = notifications.find(
    (n) =>
      (n.type === "anaf_signal" || n.type === "fiscal_alert") &&
      new Date(n.createdAt).getTime() > cutoff
  )
  if (anaf) {
    return {
      type: "anaf",
      headline: anaf.message.slice(0, 150),
      cause: "Semnal fiscal detectat din surse ANAF",
      sourceLabel: "ANAF",
    }
  }

  return null
}

function buildStatusItems(
  state: ReturnType<typeof normalizeComplianceState>,
  dsarCount: number
): MonthlyStatusItem[] {
  const items: MonthlyStatusItem[] = []

  // GDPR progress
  const gdprOk = state.gdprProgress >= 70
  items.push({
    label: "Conformitate GDPR",
    ok: gdprOk,
    detail: gdprOk ? `${state.gdprProgress}% — acoperire bună` : `${state.gdprProgress}% — necesită atenție`,
  })

  // Open findings
  const openFindings = (state.findings ?? []).filter(
    (f) => f.findingStatus !== "resolved" && f.findingStatus !== "dismissed"
  )
  items.push({
    label: "Findings deschise",
    ok: openFindings.length === 0,
    detail: openFindings.length === 0
      ? "Niciun finding deschis"
      : `${openFindings.length} finding-uri active`,
  })

  // DSAR
  if (dsarCount > 0) {
    items.push({
      label: "Cereri DSAR active",
      ok: false,
      detail: `${dsarCount} cereri în curs de procesare`,
    })
  } else {
    items.push({
      label: "Procedură DSAR",
      ok: true,
      detail: "Nicio cerere deschisă",
    })
  }

  // e-Factura
  if (state.efacturaConnected) {
    items.push({
      label: "Conexiune SPV",
      ok: state.efacturaSignalsCount === 0,
      detail: state.efacturaSignalsCount > 0
        ? `${state.efacturaSignalsCount} semnale active`
        : "Monitorizare activă, fără probleme",
    })
  }

  return items.slice(0, 5)
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("Authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return jsonError("Unauthorized.", 401, "UNAUTHORIZED")
    }
  }

  const generatedAt = new Date().toISOString()
  const results: { orgId: string; sent: boolean; reason?: string }[] = []

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
        const [notifications, dsarState] = await Promise.all([
          safeListNotifications(org.id),
          readDsarState(org.id),
        ])

        const openDsar = dsarState.requests.filter(
          (r) => r.status !== "responded" && r.status !== "refused"
        ).length

        const event = extractExternalEvent(notifications)
        const statusItems = buildStatusItems(state, openDsar)

        // Build CTA: if there's an event-relevant finding, link to it; otherwise dashboard
        const openFindings = (state.findings ?? []).filter(
          (f) => f.findingStatus !== "resolved" && f.findingStatus !== "dismissed"
        )
        const relevantFinding = event?.type === "anspdcp"
          ? openFindings.find((f) => f.category === "GDPR")
          : event?.type === "legislation"
            ? openFindings[0]
            : event?.type === "anaf"
              ? openFindings.find((f) => f.category === "E_FACTURA")
              : null

        const ctaHref = relevantFinding
          ? `/dashboard/actiuni/remediere?finding=${relevantFinding.id}`
          : "/dashboard"
        const ctaLabel = relevantFinding
          ? "Vezi finding-ul relevant"
          : "Deschide dashboard"

        const digest: MonthlyDigest = {
          orgName: org.name,
          emailAddress: prefs.emailAddress,
          event,
          statusItems,
          currentScore: summary.score,
          openFindings: openFindings.length,
          ctaHref,
          ctaLabel,
          generatedAt,
        }

        const html = buildMonthlyDigestEmail(digest)
        const subject = buildMonthlySubject(digest)
        const { ok } = await sendEmail(prefs.emailAddress, subject, html)

        results.push({ orgId: org.id, sent: ok })
      } catch (err) {
        captureCronError(err, {
          cron: "/api/cron/monthly-digest",
          orgId: org.id,
          step: "org-run",
        })
        results.push({
          orgId: org.id,
          sent: false,
          reason: err instanceof Error ? err.message : "unknown",
        })
      }
    }

    const sent = results.filter((r) => r.sent).length
    console.log(`[MonthlyDigest] ${sent}/${results.length} emailuri trimise`)

    return NextResponse.json({
      ok: true,
      sent,
      skipped: results.length - sent,
      total: results.length,
      generatedAt,
    })
  } catch (error) {
    captureCronError(error, { cron: "/api/cron/monthly-digest", step: "critical" })
    await flushCronTelemetry()
    return jsonError("Eroare la monthly digest.", 500, "MONTHLY_DIGEST_FAILED")
  }
}
