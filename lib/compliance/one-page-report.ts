// V3 P0.1 — One-Page Compliance Report
// Raport executiv printabil, destinat auditorului sau conducerii.
// Arată scorul de conformitate, statusul per framework, top riscuri, acțiuni prioritare.

import type { ComplianceState, DashboardSummary, ScanFinding, RemediationAction } from "@/lib/compliance/types"

export type OnePageReportData = {
  generatedAt: string
  generatedAtLabel: string
  orgName: string
  score: number
  riskLabel: string
  frameworks: FrameworkStatus[]
  topFindings: TopFinding[]
  topActions: TopAction[]
  metrics: ReportMetric[]
  disclaimer: string
}

export type FrameworkStatus = {
  name: string
  status: "activ" | "partial" | "neaplicat" | "neverificat"
  detail: string
  icon: string
}

export type TopFinding = {
  title: string
  severity: string
  category: string
  action: string
}

export type TopAction = {
  priority: string
  title: string
  owner: string
  dueDate: string
}

export type ReportMetric = {
  label: string
  value: string
  note?: string
}

export function buildOnePageReport(
  state: ComplianceState,
  summary: DashboardSummary,
  remediationPlan: RemediationAction[],
  orgName: string,
  nowISO: string
): OnePageReportData {
  const now = new Date(nowISO)
  const generatedAtLabel = now.toLocaleString("ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  // Framework status
  const findings = state.findings ?? []
  const nis2Findings = findings.filter((f) => f.category === "NIS2")
  const gdprFindings = findings.filter((f) => f.category === "GDPR")
  const aiActFindings = findings.filter((f) => f.category === "EU_AI_ACT")
  const efacturaFindings = findings.filter((f) => f.category === "E_FACTURA")

  const frameworks: FrameworkStatus[] = [
    {
      name: "GDPR",
      icon: "🛡️",
      status: state.gdprProgress >= 70 ? "activ" : state.gdprProgress > 0 ? "partial" : "neverificat",
      detail: state.gdprProgress > 0
        ? `${state.gdprProgress}% checklist completat · ${gdprFindings.length} finding-uri`
        : "Nu există date GDPR înregistrate",
    },
    {
      name: "EU AI Act",
      icon: "🤖",
      status: state.highRisk + state.lowRisk > 0 ? "activ" : "neverificat",
      detail: state.highRisk + state.lowRisk > 0
        ? `${state.highRisk} sisteme high-risk · ${state.lowRisk} sisteme low-risk · ${aiActFindings.length} finding-uri`
        : "Nu există sisteme AI inventariate",
    },
    {
      name: "e-Factura",
      icon: "📄",
      status: state.efacturaConnected ? "activ" : state.efacturaSignalsCount > 0 ? "partial" : "neverificat",
      detail: state.efacturaConnected
        ? `Conectat SPV · ${state.efacturaSignalsCount} semnale nerezolvate`
        : state.efacturaSignalsCount > 0
        ? `${state.efacturaSignalsCount} semnale detectate · conexiune ANAF neconfirmată`
        : "Fără conexiune ANAF configurată",
    },
    {
      name: "NIS2",
      icon: "🔒",
      status: nis2Findings.length > 0 ? "partial" : state.findings.length > 0 ? "activ" : "neverificat",
      detail: nis2Findings.length > 0
        ? `${nis2Findings.filter((f) => f.severity === "critical" || f.severity === "high").length} gap-uri critice/high · ${nis2Findings.length} total`
        : "Nu există evaluare NIS2 completată",
    },
  ]

  // Top 5 findings by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  const topFindings: TopFinding[] = [...findings]
    .sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3))
    .slice(0, 5)
    .map((f) => ({
      title: f.title,
      severity: f.severity,
      category: f.category,
      action: f.resolution?.action ?? f.remediationHint ?? "Verifică și remediază manual.",
    }))

  // Top 3 P1 actions
  const topActions: TopAction[] = remediationPlan
    .filter((a) => a.priority === "P1" || a.priority === "P2")
    .slice(0, 3)
    .map((a) => ({
      priority: a.priority,
      title: a.title,
      owner: a.owner,
      dueDate: a.dueDate ?? (a.priority === "P1" ? "azi" : "săptămâna aceasta"),
    }))

  // Key metrics
  const openAlerts = (state.alerts ?? []).filter((a) => a.open).length
  const scannedDocs = state.scannedDocuments ?? 0
  const aiSystemsTotal = (state.aiSystems ?? []).length + (state.detectedAISystems ?? []).filter((s) => s.detectionStatus === "confirmed").length
  const openDrifts = (state.driftRecords ?? []).filter((d) => d.open).length

  const metrics: ReportMetric[] = [
    { label: "Scor conformitate", value: `${summary.score}/100`, note: summary.riskLabel },
    { label: "Alerte deschise", value: `${openAlerts}`, note: openAlerts === 0 ? "fără alerte active" : "necesită atenție" },
    { label: "Finding-uri active", value: `${findings.length}`, note: `${findings.filter((f) => f.risk === "high").length} high-risk` },
    { label: "Documente analizate", value: `${scannedDocs}` },
    { label: "Sisteme AI inventariate", value: `${aiSystemsTotal}`, note: state.highRisk > 0 ? `${state.highRisk} high-risk` : undefined },
    { label: "Drift activ", value: `${openDrifts}`, note: openDrifts > 0 ? "schimbări față de baseline" : "fără drift activ" },
  ]

  return {
    generatedAt: nowISO,
    generatedAtLabel,
    orgName,
    score: summary.score,
    riskLabel: summary.riskLabel,
    frameworks,
    topFindings,
    topActions,
    metrics,
    disclaimer:
      "Generat de CompliAI. Informațiile sunt orientative — verifică cu un specialist juridic înainte de orice raport oficial. CompliAI nu garantează rezultate juridice.",
  }
}

// ── Markdown generator (for PDF export) ──────────────────────────────────────

export function buildOnePageReportMarkdown(data: OnePageReportData): string {
  const statusLabel = (status: FrameworkStatus["status"]) => {
    if (status === "activ") return "✅ Activ"
    if (status === "partial") return "⚠️ Parțial"
    if (status === "neaplicat") return "— Nu se aplică"
    return "🔘 Neverificat"
  }

  const frameworksSection = data.frameworks
    .map((f) => `- **${f.icon} ${f.name}** — ${statusLabel(f.status)}: ${f.detail}`)
    .join("\n")

  const findingsSection =
    data.topFindings.length === 0
      ? "Nu există finding-uri active."
      : data.topFindings
          .map((f, i) => `${i + 1}. **[${f.severity.toUpperCase()}] ${f.title}** (${f.category})\n   → ${f.action}`)
          .join("\n")

  const actionsSection =
    data.topActions.length === 0
      ? "Nu există acțiuni prioritare."
      : data.topActions
          .map((a) => `- **${a.priority}** ${a.title} — Owner: ${a.owner} · Termen: ${a.dueDate}`)
          .join("\n")

  const metricsSection = data.metrics
    .map((m) => `- **${m.label}:** ${m.value}${m.note ? ` (${m.note})` : ""}`)
    .join("\n")

  return `# Raport Executiv de Conformitate

**Organizație:** ${data.orgName || "–"}
**Generat la:** ${data.generatedAtLabel}
**Scor conformitate:** ${data.score}/100 — ${data.riskLabel}

---

## Metrici cheie

${metricsSection}

---

## Status per reglementare

${frameworksSection}

---

## Top finding-uri active

${findingsSection}

---

## Acțiuni prioritare (P1/P2)

${actionsSection}

---

*${data.disclaimer}*
`
}

// ── HTML generator ────────────────────────────────────────────────────────────

export function buildOnePageReportHtml(data: OnePageReportData): string {
  const scoreColor =
    data.score >= 90 ? "#16a34a" : data.score >= 75 ? "#ca8a04" : "#dc2626"

  const statusColor = (status: FrameworkStatus["status"]) => {
    if (status === "activ") return "#16a34a"
    if (status === "partial") return "#ca8a04"
    if (status === "neaplicat") return "#6b7280"
    return "#9ca3af"
  }

  const statusLabel = (status: FrameworkStatus["status"]) => {
    if (status === "activ") return "✅ Activ"
    if (status === "partial") return "⚠️ Parțial"
    if (status === "neaplicat") return "— Nu se aplică"
    return "🔘 Neverificat"
  }

  const severityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "#dc2626",
      high: "#ea580c",
      medium: "#ca8a04",
      low: "#4b5563",
    }
    return `<span style="background:${colors[severity] ?? "#4b5563"};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase">${severity}</span>`
  }

  const frameworksHtml = data.frameworks
    .map(
      (f) => `
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;break-inside:avoid">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <span style="font-weight:600;font-size:14px">${f.icon} ${f.name}</span>
          <span style="font-size:12px;font-weight:600;color:${statusColor(f.status)}">${statusLabel(f.status)}</span>
        </div>
        <p style="margin:6px 0 0;font-size:12px;color:#6b7280">${f.detail}</p>
      </div>`
    )
    .join("")

  const findingsHtml =
    data.topFindings.length === 0
      ? `<p style="color:#6b7280;font-size:13px">Nu există finding-uri active.</p>`
      : data.topFindings
          .map(
            (f) => `
          <div style="border-left:3px solid #e5e7eb;padding:8px 12px;margin-bottom:8px;break-inside:avoid">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              ${severityBadge(f.severity)}
              <span style="font-size:11px;color:#6b7280;font-weight:600">${f.category}</span>
            </div>
            <p style="margin:4px 0 2px;font-size:13px;font-weight:600;color:#111">${f.title}</p>
            <p style="margin:0;font-size:12px;color:#4b5563">${f.action}</p>
          </div>`
          )
          .join("")

  const actionsHtml =
    data.topActions.length === 0
      ? `<p style="color:#6b7280;font-size:13px">Nu există acțiuni prioritare.</p>`
      : data.topActions
          .map(
            (a) => `
          <div style="display:flex;gap:12px;align-items:flex-start;border-left:3px solid #3b82f6;padding:8px 12px;margin-bottom:8px;break-inside:avoid">
            <span style="background:#3b82f6;color:#fff;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;white-space:nowrap">${a.priority}</span>
            <div>
              <p style="margin:0;font-size:13px;font-weight:600;color:#111">${a.title}</p>
              <p style="margin:2px 0 0;font-size:11px;color:#6b7280">Owner: ${a.owner} · Termen: ${a.dueDate}</p>
            </div>
          </div>`
          )
          .join("")

  const metricsHtml = data.metrics
    .map(
      (m) => `
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px;text-align:center">
        <p style="margin:0;font-size:22px;font-weight:700;color:#111">${m.value}</p>
        <p style="margin:2px 0 0;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">${m.label}</p>
        ${m.note ? `<p style="margin:2px 0 0;font-size:10px;color:#9ca3af">${m.note}</p>` : ""}
      </div>`
    )
    .join("")

  return `<!doctype html>
<html lang="ro">
<head>
  <meta charset="utf-8" />
  <title>Raport Executiv CompliAI — ${data.orgName}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; margin: 0; padding: 32px; color: #111; background: #fff; }
    .wrap { max-width: 820px; margin: 0 auto; }
    h2 { margin: 0 0 12px; font-size: 15px; font-weight: 700; color: #111; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
    section { margin-bottom: 28px; }
    .grid-2 { display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid-3 { display: grid; gap: 10px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .grid-metrics { display: grid; gap: 8px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .disc { color: #9ca3af; font-size: 11px; margin-top: 24px; padding-top: 12px; border-top: 1px solid #f3f4f6; }
    @media print {
      body { padding: 16px; }
      .wrap { max-width: 100%; }
      section { break-inside: avoid; }
    }
  </style>
</head>
<body>
<main class="wrap">

  <!-- Header -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;gap:16px;flex-wrap:wrap">
    <div>
      <p style="margin:0;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em">Raport Executiv de Conformitate</p>
      <h1 style="margin:4px 0 0;font-size:24px;font-weight:800;color:#111">${data.orgName || "Organizație"}</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#6b7280">Generat la ${data.generatedAtLabel} · CompliAI</p>
    </div>
    <div style="text-align:center;min-width:120px;border:2px solid ${scoreColor};border-radius:12px;padding:12px 20px">
      <p style="margin:0;font-size:36px;font-weight:800;color:${scoreColor}">${data.score}</p>
      <p style="margin:0;font-size:12px;font-weight:700;color:${scoreColor}">${data.riskLabel}</p>
      <p style="margin:2px 0 0;font-size:10px;color:#9ca3af">Scor conformitate</p>
    </div>
  </div>

  <!-- Metrics grid -->
  <section>
    <h2>Metrici cheie</h2>
    <div class="grid-metrics">${metricsHtml}</div>
  </section>

  <!-- Frameworks -->
  <section>
    <h2>Status per reglementare</h2>
    <div class="grid-2">${frameworksHtml}</div>
  </section>

  <!-- Top findings -->
  <section>
    <h2>Top finding-uri active (${data.topFindings.length})</h2>
    ${findingsHtml}
  </section>

  <!-- Top actions -->
  <section>
    <h2>Acțiuni prioritare (P1/P2)</h2>
    ${actionsHtml}
  </section>

  <p class="disc">${data.disclaimer}</p>

</main>
</body>
</html>`
}
