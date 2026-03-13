import { readFile } from "node:fs/promises"

const DEFAULT_BUCKET = "compliscan-evidence-private"
const TABLES = ["organizations", "memberships", "profiles", "org_state", "evidence_objects"]

export async function loadEnvFile(filePath) {
  const content = await readFile(filePath, "utf8")
  const env = {}

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const eqIndex = line.indexOf("=")
    if (eqIndex === -1) continue
    const key = line.slice(0, eqIndex).trim()
    const value = line.slice(eqIndex + 1).trim()
    env[key] = value
  }

  return env
}

export async function verifySupabaseSprint5Resources(env) {
  const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY
  const bucketName = env.COMPLISCAN_SUPABASE_EVIDENCE_BUCKET || DEFAULT_BUCKET

  if (!baseUrl || !serviceRole) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL sau SUPABASE_SERVICE_ROLE_KEY lipsesc din .env.local")
  }

  const results = []
  for (const table of TABLES) {
    results.push(
      await requestJson({
        kind: "table",
        name: table,
        url: `${baseUrl.replace(/\/$/, "")}/rest/v1/${table}?select=*&limit=1`,
        headers: {
          apikey: serviceRole,
          Authorization: `Bearer ${serviceRole}`,
          "Accept-Profile": "public",
        },
      })
    )
  }

  results.push(
    await requestJson({
      kind: "bucket",
      name: bucketName,
      url: `${baseUrl.replace(/\/$/, "")}/storage/v1/bucket/${encodeURIComponent(bucketName)}`,
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
      },
    })
  )

  return results
}

async function requestJson({ kind, name, url, headers }) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    return {
      kind,
      name,
      status: response.status,
      body: (await response.text()).slice(0, 500),
    }
  } catch (error) {
    return {
      kind,
      name,
      status: 0,
      body: error instanceof Error ? error.message : String(error),
    }
  }
}
