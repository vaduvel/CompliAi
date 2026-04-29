import { POST as generatePartnerMonthlyReport } from "@/app/api/cron/partner-monthly-report/route"
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
    const targetUrl = new URL("/api/cron/partner-monthly-report", request.url)
    targetUrl.searchParams.set("preview", "1")
    if (session.email) {
      targetUrl.searchParams.set("consultantEmail", session.email)
    }

    const headers = new Headers()
    if (process.env.CRON_SECRET) {
      headers.set("Authorization", `Bearer ${process.env.CRON_SECRET}`)
    }

    return generatePartnerMonthlyReport(
      new Request(targetUrl, {
        method: "POST",
        headers,
      })
    )
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut genera raportul lunar.", 500, "PARTNER_MONTHLY_PREVIEW_FAILED")
  }
}
