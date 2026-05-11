#!/usr/bin/env node
// verify-release-ready.mjs
// Aggregated preflight pentru launch production.
// Verifică: env vars critice + Stripe SKU + AI provider + Supabase config + cron secret.
//
// Usage:
//   node scripts/verify-release-ready.mjs              # warnings non-fatal
//   node scripts/verify-release-ready.mjs --strict     # exit 1 dacă lipsesc env-uri critice
//
// Recomandări exit codes:
//   0 = release ready (toate critice OK)
//   1 = blockers (--strict + critice missing)
//   2 = warnings (non-strict, missing optional)

import path from "node:path"
import { loadEnvFile } from "./lib/supabase-live-check.mjs"

const ENV_PATH = path.join(process.cwd(), ".env.local")
const STRICT = process.argv.includes("--strict")

const ICP_TIER_VARS = [
  "STRIPE_PRICE_SOLO_STARTER_MONTHLY",
  "STRIPE_PRICE_SOLO_PRO_MONTHLY",
  "STRIPE_PRICE_IMM_INTERNAL_SOLO_MONTHLY",
  "STRIPE_PRICE_IMM_INTERNAL_PRO_MONTHLY",
  "STRIPE_PRICE_CABINET_SOLO_MONTHLY",
  "STRIPE_PRICE_CABINET_PRO_MONTHLY",
  "STRIPE_PRICE_CABINET_STUDIO_MONTHLY",
  "STRIPE_PRICE_FISCAL_SOLO_MONTHLY",
  "STRIPE_PRICE_FISCAL_PRO_MONTHLY",
]

const CRITICAL_VARS = [
  "COMPLISCAN_SESSION_SECRET",
  "SHARE_TOKEN_SECRET",
  "NEXT_PUBLIC_APP_URL",
]

const RECOMMENDED_VARS = [
  "GEMINI_API_KEY",
  "RESEND_API_KEY",
  "CRON_SECRET",
]

const SUPABASE_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]

const STRIPE_VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
]

function pad(label, len) {
  return label.length >= len ? label : label + " ".repeat(len - label.length)
}

async function main() {
  const env = await loadEnvFile(ENV_PATH).catch(() => ({}))
  const merged = { ...env }
  // Cele din process.env au priority (Vercel injectă acolo în production)
  for (const key of [...CRITICAL_VARS, ...RECOMMENDED_VARS, ...SUPABASE_VARS, ...STRIPE_VARS, ...ICP_TIER_VARS, "MISTRAL_API_KEY", "COMPLISCAN_DATA_BACKEND", "COMPLISCAN_AUTH_BACKEND"]) {
    if (process.env[key]) merged[key] = process.env[key]
  }

  const get = (key) => (typeof merged[key] === "string" ? merged[key].trim() : "")

  const blockers = []
  const warnings = []
  const successes = []

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("  CompliScan — Release Ready Preflight")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("")

  // 1. Critical
  console.log("🔒 Critical (NU pornește fără ele):")
  for (const key of CRITICAL_VARS) {
    const value = get(key)
    if (value) {
      console.log(`   ✓ ${pad(key, 36)} configured`)
      successes.push(key)
    } else {
      console.log(`   ✗ ${pad(key, 36)} MISSING`)
      blockers.push(key)
    }
  }
  console.log("")

  // 2. AI provider — at least one
  console.log("🤖 AI Provider (cel puțin unul required):")
  const hasGemini = Boolean(get("GEMINI_API_KEY"))
  const hasMistral = Boolean(get("MISTRAL_API_KEY"))
  if (hasGemini) {
    console.log("   ✓ GEMINI_API_KEY                    configured")
    successes.push("GEMINI_API_KEY")
  } else {
    console.log("   ⚠ GEMINI_API_KEY                    missing")
    warnings.push("GEMINI_API_KEY")
  }
  if (hasMistral) {
    console.log("   ✓ MISTRAL_API_KEY                   configured (EU sovereignty option)")
    successes.push("MISTRAL_API_KEY")
  } else {
    console.log("   ⚠ MISTRAL_API_KEY                   missing (EU sovereignty unavailable)")
    warnings.push("MISTRAL_API_KEY")
  }
  if (!hasGemini && !hasMistral) {
    blockers.push("AI_PROVIDER (need GEMINI_API_KEY or MISTRAL_API_KEY)")
    console.log("   ✗ At least one AI provider trebuie configurat")
  }
  console.log("")

  // 3. Recommended
  console.log("📌 Recomandat:")
  for (const key of RECOMMENDED_VARS) {
    const value = get(key)
    if (value) {
      console.log(`   ✓ ${pad(key, 36)} configured`)
      successes.push(key)
    } else {
      console.log(`   ⚠ ${pad(key, 36)} missing (degraded experience)`)
      warnings.push(key)
    }
  }
  console.log("")

  // 4. Supabase (production needs all 3)
  console.log("☁ Supabase (production setup):")
  let supabaseOk = 0
  for (const key of SUPABASE_VARS) {
    const value = get(key)
    if (value) {
      console.log(`   ✓ ${pad(key, 36)} configured`)
      successes.push(key)
      supabaseOk++
    } else {
      console.log(`   ⚠ ${pad(key, 36)} missing (local fallback only)`)
      warnings.push(key)
    }
  }
  if (supabaseOk === 3) {
    const dataBackend = (get("COMPLISCAN_DATA_BACKEND") || "local").toLowerCase()
    const authBackend = (get("COMPLISCAN_AUTH_BACKEND") || "local").toLowerCase()
    console.log(`   ℹ Backend curent: data=${dataBackend}, auth=${authBackend}`)
    if (dataBackend === "local") {
      console.log(`   ⚠ Supabase configurat dar DATA_BACKEND=local — flip la 'dual-write' apoi 'supabase' pentru production`)
      warnings.push("DATA_BACKEND=local cu Supabase configurat")
    }
  }
  console.log("")

  // 5. Stripe
  console.log("💳 Stripe (plăți):")
  for (const key of STRIPE_VARS) {
    const value = get(key)
    if (value) {
      console.log(`   ✓ ${pad(key, 36)} configured`)
      successes.push(key)
    } else {
      console.log(`   ⚠ ${pad(key, 36)} missing (checkout demo mode)`)
      warnings.push(key)
    }
  }
  console.log("")

  // 6. ICP tier mapping (S2A.1)
  console.log("🎯 Stripe ICP SKU (S2A.1, 9 tier-uri ICP din Doc 06):")
  let icpConfigured = 0
  for (const key of ICP_TIER_VARS) {
    const value = get(key)
    if (value) {
      icpConfigured++
      console.log(`   ✓ ${pad(key, 42)} configured`)
    } else {
      console.log(`   ⚠ ${pad(key, 42)} missing (fallback la PRO/PARTNER legacy)`)
    }
  }
  if (icpConfigured === 0) {
    console.log(`   ℹ Niciun tier ICP configurat — checkout va folosi legacy SKU pro/partner`)
  } else if (icpConfigured < ICP_TIER_VARS.length) {
    console.log(`   ⚠ ${icpConfigured}/${ICP_TIER_VARS.length} tiers ICP configurate. Restul fac fallback la legacy.`)
    warnings.push("ICP tier coverage parțial")
  } else {
    console.log(`   ✓ Toate ${ICP_TIER_VARS.length} tier-uri ICP configurate.`)
    successes.push("ICP tier coverage complet")
  }
  console.log("")

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`  Sumar: ${successes.length} OK · ${warnings.length} warnings · ${blockers.length} blockers`)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

  if (blockers.length > 0) {
    console.log("")
    console.log("❌ BLOCKERS:")
    for (const b of blockers) console.log(`   • ${b}`)
    if (STRICT) {
      console.log("")
      console.log("Strict mode activ → exit 1.")
      process.exit(1)
    }
  }

  if (warnings.length > 0 && blockers.length === 0) {
    console.log("")
    console.log("⚠ Warnings (non-fatal):")
    for (const w of warnings) console.log(`   • ${w}`)
  }

  if (blockers.length === 0 && warnings.length === 0) {
    console.log("")
    console.log("🚀 Release ready — toate verificările au trecut.")
  } else if (blockers.length === 0) {
    console.log("")
    console.log("✓ Pornire OK pentru staging. Pentru production rezolvă warnings de mai sus.")
  }

  if (warnings.length > 0 && blockers.length === 0) process.exit(2)
  process.exit(0)
}

main().catch((err) => {
  console.error(`❌ Preflight failed: ${err.message}`)
  process.exit(1)
})
