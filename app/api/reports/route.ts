import { NextResponse } from "next/server"

import { computeDashboardSummary, normalizeComplianceState } from "@/lib/compliance/engine"
import { buildRemediationPlan } from "@/lib/compliance/remediation"
import { readState } from "@/lib/server/mvp-store"

export async function POST() {
  const state = normalizeComplianceState(await readState())
  const summary = computeDashboardSummary(state)
  const remediationPlan = buildRemediationPlan(state)
  const now = new Date()

  const report = {
    generatedAt: now.toISOString(),
    generatedAtLabel: now.toLocaleString("ro-RO"),
    score: summary.score,
    riskLabel: summary.riskLabel,
    openAlerts: summary.openAlerts,
    euAiAct: {
      highRisk: state.highRisk,
      lowRisk: state.lowRisk,
    },
    gdprProgress: state.gdprProgress,
    remediationPlan,
    disclaimer:
      "Acesta este un asistent AI. Scorurile sunt sugestii. Verifică uman înainte de orice raport oficial.",
  }

  return NextResponse.json({
    report,
    html: buildReportHtml(report),
  })
}

function buildReportHtml(report: {
  generatedAtLabel: string
  score: number
  riskLabel: string
  openAlerts: number
  euAiAct: { highRisk: number; lowRisk: number }
  gdprProgress: number
  remediationPlan: Array<{ title: string; priority: string; owner: string; actions: string[] }>
  disclaimer: string
}) {
  const remediationHtml = report.remediationPlan
    .map(
      (item) => `<article class="card">
        <strong>${item.priority} · ${item.title}</strong>
        <p class="muted">Owner: ${item.owner}</p>
        <ul>${item.actions.map((action) => `<li>${action}</li>`).join("")}</ul>
      </article>`
    )
    .join("")

  return `<!doctype html>
<html lang="ro">
  <head>
    <meta charset="utf-8" />
    <title>Raport CompliScan</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; margin: 0; padding: 24px; color: #111; background: #fff; }
      .wrap { max-width: 780px; margin: 0 auto; }
      h1 { margin: 0 0 8px; }
      .muted { color: #555; margin: 0 0 20px; }
      .grid { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .card { border: 1px solid #ddd; border-radius: 12px; padding: 12px; }
      .disc { margin-top: 16px; color: #555; font-size: 14px; }
      @media print { body { padding: 0; } .wrap { max-width: 100%; } }
    </style>
  </head>
  <body>
    <main class="wrap">
      <h1>Raport de risc CompliScan</h1>
      <p class="muted">Generat la ${report.generatedAtLabel}</p>
      <section class="grid">
        <article class="card"><strong>Scor de risc:</strong> ${report.score}% (${report.riskLabel})</article>
        <article class="card"><strong>Drift activ:</strong> ${report.openAlerts}</article>
        <article class="card"><strong>EU AI Act:</strong> High-risk ${report.euAiAct.highRisk}, Low-risk ${report.euAiAct.lowRisk}</article>
        <article class="card"><strong>GDPR Checklist:</strong> ${report.gdprProgress}%</article>
      </section>
      <h2>Remediere</h2>
      <section class="grid">${remediationHtml}</section>
      <p class="disc">${report.disclaimer}</p>
    </main>
  </body>
</html>`
}
