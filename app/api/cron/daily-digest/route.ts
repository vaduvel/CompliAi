// POST /api/cron/daily-digest
// A4 — Conditional daily digest with anti-spam rule.
// Sends email ONLY when something changed: score drop, new findings, or upcoming deadlines.
// Invoked by Vercel Cron (daily 08:00 UTC).

export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { loadOrganizations } from "@/lib/server/auth"
import { normalizeComplianceState, computeDashboardSummary } from "@/lib/compliance/engine"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { readAlertPreferences } from "@/lib/server/alert-preferences-store"
import { getScoreDelta } from "@/lib/score-snapshot"
import { captureCronError, flushCronTelemetry } from "@/lib/server/sentry-cron"
import { safeRecordCronRun } from "@/lib/server/cron-status-store"
import { buildOrgKnowledgeStaleFinding } from "@/lib/compliance/org-knowledge"
import { buildSAFTD406Finding } from "@/lib/compliance/saft-hygiene"
import { readNis2State } from "@/lib/server/nis2-store"
import { readDsarState } from "@/lib/server/dsar-store"
import { createNotification } from "@/lib/server/notifications-store"
import type { ComplianceState } from "@/lib/compliance/types"

const FROM_ADDRESS = process.env.ALERT_EMAIL_FROM ?? "CompliScan Digest <onboarding@resend.dev>"
const SCORE_DROP_THRESHOLD = -3
const DEADLINE_HORIZON_MS = 7 * 24 * 60 * 60 * 1000
const FINDING_RECENCY_MS = 24 * 60 * 60 * 1000
const NIS2_SLA_WARN_MS = 4 * 60 * 60 * 1000    // alertă când < 4h rămase
const POLICY_EXPIRY_WARN_MS = 30 * 24 * 60 * 60 * 1000 // alertă la 30 zile înainte de expirare

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

// A2 — NIS2 SLA: detectează incidente cu deadline 24h sau 72h aproape
async function getNis2SlaDeadlines(orgId: string): Promise<string[]> {
  try {
    const nis2 = await readNis2State(orgId)
    const now = Date.now()
    const deadlines: string[] = []
    for (const incident of nis2.incidents) {
      if (incident.status === "closed") continue
      const d24 = new Date(incident.deadline24hISO).getTime()
      const d72 = new Date(incident.deadline72hISO).getTime()
      if (d24 > now && d24 - now < NIS2_SLA_WARN_MS) {
        deadlines.push(`NIS2 SLA 24h: "${incident.title}" — deadline în ${Math.ceil((d24 - now) / 3_600_000)}h`)
      } else if (d72 > now && d72 - now < NIS2_SLA_WARN_MS) {
        deadlines.push(`NIS2 SLA 72h: "${incident.title}" — deadline în ${Math.ceil((d72 - now) / 3_600_000)}h`)
      } else if (d24 < now && incident.status === "open") {
        deadlines.push(`NIS2 SLA 24h DEPĂȘIT: "${incident.title}"`)
      }
    }
    return deadlines.slice(0, 3)
  } catch {
    return []
  }
}

// A3 — Politici expirate: detectează documente care expiră în POLICY_EXPIRY_WARN_MS
function getPolicyExpiryDeadlines(state: ComplianceState): string[] {
  const now = Date.now()
  const deadlines: string[] = []
  for (const doc of state.generatedDocuments) {
    if (!doc.expiresAtISO) continue
    const exp = new Date(doc.expiresAtISO).getTime()
    if (exp > now && exp - now < POLICY_EXPIRY_WARN_MS) {
      const daysLeft = Math.ceil((exp - now) / (24 * 3_600_000))
      deadlines.push(`Document expiră în ${daysLeft} zile: "${doc.title}"`)
    } else if (exp < now) {
      deadlines.push(`Document EXPIRAT: "${doc.title}"`)
    }
  }
  return deadlines.slice(0, 2)
}

// A5 — DSAR deadline notifications: alertează la 10 zile și 3 zile înainte de expirare
const DSAR_WARN_10_DAYS_MS = 10 * 24 * 60 * 60 * 1000
const DSAR_WARN_3_DAYS_MS = 3 * 24 * 60 * 60 * 1000

async function checkDsarDeadlines(orgId: string): Promise<{ deadlines: string[]; notificationsSent: number }> {
  try {
    const dsarState = await readDsarState(orgId)
    const now = Date.now()
    const deadlines: string[] = []
    let notificationsSent = 0

    for (const req of dsarState.requests) {
      if (req.status === "responded" || req.status === "refused") continue
      const deadline = new Date(req.extendedDeadlineISO ?? req.deadlineISO).getTime()
      const remaining = deadline - now
      if (remaining < 0) {
        deadlines.push(`DSAR DEPĂȘIT: cerere ${req.requestType} de la ${req.requesterName}`)
        await createNotification(orgId, {
          type: "finding_new",
          title: `DSAR expirat: cerere ${req.requestType}`,
          message: `Termenul de 30 zile pentru cererea de ${req.requestType} de la ${req.requesterName} a expirat. Risc de amendă ANSPDCP.`,
          linkTo: "/dashboard/dsar",
        }).catch(() => {})
        notificationsSent++
      } else if (remaining < DSAR_WARN_3_DAYS_MS) {
        deadlines.push(`DSAR 3 zile: cerere ${req.requestType} de la ${req.requesterName}`)
        await createNotification(orgId, {
          type: "finding_new",
          title: `URGENT: 3 zile pentru cererea DSAR de ${req.requestType}`,
          message: `Mai ai ~${Math.ceil(remaining / 86_400_000)} zile pentru a răspunde la cererea de ${req.requestType} de la ${req.requesterName}.`,
          linkTo: "/dashboard/dsar",
        }).catch(() => {})
        notificationsSent++
      } else if (remaining < DSAR_WARN_10_DAYS_MS) {
        deadlines.push(`DSAR 10 zile: cerere ${req.requestType} — ${Math.ceil(remaining / 86_400_000)} zile rămase`)
        await createNotification(orgId, {
          type: "info",
          title: `Cerere DSAR — ${Math.ceil(remaining / 86_400_000)} zile rămase`,
          message: `Cererea de ${req.requestType} de la ${req.requesterName} expiră în ${Math.ceil(remaining / 86_400_000)} zile.`,
          linkTo: "/dashboard/dsar",
        }).catch(() => {})
        notificationsSent++
      }
    }
    return { deadlines: deadlines.slice(0, 3), notificationsSent }
  } catch {
    return { deadlines: [], notificationsSent: 0 }
  }
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
    <h1 style="color:#fff;margin:0;font-size:18px">CompliScan · Digest zilnic</h1>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <h2 style="margin:0 0 8px;color:#0f172a">${payload.orgName}</h2>
    <p style="font-size:28px;font-weight:700;margin:0 0 8px;color:#0f172a">
      Scor: ${payload.scoreToday}/100 ${deltaText}
    </p>
    ${findingsSection}
    ${deadlinesSection}
    <a href="${process.env.NEXT_PUBLIC_URL ?? "https://compliscan.ro"}/dashboard"
       style="display:inline-block;margin-top:16px;background:#34D399;color:#111;padding:10px 20px;
              border-radius:8px;text-decoration:none;font-weight:600">
      Deschide dashboard →
    </a>
    <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0">
    <p style="color:#94a3b8;font-size:12px;margin:0">
      Primești acest email doar când ceva se schimbă.
      <a href="${process.env.NEXT_PUBLIC_URL ?? "https://compliscan.ro"}/dashboard/settings" style="color:#6366f1">Gestionează notificările</a>
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

  const nowISO = new Date().toISOString()
  const startMs = Date.now()
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

        // Multiplicator B: upsert/remove stale knowledge finding
        const staleFinding = buildOrgKnowledgeStaleFinding(state.orgKnowledge, new Date().toISOString())
        const findingsWithoutStale = state.findings.filter((f) => f.id !== "org-knowledge-stale")
        if (staleFinding) {
          state.findings = [...findingsWithoutStale, staleFinding]
          await writeStateForOrg(org.id, state, org.name)
        } else if (state.findings.some((f) => f.id === "org-knowledge-stale")) {
          state.findings = findingsWithoutStale
          await writeStateForOrg(org.id, state, org.name)
        }

        // Faza 2 — TASK 7: SAF-T D406 finding injection
        const tags = state.applicability?.tags ?? []
        const d406Findings = buildSAFTD406Finding({
          hasSaftTag: tags.includes("saft"),
          d406EvidenceSubmitted: state.d406EvidenceSubmitted,
          nowISO: new Date().toISOString(),
        })
        if (d406Findings.length > 0 && !state.findings.some((f) => f.id === "saft-d406-registration")) {
          state.findings = [...state.findings, ...d406Findings]
          await writeStateForOrg(org.id, state, org.name)
        }

        // Faza 2 — TASK 6: DSAR procedure finding
        const dsarState = await readDsarState(org.id)
        const hasDsarProcedure = state.generatedDocuments?.some(
          (d) => d.title?.toLowerCase().includes("dsar") || d.title?.toLowerCase().includes("drepturi persoane")
        ) || dsarState.requests.length > 0
        const dsarFindingId = "dsar-no-procedure"
        if (!hasDsarProcedure && !state.findings.some((f) => f.id === dsarFindingId)) {
          state.findings = [...state.findings, {
            id: dsarFindingId,
            title: "Nu ai o procedură documentată pentru cererile DSAR",
            detail:
              "Nerespectarea drepturilor persoanelor vizate este sursa principală de amenzi ANSPDCP " +
              "în România (Fan Courier 2.000 EUR, Vodafone 3.000 EUR, Dante International 10.000 EUR — " +
              "toate amendate în 2024). Termenul legal de răspuns: 30 de zile de la primirea cererii.",
            category: "GDPR",
            severity: "high",
            risk: "high",
            principles: ["accountability"],
            createdAtISO: new Date().toISOString(),
            sourceDocument: "GDPR Art. 15-22",
            legalReference: "GDPR Art. 12(3), Art. 15-22 · OUG 1/2024 · Practică ANSPDCP 2024",
            remediationHint:
              "Creează o procedură de răspuns la cereri DSAR sau înregistrează prima cerere " +
              "în modulul DSAR pentru a demonstra că ai proces activ.",
            resolution: {
              problem: "Nu există procedură documentată pentru cererile de acces/ștergere date personale.",
              impact: "Fără procedură, nu poți răspunde în termenul legal de 30 zile. Risc direct de amendă ANSPDCP.",
              action: "Creează procedura din Generator sau înregistrează prima cerere în modulul DSAR.",
              humanStep: "DPO-ul sau responsabilul GDPR revizuiește procedura și confirmă implementarea.",
              closureEvidence: "Procedură documentată sau prima cerere DSAR procesată cu dovadă de răspuns.",
              revalidation: "Verificare trimestrială a procedurii și a logului de cereri.",
            },
          }]
          await writeStateForOrg(org.id, state, org.name)
        }

        const summary = computeDashboardSummary(state)
        const { scoreToday, delta } = await getScoreDelta(org.id)

        const newFindings = getNewFindingsCount(state)
        const [baseDeadlines, nis2Deadlines, dsarResult] = await Promise.all([
          Promise.resolve(getUrgentDeadlines(state)),
          getNis2SlaDeadlines(org.id),
          checkDsarDeadlines(org.id),
        ])
        const policyDeadlines = getPolicyExpiryDeadlines(state)
        const urgentDeadlines = [...baseDeadlines, ...nis2Deadlines, ...dsarResult.deadlines, ...policyDeadlines].slice(0, 7)

        // ANTI-SPAM: only send when something actionable happened
        const hasScoreDrop = delta !== null && delta <= SCORE_DROP_THRESHOLD
        const hasNewFindings = newFindings > 0
        const hasDeadlines = urgentDeadlines.length > 0

        if (!hasScoreDrop && !hasNewFindings && !hasDeadlines) {
          results.push({ orgId: org.id, sent: false, reason: "nothing new" })
          continue
        }

        const deltaLabel = delta !== null && delta < 0 ? ` ↓${Math.abs(delta)}` : ""
        const subject = `CompliScan · Scor ${scoreToday ?? summary.score}${deltaLabel} · ${new Date().toLocaleDateString("ro-RO")}`

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
    const errors = results.filter(
      (r) =>
        !r.sent &&
        r.reason &&
        r.reason !== "email disabled" &&
        r.reason !== "no state" &&
        r.reason !== "nothing new",
    ).length

    console.log(`[DailyDigest] Run completat: ${sent} trimise, ${skipped} sărite`)

    if (capturedCronErrors) {
      await flushCronTelemetry()
    }

    await safeRecordCronRun({
      name: "daily-digest",
      lastRunAtISO: nowISO,
      ok: errors === 0,
      durationMs: Date.now() - startMs,
      summary: `${sent} trimise, ${skipped} sărite${errors > 0 ? `, ${errors} erori` : ""}.`,
      stats: {
        sent,
        skipped,
        total: results.length,
        errors,
      },
      errorMessage:
        errors > 0
          ? results.find(
              (r) =>
                !r.sent &&
                r.reason &&
                r.reason !== "email disabled" &&
                r.reason !== "no state" &&
                r.reason !== "nothing new",
            )?.reason
          : undefined,
    })

    return NextResponse.json({ ok: true, sent, skipped, total: results.length })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown"
    console.error(`[DailyDigest] Eroare critică: ${msg}`)

    captureCronError(error, {
      cron: "/api/cron/daily-digest",
      step: "critical",
    })
    await flushCronTelemetry()

    await safeRecordCronRun({
      name: "daily-digest",
      lastRunAtISO: nowISO,
      ok: false,
      durationMs: Date.now() - startMs,
      summary: `Eroare critică: ${msg}`,
      stats: { processed: results.length },
      errorMessage: msg,
    })

    return jsonError(`Eroare la daily digest: ${msg}`, 500, "DAILY_DIGEST_FAILED")
  }
}
