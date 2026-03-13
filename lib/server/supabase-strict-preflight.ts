export type SupabaseLiveCheckEntry = {
  kind: "table" | "bucket"
  name: string
  status: number
}

export type SupabaseStrictPreflightResult = {
  ready: boolean
  blockers: string[]
  config: {
    authBackend: string
    dataBackend: string
    localFallbackAllowed: boolean
    bucketName: string
  }
  live: {
    tablesHealthy: boolean
    bucketHealthy: boolean
  }
}

const REQUIRED_TABLES = [
  "organizations",
  "memberships",
  "profiles",
  "org_state",
  "evidence_objects",
] as const

const DEFAULT_BUCKET = "compliscan-evidence-private"

export function evaluateStrictSupabasePreflight(
  env: Record<string, string | undefined>,
  liveResults: SupabaseLiveCheckEntry[]
): SupabaseStrictPreflightResult {
  const authBackend = normalize(env.COMPLISCAN_AUTH_BACKEND) || "local"
  const dataBackend = normalize(env.COMPLISCAN_DATA_BACKEND) || "local"
  const localFallbackAllowed = parseBooleanDefaultTrueInDev(
    normalize(env.COMPLISCAN_ALLOW_LOCAL_FALLBACK)
  )
  const bucketName = env.COMPLISCAN_SUPABASE_EVIDENCE_BUCKET?.trim() || DEFAULT_BUCKET

  const blockers: string[] = []

  if (!env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    blockers.push("NEXT_PUBLIC_SUPABASE_URL lipsește.")
  }

  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    blockers.push("NEXT_PUBLIC_SUPABASE_ANON_KEY lipsește.")
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    blockers.push("SUPABASE_SERVICE_ROLE_KEY lipsește.")
  }

  if (authBackend !== "supabase") {
    blockers.push("COMPLISCAN_AUTH_BACKEND trebuie să fie `supabase` pentru preflight strict.")
  }

  if (dataBackend !== "supabase") {
    blockers.push("COMPLISCAN_DATA_BACKEND trebuie să fie `supabase` pentru preflight strict.")
  }

  if (localFallbackAllowed) {
    blockers.push("COMPLISCAN_ALLOW_LOCAL_FALLBACK trebuie să fie `false` pentru preflight strict.")
  }

  const tableStatuses = new Map(
    liveResults.filter((item) => item.kind === "table").map((item) => [item.name, item.status])
  )
  const bucketStatus = liveResults.find(
    (item) => item.kind === "bucket" && item.name === bucketName
  )?.status

  const missingTables = REQUIRED_TABLES.filter((table) => tableStatuses.get(table) !== 200)
  if (missingTables.length > 0) {
    blockers.push(`Tabelele Sprint 5 nu sunt toate sănătoase: ${missingTables.join(", ")}.`)
  }

  if (bucketStatus !== 200) {
    blockers.push(`Bucket-ul privat ${bucketName} nu răspunde cu 200.`)
  }

  return {
    ready: blockers.length === 0,
    blockers,
    config: {
      authBackend,
      dataBackend,
      localFallbackAllowed,
      bucketName,
    },
    live: {
      tablesHealthy: missingTables.length === 0,
      bucketHealthy: bucketStatus === 200,
    },
  }
}

function normalize(value: string | undefined) {
  return value?.trim().toLowerCase()
}

function parseBooleanDefaultTrueInDev(value: string | undefined) {
  if (value === "1" || value === "true" || value === "yes") return true
  if (value === "0" || value === "false" || value === "no") return false
  return true
}

