#!/usr/bin/env node
// S2A.7 — Migration script: copies all .data/state-{orgId}.json into Supabase
// `org_state` table o dată înainte de cutover/dual-write enable.
//
// Idempotent: re-rulat safely (upsert pe org_id).
// Usage:
//   node scripts/migrate-fs-to-supabase.mjs              # dry-run
//   node scripts/migrate-fs-to-supabase.mjs --apply      # execută upsert
//   node scripts/migrate-fs-to-supabase.mjs --apply --table=nis2_state --prefix=nis2
//
// Cere: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY în .env.local

import fs from "node:fs/promises"
import path from "node:path"

import { loadEnvFile } from "./lib/supabase-live-check.mjs"

const ENV_PATH = path.join(process.cwd(), ".env.local")
const DATA_DIR = path.join(process.cwd(), ".data")

const args = process.argv.slice(2)
const DRY_RUN = !args.includes("--apply")
const PREFIX = parseFlag(args, "--prefix") ?? "state"
const TABLE = parseFlag(args, "--table") ?? "org_state"
const SCHEMA = parseFlag(args, "--schema") ?? "public"

function parseFlag(allArgs, flag) {
  const item = allArgs.find((a) => a.startsWith(`${flag}=`))
  if (!item) return null
  return item.slice(flag.length + 1)
}

async function main() {
  const env = await loadEnvFile(ENV_PATH)
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey =
    env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "❌ NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY sunt obligatorii (în .env.local)."
    )
    process.exit(1)
  }

  console.log(`▶ Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "APPLY (upsert to Supabase)"}`)
  console.log(`▶ Prefix: ${PREFIX} → table ${SCHEMA}.${TABLE}`)
  console.log(`▶ Data dir: ${DATA_DIR}`)

  let entries
  try {
    entries = await fs.readdir(DATA_DIR)
  } catch (err) {
    console.error(`❌ Nu pot citi ${DATA_DIR}: ${err.message}`)
    process.exit(1)
  }

  const matchPrefix = `${PREFIX}-`
  const candidates = entries.filter(
    (file) => file.startsWith(matchPrefix) && file.endsWith(".json")
  )
  if (candidates.length === 0) {
    console.log(`⚠ Niciun fișier ${matchPrefix}*.json găsit în ${DATA_DIR}.`)
    return
  }

  console.log(`▶ ${candidates.length} fișiere de migrat:`)
  for (const file of candidates) {
    console.log(`   • ${file}`)
  }

  let success = 0
  let failed = 0
  let skipped = 0

  for (const file of candidates) {
    const orgId = file.slice(matchPrefix.length, -".json".length)
    const filePath = path.join(DATA_DIR, file)

    let raw
    try {
      raw = await fs.readFile(filePath, "utf8")
    } catch (err) {
      console.error(`   ✗ ${orgId}: nu pot citi (${err.message})`)
      failed++
      continue
    }

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (err) {
      console.error(`   ✗ ${orgId}: JSON invalid (${err.message})`)
      failed++
      continue
    }

    if (DRY_RUN) {
      const sizeKb = Math.round(Buffer.byteLength(raw, "utf8") / 1024)
      console.log(`   → ${orgId}: would upsert (${sizeKb}KB)`)
      skipped++
      continue
    }

    try {
      const url = `${supabaseUrl}/rest/v1/${TABLE}?on_conflict=org_id`
      const response = await fetch(url, {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
          "Content-Profile": SCHEMA,
        },
        body: JSON.stringify({
          org_id: orgId,
          state: parsed,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`)
      }

      console.log(`   ✓ ${orgId}: upserted`)
      success++
    } catch (err) {
      console.error(`   ✗ ${orgId}: ${err.message}`)
      failed++
    }
  }

  console.log("")
  console.log("Summary:")
  console.log(`  ✓ Success:  ${success}`)
  console.log(`  ✗ Failed:   ${failed}`)
  console.log(`  ↓ Skipped:  ${skipped} (dry-run)`)

  if (failed > 0) {
    console.log("")
    console.log("⚠ Rerun cu --apply după ce rezolvi erorile de mai sus.")
    process.exit(1)
  }

  if (DRY_RUN) {
    console.log("")
    console.log("ℹ Dry-run complet. Rerun cu --apply pentru a face upsert real.")
  }
}

main().catch((err) => {
  console.error(`❌ Migration failed: ${err.message}`)
  process.exit(1)
})
