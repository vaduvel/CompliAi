// POST /api/cron/partner-monthly-report
// Monthly report for Partner/Consultant users — aggregates all client orgs.
// Sends a single email per consultant with summary of all their clients.
// Invoked by Vercel Cron (2nd of month, 09:00 UTC — after audit-pack on 1st).

export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { loadUsers, listUserMemberships } from "@/lib/server/auth"
import { readStateForOrg } from "@/lib/server/mvp-store"
import {
  normalizeComplianceState,
  computeDashboardSummary,
} from "@/lib/compliance/engine"
import { getScoreDelta } from "@/lib/score-snapshot"
import { captureCronError, flushCronTelemetry } from "@/lib/server/sentry-cron"

const FROM_ADDRESS =
  process.env.ALERT_EMAIL_FROM ?? "CompliAI Partner <onboarding@resend.dev>"
const APP_URL = process.env.NEXT_PUBLIC_URL ?? "https://compliai.ro"

type ClientReportEntry = {
  orgId: string
  orgName: string
  score: number
  riskLabel: string
  openAlerts: number
  scoreDelta30d: number | null
}

function buildPartnerMonthlyHtml(
  consultantEmail: string,
  clients: ClientReportEntry[],
  month: string
): string {
  const urgent = clients.filter(
    (c) => c.openAlerts > 0 || (c.scoreDelta30d !== null && c.scoreDelta30d < -5)
  )
  const stable = clients.filter(
    (c) => c.openAlerts === 0 && (c.scoreDelta30d === null || c.scoreDelta30d >= -5)
  )

  function clientRow(c: ClientReportEntry): string {
    const deltaText =
      c.scoreDelta30d !== null
        ? c.scoreDelta30d > 0
          ? `<span style="color:#10b981">+${c.scoreDelta30d}</span>`
          : c.scoreDelta30d < 0
            ? `<span style="color:#ef4444">${c.scoreDelta30d}</span>`
            : `<span style="color:#94a3b8">0</span>`
        : `<span style="color:#94a3b8">—</span>`

    const scoreColor =
      c.score >= 75 ? "#10b981" : c.score >= 50 ? "#f59e0b" : "#ef4444"

    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">
          <a href="${APP_URL}/portfolio" style="color:#6366f1;text-decoration:none;font-weight:500">${c.orgName}</a>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">
          <strong style="color:${scoreColor}">${c.score}</strong>/100
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${deltaText}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${c.openAlerts}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${c.riskLabel}</td>
      </tr>`
  }

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:700px;margin:0 auto;padding:24px">
  <div style="background:#1e293b;padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:18px">CompliAI · Raport lunar portofoliu</h1>
    <p style="color:#94a3b8;margin:4px 0 0;font-size:13px">${month} · ${clients.length} clienți</p>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">

    <p style="color:#475569;margin:0 0 16px">
      ${urgent.length > 0 ? `<strong style="color:#ef4444">${urgent.length} client${urgent.length > 1 ? "i" : ""} necesită atenție.</strong>` : "<strong style=\"color:#10b981\">Toți clienții sunt stabili.</strong>"}
      ${stable.length > 0 ? `${stable.length} client${stable.length > 1 ? "i" : ""} în regulă.` : ""}
    </p>

    ${urgent.length > 0 ? `
    <h3 style="color:#ef4444;margin:16px 0 8px;font-size:14px">Necesită atenție</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <tr style="background:#f8fafc">
        <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0">Client</th>
        <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e2e8f0">Scor</th>
        <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e2e8f0">Delta</th>
        <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e2e8f0">Alerte</th>
        <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e2e8f0">Risc</th>
      </tr>
      ${urgent.map(clientRow).join("")}
    </table>
    ` : ""}

    ${stable.length > 0 ? `
    <h3 style="color:#10b981;margin:16px 0 8px;font-size:14px">Stabili</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <tr style="background:#f8fafc">
        <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0">Client</th>
        <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e2e8f0">Scor</th>
        <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e2e8f0">Delta</th>
        <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e2e8f0">Alerte</th>
        <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e2e8f0">Risc</th>
      </tr>
      ${stable.map(clientRow).join("")}
    </table>
    ` : ""}

    <div style="margin-top:24px;text-align:center">
      <a href="${APP_URL}/portfolio"
         style="display:inline-block;background:#6366f1;color:#fff;padding:10px 24px;
                border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">
        Deschide Portofoliu →
      </a>
    </div>

    <p style="color:#94a3b8;font-size:11px;margin-top:24px;text-align:center">
      Raport generat automat de CompliAI · ${new Date().toLocaleDateString("ro-RO")}
    </p>
  </div>
</body>
</html>`
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("Authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return jsonError("Unauthorized.", 401, "UNAUTHORIZED")
    }
  }

  const month = new Date().toLocaleDateString("ro-RO", {
    month: "long",
    year: "numeric",
  })

  try {
    const allUsers = await loadUsers()

    // Find users with multiple memberships (partner/consultant pattern)
    const partnerCandidates = await Promise.all(
      allUsers.map(async (user) => {
        const memberships = await listUserMemberships(user.id)
        return { user, memberships }
      })
    )

    const partners = partnerCandidates.filter((p) => p.memberships.length > 1)

    let sent = 0
    let skipped = 0

    for (const { user, memberships } of partners) {
      try {
        const clientEntries: ClientReportEntry[] = await Promise.all(
          memberships.slice(0, 30).map(async (m) => {
            const state = await readStateForOrg(m.orgId)
            if (!state) {
              return {
                orgId: m.orgId,
                orgName: m.orgName,
                score: 0,
                riskLabel: "Fără date",
                openAlerts: 0,
                scoreDelta30d: null,
              }
            }

            const normalized = normalizeComplianceState(state)
            const summary = computeDashboardSummary(normalized)

            let scoreDelta30d: number | null = null
            try {
              const delta = await getScoreDelta(m.orgId)
              scoreDelta30d = delta.delta
            } catch {
              // score-snapshot may not exist for all orgs
            }

            return {
              orgId: m.orgId,
              orgName: m.orgName,
              score: summary.score,
              riskLabel: summary.riskLabel,
              openAlerts: summary.openAlerts,
              scoreDelta30d,
            }
          })
        )

        if (clientEntries.length === 0) {
          skipped++
          continue
        }

        const html = buildPartnerMonthlyHtml(user.email, clientEntries, month)

        const apiKey = process.env.RESEND_API_KEY
        if (apiKey) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: FROM_ADDRESS,
              to: [user.email],
              subject: `Raport lunar portofoliu · ${month} · ${clientEntries.length} clienți`,
              html,
            }),
            signal: AbortSignal.timeout(15_000),
          })
        } else {
          console.log(
            `[PartnerMonthly] CONSOLE → ${user.email} | ${clientEntries.length} clients`
          )
        }

        sent++
      } catch (err) {
        captureCronError(err, { cron: "partner-monthly-report", metadata: { userId: user.id } })
        console.error(`[PartnerMonthly] Failed for user ${user.email}:`, err)
      }
    }

    await flushCronTelemetry()
    return NextResponse.json({ sent, skipped, totalPartners: partners.length })
  } catch (err) {
    captureCronError(err, { cron: "partner-monthly-report" })
    await flushCronTelemetry()
    return jsonError("Raportul lunar a eșuat.", 500, "PARTNER_MONTHLY_FAILED")
  }
}
