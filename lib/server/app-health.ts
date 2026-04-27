import { getConfiguredAuthBackend } from "@/lib/server/auth"
import { isLocalFallbackAllowedForCloudPrimary } from "@/lib/server/cloud-fallback-policy"
import { getSupabaseOperationalStatus } from "@/lib/server/supabase-status"
import { getConfiguredDataBackend } from "@/lib/server/supabase-tenancy"

export type AppHealthState = "healthy" | "degraded" | "blocked"

export type AppHealthCheck = {
  key:
    | "session_secret"
    | "auth_backend"
    | "data_backend"
    | "supabase_operational"
    | "local_fallback"
  label: string
  state: AppHealthState
  summary: string
}

export type ApplicationHealthStatus = {
  state: AppHealthState
  summary: string
  blockers: string[]
  warnings: string[]
  checks: AppHealthCheck[]
  config: {
    authBackend: "local" | "supabase" | "hybrid" | "dual-write"
    dataBackend: "local" | "supabase" | "hybrid" | "dual-write"
    localFallbackAllowed: boolean
    production: boolean
  }
}

export async function getApplicationHealthStatus(): Promise<ApplicationHealthStatus> {
  const authBackend = getConfiguredAuthBackend()
  const dataBackend = getConfiguredDataBackend()
  const production = process.env.NODE_ENV === "production"
  const sessionSecretConfigured = Boolean(process.env.COMPLISCAN_SESSION_SECRET?.trim())
  const localFallbackAllowed = isLocalFallbackAllowedForCloudPrimary()

  const blockers: string[] = []
  const warnings: string[] = []
  const checks: AppHealthCheck[] = []

  if (sessionSecretConfigured) {
    checks.push({
      key: "session_secret",
      label: "Secret sesiune",
      state: "healthy",
      summary: "Configurat explicit.",
    })
  } else if (production) {
    blockers.push("COMPLISCAN_SESSION_SECRET lipsește în producție.")
    checks.push({
      key: "session_secret",
      label: "Secret sesiune",
      state: "blocked",
      summary: "Lipsește în producție.",
    })
  } else {
    warnings.push("Secretul de sesiune nu este setat explicit; development folosește fallback local.")
    checks.push({
      key: "session_secret",
      label: "Secret sesiune",
      state: "degraded",
      summary: "Fallback permis în development.",
    })
  }

  checks.push({
    key: "auth_backend",
    label: "Backend auth",
    state: authBackend === "supabase" ? "healthy" : authBackend === "hybrid" ? "degraded" : "degraded",
    summary: formatBackendSummary(authBackend),
  })

  checks.push({
    key: "data_backend",
    label: "Backend date",
    state:
      dataBackend === "supabase"
        ? "healthy"
        : dataBackend === "dual-write"
          ? "healthy" // dual-write e cale spre cutover, nu degradare
          : "degraded",
    summary: formatBackendSummary(dataBackend),
  })

  if (authBackend !== "supabase") {
    warnings.push("Identitatea finală nu rulează încă strict pe Supabase Auth.")
  }

  if (dataBackend !== "supabase") {
    warnings.push("Datele aplicației nu rulează încă strict pe backend-ul cloud principal.")
  }

  if (localFallbackAllowed) {
    warnings.push("Fallback-ul local este încă permis pentru trasee cloud-primary.")
    checks.push({
      key: "local_fallback",
      label: "Fallback local",
      state: "degraded",
      summary: "Permis; bun pentru development, slab pentru operare strictă.",
    })
  } else {
    checks.push({
      key: "local_fallback",
      label: "Fallback local",
      state: "healthy",
      summary: "Blocat pentru cloud-first strict.",
    })
  }

  const shouldCheckSupabase = authBackend !== "local" || dataBackend !== "local"

  if (shouldCheckSupabase) {
    const supabaseStatus = await getSupabaseOperationalStatus()
    if (supabaseStatus.summary.ready) {
      checks.push({
        key: "supabase_operational",
        label: "Supabase operational",
        state: "healthy",
        summary: "REST, bucket și schema critică răspund corect.",
      })
    } else {
      const detail =
        supabaseStatus.summary.blockers[0] ||
        "Traseul Supabase are componente lipsă sau degradate."

      if (authBackend === "supabase" || dataBackend === "supabase") {
        blockers.push(detail)
        checks.push({
          key: "supabase_operational",
          label: "Supabase operational",
          state: "blocked",
          summary: detail,
        })
      } else {
        warnings.push(detail)
        checks.push({
          key: "supabase_operational",
          label: "Supabase operational",
          state: "degraded",
          summary: detail,
        })
      }
    }
  } else {
    checks.push({
      key: "supabase_operational",
      label: "Supabase operational",
      state: "degraded",
      summary: "Nu este traseul principal în configurația curentă.",
    })
  }

  const state = deriveOverallState(checks)

  return {
    state,
    summary: buildSummary(state, authBackend, dataBackend),
    blockers,
    warnings,
    checks,
    config: {
      authBackend,
      dataBackend,
      localFallbackAllowed,
      production,
    },
  }
}

function deriveOverallState(checks: AppHealthCheck[]): AppHealthState {
  if (checks.some((check) => check.state === "blocked")) return "blocked"
  if (checks.some((check) => check.state === "degraded")) return "degraded"
  return "healthy"
}

function buildSummary(
  state: AppHealthState,
  authBackend: "local" | "supabase" | "hybrid" | "dual-write",
  dataBackend: "local" | "supabase" | "hybrid" | "dual-write"
) {
  if (state === "healthy") {
    return "Traseul de operare este suficient de curat pentru pilot și health checks de bază."
  }

  if (state === "blocked") {
    return `Există blocaje operaționale pentru configurația curentă (${authBackend}/${dataBackend}).`
  }

  return `Aplicația rulează, dar are încă piese degradate pentru o operare mai liniștită (${authBackend}/${dataBackend}).`
}

function formatBackendSummary(backend: "local" | "supabase" | "hybrid" | "dual-write") {
  if (backend === "supabase") return "Cloud-first strict."
  if (backend === "hybrid") return "Cloud + fallback controlat."
  if (backend === "dual-write") return "Dual-write activ — primary local + secondary Supabase pentru cutover safe."
  return "Local-first; util pentru development, mai slab pentru operare matură."
}
