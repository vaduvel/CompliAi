export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { runDriftSweep } from "@/lib/server/drift-trigger-engine"

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return jsonError("Unauthorized.", 401, "UNAUTHORIZED")
    }

    const result = await runDriftSweep()

    return NextResponse.json({
      ok: true,
      ...result,
      message: `Drift sweep completat: ${result.flagged} flagged, ${result.reopened} reopened.`,
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Eroare la drift sweep.",
      500,
      "DRIFT_SWEEP_FAILED"
    )
  }
}
