import { NextResponse } from "next/server"
import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import { readNis2State } from "@/lib/server/nis2-store"
import { loadEvidenceLedgerFromSupabase } from "@/lib/server/supabase-evidence-read"

export const dynamic = "force-dynamic"

export type AccumulationData = {
  dovediiSalvate: number | null       // evidence count
  rapoarteGenerate: number            // generated documents count
  furnizoriMonitorizati: number       // active NIS2 vendors
  luniMonitorizare: number            // months since first activity
  ultimulAuditPackZile: number | null // days since last audit pack (null = never)
}

export async function GET(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "indicatorii operaționali ai dashboardului"
    )
    const workspace = { orgId: session.orgId, orgName: session.orgName }
    const [state, nis2State, evidenceLedger] = await Promise.all([
      readFreshStateForOrg(workspace.orgId, workspace.orgName),
      readNis2State(workspace.orgId).catch(() => ({ vendors: [], incidents: [] })),
      loadEvidenceLedgerFromSupabase({ orgId: workspace.orgId }).catch(() => null),
    ])
    const normalizedState = state ?? normalizeComplianceState(initialComplianceState)

    // Dovezi: evidence ledger (Supabase) or generated documents as proxy
    const dovediiSalvate = evidenceLedger !== null
      ? evidenceLedger.length
      : null

    // Rapoarte generate
    const rapoarteGenerate = (normalizedState.generatedDocuments ?? []).length

    // Furnizori monitorizați (NIS2 vendors)
    const furnizoriMonitorizati = (nis2State.vendors ?? []).length

    // Luni de monitorizare — from oldest snapshot or first scan
    const allDates = [
      ...(normalizedState.snapshotHistory ?? []).map((s) => s.generatedAt),
      ...(normalizedState.scans ?? []).map((s) => s.createdAtISO),
    ].filter(Boolean).sort()
    const oldestDate = allDates[0]
    const luniMonitorizare = oldestDate
      ? Math.max(
          1,
          Math.floor(
            (Date.now() - new Date(oldestDate).getTime()) / (30 * 24 * 60 * 60 * 1000)
          )
        )
      : 0

    // Ultimul audit pack — days since last snapshot
    const lastSnapshot = (normalizedState.snapshotHistory ?? []).sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    )[0]
    const ultimulAuditPackZile = lastSnapshot
      ? Math.floor((Date.now() - new Date(lastSnapshot.generatedAt).getTime()) / (24 * 60 * 60 * 1000))
      : null

    const data: AccumulationData = {
      dovediiSalvate,
      rapoarteGenerate,
      furnizoriMonitorizati,
      luniMonitorizare,
      ultimulAuditPackZile,
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Nu am putut încărca indicatorii dashboardului.",
      503,
      "DASHBOARD_ACCUMULATION_UNAVAILABLE"
    )
  }
}
