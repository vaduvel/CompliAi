import { NextResponse } from "next/server"
import { readState } from "@/lib/server/mvp-store"
import { readNis2State } from "@/lib/server/nis2-store"
import { getOrgContext } from "@/lib/server/org-context"
import { loadEvidenceLedgerFromSupabase } from "@/lib/server/supabase-evidence-read"

export const dynamic = "force-dynamic"

export type AccumulationData = {
  dovediiSalvate: number | null       // evidence count
  rapoarteGenerate: number            // generated documents count
  furnizoriMonitorizati: number       // active NIS2 vendors
  luniMonitorizare: number            // months since first activity
  ultimulAuditPackZile: number | null // days since last audit pack (null = never)
}

export async function GET() {
  try {
    const { orgId } = await getOrgContext()
    const [state, nis2State, evidenceLedger] = await Promise.all([
      readState(),
      readNis2State(orgId).catch(() => ({ vendors: [], incidents: [] })),
      loadEvidenceLedgerFromSupabase({ orgId }).catch(() => null),
    ])

    // Dovezi: evidence ledger (Supabase) or generated documents as proxy
    const dovediiSalvate = evidenceLedger !== null
      ? evidenceLedger.length
      : null

    // Rapoarte generate
    const rapoarteGenerate = (state.generatedDocuments ?? []).length

    // Furnizori monitorizați (NIS2 vendors)
    const furnizoriMonitorizati = (nis2State.vendors ?? []).length

    // Luni de monitorizare — from oldest snapshot or first scan
    const allDates = [
      ...(state.snapshotHistory ?? []).map((s) => s.generatedAt),
      ...(state.scans ?? []).map((s) => s.createdAtISO),
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
    const lastSnapshot = (state.snapshotHistory ?? []).sort(
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
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 })
  }
}
