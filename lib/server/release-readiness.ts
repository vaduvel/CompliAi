import { getApplicationHealthStatus } from "@/lib/server/app-health"
import { getRlsVerificationReadiness } from "@/lib/server/rls-verification-status"
import {
  evaluateStrictSupabasePreflight,
  type SupabaseLiveCheckEntry,
} from "@/lib/server/supabase-strict-preflight"
import { getSupabaseOperationalStatus } from "@/lib/server/supabase-status"

export type ReleaseReadinessState = "ready" | "review" | "blocked"

export type ReleaseReadinessStatus = {
  state: ReleaseReadinessState
  ready: boolean
  summary: string
  blockers: string[]
  warnings: string[]
  checks: Array<{
    key: string
    label: string
    state: "healthy" | "degraded" | "blocked"
    summary: string
  }>
}

export async function getReleaseReadinessStatus(): Promise<ReleaseReadinessStatus> {
  const [appHealth, supabaseStatus, rlsVerification] = await Promise.all([
    getApplicationHealthStatus(),
    getSupabaseOperationalStatus(),
    getRlsVerificationReadiness(),
  ])
  const strictPreflight = evaluateStrictSupabasePreflight(
    process.env,
    buildLiveResultsFromSupabaseStatus(supabaseStatus)
  )

  const blockers = [...appHealth.blockers]
  const warnings = [...appHealth.warnings]
  const checks: ReleaseReadinessStatus["checks"] = [
    ...appHealth.checks,
    {
      key: "strict_supabase_preflight",
      label: "Strict supabase preflight",
      state: strictPreflight.ready ? "healthy" : "degraded",
      summary: strictPreflight.ready
        ? "Mediul strict `supabase` este pregătit."
        : strictPreflight.blockers[0] || "Mediul strict `supabase` cere verificare.",
    },
    {
      key: "live_rls_verification",
      label: "Live RLS verification",
      state: rlsVerification.ready ? "healthy" : "degraded",
      summary: rlsVerification.summary,
    },
  ]

  if (!strictPreflight.ready) {
    warnings.push(...strictPreflight.blockers)
  }

  if (!rlsVerification.ready) {
    warnings.push(...rlsVerification.blockers)
  }

  const state = deriveReleaseState(appHealth.state, strictPreflight.ready, rlsVerification.ready)

  if (state === "blocked" && blockers.length === 0) {
    blockers.push("Există blocaje operaționale care împiedică release-ul controlat.")
  }

  return {
    state,
    ready: state === "ready",
    summary: buildSummary(state),
    blockers,
    warnings: dedupe(warnings),
    checks,
  }
}

function deriveReleaseState(
  appHealthState: "healthy" | "degraded" | "blocked",
  strictSupabaseReady: boolean,
  rlsVerificationReady: boolean
): ReleaseReadinessState {
  if (appHealthState === "blocked") return "blocked"
  if (appHealthState === "degraded" || !strictSupabaseReady || !rlsVerificationReady) {
    return "review"
  }
  return "ready"
}

function buildSummary(state: ReleaseReadinessState) {
  switch (state) {
    case "ready":
      return "Build-ul este pregătit pentru release controlat pe baza verificărilor operaționale curente."
    case "blocked":
      return "Release-ul trebuie blocat până când închidem problemele operaționale active."
    case "review":
    default:
      return "Release-ul poate fi discutat, dar cere review explicit înainte de a-l trata ca variantă pilot-ready."
  }
}

function buildLiveResultsFromSupabaseStatus(status: Awaited<ReturnType<typeof getSupabaseOperationalStatus>>) {
  const liveResults: SupabaseLiveCheckEntry[] = Object.entries(status.tables).map(([name, entry]) => ({
    kind: "table",
    name,
    status: entry.ok ? 200 : entry.state === "missing_schema" ? 404 : 500,
  }))

  if (status.bucket) {
    liveResults.push({
      kind: "bucket",
      name: status.bucket.name,
      status: status.bucket.ok ? 200 : status.bucket.state === "missing_bucket" ? 404 : 500,
    })
  }

  return liveResults
}

function dedupe(items: string[]) {
  return Array.from(new Set(items))
}
