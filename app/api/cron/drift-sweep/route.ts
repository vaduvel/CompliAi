export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { runDriftSweep } from "@/lib/server/drift-trigger-engine"
import { safeRecordCronRun } from "@/lib/server/cron-status-store"

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  const nowISO = new Date().toISOString()
  const startMs = Date.now()
  try {
    const authHeader = request.headers.get("authorization")
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return jsonError("Unauthorized.", 401, "UNAUTHORIZED")
    }

    const result = await runDriftSweep()

    await safeRecordCronRun({
      name: "drift-sweep",
      lastRunAtISO: nowISO,
      ok: true,
      durationMs: Date.now() - startMs,
      summary: `${result.flagged} flagged, ${result.reopened} reopened.`,
      stats: {
        flagged: result.flagged,
        reopened: result.reopened,
      },
    })

    return NextResponse.json({
      ok: true,
      ...result,
      message: `Drift sweep completat: ${result.flagged} flagged, ${result.reopened} reopened.`,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Eroare la drift sweep."
    await safeRecordCronRun({
      name: "drift-sweep",
      lastRunAtISO: nowISO,
      ok: false,
      durationMs: Date.now() - startMs,
      summary: `Eroare critică: ${msg}`,
      stats: {},
      errorMessage: msg,
    })
    return jsonError(
      msg,
      500,
      "DRIFT_SWEEP_FAILED"
    )
  }
}
