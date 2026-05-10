// Sprint 9 — Admin observability endpoint pentru cron-uri.
//
// GET /api/admin/cron-status
//   → returnează lista crons configurate (din vercel.json) + last-run records
//     stocate în cron-status-store.
//
// Doar utilizatorii autentificați pot accesa. (Stratificare admin-only e
// preluată prin organization scope — în prod, ar trebui restricționat la
// owner/partner_manager.)

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import {
  CONFIGURED_CRONS,
  safeGetAllCronStatuses,
  type CronRunRecord,
} from "@/lib/server/cron-status-store"

export async function GET(request: Request) {
  try {
    await requireFreshAuthenticatedSession(request, "Admin cron status")
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      const e = err as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Auth eșuată.", 401, "CRON_STATUS_AUTH_FAILED")
  }

  const records = await safeGetAllCronStatuses()
  const recordsByName = new Map<string, CronRunRecord>(records.map((r) => [r.name, r]))

  const merged = CONFIGURED_CRONS.map((c) => ({
    name: c.name,
    path: c.path,
    schedule: c.schedule,
    description: c.description,
    lastRun: recordsByName.get(c.name) ?? null,
  }))

  // Crons cu records dar fără config (fallback — rare)
  for (const r of records) {
    if (!CONFIGURED_CRONS.some((c) => c.name === r.name)) {
      merged.push({
        name: r.name,
        path: `/api/cron/${r.name}`,
        schedule: "(necunoscut)",
        description: "(neconfigurat în vercel.json — verifică cron-status-store.ts)",
        lastRun: r,
      })
    }
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    crons: merged,
  })
}
