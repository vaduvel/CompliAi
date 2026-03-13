import { getConfiguredAuthBackend } from "@/lib/server/auth"
import { isLocalFallbackAllowedForCloudPrimary } from "@/lib/server/cloud-fallback-policy"
import { hasSupabaseConfig, supabaseSelect } from "@/lib/server/supabase-rest"
import { getSupabaseBucketStatus, hasSupabaseStorageConfig } from "@/lib/server/supabase-storage"
import { getConfiguredDataBackend } from "@/lib/server/supabase-tenancy"

type TableStatus = {
  ok: boolean
  state?: "healthy" | "missing_schema" | "error"
  error?: string
}

type BucketStatus = {
  ok: boolean
  name: string
  state?: "present" | "missing_bucket" | "error"
  error?: string
}

export async function getSupabaseOperationalStatus() {
  const authBackend = getConfiguredAuthBackend()
  const dataBackend = getConfiguredDataBackend()
  const restConfigured = hasSupabaseConfig()
  const storageConfigured = hasSupabaseStorageConfig()
  const bucketName = process.env.COMPLISCAN_SUPABASE_EVIDENCE_BUCKET?.trim() || "compliscan-evidence-private"

  const tables: Record<string, TableStatus> = {}
  let bucket: BucketStatus | null = null

  if (restConfigured) {
    for (const table of ["organizations", "memberships", "profiles", "org_state", "evidence_objects"]) {
      tables[table] = await checkPublicTable(table)
    }
  }

  if (storageConfigured) {
    bucket = await getSupabaseBucketStatus(bucketName)
  }

  const healthyTables = Object.values(tables).filter((entry) => entry.ok).length
  const totalTables = Object.keys(tables).length
  const schemaReady = totalTables > 0 && healthyTables === totalTables
  const bucketReady = bucket?.ok ?? false
  const blockers = buildBlockers({
    restConfigured,
    storageConfigured,
    schemaReady,
    bucket,
    tables,
  })

  return {
    authBackend,
    dataBackend,
    restConfigured,
    storageConfigured,
    localFallbackAllowed: isLocalFallbackAllowedForCloudPrimary(),
    tables,
    bucket,
    summary: {
      healthyTables,
      totalTables,
      schemaReady,
      bucketReady,
      blockers,
      ready:
        restConfigured &&
        storageConfigured &&
        totalTables > 0 &&
        healthyTables === totalTables &&
        bucketReady,
    },
  }
}

async function checkPublicTable(table: string): Promise<TableStatus> {
  try {
    await supabaseSelect(table, "select=*&limit=1", "public")
    return { ok: true, state: "healthy" }
  } catch (error) {
    const message = error instanceof Error ? error.message : `Table check failed for ${table}.`
    const normalized = message.toLowerCase()

    return {
      ok: false,
      state: normalized.includes("schema cache") ? "missing_schema" : "error",
      error: message,
    }
  }
}

function buildBlockers(input: {
  restConfigured: boolean
  storageConfigured: boolean
  schemaReady: boolean
  bucket: BucketStatus | null
  tables: Record<string, TableStatus>
}) {
  const blockers: string[] = []

  if (!input.restConfigured) {
    blockers.push("Supabase REST nu este configurat.")
  }

  if (!input.storageConfigured) {
    blockers.push("Supabase Storage nu este configurat.")
  }

  const missingSchemaTables = Object.entries(input.tables)
    .filter(([, status]) => status.state === "missing_schema")
    .map(([table]) => table)

  if (missingSchemaTables.length > 0) {
    blockers.push(
      `Schema Sprint 5 lipseste in Supabase pentru: ${missingSchemaTables.join(", ")}.`
    )
  } else if (!input.schemaReady && Object.keys(input.tables).length > 0) {
    blockers.push("Unele tabele Sprint 5 raspund cu erori si cer verificare RLS / acces.")
  }

  if (input.bucket && !input.bucket.ok) {
    blockers.push(`Bucket-ul privat ${input.bucket.name} lipseste sau nu raspunde corect.`)
  }

  return blockers
}
