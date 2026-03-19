// V3 P1.3 — Inspector Mode API
import { NextResponse } from "next/server"
import { readState } from "@/lib/server/mvp-store"
import { getOrgContext } from "@/lib/server/org-context"
import { readNis2State } from "@/lib/server/nis2-store"
import { runInspectorSimulation } from "@/lib/compliance/inspector-mode"
import { requirePlan, PlanError } from "@/lib/server/plan"

export async function GET(request: Request) {
  try {
    await requirePlan(request, "pro", "Inspector Mode / Simulare Control")
    const { orgId } = await getOrgContext()
    const [state, nis2State] = await Promise.all([
      readState(),
      readNis2State(orgId),
    ])
    const result = runInspectorSimulation(state, nis2State, new Date().toISOString())
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof PlanError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status })
    }
    console.error("[inspector] GET error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
