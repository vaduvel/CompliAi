// V3 P1.2 — Compliance Health Check API
import { NextResponse } from "next/server"
import { readState } from "@/lib/server/mvp-store"
import { runHealthCheck } from "@/lib/compliance/health-check"
import { requirePlan, PlanError } from "@/lib/server/plan"

export async function GET(request: Request) {
  try {
    await requirePlan(request, "pro", "Health Check periodic")
    const state = await readState()
    const result = runHealthCheck(state, new Date().toISOString())
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof PlanError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status })
    }
    console.error("[health-check] GET error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
