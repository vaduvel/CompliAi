// P1 — Scheduled report by ID.
// PATCH: update a scheduled report.
// DELETE: delete a scheduled report.

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole, resolveUserMode } from "@/lib/server/auth"
import {
  updateScheduledReport,
  deleteScheduledReport,
  getScheduledReport,
  type ScheduledReportType,
  type ScheduledReportFrequency,
} from "@/lib/server/scheduled-reports"

const WRITE_ROLES = ["owner", "partner_manager"] as const

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFreshRole(request, [...WRITE_ROLES, "compliance", "reviewer"], "raport programat")
    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      throw new AuthzError("Modul partner necesar.", 403, "PARTNER_ONLY")
    }

    const orgId = request.headers.get("x-compliscan-org-id") ?? session.orgId
    const { id } = await params

    const report = await getScheduledReport(orgId, id)
    if (!report) return jsonError("Raportul nu a fost găsit.", 404, "REPORT_NOT_FOUND")

    return NextResponse.json({ report })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la citirea raportului.", 500, "REPORT_GET_FAILED")
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFreshRole(request, [...WRITE_ROLES], "actualizare raport programat")
    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      throw new AuthzError("Modul partner necesar.", 403, "PARTNER_ONLY")
    }

    const orgId = request.headers.get("x-compliscan-org-id") ?? session.orgId
    const { id } = await params

    const body = (await request.json()) as {
      reportType?: ScheduledReportType
      frequency?: ScheduledReportFrequency
      clientOrgIds?: string[]
      recipientEmails?: string[]
      requiresApproval?: boolean
      enabled?: boolean
    }

    const updated = await updateScheduledReport(orgId, id, body)
    if (!updated) return jsonError("Raportul nu a fost găsit.", 404, "REPORT_NOT_FOUND")

    return NextResponse.json({ report: updated })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la actualizarea raportului.", 500, "REPORT_UPDATE_FAILED")
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFreshRole(request, [...WRITE_ROLES], "ștergere raport programat")
    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      throw new AuthzError("Modul partner necesar.", 403, "PARTNER_ONLY")
    }

    const orgId = request.headers.get("x-compliscan-org-id") ?? session.orgId
    const { id } = await params

    await deleteScheduledReport(orgId, id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la ștergerea raportului.", 500, "REPORT_DELETE_FAILED")
  }
}
