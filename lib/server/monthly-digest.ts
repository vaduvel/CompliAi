// Faza 2 — TASK 5: Monthly Digest Email
// Template cu un singur eveniment extern real + statusul firmei față de acel eveniment.
// Funcție pură, fără I/O, testabilă izolat.

import type { ComplianceState, EvidenceRegistryEntry } from "@/lib/compliance/types"

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
  activity?: MonthlyActivitySummary
  currentScore: number
  openFindings: number
  ctaHref: string         // link direct la finding relevant, nu la dashboard generic
  ctaLabel: string
  appBaseUrl?: string
  generatedAt: string
}

export type MonthlyActivitySummary = {
  periodStartISO: string
  periodEndISO: string
  documentsGenerated: number
  documentsSent: number
  magicLinksApproved: number
  magicLinksRejected: number
  magicLinkComments: number
  validatedEvidenceItems: number
  findingsClosed: number
  baselineValidated: boolean
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
    `Raport lunar de conformitate — ce a lucrat CompliScan luna asta`,
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
  const { orgName, event, statusItems, activity, currentScore, openFindings, ctaHref, ctaLabel, generatedAt } = digest

  const dateStr = new Date(generatedAt).toLocaleDateString("ro-RO", {
    month: "long",
    year: "numeric",
  })
  const color = scoreColor(currentScore)
  const appBaseUrl = (digest.appBaseUrl ?? "https://app.compliscan.ro").replace(/\/+$/, "")

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

  const activityHtml = activity
    ? `
      <div style="margin:20px 0">
        <p style="margin:0 0 10px;font-weight:600;color:#0f172a;font-size:13px">Activitate reală în dosar luna aceasta:</p>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
          ${buildActivityMetric("Documente generate", activity.documentsGenerated)}
          ${buildActivityMetric("Documente trimise", activity.documentsSent)}
          ${buildActivityMetric("Aprobări magic link", activity.magicLinksApproved)}
          ${buildActivityMetric("Respingeri / comentarii", activity.magicLinksRejected + activity.magicLinkComments)}
          ${buildActivityMetric("Dovezi validate", activity.validatedEvidenceItems)}
          ${buildActivityMetric("Findings închise", activity.findingsClosed)}
        </div>
        <p style="margin:10px 0 0;color:${activity.baselineValidated ? "#15803d" : "#92400e"};font-size:12px">
          ${activity.baselineValidated
            ? "Baseline validat în această perioadă."
            : "Baseline-ul nu a fost revalidat în această perioadă."}
        </p>
      </div>`
    : ""

  return `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto">

    <!-- Header -->
    <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0">
      <h1 style="color:#fff;margin:0;font-size:16px;font-weight:600">CompliScan</h1>
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

      ${activityHtml}

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
        <a href="${appBaseUrl}${ctaHref}"
           style="display:inline-block;background:#6366f1;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">
          ${ctaLabel}
        </a>
      </div>

    </div>

    <!-- Footer -->
    <p style="text-align:center;color:#94a3b8;font-size:11px;margin:16px 0">
      Raport lunar automat CompliScan &mdash;
      <a href="${appBaseUrl}/dashboard/settings" style="color:#6366f1">Dezactivează</a>
    </p>

  </div>
</body>
</html>`
}

export function buildMonthlyActivitySummary(input: {
  state: ComplianceState
  evidenceLedger?: EvidenceRegistryEntry[]
  generatedAtISO: string
  windowDays?: number
}): MonthlyActivitySummary {
  const periodEndMs = Date.parse(input.generatedAtISO)
  const safePeriodEndMs = Number.isFinite(periodEndMs) ? periodEndMs : Date.now()
  const periodStartMs = safePeriodEndMs - (input.windowDays ?? 30) * 86_400_000

  const inPeriod = (iso?: string | null) => {
    if (!iso) return false
    const value = Date.parse(iso)
    return Number.isFinite(value) && value >= periodStartMs && value <= safePeriodEndMs
  }

  const documentsGenerated = input.state.generatedDocuments.filter((document) =>
    inPeriod(document.generatedAtISO)
  ).length
  const documentsSent = input.state.generatedDocuments.filter((document) =>
    document.adoptionStatus === "sent_for_signature" ||
    document.adoptionStatus === "signed" ||
    document.adoptionStatus === "rejected"
  ).filter((document) => inPeriod(document.adoptionUpdatedAtISO ?? document.generatedAtISO)).length

  const approvedEvents = input.state.events.filter((event) =>
    event.type === "document.shared_approved" && inPeriod(event.createdAtISO)
  ).length
  const rejectedEvents = input.state.events.filter((event) =>
    event.type === "document.shared_rejected" && inPeriod(event.createdAtISO)
  ).length
  const commentEvents = input.state.events.filter((event) =>
    event.type === "document.shared_commented" && inPeriod(event.createdAtISO)
  ).length

  const approvedFromDocuments = input.state.generatedDocuments.filter((document) =>
    document.adoptionStatus === "signed" && inPeriod(document.adoptionUpdatedAtISO)
  ).length
  const rejectedFromDocuments = input.state.generatedDocuments.filter((document) =>
    document.adoptionStatus === "rejected" && inPeriod(document.adoptionUpdatedAtISO)
  ).length
  const commentsFromDocuments = input.state.generatedDocuments.reduce((total, document) => {
    return total + (document.shareComments ?? []).filter((comment) => inPeriod(comment.createdAtISO)).length
  }, 0)

  const validatedEvidenceIds = new Set<string>()
  for (const taskState of Object.values(input.state.taskState ?? {})) {
    const evidence = taskState.attachedEvidenceMeta
    if (
      evidence?.id &&
      evidence.quality?.status === "sufficient" &&
      inPeriod(evidence.uploadedAtISO ?? taskState.validatedAtISO ?? taskState.updatedAtISO)
    ) {
      validatedEvidenceIds.add(evidence.id)
    }
  }
  for (const evidence of input.evidenceLedger ?? []) {
    if (
      evidence.id &&
      evidence.quality?.status === "sufficient" &&
      inPeriod(evidence.uploadedAtISO)
    ) {
      validatedEvidenceIds.add(evidence.id)
    }
  }

  const findingsClosed = input.state.findings.filter((finding) =>
    (finding.findingStatus === "resolved" ||
      finding.findingStatus === "under_monitoring" ||
      finding.findingStatus === "dismissed") &&
    inPeriod(finding.findingStatusUpdatedAtISO ?? finding.resolution?.reviewedAtISO)
  ).length
  const baselineValidated = input.state.events.some((event) =>
    event.type === "baseline.set" && inPeriod(event.createdAtISO)
  )

  return {
    periodStartISO: new Date(periodStartMs).toISOString(),
    periodEndISO: new Date(safePeriodEndMs).toISOString(),
    documentsGenerated,
    documentsSent,
    magicLinksApproved: Math.max(approvedEvents, approvedFromDocuments),
    magicLinksRejected: Math.max(rejectedEvents, rejectedFromDocuments),
    magicLinkComments: Math.max(commentEvents, commentsFromDocuments),
    validatedEvidenceItems: validatedEvidenceIds.size,
    findingsClosed,
    baselineValidated,
  }
}

function buildActivityMetric(label: string, value: number) {
  return `
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;background:#f8fafc">
      <p style="margin:0;color:#64748b;font-size:11px">${label}</p>
      <p style="margin:4px 0 0;color:#0f172a;font-size:20px;font-weight:700">${value}</p>
    </div>`
}
