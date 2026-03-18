// V3 P1.1 — Compliance Response Pack
// Document structurat pentru răspuns la o cerere de due diligence sau chestionar de conformitate.
// Acoperă: GDPR, NIS2, EU AI Act, e-Factura — status, evidențe, angajamente.

import type { ComplianceState, DashboardSummary, RemediationAction } from "@/lib/compliance/types"

export type ResponsePackFramework = {
  id: string
  name: string
  status: "compliant" | "partial" | "not-assessed"
  controlsImplemented: string[]
  openGaps: string[]
  evidenceArtifacts: string[]
}

export type ResponsePackFinding = {
  title: string
  severity: string
  mitigation: string
  targetDate: string
}

export type ResponsePackVendorReview = {
  vendorName: string
  status: string
  urgency: string
  reviewCase: string | null
  hasEvidence: boolean
  nextReviewDueISO: string | null
}

export type ResponsePackVendorSummary = {
  totalVendors: number
  reviewedVendors: number
  overdueReviews: number
  criticalCount: number
  topReviews: ResponsePackVendorReview[]
}

export type ComplianceResponseData = {
  generatedAt: string
  generatedAtLabel: string
  orgName: string
  score: number
  riskLabel: string
  frameworks: ResponsePackFramework[]
  openFindings: ResponsePackFinding[]
  evidenceSummary: {
    scannedDocuments: number
    validatedBaseline: boolean
    aiSystemsInventoried: number
    highRiskAiSystems: number
  }
  vendorReviews?: ResponsePackVendorSummary
  commitments: string[]
  disclaimer: string
}

// ── Builder ──────────────────────────────────────────────────────────────────

export function buildComplianceResponse(
  state: ComplianceState,
  summary: DashboardSummary,
  remediationPlan: RemediationAction[],
  orgName: string,
  nowISO: string,
  vendorReviewSummary?: ResponsePackVendorSummary,
): ComplianceResponseData {
  const now = new Date(nowISO)
  const generatedAtLabel = now.toLocaleString("ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const findings = state.findings ?? []
  const openFindings: ResponsePackFinding[] = findings
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .slice(0, 5)
    .map((f) => ({
      title: f.title,
      severity: f.severity,
      mitigation: f.remediationHint ?? f.resolution?.action ?? "In curs de remediere.",
      targetDate: remediationPlan.find((r) => r.relatedFindingIds?.includes(f.id))?.dueDate ?? "30 zile",
    }))

  // GDPR framework
  const gdprFindings = findings.filter((f) => f.category === "GDPR")
  const gdprStatus: ResponsePackFramework["status"] =
    gdprFindings.filter((f) => f.severity === "critical" || f.severity === "high").length === 0
      ? state.gdprProgress >= 70
        ? "compliant"
        : "partial"
      : "partial"

  const gdpr: ResponsePackFramework = {
    id: "gdpr",
    name: "GDPR (Regulamentul (UE) 2016/679)",
    status: gdprStatus,
    controlsImplemented: [
      "Inventar sisteme AI cu clasificare risc",
      "Scanare automată documente pentru semnale date personale",
      ...(state.gdprProgress >= 50 ? ["Progres conformitate GDPR > 50%"] : []),
    ],
    openGaps: gdprFindings
      .filter((f) => f.severity === "high" || f.severity === "critical")
      .slice(0, 3)
      .map((f) => f.title),
    evidenceArtifacts: [
      `${state.scannedDocuments ?? 0} documente scanate`,
      `${(state.findings ?? []).filter((f) => f.category === "GDPR" && f.severity === "critical").length === 0 ? "Niciun finding critic GDPR activ" : "Finding-uri critice GDPR deschise"}`,
    ],
  }

  // NIS2 framework
  const nis2Findings = findings.filter((f) => f.category === "NIS2")
  const nis2Status: ResponsePackFramework["status"] =
    nis2Findings.length === 0 ? "not-assessed" : nis2Findings.filter((f) => f.severity === "critical" || f.severity === "high").length === 0 ? "partial" : "partial"

  const nis2: ResponsePackFramework = {
    id: "nis2",
    name: "NIS2 (Directiva (UE) 2022/2555 / OUG 155/2024)",
    status: nis2Status,
    controlsImplemented: [
      "Evaluare gap analysis NIS2 implementată",
      "Registru furnizori ICT activ",
      "Flux raportare incidente (24h/72h DNSC)",
    ],
    openGaps: nis2Findings
      .filter((f) => f.severity === "high" || f.severity === "critical")
      .slice(0, 3)
      .map((f) => f.title),
    evidenceArtifacts: [
      "Gap analysis NIS2 cu scoring per categorie",
      "Registru furnizori cu clasificare risc",
    ],
  }

  // EU AI Act framework
  const aiActFindings = findings.filter((f) => f.category === "EU_AI_ACT")
  const aiSystemsCount = (state.aiSystems ?? []).length + (state.detectedAISystems ?? []).length
  const aiStatus: ResponsePackFramework["status"] =
    aiSystemsCount === 0
      ? "not-assessed"
      : aiActFindings.filter((f) => f.severity === "critical").length === 0
        ? "partial"
        : "partial"

  const aiAct: ResponsePackFramework = {
    id: "eu-ai-act",
    name: "EU AI Act (Regulamentul (UE) 2024/1689)",
    status: aiStatus,
    controlsImplemented: [
      `${aiSystemsCount} sisteme AI inventariate`,
      "Clasificare risc per sistem (minimal/limitat/ridicat)",
      ...(state.highRisk > 0 ? [] : ["Niciun sistem AI high-risk fără monitorizare"]),
    ],
    openGaps: aiActFindings
      .filter((f) => f.severity === "high" || f.severity === "critical")
      .slice(0, 3)
      .map((f) => f.title),
    evidenceArtifacts: [
      "Inventar AI cu clasificare risc și proprietar",
      ...(state.highRisk > 0 ? [`${state.highRisk} sisteme high-risk monitorizate`] : []),
    ],
  }

  // e-Factura framework
  const efacturaFindings = findings.filter((f) => f.category === "E_FACTURA")
  const efacturaStatus: ResponsePackFramework["status"] =
    efacturaFindings.length === 0
      ? state.efacturaConnected
        ? "compliant"
        : "not-assessed"
      : "partial"

  const efactura: ResponsePackFramework = {
    id: "e-factura",
    name: "e-Factura (OUG 120/2021 / Legea 296/2023)",
    status: efacturaStatus,
    controlsImplemented: [
      ...(state.efacturaConnected ? ["Integrare SPV ANAF activă"] : []),
      "Validator UBL CIUS-RO disponibil",
      "Monitorizare facturi respinse/erori",
    ],
    openGaps: efacturaFindings
      .filter((f) => f.severity === "high")
      .slice(0, 3)
      .map((f) => f.title),
    evidenceArtifacts: [
      ...(state.efacturaConnected ? ["Conexiune SPV ANAF confirmată"] : ["SPV ANAF în configurare"]),
    ],
  }

  const p1Actions = remediationPlan.filter((a) => a.priority === "P1").slice(0, 3)
  const commitments = p1Actions.length > 0
    ? p1Actions.map((a) => `${a.title} — termen: ${a.dueDate ?? "30 zile"}`)
    : ["Continuarea procesului de conformitate conform planului de remediere."]

  return {
    generatedAt: nowISO,
    generatedAtLabel,
    orgName,
    score: summary.score,
    riskLabel: summary.riskLabel,
    frameworks: [gdpr, nis2, aiAct, efactura],
    openFindings,
    evidenceSummary: {
      scannedDocuments: state.scannedDocuments ?? 0,
      validatedBaseline: !!state.validatedBaselineSnapshotId,
      aiSystemsInventoried: aiSystemsCount,
      highRiskAiSystems: state.highRisk ?? 0,
    },
    vendorReviews: vendorReviewSummary,
    commitments,
    disclaimer:
      "Generat de CompliAI. Informațiile sunt orientative și nu constituie consultanță juridică. Verificați cu un specialist înainte de depunere oficială.",
  }
}

// ── HTML generator ─────────────────────────────────────────────────────────

const STATUS_COLOR: Record<ResponsePackFramework["status"], string> = {
  compliant: "#16a34a",
  partial: "#ca8a04",
  "not-assessed": "#6b7280",
}

const STATUS_LABEL: Record<ResponsePackFramework["status"], string> = {
  compliant: "✅ Conform",
  partial: "⚠️ Parțial conform",
  "not-assessed": "🔘 Neevaluat",
}

export function buildComplianceResponseHtml(data: ComplianceResponseData): string {
  const scoreColor =
    data.score >= 90 ? "#16a34a" : data.score >= 75 ? "#ca8a04" : "#dc2626"

  const frameworksHtml = data.frameworks
    .map(
      (f) => `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;break-inside:avoid;margin-bottom:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
        <span style="font-weight:700;font-size:14px;color:#111">${f.name}</span>
        <span style="font-size:12px;font-weight:700;color:${STATUS_COLOR[f.status]}">${STATUS_LABEL[f.status]}</span>
      </div>
      ${
        f.controlsImplemented.length > 0
          ? `<div style="margin-top:10px">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Controale implementate</p>
        <ul style="margin:0;padding-left:16px;font-size:12px;color:#374151">${f.controlsImplemented.map((c) => `<li>${c}</li>`).join("")}</ul>
      </div>`
          : ""
      }
      ${
        f.openGaps.length > 0
          ? `<div style="margin-top:8px">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#ca8a04;text-transform:uppercase;letter-spacing:0.05em">Gap-uri deschise</p>
        <ul style="margin:0;padding-left:16px;font-size:12px;color:#92400e">${f.openGaps.map((g) => `<li>${g}</li>`).join("")}</ul>
      </div>`
          : ""
      }
      ${
        f.evidenceArtifacts.length > 0
          ? `<div style="margin-top:8px">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:0.05em">Artefacte de dovadă</p>
        <ul style="margin:0;padding-left:16px;font-size:12px;color:#1e40af">${f.evidenceArtifacts.map((a) => `<li>${a}</li>`).join("")}</ul>
      </div>`
          : ""
      }
    </div>`
    )
    .join("")

  const findingsHtml =
    data.openFindings.length === 0
      ? `<p style="color:#16a34a;font-size:13px;font-weight:600">✅ Niciun finding critic sau high-risk deschis activ.</p>`
      : data.openFindings
          .map(
            (f) => `
          <div style="border-left:3px solid ${f.severity === "critical" ? "#dc2626" : "#ea580c"};padding:8px 12px;margin-bottom:8px;break-inside:avoid">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span style="background:${f.severity === "critical" ? "#dc2626" : "#ea580c"};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase">${f.severity}</span>
            </div>
            <p style="margin:4px 0 2px;font-size:13px;font-weight:600;color:#111">${f.title}</p>
            <p style="margin:0 0 2px;font-size:12px;color:#4b5563"><strong>Mitigare:</strong> ${f.mitigation}</p>
            <p style="margin:0;font-size:11px;color:#9ca3af">Termen: ${f.targetDate}</p>
          </div>`
          )
          .join("")

  const evidenceRows = [
    `<tr><td style="padding:6px 0;font-size:13px;color:#374151">Documente analizate</td><td style="padding:6px 0;font-size:13px;font-weight:600;text-align:right">${data.evidenceSummary.scannedDocuments}</td></tr>`,
    `<tr><td style="padding:6px 0;font-size:13px;color:#374151">Baseline validat</td><td style="padding:6px 0;font-size:13px;font-weight:600;text-align:right">${data.evidenceSummary.validatedBaseline ? "Da" : "Nu"}</td></tr>`,
    `<tr><td style="padding:6px 0;font-size:13px;color:#374151">Sisteme AI inventariate</td><td style="padding:6px 0;font-size:13px;font-weight:600;text-align:right">${data.evidenceSummary.aiSystemsInventoried}</td></tr>`,
    `<tr><td style="padding:6px 0;font-size:13px;color:#374151">Sisteme AI high-risk</td><td style="padding:6px 0;font-size:13px;font-weight:600;text-align:right">${data.evidenceSummary.highRiskAiSystems}</td></tr>`,
  ].join("")

  return `<!doctype html>
<html lang="ro">
<head>
  <meta charset="utf-8" />
  <title>Compliance Response Pack — ${data.orgName}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; margin: 0; padding: 32px; color: #111; background: #fff; }
    .wrap { max-width: 820px; margin: 0 auto; }
    h2 { margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #111; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
    section { margin-bottom: 28px; }
    .disc { color: #9ca3af; font-size: 11px; margin-top: 24px; padding-top: 12px; border-top: 1px solid #f3f4f6; }
    @media print { body { padding: 16px; } .wrap { max-width: 100%; } }
  </style>
</head>
<body>
<main class="wrap">

  <!-- Header -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;gap:16px;flex-wrap:wrap">
    <div>
      <p style="margin:0;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em">Compliance Response Pack</p>
      <h1 style="margin:4px 0 0;font-size:22px;font-weight:800;color:#111">${data.orgName || "Organizație"}</h1>
      <p style="margin:4px 0 0;font-size:12px;color:#6b7280">Generat la ${data.generatedAtLabel} · CompliAI</p>
      <p style="margin:4px 0 0;font-size:11px;color:#9ca3af">Document de răspuns pentru cereri de due diligence sau chestionare de conformitate</p>
    </div>
    <div style="text-align:center;min-width:110px;border:2px solid ${scoreColor};border-radius:10px;padding:10px 16px">
      <p style="margin:0;font-size:32px;font-weight:800;color:${scoreColor}">${data.score}</p>
      <p style="margin:0;font-size:11px;font-weight:700;color:${scoreColor}">${data.riskLabel}</p>
      <p style="margin:2px 0 0;font-size:10px;color:#9ca3af">Scor conformitate</p>
    </div>
  </div>

  <!-- Frameworks -->
  <section>
    <h2>Status per reglementare</h2>
    ${frameworksHtml}
  </section>

  <!-- Open findings -->
  <section>
    <h2>Finding-uri critice / high-risk deschise</h2>
    ${findingsHtml}
  </section>

  <!-- Vendor Reviews (V5.6) -->
  ${data.vendorReviews ? `
  <section>
    <h2>Vendor Reviews — Evaluare furnizori externi</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:6px 0;font-size:13px;color:#374151">Vendori totali evaluați</td><td style="padding:6px 0;font-size:13px;font-weight:600;text-align:right">${data.vendorReviews.totalVendors}</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:#374151">Review-uri finalizate</td><td style="padding:6px 0;font-size:13px;font-weight:600;text-align:right">${data.vendorReviews.reviewedVendors}</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:#374151">Review-uri expirate</td><td style="padding:6px 0;font-size:13px;font-weight:600;text-align:right;${data.vendorReviews.overdueReviews > 0 ? "color:#dc2626" : ""}">${data.vendorReviews.overdueReviews}</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:#374151">Vendori critici (deschise)</td><td style="padding:6px 0;font-size:13px;font-weight:600;text-align:right;${data.vendorReviews.criticalCount > 0 ? "color:#dc2626" : ""}">${data.vendorReviews.criticalCount}</td></tr>
    </table>
    ${data.vendorReviews.topReviews.length > 0 ? `
    <div style="margin-top:12px">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Detalii review-uri</p>
      ${data.vendorReviews.topReviews.map((r) => `
      <div style="border-left:3px solid ${r.urgency === "critical" ? "#dc2626" : r.urgency === "high" ? "#ea580c" : "#6b7280"};padding:6px 12px;margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:13px;font-weight:600;color:#111">${r.vendorName}</span>
          <span style="background:${r.status === "closed" ? "#16a34a" : r.urgency === "critical" ? "#dc2626" : "#ca8a04"};color:#fff;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:600">${r.status === "closed" ? "ÎNCHIS" : r.status === "overdue-review" ? "EXPIRAT" : r.status.toUpperCase()}</span>
        </div>
        <p style="margin:2px 0 0;font-size:11px;color:#6b7280">Caz: ${r.reviewCase ?? "—"} · Dovezi: ${r.hasEvidence ? "Da" : "Nu"}${r.nextReviewDueISO ? ` · Următorul review: ${new Date(r.nextReviewDueISO).toLocaleDateString("ro-RO")}` : ""}</p>
      </div>`).join("")}
    </div>` : ""}
  </section>` : ""}

  <!-- Evidence summary -->
  <section>
    <h2>Rezumat evidențe</h2>
    <table style="width:100%;border-collapse:collapse">
      ${evidenceRows}
    </table>
  </section>

  <!-- Commitments -->
  <section>
    <h2>Angajamente prioritare (P1)</h2>
    <ul style="margin:0;padding-left:20px;font-size:13px;color:#374151;line-height:1.6">
      ${data.commitments.map((c) => `<li>${c}</li>`).join("")}
    </ul>
  </section>

  <p class="disc">${data.disclaimer}</p>

</main>
</body>
</html>`
}
