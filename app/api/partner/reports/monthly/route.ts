import { POST as generatePartnerMonthlyReport } from "@/app/api/cron/partner-monthly-report/route"
import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError } from "@/lib/server/auth"
import { requirePortfolioAccess } from "@/lib/server/portfolio"

export const runtime = "nodejs"

export async function GET(request: Request) {
  return generatePreview(request)
}

export async function POST(request: Request) {
  return generatePreview(request)
}

async function generatePreview(request: Request) {
  try {
    const { session } = await requirePortfolioAccess(request)
    const body = await readOptionalJson(request)
    const requestedClientOrgId =
      typeof body?.clientOrgId === "string" && body.clientOrgId.trim()
        ? body.clientOrgId.trim()
        : null
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

    return NextResponse.json(payload, { status: cronResponse.status })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut genera raportul lunar.", 500, "PARTNER_MONTHLY_PREVIEW_FAILED")
  }
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
