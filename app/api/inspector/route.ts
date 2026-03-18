// V3 P1.3 — Inspector Mode API
import { NextResponse } from "next/server"
import { readState } from "@/lib/server/mvp-store"
import { getOrgContext } from "@/lib/server/org-context"
import { readNis2State } from "@/lib/server/nis2-store"
import { runInspectorSimulation } from "@/lib/compliance/inspector-mode"

export async function GET() {
  try {
    const { orgId } = await getOrgContext()
    const [state, nis2State] = await Promise.all([
      readState(),
      readNis2State(orgId),
    ])
    const result = runInspectorSimulation(state, nis2State, new Date().toISOString())
    return NextResponse.json(result)
  } catch (err) {
    console.error("[inspector] GET error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
