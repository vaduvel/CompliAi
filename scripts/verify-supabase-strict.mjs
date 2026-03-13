import path from "node:path"

import { loadEnvFile, verifySupabaseSprint5Resources } from "./lib/supabase-live-check.mjs"

const ENV_PATH = path.join(process.cwd(), ".env.local")
const DEFAULT_BUCKET = "compliscan-evidence-private"
const TABLES = ["organizations", "memberships", "profiles", "org_state", "evidence_objects"]

async function main() {
  const env = await loadEnvFile(ENV_PATH)
  const results = await verifySupabaseSprint5Resources(env)
  const blockers = []

  const authBackend = normalize(env.COMPLISCAN_AUTH_BACKEND) || "local"
  const dataBackend = normalize(env.COMPLISCAN_DATA_BACKEND) || "local"
  const localFallback = normalize(env.COMPLISCAN_ALLOW_LOCAL_FALLBACK)
  const bucketName = env.COMPLISCAN_SUPABASE_EVIDENCE_BUCKET || DEFAULT_BUCKET

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
    blockers.push("COMPLISCAN_AUTH_BACKEND trebuie să fie `supabase`.")
  }
  if (dataBackend !== "supabase") {
    blockers.push("COMPLISCAN_DATA_BACKEND trebuie să fie `supabase`.")
  }
  if (!(localFallback === "false" || localFallback === "0" || localFallback === "no")) {
    blockers.push("COMPLISCAN_ALLOW_LOCAL_FALLBACK trebuie să fie `false`.")
  }

  const tableStatuses = new Map(
    results.filter((item) => item.kind === "table").map((item) => [item.name, item.status])
  )
  const missingTables = TABLES.filter((table) => tableStatuses.get(table) !== 200)
  if (missingTables.length > 0) {
    blockers.push(`Tabelele Sprint 5 nu sunt toate sănătoase: ${missingTables.join(", ")}.`)
  }

  const bucketStatus = results.find(
    (item) => item.kind === "bucket" && item.name === bucketName
  )?.status
  if (bucketStatus !== 200) {
    blockers.push(`Bucket-ul privat ${bucketName} nu răspunde cu 200.`)
  }

  console.log(
    JSON.stringify(
      {
        ready: blockers.length === 0,
        config: {
          authBackend,
          dataBackend,
          localFallbackAllowed:
            localFallback === "true" || localFallback === "1" || localFallback === "yes"
              ? true
              : false,
          bucketName,
        },
        liveResults: results,
        blockers,
      },
      null,
      2
    )
  )

  process.exitCode = blockers.length === 0 ? 0 : 1
}

function normalize(value) {
  return value?.trim().toLowerCase()
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
