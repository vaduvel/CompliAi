// P1 — Scheduled reports API.
// GET: list all scheduled reports for the org.
// POST: create a new scheduled report.

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole, resolveUserMode } from "@/lib/server/auth"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { hasSupabaseConfig } from "@/lib/server/supabase-rest"
import {
  createScheduledReport,
  listScheduledReports,
  type ScheduledReportType,
  type ScheduledReportFrequency,
} from "@/lib/server/scheduled-reports"

const WRITE_ROLES = ["owner", "partner_manager"] as const

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, [...WRITE_ROLES, "compliance", "reviewer"], "rapoarte programate")
    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      throw new AuthzError("Rapoartele programate sunt disponibile doar în modul partner.", 403, "PARTNER_ONLY")
    }

    const orgId = session.orgId
    const [reports, state] = await Promise.all([
      listScheduledReports(orgId),
      readStateForOrg(orgId),
    ])
    const recentRuns = (state?.events ?? [])
      .filter((event) => event.type === "report.scheduled_run" || event.type === "report.scheduled_run_failed")
      .map((event) => ({
        id: event.id,
        scheduledReportId: String(event.metadata?.scheduledReportId ?? ""),
        reportType: String(event.metadata?.reportType ?? ""),
        status:
          event.type === "report.scheduled_run_failed"
            ? "failed"
            : event.metadata?.executionMode === "approved"
              ? "approved_then_executed"
            : Boolean(event.metadata?.approvalQueued)
              ? "queued_for_approval"
              : "auto_executed",
        createdAtISO: event.createdAtISO,
        message: event.message,
      }))
      .sort((left, right) => right.createdAtISO.localeCompare(left.createdAtISO))
      .slice(0, 30)

    const runtimeStatus = {
      storageBackend: hasSupabaseConfig() ? "supabase" : "local_fallback",
      persistenceStatus: hasSupabaseConfig() ? "synced" : "fallback",
    }

    return NextResponse.json({ reports, recentRuns, runtimeStatus })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la citirea rapoartelor.", 500, "REPORTS_LIST_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, [...WRITE_ROLES], "creare raport programat")
    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      throw new AuthzError("Rapoartele programate sunt disponibile doar în modul partner.", 403, "PARTNER_ONLY")
    }

    const orgId = session.orgId
    const userId = session.userId

    const body = (await request.json()) as {
      reportType?: ScheduledReportType
      frequency?: ScheduledReportFrequency
      clientOrgIds?: string[]
      recipientEmails?: string[]
      requiresApproval?: boolean
    }

    if (!body.reportType) return jsonError("reportType este obligatoriu.", 400, "MISSING_REPORT_TYPE")
    if (!body.frequency) return jsonError("frequency este obligatorie.", 400, "MISSING_FREQUENCY")
    if (!body.clientOrgIds?.length) return jsonError("Selectează cel puțin o firmă.", 400, "NO_CLIENTS")
    if (!body.recipientEmails?.length) return jsonError("Cel puțin un email destinatar este obligatoriu.", 400, "NO_RECIPIENTS")

    const report = await createScheduledReport({
      orgId,
      userId,
      reportType: body.reportType,
      frequency: body.frequency,
      clientOrgIds: body.clientOrgIds,
      recipientEmails: body.recipientEmails,
      requiresApproval: body.requiresApproval ?? true,
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la crearea raportului.", 500, "REPORT_CREATE_FAILED")
  }
}
