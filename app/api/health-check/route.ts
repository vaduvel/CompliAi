// V3 P1.2 — Compliance Health Check API
import { NextResponse } from "next/server"
import { readState } from "@/lib/server/mvp-store"
import { runHealthCheck } from "@/lib/compliance/health-check"

export async function GET() {
  try {
    const state = await readState()
    const result = runHealthCheck(state, new Date().toISOString())
    return NextResponse.json(result)
  } catch (err) {
    console.error("[health-check] GET error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
