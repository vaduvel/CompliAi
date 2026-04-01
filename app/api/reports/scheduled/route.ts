// P1 — Scheduled reports API.
// GET: list all scheduled reports for the org.
// POST: create a new scheduled report.

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole, resolveUserMode } from "@/lib/server/auth"
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

    const orgId = request.headers.get("x-compliscan-org-id") ?? ""
    const reports = await listScheduledReports(orgId)

    return NextResponse.json({ reports })
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

    const orgId = request.headers.get("x-compliscan-org-id") ?? ""
    const userId = request.headers.get("x-compliscan-user-id") ?? ""

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
