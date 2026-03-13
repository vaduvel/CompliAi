import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { buildClientAnnexLiteDocument } from "@/lib/server/annex-lite-client"
import { readState } from "@/lib/server/mvp-store"

export async function GET() {
  const payload = await buildDashboardPayload(await readState())
  const document = buildClientAnnexLiteDocument(payload.compliancePack)

  return new Response(document.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${document.fileName}"`,
      "Cache-Control": "no-store",
    },
  })
}
