import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { listAnafRequestLog } from "@/lib/server/anaf-request-log"

/**
 * GET /api/fiscal/anaf-request-log — list recent ANAF transport-level
 * request/response pairs for the active org. Used by the audit drawer to
 * surface evidence when a cabinet disputes an ANAF rejection.
 */
export async function GET(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "vizualizarea log-ului de cereri ANAF",
    )
    const url = new URL(request.url)
    const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "20", 10)
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 20

    const entries = await listAnafRequestLog(session.orgId, limit)
    return NextResponse.json({
      orgId: session.orgId,
      total: entries.length,
      entries,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Nu am putut citi log-ul ANAF.", 500, "ANAF_LOG_READ_FAILED")
  }
}
