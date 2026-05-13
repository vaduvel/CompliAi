#!/usr/bin/env tsx
// Validează FC-4 — încarcă state-ul, rulează cross-correlation, raportează R6+R7.

import * as fs from "node:fs"
import * as path from "node:path"

import { runCrossCorrelation } from "../../lib/compliance/cross-correlation-engine"

const orgId = process.argv[2] ?? "org-96d5827110b0fb7f"
// Resolve .data either in cwd or in parent CompliAI root
const candidates = [
  path.resolve(process.cwd(), ".data", `state-${orgId}.json`),
  path.resolve("/Users/vaduvageorge/Desktop/CompliAI/.data", `state-${orgId}.json`),
]
const statePath = candidates.find((p) => fs.existsSync(p))
if (!statePath) {
  console.error("State file not found in any of:", candidates)
  process.exit(1)
}
const state = JSON.parse(fs.readFileSync(statePath, "utf-8"))
console.log(`Loaded state from: ${statePath}`)

const report = runCrossCorrelation({
  declarations: state.parsedDeclarations ?? [],
  aga: state.parsedAga ?? [],
  invoices: state.parsedInvoices ?? [],
  onrc: state.onrcSnapshots ?? [],
  filings: state.filingRecords ?? [],
  expectedVatFrequency: state.orgProfile?.vatFrequency,
})

console.log("Cross-correlation report:")
console.log(`  Total: ${report.summary.totalChecks}`)
console.log(`  Errors: ${report.summary.errors}`)
console.log(`  Warnings: ${report.summary.warnings}`)
console.log(`  OK: ${report.summary.ok}`)
console.log(`  Info: ${report.summary.info}`)
console.log("")
console.log("By rule:")
for (const [rule, counts] of Object.entries(report.summary.byRule)) {
  const c = counts as { ok: number; warning: number; error: number; info: number }
  if (c.ok + c.warning + c.error + c.info > 0) {
    console.log(`  ${rule}: ok=${c.ok}, warning=${c.warning}, error=${c.error}, info=${c.info}`)
  }
}
console.log("")
console.log("R6+R7 findings detail:")
const r6r7 = report.findings.filter((f) => f.rule === "R6" || f.rule === "R7")
for (const f of r6r7) {
  console.log(`  [${f.rule}/${f.severity}] ${f.title}`)
  if (f.economicImpact) {
    console.log(
      `      → impact RON: min=${f.economicImpact.totalCostMinRON}, max=${f.economicImpact.totalCostMaxRON}`,
    )
  }
}
