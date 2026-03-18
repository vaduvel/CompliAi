// V3 P1.2 — Compliance Health Check Periodic
// Detectează evaluări expirate, dovezi stale, review-uri întârziate și gap-uri de monitorizare.

import type { ComplianceState } from "@/lib/compliance/types"

export type HealthCheckStatus = "ok" | "warning" | "critical"

export type HealthCheckItem = {
  id: string
  title: string
  detail: string
  status: HealthCheckStatus
  action: string
  actionHref?: string
  daysOverdue?: number
}

export type HealthCheckResult = {
  overallStatus: HealthCheckStatus
  score: number          // 0-100, higher is healthier
  items: HealthCheckItem[]
  checkedAtISO: string
}

const MS_PER_DAY = 86_400_000

function daysSince(isoDate: string | undefined | null, nowMs: number): number | null {
  if (!isoDate) return null
  const d = new Date(isoDate).getTime()
  if (isNaN(d)) return null
  return Math.floor((nowMs - d) / MS_PER_DAY)
}

/**
 * Runs a periodic health check on the compliance state.
 * Checks for stale assessments, missing baselines, open drifts, unreviewed AI systems, etc.
 */
export function runHealthCheck(state: ComplianceState, nowISO: string): HealthCheckResult {
  const nowMs = new Date(nowISO).getTime()
  const items: HealthCheckItem[] = []

  // 1. Baseline validation
  if (!state.validatedBaselineSnapshotId) {
    items.push({
      id: "hc-baseline",
      title: "Baseline de conformitate nevalidat",
      detail: "Nu există un snapshot de referință validat. Fără baseline, drift-ul nu poate fi detectat corect.",
      status: "warning",
      action: "Validează un snapshot ca baseline",
      actionHref: "/dashboard/rapoarte",
    })
  } else {
    items.push({
      id: "hc-baseline",
      title: "Baseline validat",
      detail: "Snapshot-ul de referință este definit și activ.",
      status: "ok",
      action: "Verifică periodic",
    })
  }

  // 2. Recent scan check (last scan within 30 days)
  const scans = state.scans ?? []
  const latestScan = scans[0]
  const daysSinceLastScan = daysSince(latestScan?.scannedAtISO, nowMs)
  if (daysSinceLastScan === null || daysSinceLastScan > 30) {
    items.push({
      id: "hc-scan",
      title: "Niciun scan recent (>30 zile)",
      detail: `Ultimul scan a fost acum ${daysSinceLastScan ?? "N/A"} zile. Scanează periodic pentru a detecta noi finding-uri.`,
      status: "warning",
      action: "Rulează un scan nou",
      actionHref: "/dashboard/scanari",
      daysOverdue: daysSinceLastScan ? Math.max(0, daysSinceLastScan - 30) : undefined,
    })
  } else {
    items.push({
      id: "hc-scan",
      title: "Scan recent efectuat",
      detail: `Ultimul scan a fost acum ${daysSinceLastScan} zile.`,
      status: "ok",
      action: "Continuă să scanezi periodic",
    })
  }

  // 3. Open drifts older than 30 days
  const openDrifts = (state.driftRecords ?? []).filter((d) => d.open)
  const staleDrifts = openDrifts.filter((d) => {
    const age = daysSince(d.detectedAtISO, nowMs)
    return age !== null && age > 30
  })
  if (staleDrifts.length > 0) {
    items.push({
      id: "hc-drift",
      title: `${staleDrifts.length} drift${staleDrifts.length > 1 ? "-uri" : ""} deschis de >30 zile`,
      detail: "Drift-urile vechi neremediate indică probleme de conformitate neadresate.",
      status: "critical",
      action: "Investighează și rezolvă drift-urile stale",
      actionHref: "/dashboard/alerte",
      daysOverdue: Math.max(...staleDrifts.map((d) => Math.max(0, (daysSince(d.detectedAtISO, nowMs) ?? 0) - 30))),
    })
  } else if (openDrifts.length > 0) {
    items.push({
      id: "hc-drift",
      title: `${openDrifts.length} drift${openDrifts.length > 1 ? "-uri" : ""} deschise`,
      detail: "Drift-uri detectate — investighează în curând.",
      status: "warning",
      action: "Revizuiește drift-urile",
      actionHref: "/dashboard/alerte",
    })
  } else {
    items.push({
      id: "hc-drift",
      title: "Niciun drift deschis",
      detail: "Sistemul este aliniat cu baseline-ul validat.",
      status: "ok",
      action: "Menține monitorizarea drift-ului",
    })
  }

  // 4. AI systems without human review
  const aiSystems = state.aiSystems ?? []
  const noHumanReview = aiSystems.filter((s) => !s.hasHumanReview)
  if (noHumanReview.length > 0) {
    items.push({
      id: "hc-ai-review",
      title: `${noHumanReview.length} sistem${noHumanReview.length > 1 ? "e" : ""} AI fără supraveghere umană`,
      detail: "EU AI Act impune supraveghere umană pentru sistemele cu risc. Actualizează inventarul.",
      status: noHumanReview.some((s) => s.riskLevel === "high") ? "critical" : "warning",
      action: "Actualizează inventarul AI",
      actionHref: "/dashboard/sisteme",
    })
  } else if (aiSystems.length === 0) {
    items.push({
      id: "hc-ai-review",
      title: "Niciun sistem AI inventariat",
      detail: "Nu există sisteme AI în inventar. Verifică dacă organizația folosește sisteme AI.",
      status: "warning",
      action: "Adaugă sisteme AI în inventar",
      actionHref: "/dashboard/sisteme",
    })
  } else {
    items.push({
      id: "hc-ai-review",
      title: "Sisteme AI cu supraveghere umană activă",
      detail: `${aiSystems.length} sistem${aiSystems.length > 1 ? "e" : ""} AI inventariat${aiSystems.length > 1 ? "e" : ""}, toate cu supraveghere umană.`,
      status: "ok",
      action: "Revizuiește periodic",
    })
  }

  // 5. e-Factura connection
  if (!state.efacturaConnected) {
    items.push({
      id: "hc-efactura",
      title: "e-Factura neconectat la SPV ANAF",
      detail: "Integrarea cu SPV ANAF nu este activă. Semnalele de risc fiscal nu sunt monitorizate.",
      status: "warning",
      action: "Configurează integrarea e-Factura",
      actionHref: "/dashboard/setari",
    })
  } else {
    // Check if sync is stale (>7 days)
    const daysSinceSync = daysSince(state.efacturaSyncedAtISO, nowMs)
    if (daysSinceSync !== null && daysSinceSync > 7) {
      items.push({
        id: "hc-efactura",
        title: `Sync e-Factura neactualizat (${daysSinceSync} zile)`,
        detail: "Ultima sincronizare e-Factura a fost acum mai mult de 7 zile.",
        status: "warning",
        action: "Rulează sync e-Factura",
        actionHref: "/dashboard/rapoarte",
        daysOverdue: Math.max(0, daysSinceSync - 7),
      })
    } else {
      items.push({
        id: "hc-efactura",
        title: "e-Factura conectat și sincronizat",
        detail: "Integrarea SPV ANAF este activă.",
        status: "ok",
        action: "Monitorizează periodic",
      })
    }
  }

  // 6. High-risk findings without any evidence attached
  const highFindings = (state.findings ?? []).filter(
    (f) => f.severity === "critical" || f.severity === "high"
  )
  const taskState = state.taskState ?? {}
  const highWithoutEvidence = highFindings.filter((f) => {
    const ts = taskState[f.id]
    return !ts?.attachedEvidence && !ts?.attachedEvidenceMeta
  })
  if (highWithoutEvidence.length > 0) {
    items.push({
      id: "hc-evidence",
      title: `${highWithoutEvidence.length} finding-uri critice/high fără dovadă atașată`,
      detail: "Finding-urile critice fără dovadă de remediere nu pot fi considerate închise.",
      status: "critical",
      action: "Atașează dovezi la finding-urile critice",
      actionHref: "/dashboard/checklists",
    })
  } else if (highFindings.length > 0) {
    items.push({
      id: "hc-evidence",
      title: "Finding-uri critice/high au dovezi atașate",
      detail: `${highFindings.length} finding-ur${highFindings.length > 1 ? "i" : ""} high-severity cu dovezi.`,
      status: "ok",
      action: "Continuă atașarea de dovezi",
    })
  }

  // Calculate score
  const criticalCount = items.filter((i) => i.status === "critical").length
  const warningCount = items.filter((i) => i.status === "warning").length
  const okCount = items.filter((i) => i.status === "ok").length
  const total = items.length
  const score = total === 0 ? 100 : Math.round(((okCount + warningCount * 0.5) / total) * 100)

  const overallStatus: HealthCheckStatus =
    criticalCount > 0 ? "critical" : warningCount > 0 ? "warning" : "ok"

  return {
    overallStatus,
    score,
    items,
    checkedAtISO: nowISO,
  }
}
