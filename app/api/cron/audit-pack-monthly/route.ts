// POST /api/cron/audit-pack-monthly
// S3.3 — Monthly audit pack auto-generation.
// For each org: auto-generates audit pack, records it in generatedDocuments,
// sends email with "pack ready for review" OR "pack incomplete with gaps list".
// Invoked by Vercel Cron (1st of month, 09:00 UTC).

export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { loadOrganizations } from "@/lib/server/auth"
import { readAlertPreferences } from "@/lib/server/alert-preferences-store"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { normalizeComplianceState, computeDashboardSummary } from "@/lib/compliance/engine"
import { buildRemediationPlan } from "@/lib/compliance/remediation"
import { buildCompliScanSnapshot } from "@/lib/server/compliscan-export"
import { buildAICompliancePack } from "@/lib/server/ai-compliance-pack"
import { buildAuditPack } from "@/lib/server/audit-pack"
import { readNis2State } from "@/lib/server/nis2-store"
import type { WorkspaceContext } from "@/lib/compliance/types"
import { captureCronError, flushCronTelemetry } from "@/lib/server/sentry-cron"

const FROM_ADDRESS = process.env.ALERT_EMAIL_FROM ?? "CompliScan Audit <onboarding@resend.dev>"
const APP_URL = process.env.NEXT_PUBLIC_URL ?? "https://compliscan.ro"

type AuditPackResult = {
  readiness: "audit_ready" | "review_required"
  score: number | null
  riskLabel: string | null
  gaps: string[]
  generatedAtISO: string
}

function buildAuditPackReadyEmailHtml(orgName: string, result: AuditPackResult): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#1e293b;padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:18px">CompliScan · Audit Pack lunar generat</h1>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <h2 style="margin:0 0 8px;color:#0f172a">${orgName}</h2>
    <p style="color:#475569">Audit Pack-ul lunar a fost <strong>generat automat</strong> și este gata de review.</p>
    <p style="color:#475569">Scor curent: <strong>${result.score ?? "—"}/100</strong> · ${result.riskLabel ?? "—"}</p>
    <p style="color:#059669;font-weight:600">✓ Dosarul este complet — gata pentru export.</p>
    <a href="${APP_URL}/dashboard/reports/vault"
       style="display:inline-block;margin-top:16px;background:#34D399;color:#111;padding:10px 20px;
              border-radius:8px;text-decoration:none;font-weight:600">
      Descarcă Audit Pack →
    </a>
    <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0">
    <p style="color:#94a3b8;font-size:12px;margin:0">
      Email lunar automat CompliScan &mdash;
      <a href="${APP_URL}/dashboard/settings" style="color:#6366f1">Gestionează notificările</a>
    </p>
  </div>
</body>
</html>`
}

function buildAuditPackGapsEmailHtml(orgName: string, result: AuditPackResult): string {
  const gapsList = result.gaps.slice(0, 5).map((g) => `<li style="color:#475569">${g}</li>`).join("")
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#1e293b;padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:18px">CompliScan · Audit Pack lunar — acțiuni necesare</h1>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <h2 style="margin:0 0 8px;color:#0f172a">${orgName}</h2>
    <p style="color:#475569">Audit Pack-ul lunar a fost generat automat, dar <strong>necesită completări</strong> înainte de export.</p>
    <p style="color:#475569">Scor curent: <strong>${result.score ?? "—"}/100</strong> · ${result.riskLabel ?? "—"}</p>
    <p style="color:#b45309;font-weight:600">⚠ Gaps identificate:</p>
    <ul style="margin:8px 0 16px;padding-left:20px">${gapsList}</ul>
    <a href="${APP_URL}/dashboard/resolve"
       style="display:inline-block;margin-top:8px;background:#f59e0b;color:#111;padding:10px 20px;
              border-radius:8px;text-decoration:none;font-weight:600">
      Rezolvă gaps →
    </a>
    <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0">
    <p style="color:#94a3b8;font-size:12px;margin:0">
      Email lunar automat CompliScan &mdash;
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

function buildWorkspaceForOrg(orgId: string, orgName: string): WorkspaceContext {
  return {
    orgId,
    orgName,
    workspaceLabel: orgName,
    workspaceOwner: "system-cron",
    workspaceInitials: orgName.slice(0, 2).toUpperCase(),
  }
}

function generateAuditPackForOrg(
  orgId: string,
  orgName: string,
  rawState: import("@/lib/compliance/types").ComplianceState,
  nis2State: Awaited<ReturnType<typeof readNis2State>> | null
): AuditPackResult {
  const state = normalizeComplianceState(rawState)
  const summary = computeDashboardSummary(state)
  const remediationPlan = buildRemediationPlan(state)
  const workspace = buildWorkspaceForOrg(orgId, orgName)
  const snapshot = state.snapshotHistory[0] ?? buildCompliScanSnapshot({
    state, summary, remediationPlan, workspace,
  })
  const compliancePack = buildAICompliancePack({
    state, remediationPlan, workspace, snapshot,
  })

  const auditPack = buildAuditPack({
    state, remediationPlan, workspace, compliancePack, snapshot, nis2State,
  })

  return {
    readiness: auditPack.executiveSummary.auditReadiness,
    score: auditPack.executiveSummary.complianceScore,
    riskLabel: auditPack.executiveSummary.riskLabel,
    gaps: auditPack.executiveSummary.topBlockers,
    generatedAtISO: auditPack.generatedAt,
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

  const results: { orgId: string; sent: boolean; readiness?: string; reason?: string }[] = []
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

        const nis2State = await readNis2State(org.id).catch(() => null)

        // S3.3: Auto-generate audit pack
        const packResult = generateAuditPackForOrg(org.id, org.name, rawState, nis2State)

        // Record the auto-generation in generatedDocuments
        const state = normalizeComplianceState(rawState)
        const docRecord = {
          id: `audit-pack-auto-${Date.now().toString(36)}`,
          documentType: "ai-governance" as const,
          title: `Audit Pack lunar — ${new Date().toLocaleDateString("ro-RO", { month: "long", year: "numeric" })}`,
          generatedAtISO: packResult.generatedAtISO,
          llmUsed: false,
          approvalStatus: "draft" as const,
        }
        state.generatedDocuments.push(docRecord)
        await writeStateForOrg(org.id, state, org.name)

        // Send differentiated email
        const monthLabel = new Date().toLocaleDateString("ro-RO", { month: "long", year: "numeric" })
        const isReady = packResult.readiness === "audit_ready"
        const html = isReady
          ? buildAuditPackReadyEmailHtml(org.name, packResult)
          : buildAuditPackGapsEmailHtml(org.name, packResult)
        const subject = isReady
          ? `[CompliScan] Audit Pack ${monthLabel} gata · ${org.name}`
          : `[CompliScan] Audit Pack ${monthLabel} — acțiuni necesare · ${org.name}`

        const ok = await sendEmail(prefs.emailAddress, subject, html)
        results.push({ orgId: org.id, sent: ok, readiness: packResult.readiness })
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
    const ready = results.filter((r) => r.readiness === "audit_ready").length
    console.log(`[AuditPackMonthly] ${sent} trimise (${ready} ready, ${sent - ready} cu gaps), ${results.length - sent} sărite`)

    return NextResponse.json({ ok: true, sent, ready, total: results.length })
  } catch (error) {
    captureCronError(error, { cron: "/api/cron/audit-pack-monthly", step: "critical" })
    await flushCronTelemetry()
    return jsonError("Eroare la audit pack monthly.", 500, "AUDIT_PACK_MONTHLY_FAILED")
  }
}
