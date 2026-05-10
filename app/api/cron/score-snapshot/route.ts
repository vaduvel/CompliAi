// POST /api/cron/score-snapshot
// A3 — Daily score snapshot + score drop alert.
// Saves compliance score per org, triggers email if score dropped >= 3 points.
// Invoked by Vercel Cron (daily 07:30 UTC).

export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { loadOrganizations } from "@/lib/server/auth"
import { normalizeComplianceState, computeDashboardSummary } from "@/lib/compliance/engine"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { readAlertPreferences } from "@/lib/server/alert-preferences-store"
import { sendEmailAlert } from "@/lib/server/email-alerts"
import { saveScoreSnapshot, getScoreDelta } from "@/lib/score-snapshot"
import { captureCronError, flushCronTelemetry } from "@/lib/server/sentry-cron"
import { safeRecordCronRun } from "@/lib/server/cron-status-store"
import type { ComplianceStreak } from "@/lib/compliance/types"

const SCORE_DROP_THRESHOLD = -3

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("Authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return jsonError("Unauthorized.", 401, "UNAUTHORIZED")
    }
  }

  const nowISO = new Date().toISOString()
  const startMs = Date.now()
  const results: { orgId: string; score: number | null; alerted: boolean; error?: string }[] = []
  let capturedCronErrors = false

  try {
    const organizations = await loadOrganizations()
    const orgsToProcess = organizations.slice(0, 50)

    for (const org of orgsToProcess) {
      try {
        const rawState = await readStateForOrg(org.id)
        if (!rawState) {
          results.push({ orgId: org.id, score: null, alerted: false, error: "no state" })
          continue
        }

        const state = normalizeComplianceState(rawState)
        const summary = computeDashboardSummary(state)

        await saveScoreSnapshot(org.id, summary.score)

        const { delta, dropped, scoreYesterday } = await getScoreDelta(org.id)

        let alerted = false
        if (dropped && delta !== null && delta <= SCORE_DROP_THRESHOLD) {
          const prefs = await readAlertPreferences(org.id)
          if (prefs.emailEnabled && prefs.emailAddress && prefs.events["score.dropped"] !== false) {
            await sendEmailAlert(prefs.emailAddress, "score.dropped", org.id, {
              "Organizație": org.name,
              "Scor azi": `${summary.score}/100`,
              "Scor ieri": `${scoreYesterday ?? "?"}/100`,
              "Diferență": `${delta} puncte`,
            })
            alerted = true
          }
        }

        // Addon 1: Update compliance streak
        await updateComplianceStreak(org.id, summary.score, rawState, new Date().toISOString())

        results.push({ orgId: org.id, score: summary.score, alerted })
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown"
        capturedCronErrors =
          captureCronError(err, {
            cron: "/api/cron/score-snapshot",
            orgId: org.id,
            step: "org-run",
          }) || capturedCronErrors
        results.push({ orgId: org.id, score: null, alerted: false, error: msg })
      }
    }

    const saved = results.filter((r) => r.score !== null).length
    const alerted = results.filter((r) => r.alerted).length
    const errors = results.filter((r) => r.error && r.error !== "no state").length

    console.log(`[ScoreSnapshot] Run completat: ${saved} salvate, ${alerted} alerte trimise`)

    if (capturedCronErrors) {
      await flushCronTelemetry()
    }

    await safeRecordCronRun({
      name: "score-snapshot",
      lastRunAtISO: nowISO,
      ok: errors === 0,
      durationMs: Date.now() - startMs,
      summary: `${saved} score-uri salvate, ${alerted} alerte trimise${errors > 0 ? `, ${errors} erori` : ""}.`,
      stats: {
        saved,
        alerted,
        total: results.length,
        errors,
      },
      errorMessage:
        errors > 0
          ? results.find((r) => r.error && r.error !== "no state")?.error
          : undefined,
    })

    return NextResponse.json({
      ok: true,
      saved,
      alerted,
      total: results.length,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown"
    console.error(`[ScoreSnapshot] Eroare critică: ${msg}`)

    captureCronError(error, {
      cron: "/api/cron/score-snapshot",
      step: "critical",
    })
    await flushCronTelemetry()

    await safeRecordCronRun({
      name: "score-snapshot",
      lastRunAtISO: nowISO,
      ok: false,
      durationMs: Date.now() - startMs,
      summary: `Eroare critică: ${msg}`,
      stats: { processed: results.length },
      errorMessage: msg,
    })

    return jsonError(`Eroare la score snapshot: ${msg}`, 500, "SCORE_SNAPSHOT_FAILED")
  }
}

// ── Addon 1: Compliance Streak ──────────────────────────────────────────────

const DEFAULT_STREAK_THRESHOLD = 70

async function updateComplianceStreak(
  orgId: string,
  scoreToday: number,
  rawState: Record<string, unknown>,
  nowISO: string
): Promise<void> {
  try {
    const existing = (rawState.complianceStreak ?? null) as ComplianceStreak | null
    const streak: ComplianceStreak = existing ?? {
      currentDays: 0,
      longestStreak: 0,
      lastUpdated: "",
      threshold: DEFAULT_STREAK_THRESHOLD,
      brokenAt: null,
    }

    if (scoreToday >= streak.threshold) {
      streak.currentDays += 1
      streak.longestStreak = Math.max(streak.longestStreak, streak.currentDays)
      streak.brokenAt = null
    } else {
      if (streak.currentDays > 0) {
        streak.brokenAt = nowISO
      }
      streak.currentDays = 0
    }

    streak.lastUpdated = nowISO
    await writeStateForOrg(orgId, { ...rawState, complianceStreak: streak } as import("@/lib/compliance/types").ComplianceState)
  } catch {
    // Non-critical — streak update failure should not block cron
  }
}
