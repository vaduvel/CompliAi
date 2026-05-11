// POST /api/cron/partner-monthly-report
// Monthly report for Partner/Consultant users — aggregates all client orgs.
// Sends a single email per consultant with summary of all their clients.
// Invoked by Vercel Cron (2nd of month, 09:00 UTC — after audit-pack on 1st).

export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { loadUsers, listUserMemberships } from "@/lib/server/auth"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { getWhiteLabelConfig } from "@/lib/server/white-label"
import {
  normalizeComplianceState,
  computeDashboardSummary,
} from "@/lib/compliance/engine"
import { isFindingOperationallyClosed } from "@/lib/compliance/task-resolution"
import { buildFindingLifecycleView } from "@/lib/compliance/finding-lifecycle"
import type { ComplianceState, ScanFinding } from "@/lib/compliance/types"
import { readDsarState, type DsarOrgState } from "@/lib/server/dsar-store"
import { readNis2State, type Nis2OrgState } from "@/lib/server/nis2-store"
import { getScoreDelta } from "@/lib/score-snapshot"
import { captureCronError, flushCronTelemetry } from "@/lib/server/sentry-cron"
import { safeRecordCronRun } from "@/lib/server/cron-status-store"

const FROM_ADDRESS =
  process.env.ALERT_EMAIL_FROM ?? "CompliScan Partner <onboarding@resend.dev>"
const APP_URL = process.env.NEXT_PUBLIC_URL ?? "https://compliai.ro"

type ClientReportEntry = {
  orgId: string
  orgName: string
  score: number
  riskLabel: string
  openAlerts: number
  scoreDelta30d: number | null
  openFindings: number
  validatedEvidence: number
  pendingEvidence: number
  auditReadiness: "audit_ready" | "review_required"
  activities: string[]
  workDone: string[]
  openFindingTitles: string[]
  nextActions: string[]
}

type ClientFacingReport = {
  orgId: string
  orgName: string
  month: string
  html: string
  activities: string[]
  summary: {
    score: number
    riskLabel: string
    auditReadiness: ClientReportEntry["auditReadiness"]
    openFindings: number
    validatedEvidence: number
    pendingEvidence: number
  }
}

function buildPartnerMonthlyHtml(
  consultantEmail: string,
  clients: ClientReportEntry[],
  month: string,
  branding?: { partnerName: string; brandColor: string; tagline: string | null }
): string {
  const headerBg = branding?.brandColor ?? "#1e293b"
  const headerTitle = branding?.partnerName ? `${branding.partnerName} · Raport lunar` : "CompliScan · Raport lunar portofoliu"
  const headerSub = branding?.tagline ?? `${month} · ${clients.length} clienți`
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

  function listItems(items: string[], empty: string): string {
    if (items.length === 0) {
      return `<li style="color:#94a3b8">${escapeHtml(empty)}</li>`
    }

    return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
  }

  function activityCard(c: ClientReportEntry): string {
    const readinessColor = c.auditReadiness === "audit_ready" ? "#10b981" : "#f59e0b"
    return `
      <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin:10px 0;background:#fff">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
          <div>
            <h4 style="margin:0 0 4px;color:#0f172a;font-size:14px">${escapeHtml(c.orgName)}</h4>
            <p style="margin:0;color:#64748b;font-size:12px">
              ${c.validatedEvidence} dovezi validate · ${c.pendingEvidence} dovezi pendinte · ${c.openFindings} findings deschise
            </p>
          </div>
          <span style="color:${readinessColor};font-size:12px;font-weight:700">${c.auditReadiness}</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;font-size:12px;color:#334155">
          <div>
            <strong>Ce s-a lucrat</strong>
            <ul style="margin:6px 0 0;padding-left:18px">${listItems(c.workDone, "Nicio acțiune nouă în perioada raportată.")}</ul>
          </div>
          <div>
            <strong>Rămâne deschis</strong>
            <ul style="margin:6px 0 0;padding-left:18px">${listItems(c.openFindingTitles, "Nu există findings deschise.")}</ul>
          </div>
        </div>

        <div style="margin-top:10px;font-size:12px;color:#334155">
          <strong>Următorul pas</strong>
          <ul style="margin:6px 0 0;padding-left:18px">${listItems(c.nextActions, "Menține monitorizarea lunară.")}</ul>
        </div>
      </div>`
  }

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:700px;margin:0 auto;padding:24px">
  <div style="background:${headerBg};padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:18px">${headerTitle}</h1>
    <p style="color:rgba(255,255,255,0.65);margin:4px 0 0;font-size:13px">${headerSub}</p>
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

    <h3 style="color:#0f172a;margin:20px 0 8px;font-size:14px">Activitate lunară pe client</h3>
    ${clients.map(activityCard).join("")}

    <div style="margin-top:24px;text-align:center">
      <a href="${APP_URL}/portfolio"
         style="display:inline-block;background:#6366f1;color:#fff;padding:10px 24px;
                border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">
        Deschide Portofoliu →
      </a>
    </div>

    <p style="color:#94a3b8;font-size:11px;margin-top:24px;text-align:center">
      Raport generat automat de CompliScan · ${new Date().toLocaleDateString("ro-RO")}
    </p>
  </div>
</body>
</html>`
}

function buildClientFacingMonthlyHtml(
  client: ClientReportEntry,
  month: string,
  branding?: { partnerName: string; brandColor: string; tagline: string | null }
): string {
  const headerBg = branding?.brandColor ?? "#1e293b"
  const cabinetName = branding?.partnerName ?? "Cabinet DPO"
  const readinessColor = client.auditReadiness === "audit_ready" ? "#10b981" : "#f59e0b"
  const scoreColor = client.score >= 75 ? "#10b981" : client.score >= 50 ? "#f59e0b" : "#ef4444"

  const listItems = (items: string[], empty: string) =>
    items.length > 0
      ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : `<li style="color:#94a3b8">${escapeHtml(empty)}</li>`

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:680px;margin:0 auto;padding:24px;background:#f8fafc;color:#0f172a">
  <div style="background:${headerBg};padding:18px 24px;border-radius:12px 12px 0 0">
    <p style="margin:0 0 4px;color:rgba(255,255,255,0.72);font-size:12px;text-transform:uppercase;letter-spacing:.08em">${escapeHtml(cabinetName)}</p>
    <h1 style="color:#fff;margin:0;font-size:20px">Raport lunar DPO — ${escapeHtml(client.orgName)}</h1>
    <p style="color:rgba(255,255,255,0.68);margin:6px 0 0;font-size:13px">${escapeHtml(month)}</p>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;background:#fff;padding:24px;border-radius:0 0 12px 12px">
    <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:20px">
      <div style="border:1px solid #e2e8f0;border-radius:10px;padding:10px">
        <div style="font-size:11px;color:#64748b">Scor</div>
        <strong style="font-size:22px;color:${scoreColor}">${client.score}</strong><span style="font-size:12px;color:#94a3b8">/100</span>
      </div>
      <div style="border:1px solid #e2e8f0;border-radius:10px;padding:10px">
        <div style="font-size:11px;color:#64748b">Readiness</div>
        <strong style="font-size:13px;color:${readinessColor}">${client.auditReadiness}</strong>
      </div>
      <div style="border:1px solid #e2e8f0;border-radius:10px;padding:10px">
        <div style="font-size:11px;color:#64748b">Dovezi validate</div>
        <strong style="font-size:22px;color:#0f172a">${client.validatedEvidence}</strong>
      </div>
      <div style="border:1px solid #e2e8f0;border-radius:10px;padding:10px">
        <div style="font-size:11px;color:#64748b">Findings deschise</div>
        <strong style="font-size:22px;color:#0f172a">${client.openFindings}</strong>
      </div>
    </div>

    <section style="margin:16px 0">
      <h2 style="font-size:15px;margin:0 0 8px">Ce s-a lucrat luna aceasta</h2>
      <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.55;color:#334155">${listItems(client.workDone, "Nu există acțiuni noi în perioada raportată.")}</ul>
    </section>

    <section style="margin:16px 0">
      <h2 style="font-size:15px;margin:0 0 8px">Rămâne deschis</h2>
      <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.55;color:#334155">${listItems(client.openFindingTitles, "Nu există findings deschise.")}</ul>
    </section>

    <section style="margin:16px 0">
      <h2 style="font-size:15px;margin:0 0 8px">Următorul pas recomandat</h2>
      <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.55;color:#334155">${listItems(client.nextActions, "Menține monitorizarea lunară.")}</ul>
    </section>

    <p style="margin-top:22px;border-top:1px solid #e2e8f0;padding-top:12px;color:#64748b;font-size:11px">
      Document de lucru pregătit de ${escapeHtml(cabinetName)}. Necesită validare profesională înainte de utilizare oficială.
    </p>
  </div>
</body>
</html>`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function buildMonthlyActivity(
  state: ComplianceState,
  external?: {
    dsar?: DsarOrgState | null
    nis2?: Nis2OrgState | null
  }
) {
  const lifecycleViews = state.findings.map((finding) =>
    buildFindingLifecycleView({
      finding,
      generatedDocuments: state.generatedDocuments,
      taskState: state.taskState,
      events: state.events,
    })
  )
  const openFindings = state.findings.filter((finding) => isOpenMonthlyFinding(state, finding))
  const validatedEvidenceFromTasks = Object.values(state.taskState).filter(
    (task) => task.attachedEvidenceMeta?.quality?.status === "sufficient"
  ).length
  const validatedEvidenceFromFindings = lifecycleViews.filter((view) => view.evidence.validated).length
  const validatedEvidence = Math.max(validatedEvidenceFromTasks, validatedEvidenceFromFindings)
  const workDone = buildWorkDoneItems(state, external)
  const closedFindingWork = lifecycleViews
    .filter((view) => view.dossierReady || view.currentStage === "resolved")
    .map((view) => state.findings.find((finding) => finding.id === view.findingId))
    .filter((finding): finding is ScanFinding => Boolean(finding))
    .slice(0, 3)
    .map((finding) => `${finding.title} închis, dovada validată și păstrată în Dosar.`)
  const nextActions = openFindings
    .slice()
    .sort(compareMonthlyFindings)
    .slice(0, 3)
    .map((finding) => finding.remediationHint || finding.resolution?.action || finding.title)

  return {
    openFindings: openFindings.length,
    validatedEvidence,
    pendingEvidence: openFindings.length,
    auditReadiness: openFindings.length === 0 && Boolean(state.validatedBaselineSnapshotId)
      ? "audit_ready" as const
      : "review_required" as const,
    activities: [...new Set([...closedFindingWork, ...workDone])].slice(0, 8),
    workDone: [...new Set([...closedFindingWork, ...workDone])].slice(0, 8),
    openFindingTitles: openFindings
      .slice()
      .sort(compareMonthlyFindings)
      .slice(0, 4)
      .map((finding) => `${finding.title}${finding.legalReference ? ` · ${finding.legalReference}` : ""}`),
    nextActions,
  }
}

function isOpenMonthlyFinding(state: ComplianceState, finding: ScanFinding) {
  return !["resolved", "dismissed", "under_monitoring"].includes(finding.findingStatus ?? "open")
    && !isFindingOperationallyClosed(state, finding.id)
}

function buildWorkDoneItems(
  state: ComplianceState,
  external?: {
    dsar?: DsarOrgState | null
    nis2?: Nis2OrgState | null
  }
) {
  const eventItems = state.events
    .filter((event) =>
      [
        "document.shared_approved",
        "document.shared_rejected",
        "document.shared_commented",
        "document.shared",
        "document.generated",
        "document_generated",
        "dpo.migration_imported",
        "ai.off_configured",
      ].includes(event.type)
    )
    .slice()
    .sort((left, right) => right.createdAtISO.localeCompare(left.createdAtISO))
    .slice(0, 4)
    .map((event) => event.message)

  const documentItems = state.generatedDocuments
    .filter((document) => ["signed", "rejected", "reviewed_internally"].includes(document.adoptionStatus ?? ""))
    .slice()
    .sort((left, right) => right.generatedAtISO.localeCompare(left.generatedAtISO))
    .slice(0, 3)
    .map((document) => {
      if (document.adoptionStatus === "signed") return `${document.title} aprobat prin magic link.`
      if (document.adoptionStatus === "rejected") return `${document.title} respins de client, necesită revizie.`
      return `${document.title} pregătit pentru review.`
    })

  const dsarItems = (external?.dsar?.requests ?? [])
    .slice()
    .sort((left, right) => right.updatedAtISO.localeCompare(left.updatedAtISO))
    .slice(0, 3)
    .map((request) => {
      const deadline = new Date(request.deadlineISO).toLocaleDateString("ro-RO")
      if (request.status === "responded") {
        return `DSAR ${request.requesterName} răspuns și arhivat.`
      }
      return `DSAR ${request.requesterName} înregistrat · termen ${deadline}.`
    })

  const trainingItems = (state.gdprTrainingRecords ?? [])
    .slice()
    .sort((left, right) => right.updatedAtISO.localeCompare(left.updatedAtISO))
    .slice(0, 3)
    .map((record) => {
      if (record.status === "completed") {
        return `Training GDPR finalizat: ${record.title} · ${record.participantCount} participanți.`
      }
      if (record.status === "evidence_required") {
        return `Training GDPR înregistrat: ${record.title} · dovadă necesară.`
      }
      return `Training GDPR planificat: ${record.title} · ${record.participantCount} participanți.`
    })

  const breachItems = (external?.nis2?.incidents ?? [])
    .filter((incident) => incident.involvesPersonalData || incident.anspdcpNotification)
    .slice()
    .sort((left, right) => right.updatedAtISO.localeCompare(left.updatedAtISO))
    .slice(0, 3)
    .map((incident) => {
      const notification = incident.anspdcpNotification
      if (notification?.status === "submitted") {
        return `Breach ANSPDCP trimis: ${incident.title}.`
      }
      if (notification?.status === "acknowledged") {
        return `Breach ANSPDCP confirmat: ${incident.title}.`
      }
      return `Breach cu date personale înregistrat: ${incident.title} · notificare ANSPDCP de urmărit.`
    })

  const importItems = state.importedClientContext
    ? [
        `Client importat din fișier cabinet${
          state.importedClientContext.contactName
            ? ` · contact ${state.importedClientContext.contactName}`
            : ""
        }.`,
      ]
    : []

  return [...new Set([...eventItems, ...documentItems, ...dsarItems, ...trainingItems, ...breachItems, ...importItems])].slice(0, 8)
}

function compareMonthlyFindings(left: ScanFinding, right: ScanFinding) {
  const severityRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  const bySeverity = (severityRank[left.severity] ?? 3) - (severityRank[right.severity] ?? 3)
  if (bySeverity !== 0) return bySeverity
  return left.createdAtISO.localeCompare(right.createdAtISO)
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const preview = requestUrl.searchParams.get("preview") === "1"
  const consultantEmailFilter = requestUrl.searchParams.get("consultantEmail")?.trim().toLowerCase()
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
  const nowISO = new Date().toISOString()
  const startMs = Date.now()
  let errorCount = 0

  try {
    const allUsers = await loadUsers()

    // Find users with multiple memberships (partner/consultant pattern)
    const partnerCandidates = await Promise.all(
      allUsers.map(async (user) => {
        const memberships = await listUserMemberships(user.id)
        return { user, memberships }
      })
    )

    const partners = partnerCandidates.filter(
      (p) =>
        p.memberships.length > 1 &&
        (!consultantEmailFilter || p.user.email.toLowerCase() === consultantEmailFilter)
    )

    let sent = 0
    let skipped = 0
    const previewReports: Array<{
      consultantEmail: string
      month: string
      clientEntries: ClientReportEntry[]
      html: string
      clientFacingReports: ClientFacingReport[]
    }> = []

    for (const { user, memberships } of partners) {
      try {
        const wl = user.orgId
          ? await getWhiteLabelConfig(user.orgId).catch(() => null)
          : null
        const branding = wl?.partnerName
          ? { partnerName: wl.partnerName, brandColor: wl.brandColor, tagline: wl.tagline }
          : undefined

        const clientMemberships = memberships
          .filter((membership) => membership.orgId !== user.orgId)
          .slice(0, 30)

        const clientEntries: ClientReportEntry[] = await Promise.all(
          clientMemberships.map(async (m) => {
            const [state, dsarState, nis2State] = await Promise.all([
              readStateForOrg(m.orgId),
              readDsarState(m.orgId).catch(() => null),
              readNis2State(m.orgId).catch(() => null),
            ])
            if (!state) {
              return {
                orgId: m.orgId,
                orgName: m.orgName,
                score: 0,
                riskLabel: "Fără date",
                openAlerts: 0,
                scoreDelta30d: null,
                openFindings: 0,
                validatedEvidence: 0,
                pendingEvidence: 0,
                auditReadiness: "review_required",
                activities: [],
                workDone: [],
                openFindingTitles: [],
                nextActions: ["Completează onboarding-ul clientului și rulează primul scan."],
              }
            }

            const normalized = normalizeComplianceState(state)
            const summary = computeDashboardSummary(normalized)
            const activity = buildMonthlyActivity(normalized, {
              dsar: dsarState,
              nis2: nis2State,
            })

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
              ...activity,
            }
          })
        )

        if (clientEntries.length === 0) {
          skipped++
          continue
        }

        const html = buildPartnerMonthlyHtml(user.email, clientEntries, month, branding)
        const clientFacingReports: ClientFacingReport[] = clientEntries.map((client) => ({
          orgId: client.orgId,
          orgName: client.orgName,
          month,
          html: buildClientFacingMonthlyHtml(client, month, branding),
          activities: client.activities,
          summary: {
            score: client.score,
            riskLabel: client.riskLabel,
            auditReadiness: client.auditReadiness,
            openFindings: client.openFindings,
            validatedEvidence: client.validatedEvidence,
            pendingEvidence: client.pendingEvidence,
          },
        }))

        if (preview) {
          previewReports.push({
            consultantEmail: user.email,
            month,
            clientEntries,
            html,
            clientFacingReports,
          })
          sent++
          continue
        }

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
        errorCount++
      }
    }

    await flushCronTelemetry()
    if (preview) {
      await safeRecordCronRun({
        name: "partner-monthly-report",
        lastRunAtISO: nowISO,
        ok: errorCount === 0,
        durationMs: Date.now() - startMs,
        summary: `Preview: ${previewReports.length} rapoarte generate, ${skipped} sărite, ${partners.length} parteneri.`,
        stats: {
          generated: previewReports.length,
          skipped,
          totalPartners: partners.length,
          errors: errorCount,
          preview: 1,
        },
        errorMessage: errorCount > 0 ? `${errorCount} parteneri au eșuat` : undefined,
      })
      return NextResponse.json({
        preview: true,
        generated: previewReports.length,
        skipped,
        totalPartners: partners.length,
        reports: previewReports,
      })
    }

    await safeRecordCronRun({
      name: "partner-monthly-report",
      lastRunAtISO: nowISO,
      ok: errorCount === 0,
      durationMs: Date.now() - startMs,
      summary: `${sent} rapoarte trimise, ${skipped} sărite, ${partners.length} parteneri${errorCount > 0 ? `, ${errorCount} erori` : ""}.`,
      stats: {
        sent,
        skipped,
        totalPartners: partners.length,
        errors: errorCount,
      },
      errorMessage: errorCount > 0 ? `${errorCount} parteneri au eșuat` : undefined,
    })

    return NextResponse.json({ sent, skipped, totalPartners: partners.length })
  } catch (err) {
    captureCronError(err, { cron: "partner-monthly-report" })
    await flushCronTelemetry()
    const msg = err instanceof Error ? err.message : "unknown"
    await safeRecordCronRun({
      name: "partner-monthly-report",
      lastRunAtISO: nowISO,
      ok: false,
      durationMs: Date.now() - startMs,
      summary: `Eroare critică: ${msg}`,
      stats: { errors: errorCount },
      errorMessage: msg,
    })
    return jsonError("Raportul lunar a eșuat.", 500, "PARTNER_MONTHLY_FAILED")
  }
}
