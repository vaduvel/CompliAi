import { POST as generatePartnerMonthlyReport } from "@/app/api/cron/partner-monthly-report/route"
import { NextResponse } from "next/server"
import { computeDashboardSummary, normalizeComplianceState } from "@/lib/compliance/engine"
import type { ComplianceState, ScanFinding } from "@/lib/compliance/types"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, type SessionPayload } from "@/lib/server/auth"
import { readDsarState } from "@/lib/server/dsar-store"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { readNis2State } from "@/lib/server/nis2-store"
import { requirePortfolioAccess } from "@/lib/server/portfolio"
import { isFindingOperationallyClosed } from "@/lib/compliance/task-resolution"
import { getWhiteLabelConfig } from "@/lib/server/white-label"
import { getScoreDelta } from "@/lib/score-snapshot"
import { getIncidentIdFromAnspdcpFindingId } from "@/lib/compliance/anspdcp-breach-rescue"

export const runtime = "nodejs"

export async function GET(request: Request) {
  return generatePreview(request)
}

export async function POST(request: Request) {
  return generatePreview(request)
}

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

async function generatePreview(request: Request) {
  try {
    const { session } = await requirePortfolioAccess(request)
    const body = await readOptionalJson(request)
    const requestedClientOrgId =
      typeof body?.clientOrgId === "string" && body.clientOrgId.trim()
        ? body.clientOrgId.trim()
        : null
    const currentClientFallbackOnly = body?.currentClientFallbackOnly === true

    if (currentClientFallbackOnly) {
      const fallback = await buildCurrentClientPreview(session)
      if (fallback) {
        return NextResponse.json(fallback)
      }
      return jsonError(
        "Nu există suficientă activitate pe clientul curent pentru raportul lunar.",
        404,
        "MONTHLY_REPORT_CURRENT_CLIENT_EMPTY"
      )
    }

    const targetUrl = new URL("/api/cron/partner-monthly-report", request.url)
    targetUrl.searchParams.set("preview", "1")
    if (session.email) {
      targetUrl.searchParams.set("consultantEmail", session.email)
    }

    const headers = new Headers()
    if (process.env.CRON_SECRET) {
      headers.set("Authorization", `Bearer ${process.env.CRON_SECRET}`)
    }

    const cronResponse = await generatePartnerMonthlyReport(
      new Request(targetUrl, {
        method: "POST",
        headers,
      })
    )
    const payload = await cronResponse.json()

    if (requestedClientOrgId) {
      const report = Array.isArray(payload?.reports) ? payload.reports[0] : null
      const clientEntry = report?.clientEntries?.find(
        (entry: { orgId?: string }) => entry.orgId === requestedClientOrgId
      )
      const clientFacingReport = report?.clientFacingReports?.find(
        (entry: { orgId?: string }) => entry.orgId === requestedClientOrgId
      )

      if (!clientEntry) {
        if (requestedClientOrgId === session.orgId) {
          const fallback = await buildCurrentClientPreview(session)
          if (fallback?.reports?.[0]?.clientEntries?.[0]) {
            const fallbackEntry = fallback.reports[0].clientEntries[0]
            const fallbackReport = fallback.reports[0].clientFacingReports[0]
            return NextResponse.json({
              ok: true,
              preview: true,
              month: fallback.reports[0].month,
              clientOrgId: session.orgId,
              clientEntry: fallbackEntry,
              activities: fallbackEntry.activities,
              html: fallbackReport?.html ?? null,
              report: fallbackReport ?? null,
              fallback: "current_client_context",
            })
          }
        }
        return jsonError(
          "Nu am găsit clientul cerut în raportul lunar al portofoliului.",
          404,
          "MONTHLY_REPORT_CLIENT_NOT_FOUND"
        )
      }

      const activities = Array.isArray(clientEntry.activities)
        ? clientEntry.activities
        : Array.isArray(clientEntry.workDone)
          ? clientEntry.workDone
          : []

      return NextResponse.json({
        ok: true,
        preview: true,
        month: report?.month ?? null,
        clientOrgId: requestedClientOrgId,
        clientEntry,
        activities,
        html: clientFacingReport?.html ?? null,
        report: clientFacingReport ?? null,
      })
    }

    if (!Array.isArray(payload?.reports) || payload.reports.length === 0 || payload.generated === 0) {
      const fallback = await buildCurrentClientPreview(session)
      if (fallback) {
        return NextResponse.json(fallback)
      }
    }

    return NextResponse.json(payload, { status: cronResponse.status })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut genera raportul lunar.", 500, "PARTNER_MONTHLY_PREVIEW_FAILED")
  }
}

async function buildCurrentClientPreview(session: SessionPayload) {
  const state = await readStateForOrg(session.orgId)
  if (!state) return null

  const [dsarState, nis2State, wl] = await Promise.all([
    readDsarState(session.orgId).catch(() => null),
    readNis2State(session.orgId).catch(() => null),
    getWhiteLabelConfig(session.orgId).catch(() => null),
  ])
  const branding = wl?.partnerName
    ? { partnerName: wl.partnerName, brandColor: wl.brandColor, tagline: wl.tagline }
    : undefined

  const normalized = normalizeComplianceState(state)
  const summary = computeDashboardSummary(normalized)
  const activity = buildCurrentClientActivity(normalized, { dsar: dsarState, nis2: nis2State })
  const month = new Date().toLocaleDateString("ro-RO", {
    month: "long",
    year: "numeric",
  })

  let scoreDelta30d: number | null = null
  try {
    const delta = await getScoreDelta(session.orgId)
    scoreDelta30d = delta.delta
  } catch {
    scoreDelta30d = null
  }

  const clientEntry: ClientReportEntry = {
    orgId: session.orgId,
    orgName: session.orgName,
    score: summary.score,
    riskLabel: summary.riskLabel,
    openAlerts: summary.openAlerts,
    scoreDelta30d,
    ...activity,
  }
  const clientFacingReports = [
    {
      orgId: clientEntry.orgId,
      orgName: clientEntry.orgName,
      month,
      html: buildSimpleClientMonthlyHtml(clientEntry, month, branding),
      activities: clientEntry.activities,
      summary: {
        score: clientEntry.score,
        riskLabel: clientEntry.riskLabel,
        auditReadiness: clientEntry.auditReadiness,
        openFindings: clientEntry.openFindings,
        validatedEvidence: clientEntry.validatedEvidence,
        pendingEvidence: clientEntry.pendingEvidence,
      },
    },
  ]

  return {
    preview: true,
    generated: 1,
    skipped: 0,
    totalPartners: 0,
    fallback: "current_client_context",
    reports: [
      {
        consultantEmail: session.email,
        month,
        clientEntries: [clientEntry],
        html: buildSimpleClientMonthlyHtml(clientEntry, month, branding),
        clientFacingReports,
      },
    ],
  }
}

function buildCurrentClientActivity(
  state: ComplianceState,
  external: {
    dsar: Awaited<ReturnType<typeof readDsarState>> | null
    nis2: Awaited<ReturnType<typeof readNis2State>> | null
  }
) {
  const openFindings = state.findings.filter(
    (finding) =>
      isOpenMonthlyFinding(state, finding)
      && !isSubmittedAnspdcpFinding(finding, external.nis2)
  )
  const validatedEvidence = Object.values(state.taskState).filter(
    (task) => task.attachedEvidenceMeta?.quality?.status === "sufficient"
  ).length

  const eventItems = (state.events ?? [])
    .filter((event) =>
      [
        "document.shared_approved",
        "document.shared_rejected",
        "document.shared_commented",
        "document.shared",
        "document.generated",
        "document_generated",
        "dsar.created",
        "gdpr.training.created",
        "gdpr.training.updated",
        "incident.personal_data.created",
        "anspdcp.notification.submitted",
      ].includes(event.type)
    )
    .slice()
    .sort((left, right) => right.createdAtISO.localeCompare(left.createdAtISO))
    .slice(0, 5)
    .map((event) => event.message)

  const dsarItems = (external.dsar?.requests ?? [])
    .slice()
    .sort((left, right) => right.updatedAtISO.localeCompare(left.updatedAtISO))
    .slice(0, 2)
    .map((request) => `DSAR ${request.requesterName} înregistrat · termen ${new Date(request.deadlineISO).toLocaleDateString("ro-RO")}.`)

  const trainingItems = (state.gdprTrainingRecords ?? [])
    .slice()
    .sort((left, right) => right.updatedAtISO.localeCompare(left.updatedAtISO))
    .slice(0, 2)
    .map((record) =>
      record.status === "completed"
        ? `Training GDPR finalizat: ${record.title} · ${record.participantCount} participanți.`
        : `Training GDPR înregistrat: ${record.title} · ${record.participantCount} participanți.`
    )

  const breachItems = (external.nis2?.incidents ?? [])
    .filter((incident) => incident.involvesPersonalData || incident.anspdcpNotification)
    .slice()
    .sort((left, right) => right.updatedAtISO.localeCompare(left.updatedAtISO))
    .slice(0, 2)
    .map((incident) =>
      incident.anspdcpNotification?.status === "submitted"
        ? `Breach ANSPDCP trimis: ${incident.title}.`
        : `Breach cu date personale înregistrat: ${incident.title}.`
    )

  const importItems = state.importedClientContext
    ? [`Client importat din fișier cabinet${state.importedClientContext.contactName ? ` · contact ${state.importedClientContext.contactName}` : ""}.`]
    : []
  const workDone = [...new Set([...eventItems, ...dsarItems, ...trainingItems, ...breachItems, ...importItems])].slice(0, 8)
  const sortedOpenFindings = openFindings.slice().sort(compareMonthlyFindings)

  return {
    openFindings: openFindings.length,
    validatedEvidence,
    pendingEvidence: openFindings.length,
    auditReadiness:
      openFindings.length === 0 && Boolean(state.validatedBaselineSnapshotId)
        ? "audit_ready" as const
        : "review_required" as const,
    activities: workDone,
    workDone,
    openFindingTitles: sortedOpenFindings
      .slice(0, 4)
      .map((finding) => `${finding.title}${finding.legalReference ? ` · ${finding.legalReference}` : ""}`),
    nextActions: sortedOpenFindings
      .slice(0, 3)
      .map((finding) => finding.remediationHint || finding.resolution?.action || finding.title),
  }
}

function isSubmittedAnspdcpFinding(
  finding: ScanFinding,
  nis2State: Awaited<ReturnType<typeof readNis2State>> | null
) {
  const incidentId = getIncidentIdFromAnspdcpFindingId(finding.id)
  if (!incidentId) return false
  const incident = nis2State?.incidents.find((item) => item.id === incidentId)
  return incident?.anspdcpNotification?.status === "submitted"
    || incident?.anspdcpNotification?.status === "acknowledged"
}

function isOpenMonthlyFinding(state: ComplianceState, finding: ScanFinding) {
  return !["resolved", "dismissed", "under_monitoring"].includes(finding.findingStatus ?? "open")
    && !isFindingOperationallyClosed(state, finding.id)
}

function compareMonthlyFindings(left: ScanFinding, right: ScanFinding) {
  const severityRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  const bySeverity = (severityRank[left.severity] ?? 3) - (severityRank[right.severity] ?? 3)
  if (bySeverity !== 0) return bySeverity
  return left.createdAtISO.localeCompare(right.createdAtISO)
}

function buildSimpleClientMonthlyHtml(
  client: ClientReportEntry,
  month: string,
  branding?: { partnerName: string; brandColor: string; tagline: string | null }
) {
  const brandColor = branding?.brandColor ?? "#4f46e5"
  const cabinetName = branding?.partnerName ?? "Cabinet DPO"
  const items = (values: string[], empty: string) =>
    values.length > 0
      ? values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")
      : `<li style="color:#94a3b8">${escapeHtml(empty)}</li>`

  return `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#0f172a">
  <div style="background:${brandColor};padding:18px 22px;border-radius:12px 12px 0 0;color:white">
    <div style="font-size:12px;opacity:.72;text-transform:uppercase;letter-spacing:.08em">${escapeHtml(cabinetName)}</div>
    <h1 style="margin:4px 0 0;font-size:20px">Raport lunar DPO — ${escapeHtml(client.orgName)}</h1>
    <p style="margin:6px 0 0;opacity:.72;font-size:13px">${escapeHtml(month)}</p>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:22px;border-radius:0 0 12px 12px">
    <p><strong>Scor:</strong> ${client.score}/100 · <strong>Status:</strong> ${client.auditReadiness} · <strong>Findings deschise:</strong> ${client.openFindings}</p>
    <h2 style="font-size:15px">Ce s-a lucrat</h2>
    <ul>${items(client.workDone, "Nu există acțiuni noi în perioada raportată.")}</ul>
    <h2 style="font-size:15px">Rămâne deschis</h2>
    <ul>${items(client.openFindingTitles, "Nu există findings deschise.")}</ul>
    <h2 style="font-size:15px">Următorul pas</h2>
    <ul>${items(client.nextActions, "Menține monitorizarea lunară.")}</ul>
    <p style="border-top:1px solid #e2e8f0;margin-top:18px;padding-top:12px;color:#64748b;font-size:11px">
      Document de lucru pregătit de ${escapeHtml(cabinetName)}. Necesită validare profesională înainte de utilizare oficială.
    </p>
  </div>
</body></html>`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

async function readOptionalJson(request: Request): Promise<Record<string, unknown> | null> {
  if (request.method !== "POST") return null
  try {
    const text = await request.clone().text()
    if (!text.trim()) return null
    const parsed = JSON.parse(text) as unknown
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}
