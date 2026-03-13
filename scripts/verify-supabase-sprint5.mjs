import path from "node:path"
import { loadEnvFile, verifySupabaseSprint5Resources } from "./lib/supabase-live-check.mjs"

const ENV_PATH = path.join(process.cwd(), ".env.local")

async function main() {
  const env = await loadEnvFile(ENV_PATH)
  const results = await verifySupabaseSprint5Resources(env)

  console.log(JSON.stringify(results, null, 2))

  const hasFailures = results.some((item) => item.status < 200 || item.status >= 300)
  process.exitCode = hasFailures ? 1 : 0
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
