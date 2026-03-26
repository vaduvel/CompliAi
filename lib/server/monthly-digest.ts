// Faza 2 — TASK 5: Monthly Digest Email
// Template cu un singur eveniment extern real + statusul firmei față de acel eveniment.
// Funcție pură, fără I/O, testabilă izolat.

// ── Types ────────────────────────────────────────────────────────────────────

export type MonthlyExternalEvent = {
  type: "anspdcp" | "legislation" | "anaf"
  headline: string        // max 2 rânduri
  cause: string           // 1 rând
  sourceLabel: string     // "ANSPDCP", "DNSC", "ANAF"
}

export type MonthlyStatusItem = {
  label: string
  ok: boolean             // true = verde, false = galben/warning
  detail?: string
}

export type MonthlyDigest = {
  orgName: string
  emailAddress: string
  event: MonthlyExternalEvent | null
  statusItems: MonthlyStatusItem[]
  currentScore: number
  openFindings: number
  ctaHref: string         // link direct la finding relevant, nu la dashboard generic
  ctaLabel: string
  generatedAt: string
}

// ── Subjects (rotație) ──────────────────────────────────────────────────────

const SUBJECT_TEMPLATES = {
  anspdcp: (headline: string) =>
    `ANSPDCP: ${headline.slice(0, 60)}. Iată cum ești protejat.`,
  legislation: (headline: string) =>
    `Schimbare legislativă: ${headline.slice(0, 50)}. Statusul tău.`,
  anaf: (headline: string) =>
    `ANAF: ${headline.slice(0, 60)}. Statusul conformității tale.`,
  fallback: (_orgName: string) =>
    `Raport lunar de conformitate — ce a lucrat Compli luna asta`,
}

export function buildMonthlySubject(digest: MonthlyDigest): string {
  if (!digest.event) {
    return SUBJECT_TEMPLATES.fallback(digest.orgName)
  }
  return SUBJECT_TEMPLATES[digest.event.type](digest.event.headline)
}

// ── HTML builder ────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 75) return "#10b981"
  if (score >= 50) return "#f59e0b"
  return "#ef4444"
}

export function buildMonthlyDigestEmail(digest: MonthlyDigest): string {
  const { orgName, event, statusItems, currentScore, openFindings, ctaHref, ctaLabel, generatedAt } = digest

  const dateStr = new Date(generatedAt).toLocaleDateString("ro-RO", {
    month: "long",
    year: "numeric",
  })
  const color = scoreColor(currentScore)

  // Event section
  const eventHtml = event
    ? `
      <div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:14px 16px;border-radius:0 6px 6px 0;margin-bottom:20px">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#92400e">${event.sourceLabel} — ${dateStr}</p>
        <p style="margin:0 0 8px;color:#0f172a;font-weight:600;font-size:14px">${event.headline}</p>
        <p style="margin:0;color:#78350f;font-size:13px">Cauza: ${event.cause}</p>
      </div>`
    : `
      <div style="background:#f0fdf4;border-left:3px solid #22c55e;padding:14px 16px;border-radius:0 6px 6px 0;margin-bottom:20px">
        <p style="margin:0;color:#15803d;font-size:13px">
          Luna aceasta nu au fost detectate sancțiuni sau schimbări legislative cu impact direct pe firma ta.
          Compli continuă să monitorizeze automat.
        </p>
      </div>`

  // Status items
  const statusHtml = statusItems
    .map((item) => {
      const icon = item.ok ? "✓" : "⚠️"
      const bgColor = item.ok ? "#f0fdf4" : "#fffbeb"
      const textColor = item.ok ? "#15803d" : "#92400e"
      const detail = item.detail ? ` — ${item.detail}` : ""
      return `
        <div style="display:flex;align-items:flex-start;gap:8px;padding:8px 12px;background:${bgColor};border-radius:6px;margin-bottom:6px">
          <span style="font-size:14px;flex-shrink:0">${icon}</span>
          <span style="color:${textColor};font-size:13px">${item.label}${detail}</span>
        </div>`
    })
    .join("")

  return `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto">

    <!-- Header -->
    <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0">
      <h1 style="color:#fff;margin:0;font-size:16px;font-weight:600">🛡 CompliAI</h1>
      <p style="color:#94a3b8;margin:4px 0 0;font-size:12px">Raport lunar · ${dateStr}</p>
    </div>

    <!-- Body -->
    <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">

      <h2 style="margin:0 0 4px;color:#0f172a;font-size:18px">${orgName}</h2>
      <p style="margin:0 0 20px;color:#64748b;font-size:13px">Ce a observat Compli luna aceasta</p>

      ${eventHtml}

      <!-- Org status relative to event -->
      <p style="margin:0 0 10px;font-weight:600;color:#0f172a;font-size:13px">Cum stai tu față de acest risc:</p>
      ${statusHtml}

      <!-- Score summary -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;margin:20px 0;display:flex;align-items:center;justify-content:space-between">
        <div>
          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8">Readiness</p>
          <span style="font-size:28px;font-weight:700;color:${color}">${currentScore}%</span>
        </div>
        <div style="text-align:right;font-size:12px;color:#64748b">
          ${openFindings > 0
            ? `<span style="color:#d97706">${openFindings} findings deschise</span>`
            : `<span style="color:#16a34a">Niciun finding deschis</span>`}
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:24px 0 0">
        <a href="https://compliai.ro${ctaHref}"
           style="display:inline-block;background:#6366f1;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">
          ${ctaLabel}
        </a>
      </div>

    </div>

    <!-- Footer -->
    <p style="text-align:center;color:#94a3b8;font-size:11px;margin:16px 0">
      Raport lunar automat CompliAI &mdash;
      <a href="https://compliai.ro/dashboard/settings" style="color:#6366f1">Dezactivează</a>
    </p>

  </div>
</body>
</html>`
}
