#!/usr/bin/env tsx
// Seed FC-4 maturity — populează state-org-{orgId}.json cu filingRecords reale
// pentru a testa R6 (termen ↔ depunere) + R7 (frecvență D300).
//
// Cazuri realiste:
//   - D300 ianuarie 2026 — depusă la timp (24 feb, termen 25 feb)         → R6 OK
//   - D300 februarie 2026 — depusă cu 5 zile întârziere                    → R6 WARNING
//   - D300 martie 2026 — depusă cu 20 zile întârziere                      → R6 ERROR (>15)
//   - D300 aprilie 2026 — MISSING (termen depășit cu 18 zile la 13 mai)    → R6 ERROR (missing)
//   - D300 mai 2026 — UPCOMING (termen 25 iunie, nu rulează încă)          → skip
//   - SAF-T trim 1 2026 — depusă cu 2 zile întârziere                      → R6 WARNING
//   - D390 ianuarie 2026 — depusă la timp                                  → R6 OK
//
// Pentru R7: orgProfile.vatFrequency = "monthly" (din 4 D300-uri lunare → match).
//
// Usage: npx tsx scripts/fiscal-maturity/seed-fc4.ts <orgId>
// Default orgId: org-96d5827110b0fb7f (Vaduva)

import * as fs from "node:fs"
import * as path from "node:path"

import type { FilingRecord } from "../../lib/compliance/filing-discipline"

const orgId = process.argv[2] ?? "org-96d5827110b0fb7f"
const statePath = path.resolve(process.cwd(), ".data", `state-${orgId}.json`)

function iso(y: number, m: number, d: number): string {
  return new Date(Date.UTC(y, m - 1, d)).toISOString()
}

// FilingRecord-uri realiste pentru Marketing HUB (Vaduva), perioada Q1-Q2 2026.
// Termenele ANAF: D300 lunar până la data 25 a lunii următoare; SAF-T trimestrial
// până la data 25 a lunii următoare după închiderea trimestrului; D390 lunar tot la 25.
const filingRecords: FilingRecord[] = [
  // D300 ianuarie 2026 — depusă pe 24 feb (termen 25 feb) → OK
  {
    id: "filing-d300-2026-01",
    type: "d300_tva",
    period: "2026-01",
    status: "on_time",
    dueISO: iso(2026, 2, 25),
    filedAtISO: iso(2026, 2, 24),
    note: "Depunere normală, fără probleme.",
  },
  // D300 februarie 2026 — depusă pe 2 apr (termen 25 mar) → întârziere 8 zile = WARNING
  {
    id: "filing-d300-2026-02",
    type: "d300_tva",
    period: "2026-02",
    status: "late",
    dueISO: iso(2026, 3, 25),
    filedAtISO: iso(2026, 4, 2),
    rectificationCount: 0,
    note: "Întârziere 8 zile — uitat în vacanță.",
  },
  // D300 martie 2026 — depusă pe 15 mai (termen 25 apr) → întârziere 20 zile = ERROR
  {
    id: "filing-d300-2026-03",
    type: "d300_tva",
    period: "2026-03",
    status: "late",
    dueISO: iso(2026, 4, 25),
    filedAtISO: iso(2026, 5, 15),
    rectificationCount: 1,
    note: "Întârziere 20 zile + rectificare 15 mai.",
  },
  // D300 aprilie 2026 — MISSING (azi e 13 mai, termen 25 mai, încă upcoming)
  // Schimb la "missing" simulând că termenul a fost 25 apr cu 18 zile întârziere
  // (perioada Q1 2026 retrospectiv)
  {
    id: "filing-d300-2026-12-missing",
    type: "d300_tva",
    period: "2025-12",
    status: "missing",
    dueISO: iso(2026, 1, 25), // termen 25 ian, dar nedepusă încă (109 zile întârziere)
    note: "NEDEPUSĂ — urgent.",
  },
  // SAF-T Q1 2026 — depusă pe 27 apr (termen 25 apr) → WARNING 2 zile
  {
    id: "filing-saft-2026-Q1",
    type: "saft",
    period: "2026-Q1",
    status: "late",
    dueISO: iso(2026, 4, 25),
    filedAtISO: iso(2026, 4, 27),
    note: "Întârziere 2 zile la SAF-T D406.",
  },
  // D390 ianuarie 2026 — la timp
  {
    id: "filing-d390-2026-01",
    type: "d390_recap",
    period: "2026-01",
    status: "on_time",
    dueISO: iso(2026, 2, 25),
    filedAtISO: iso(2026, 2, 25),
  },
  // D300 mai 2026 — UPCOMING (termen 25 iunie, în viitor)
  {
    id: "filing-d300-2026-05-upcoming",
    type: "d300_tva",
    period: "2026-05",
    status: "upcoming",
    dueISO: iso(2026, 6, 25),
  },
]

if (!fs.existsSync(statePath)) {
  console.error(`State file not found: ${statePath}`)
  process.exit(1)
}

const state = JSON.parse(fs.readFileSync(statePath, "utf-8"))
state.filingRecords = filingRecords
state.orgProfile = {
  ...(state.orgProfile ?? {}),
  vatFrequency: "monthly",
}

fs.writeFileSync(statePath, JSON.stringify(state, null, 2))

console.log(`✓ Seeded ${filingRecords.length} filingRecords into ${statePath}`)
console.log(`  - D300 lunar: 4 (1 ok, 1 warning, 1 error, 1 missing)`)
console.log(`  - SAF-T Q1: 1 (warning)`)
console.log(`  - D390: 1 (ok)`)
console.log(`  - Upcoming: 1 (skip from R6)`)
console.log(`✓ orgProfile.vatFrequency = "monthly" (pentru R7 match)`)
console.log("")
console.log("Expected cross-correlation R6/R7 result:")
console.log("  R6 OK:      2 findings (D300 2026-01, D390 2026-01)")
console.log("  R6 WARNING: 2 findings (D300 2026-02 + SAF-T Q1)")
console.log("  R6 ERROR:   2 findings (D300 2026-03, D300 2025-12 missing)")
console.log("  R7 OK:      1 finding (4 D300 lunare match expected=monthly)")
