// Sprint 13 — Weekly Digest Email
// Construiește HTML-ul email-ului săptămânal de conformitate.
// Funcție pură — fără I/O, testabilă izolat.

// ── Tipuri ────────────────────────────────────────────────────────────────────

export type DigestFinding = {
  title: string
  category: string
  severity: string
}

export type DigestNis2 = {
  openIncidents: number
  pendingVendors: number
  dnscStatus: string
}

export type WeeklyDigest = {
  orgName: string
  orgId: string
  emailAddress: string
  currentScore: number
  previousScore?: number      // din săptămâna trecută (opțional)
  riskLabel: string
  openAlerts: number
  redAlerts: number
  resolvedThisWeek?: number   // items rezolvate în ultima săptămână
  deadlinesIminente?: string[] // deadline-uri în următoarele 7 zile
  nextBestAction?: string
  openFindings: DigestFinding[]
  nis2?: DigestNis2
  generatedAt?: string
}

// ── Helpers HTML ──────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 75) return "#10b981"  // emerald-500
  if (score >= 50) return "#f59e0b"  // amber-400
  return "#ef4444"                   // red-500
}

function scoreDelta(current: number, previous?: number): string {
  if (previous === undefined) return ""
  const diff = current - previous
  if (diff === 0) return `<span style="color:#94a3b8">→ neschimbat</span>`
  return diff > 0
    ? `<span style="color:#10b981">↑ +${diff}% față de săptămâna trecută</span>`
    : `<span style="color:#ef4444">↓ ${diff}% față de săptămâna trecută</span>`
}

// ── Builder principal ─────────────────────────────────────────────────────────

/**
 * Construiește HTML-ul email-ului digest săptămânal.
 * Pur, determinist, fără I/O.
 */
// ── B6 — Partner Hub Weekly Digest ──────────────────────────────────────────

export type PartnerClientSummary = {
  orgName: string
  orgId: string
  currentScore: number
  openAlerts: number
  redAlerts: number
  urgentDeadline?: string
}

export type PartnerDigest = {
  consultantEmail: string
  consultantName?: string
  cabinetName?: string
  clients: PartnerClientSummary[]
  generatedAt?: string
}

export function buildPartnerDigestEmail(digest: PartnerDigest): string {
  const { consultantName, cabinetName, clients, generatedAt } = digest

  const dateStr = generatedAt
    ? new Date(generatedAt).toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" })
    : new Date().toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" })

  // Sort: urgente first (red alerts + low score)
  const sorted = [...clients].sort((a, b) => {
    if (b.redAlerts !== a.redAlerts) return b.redAlerts - a.redAlerts
    return a.currentScore - b.currentScore
  })

  const rowsHtml = sorted.map((c) => {
    const color = scoreColor(c.currentScore)
    const urgentBadge = c.redAlerts > 0
      ? `<span style="background:#fef2f2;color:#dc2626;padding:2px 6px;border-radius:4px;font-size:10px">${c.redAlerts} critice</span>`
      : ""
    const deadlineInfo = c.urgentDeadline
      ? `<span style="color:#d97706;font-size:11px">⏰ ${c.urgentDeadline}</span>`
      : ""

    return `
      <tr>
        <td style="padding:8px 4px;border-bottom:1px solid #f1f5f9;color:#0f172a;font-weight:500">${c.orgName}</td>
        <td style="padding:8px 4px;border-bottom:1px solid #f1f5f9;text-align:center">
          <span style="color:${color};font-weight:700">${c.currentScore}%</span>
        </td>
        <td style="padding:8px 4px;border-bottom:1px solid #f1f5f9;text-align:center">${c.openAlerts}</td>
        <td style="padding:8px 4px;border-bottom:1px solid #f1f5f9;text-align:right">${urgentBadge} ${deadlineInfo}</td>
      </tr>`
  }).join("")

  const greeting = consultantName ? `Salut ${consultantName},` : "Salut,"
  const footer = cabinetName
    ? `Trimis de ${cabinetName} via CompliAI`
    : "Digest automat CompliAI Partner Hub"

  return `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto">
    <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0">
      <h1 style="color:#fff;margin:0;font-size:16px;font-weight:600">🛡 CompliAI · Partner Hub</h1>
      <p style="color:#94a3b8;margin:4px 0 0;font-size:12px">Digest săptămânal clienți · ${dateStr}</p>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
      <p style="margin:0 0 16px;color:#475569">${greeting}</p>
      <p style="margin:0 0 20px;color:#475569">Ai <strong>${clients.length}</strong> client${clients.length !== 1 ? "i" : ""} monitorizat${clients.length !== 1 ? "i" : ""}. Rezumat:</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:8px 4px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Client</th>
            <th style="padding:8px 4px;text-align:center;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Scor</th>
            <th style="padding:8px 4px;text-align:center;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Alerte</th>
            <th style="padding:8px 4px;text-align:right;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Urgent</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="text-align:center;margin:24px 0 0">
        <a href="https://compliai.ro/dashboard"
           style="display:inline-block;background:#6366f1;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">
          Deschide Dashboard
        </a>
      </div>
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:11px;margin:16px 0">
      ${footer} &mdash;
      <a href="https://compliai.ro/dashboard/settings" style="color:#6366f1">Gestionează notificările</a>
    </p>
  </div>
</body>
</html>`
}

// ── Original Org Digest ─────────────────────────────────────────────────────

export function buildDigestEmail(digest: WeeklyDigest): string {
  const {
    orgName, currentScore, previousScore, riskLabel,
    openAlerts, redAlerts, resolvedThisWeek, deadlinesIminente,
    nextBestAction, openFindings, nis2, generatedAt,
  } = digest

  const dateStr = generatedAt
    ? new Date(generatedAt).toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" })
    : new Date().toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" })

  const color = scoreColor(currentScore)
  const delta = scoreDelta(currentScore, previousScore)

  const findingsHtml = openFindings.slice(0, 5).map((f) => `
    <tr>
      <td style="padding:6px 0;border-bottom:1px solid #f1f5f9;color:#0f172a">${f.title}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:11px">${f.category}</td>
      <td style="padding:6px 0;border-bottom:1px solid #f1f5f9;text-align:right">
        <span style="background:${f.severity === "high" || f.severity === "critical" ? "#fef2f2" : "#fffbeb"};color:${f.severity === "high" || f.severity === "critical" ? "#dc2626" : "#d97706"};padding:2px 8px;border-radius:4px;font-size:11px">${f.severity}</span>
      </td>
    </tr>`).join("")

  const nis2Html = nis2 && (nis2.openIncidents > 0 || nis2.pendingVendors > 0)
    ? `
    <div style="background:#f0f9ff;border-left:3px solid #0ea5e9;padding:12px 16px;border-radius:0 6px 6px 0;margin-bottom:16px">
      <p style="margin:0 0 6px;font-weight:600;color:#0c4a6e">NIS2</p>
      <ul style="margin:0;padding-left:16px;color:#0369a1;font-size:13px">
        ${nis2.openIncidents > 0 ? `<li>${nis2.openIncidents} incident${nis2.openIncidents !== 1 ? "e deschise" : " deschis"}</li>` : ""}
        ${nis2.pendingVendors > 0 ? `<li>${nis2.pendingVendors} furnizori fără evaluare completă</li>` : ""}
        <li>Înregistrare DNSC: <strong>${nis2.dnscStatus === "confirmed" ? "Confirmată ✓" : nis2.dnscStatus === "submitted" ? "Trimisă, în așteptare" : "Nepornită"}</strong></li>
      </ul>
    </div>` : ""

  const deadlinesHtml = deadlinesIminente && deadlinesIminente.length > 0
    ? `
    <div style="background:#fef3c7;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:0 6px 6px 0;margin-bottom:16px">
      <p style="margin:0 0 6px;font-weight:600;color:#92400e">Deadline-uri iminente (7 zile)</p>
      <ul style="margin:0;padding-left:16px;color:#b45309;font-size:13px">
        ${deadlinesIminente.map((d) => `<li>${d}</li>`).join("")}
      </ul>
    </div>` : ""

  const nextActionHtml = nextBestAction
    ? `
    <div style="background:#f0fdf4;border-left:3px solid #22c55e;padding:12px 16px;border-radius:0 6px 6px 0;margin-bottom:16px">
      <p style="margin:0 0 4px;font-weight:600;color:#14532d">Acțiunea recomandată</p>
      <p style="margin:0;color:#15803d;font-size:13px">${nextBestAction}</p>
    </div>` : ""

  return `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto">

    <!-- Header -->
    <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:space-between">
      <div>
        <h1 style="color:#fff;margin:0;font-size:16px;font-weight:600">🛡 CompliAI</h1>
        <p style="color:#94a3b8;margin:4px 0 0;font-size:12px">Digest săptămânal · ${dateStr}</p>
      </div>
    </div>

    <!-- Body -->
    <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">

      <h2 style="margin:0 0 4px;color:#0f172a;font-size:18px">${orgName}</h2>
      <p style="margin:0 0 20px;color:#64748b;font-size:13px">Raport de conformitate · ${dateStr}</p>

      <!-- Score card -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between">
        <div>
          <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8">Readiness global</p>
          <div style="display:flex;align-items:baseline;gap:8px;margin-top:4px">
            <span style="font-size:36px;font-weight:700;color:${color}">${currentScore}%</span>
            <span style="font-size:12px;color:#64748b">${riskLabel}</span>
          </div>
          ${delta ? `<p style="margin:4px 0 0;font-size:12px">${delta}</p>` : ""}
        </div>
        <div style="text-align:right">
          ${redAlerts > 0
            ? `<span style="background:#fef2f2;color:#dc2626;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600">${redAlerts} alerte critice</span>`
            : `<span style="background:#f0fdf4;color:#16a34a;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600">Fără alerte critice</span>`
          }
          ${resolvedThisWeek && resolvedThisWeek > 0
            ? `<p style="margin:6px 0 0;font-size:12px;color:#16a34a">✓ ${resolvedThisWeek} items rezolvate săptămâna aceasta</p>`
            : ""}
        </div>
      </div>

      ${nis2Html}
      ${deadlinesHtml}
      ${nextActionHtml}

      <!-- Findings -->
      ${openFindings.length > 0 ? `
      <h3 style="margin:0 0 12px;color:#0f172a;font-size:14px">Findings deschise (${openAlerts} total)</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        ${findingsHtml}
      </table>
      ` : `
      <div style="background:#f0fdf4;padding:12px 16px;border-radius:6px;margin-bottom:20px">
        <p style="margin:0;color:#15803d;font-size:13px">✓ Niciun finding critic deschis. Menține ritmul!</p>
      </div>
      `}

      <!-- CTA -->
      <div style="text-align:center;margin:24px 0 0">
        <a href="https://compliai.ro/dashboard"
           style="display:inline-block;background:#6366f1;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">
          Deschide Dashboard
        </a>
      </div>

    </div>

    <!-- Footer -->
    <p style="text-align:center;color:#94a3b8;font-size:11px;margin:16px 0">
      Digest automat CompliAI &mdash;
      <a href="https://compliai.ro/dashboard/settings" style="color:#6366f1">Dezactivează digest</a>
    </p>

  </div>
</body>
</html>`
}
