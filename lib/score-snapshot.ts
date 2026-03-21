// A3 — Score Snapshot persistence (Supabase REST)
// Stores daily compliance score per org for delta alerts and trend tracking.

import {
  hasSupabaseConfig,
  supabaseSelect,
  supabaseUpsert,
} from "@/lib/server/supabase-rest"

type ScoreSnapshotRow = {
  org_id: string
  date: string
  score: number
}

export async function saveScoreSnapshot(orgId: string, score: number): Promise<void> {
  if (!hasSupabaseConfig()) return

  const today = new Date().toISOString().split("T")[0]!
  await supabaseUpsert<ScoreSnapshotRow, ScoreSnapshotRow>(
    "score_snapshots",
    { org_id: orgId, date: today, score }
  )
}

export async function getScoreDelta(orgId: string): Promise<{
  scoreToday: number | null
  scoreYesterday: number | null
  delta: number | null
  dropped: boolean
}> {
  if (!hasSupabaseConfig()) {
    return { scoreToday: null, scoreYesterday: null, delta: null, dropped: false }
  }

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStr = today.toISOString().split("T")[0]!
  const yesterdayStr = yesterday.toISOString().split("T")[0]!

  const rows = await supabaseSelect<ScoreSnapshotRow>(
    "score_snapshots",
    `select=date,score&org_id=eq.${orgId}&date=in.(${todayStr},${yesterdayStr})&order=date.desc`
  )

  if (!rows || rows.length === 0) {
    return { scoreToday: null, scoreYesterday: null, delta: null, dropped: false }
  }

  const scoreToday = rows.find((r) => r.date === todayStr)?.score ?? null
  const scoreYesterday = rows.find((r) => r.date === yesterdayStr)?.score ?? null
  const delta =
    scoreToday !== null && scoreYesterday !== null ? scoreToday - scoreYesterday : null

  return {
    scoreToday,
    scoreYesterday,
    delta,
    dropped: delta !== null && delta < 0,
  }
}
