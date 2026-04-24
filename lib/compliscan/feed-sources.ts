// Faza 2 — TASK 4: External Feed Sources
// Converts external signals (legislation, ANSPDCP, SPV) into ActivityFeedItem format.
// Called from the dashboard to inject real-world events alongside internal activity.

import type { AppNotification } from "@/lib/server/notifications-store"
import type { ComplianceState, ScanFinding } from "@/lib/compliance/types"
import type { ApplicabilityTag } from "@/lib/compliance/applicability"
import { buildCockpitRecipe } from "@/lib/compliscan/finding-kernel"
import { dashboardFindingRoute } from "@/lib/compliscan/dashboard-routes"

const FEED_TIME_ZONE = "Europe/Bucharest"

const FEED_MONITORING_DATE_FORMATTER = new Intl.DateTimeFormat("ro-RO", {
  timeZone: FEED_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

// ── Types ────────────────────────────────────────────────────────────────────

export type ExternalFeedItem = {
  id: string
  eyebrow: string
  title: string
  detail: string
  dateISO: string
  tone: "default" | "success" | "warning"
  href?: string
  sourceType: "legislation" | "anspdcp" | "spv" | "anaf" | "system"
}

function formatFeedMonitoringDate(iso: string) {
  return FEED_MONITORING_DATE_FORMATTER.format(new Date(iso))
}

function resolveStableFeedNowISO(
  state: ComplianceState,
  explicitNowISO?: string
) : string {
  if (explicitNowISO) return explicitNowISO

  return (
    state.snapshotHistory?.[0]?.generatedAt ||
    state.events?.[0]?.createdAtISO ||
    state.scans?.[0]?.createdAtISO ||
    state.generatedDocuments?.[0]?.generatedAtISO ||
    state.findings?.[0]?.findingStatusUpdatedAtISO ||
    state.findings?.[0]?.createdAtISO ||
    state.siteScan?.scannedAtISO ||
    state.intakeCompletedAtISO ||
    state.shadowAiCompletedAtISO ||
    state.efacturaSyncedAtISO ||
    "2026-01-01T00:00:00.000Z"
  )
}

// ── Legislation relevance filter ────────────────────────────────────────────

type Framework = "GDPR" | "NIS2" | "EFACTURA"

const TAG_MAP: Record<Framework, ApplicabilityTag | null> = {
  GDPR: null,       // GDPR applies to all
  NIS2: "nis2",
  EFACTURA: "efactura",
}

export function isLegislationRelevant(
  framework: Framework,
  tags: ApplicabilityTag[]
): boolean {
  if (framework === "GDPR") return true
  const requiredTag = TAG_MAP[framework]
  if (!requiredTag) return true
  return tags.includes(requiredTag)
}

// ── Notification → Feed Items ───────────────────────────────────────────────

export function buildExternalFeedItems(
  notifications: AppNotification[],
  state: ComplianceState,
  nowISO?: string
): ExternalFeedItem[] {
  const items: ExternalFeedItem[] = []
  const tags = state.applicability?.tags ?? []
  const stableNowISO = resolveStableFeedNowISO(state, nowISO)
  const monitoredFiscalItems = buildFiscalMonitoringFeedItems(state)

  items.push(...monitoredFiscalItems)

  // 1. Legislation change notifications → feed items (Tip 2 + Tip 3)
  for (const notif of notifications) {
    if (notif.title.startsWith("Schimbare legislativă:")) {
      const sursa = notif.title.replace("Schimbare legislativă: ", "")
      const isAnspdcp = sursa === "ANSPDCP"

      items.push({
        id: `ext-legis-${notif.id}`,
        eyebrow: isAnspdcp ? "ANSPDCP" : "Radar legislativ",
        title: isAnspdcp
          ? `ANSPDCP: comunicat nou detectat`
          : `Schimbare legislativă: ${sursa}`,
        detail: notif.message,
        dateISO: notif.createdAt,
        tone: "warning",
        href: isAnspdcp ? "/dashboard/resolve" : "/dashboard/scan",
        sourceType: isAnspdcp ? "anspdcp" : "legislation",
      })
    }

    // ANAF fiscal signals → feed items (Tip 4 partial)
    if (notif.type === "anaf_signal" || notif.type === "fiscal_alert") {
      items.push({
        id: `ext-anaf-${notif.id}`,
        eyebrow: "ANAF",
        title: notif.title,
        detail: notif.message,
        dateISO: notif.createdAt,
        tone: "warning",
        href: notif.linkTo ?? "/dashboard/fiscal",
        sourceType: "anaf",
      })
    }
  }

  // 2. SPV / eFactura signal differentiation (Tip 4)
  if (state.efacturaConnected) {
    const hasRejected = state.efacturaSignalsCount > 0
    const findingsWithSpv = (state.findings ?? []).filter(
      (f: ScanFinding) =>
        f.id.startsWith("site-") === false &&
        f.category === "E_FACTURA" &&
        f.findingStatus !== "under_monitoring" &&
        f.findingStatus !== "resolved" &&
        f.findingStatus !== "dismissed"
    )
    const hasOpenEfacturaFindings = findingsWithSpv.length > 0

    if ((hasRejected || hasOpenEfacturaFindings) && monitoredFiscalItems.length === 0) {
      items.push({
        id: "ext-spv-warning",
        eyebrow: "SPV ANAF",
        title: `Am detectat ${state.efacturaSignalsCount} semnale eFactura active`,
        detail: hasOpenEfacturaFindings
          ? `Există ${findingsWithSpv.length} finding-uri deschise legate de facturare electronică. Verifică înainte de termenul de 5 zile.`
          : "Verifică factura respinsă sau cu status neclar pe SPV.",
        dateISO: stableNowISO,
        tone: "warning",
        href: "/dashboard/fiscal",
        sourceType: "spv",
      })
    } else if (monitoredFiscalItems.length === 0) {
      items.push({
        id: "ext-spv-ok",
        eyebrow: "SPV ANAF",
        title: "Am verificat SPV-ul — nicio factură respinsă",
        detail: "Toate facturile sunt preluate corect. Continuăm monitorizarea automată.",
        dateISO: stableNowISO,
        tone: "success",
        href: "/dashboard/fiscal",
        sourceType: "spv",
      })
    }
  }

  // 3. NIS2 eligibility awareness (from TASK 8 — if applicable, surface in feed)
  if (tags.includes("nis2" as ApplicabilityTag)) {
    const nis2Findings = (state.findings ?? []).filter(
      (f: ScanFinding) => f.category === "NIS2" && f.findingStatus !== "resolved" && f.findingStatus !== "dismissed"
    )
    if (nis2Findings.length > 0) {
      items.push({
        id: "ext-nis2-awareness",
        eyebrow: "NIS2",
        title: `${nis2Findings.length} obligații NIS2 deschise`,
        detail: "Termenul de înregistrare la DNSC era septembrie 2025. Verifică statusul evaluării.",
        dateISO: stableNowISO,
        tone: "warning",
        href: "/dashboard/nis2",
        sourceType: "legislation",
      })
    }
  }

  return items
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
    .slice(0, 5)
}

function buildFiscalMonitoringFeedItems(state: ComplianceState): ExternalFeedItem[] {
  return (state.findings ?? [])
    .filter(
      (finding) =>
        finding.category === "E_FACTURA" &&
        finding.findingStatus === "under_monitoring"
    )
    .map((finding) => buildFiscalMonitoringFeedItem(finding))
    .filter((item): item is ExternalFeedItem => Boolean(item))
}

function buildFiscalMonitoringFeedItem(finding: ScanFinding): ExternalFeedItem | null {
  const recipe = buildCockpitRecipe(finding)
  const nextControlLabel = finding.nextMonitoringDateISO
    ? ` Următorul control este programat pentru ${formatFeedMonitoringDate(finding.nextMonitoringDateISO)}.`
    : ""
  const mainSignal =
    recipe.monitoringSignals.find((signal) => !signal.startsWith("Următor control la")) ??
    recipe.monitoringSignals[0] ??
    "Cazul rămâne sub watch fiscal."

  switch (recipe.findingTypeId) {
    case "EF-001":
      return {
        id: `ext-fiscal-monitor-${finding.id}`,
        eyebrow: "SPV ANAF",
        title: "Reverificăm SPV-ul firmei",
        detail: `${mainSignal}${nextControlLabel}`.trim(),
        dateISO: finding.nextMonitoringDateISO ?? finding.findingStatusUpdatedAtISO ?? finding.createdAtISO,
        tone: "warning",
        href: recipe.workflowLink?.href ?? `/dashboard/fiscal?tab=spv&findingId=${finding.id}`,
        sourceType: "spv",
      }
    case "EF-003":
      return {
        id: `ext-fiscal-monitor-${finding.id}`,
        eyebrow: "e-Factura",
        title: "Reverificăm factura retransmisă",
        detail: `${mainSignal}${nextControlLabel}`.trim(),
        dateISO: finding.nextMonitoringDateISO ?? finding.findingStatusUpdatedAtISO ?? finding.createdAtISO,
        tone: "warning",
        href: dashboardFindingRoute(finding.id),
        sourceType: "anaf",
      }
    case "EF-004":
      return {
        id: `ext-fiscal-monitor-${finding.id}`,
        eyebrow: "e-Factura",
        title: "Verificăm dacă factura a ieșit din prelucrare",
        detail: `${mainSignal}${nextControlLabel}`.trim(),
        dateISO: finding.nextMonitoringDateISO ?? finding.findingStatusUpdatedAtISO ?? finding.createdAtISO,
        tone: "warning",
        href: dashboardFindingRoute(finding.id),
        sourceType: "anaf",
      }
    case "EF-005":
      return {
        id: `ext-fiscal-monitor-${finding.id}`,
        eyebrow: "e-Factura",
        title: "Verificăm confirmarea transmiterii în SPV",
        detail: `${mainSignal}${nextControlLabel}`.trim(),
        dateISO: finding.nextMonitoringDateISO ?? finding.findingStatusUpdatedAtISO ?? finding.createdAtISO,
        tone: "warning",
        href: dashboardFindingRoute(finding.id),
        sourceType: "anaf",
      }
    case "EF-006":
      return {
        id: `ext-fiscal-monitor-${finding.id}`,
        eyebrow: "e-Factura",
        title: "Verificăm factura după corecția datelor clientului",
        detail: `${mainSignal}${nextControlLabel}`.trim(),
        dateISO: finding.nextMonitoringDateISO ?? finding.findingStatusUpdatedAtISO ?? finding.createdAtISO,
        tone: "warning",
        href: dashboardFindingRoute(finding.id),
        sourceType: "anaf",
      }
    default:
      return null
  }
}

// ── Sprint 8 — Ce am verificat pentru tine ──────────────────────────────────

/**
 * Generează itemi proactivi de tip "Ce am verificat pentru tine".
 * Apar în feed chiar dacă nu există probleme — oferă liniște utilizatorului
 * că sistemul lucrează în fundal. Mereu 2-3 items bazate pe starea curentă.
 */
export function buildProactiveSystemChecks(
  state: ComplianceState,
  score: number,
  redAlerts: number,
  nowISO?: string
): ExternalFeedItem[] {
  const items: ExternalFeedItem[] = []
  const now = resolveStableFeedNowISO(state, nowISO)
  const tags = state.applicability?.tags ?? []

  // 1. Scoring de conformitate
  const scoreTone: ExternalFeedItem["tone"] =
    score >= 70 ? "success" : score >= 50 ? "default" : "warning"
  const scoreDetail =
    redAlerts > 0
      ? `Scorul tău este ${score}% cu ${redAlerts} alerte critice. Fiecare finding rezolvat adaugă puncte.`
      : score >= 70
        ? `Scorul tău este ${score}% — peste pragul recomandat. Continuăm monitorizarea automată.`
        : `Scorul tău este ${score}% — sub 70%. Prioritizează finding-urile deschise pentru a avansa.`
  items.push({
    id: "sys-check-score",
    eyebrow: "Ce am verificat",
    title: `Am verificat scoring-ul de conformitate — ${score}%`,
    detail: scoreDetail,
    dateISO: now,
    tone: scoreTone,
    href: "/dashboard",
    sourceType: "system",
  })

  // 2. Conformitate GDPR
  const gdpr = state.gdprProgress ?? 0
  const gdprTone: ExternalFeedItem["tone"] = gdpr >= 70 ? "success" : gdpr >= 40 ? "default" : "warning"
  const gdprDetail =
    gdpr >= 70
      ? `GDPR la ${gdpr}% — acoperire satisfăcătoare. Documentele cheie sunt prezente în workspace.`
      : gdpr >= 40
        ? `GDPR la ${gdpr}% — există documente sau proceduri lipsă. Verifică finding-urile GDPR active.`
        : `GDPR la ${gdpr}% — nivel de risc ridicat. Prioritizează politicile de bază (cookie, privacy).`
  items.push({
    id: "sys-check-gdpr",
    eyebrow: "Ce am verificat",
    title: `Am verificat conformitatea GDPR — ${gdpr}%`,
    detail: gdprDetail,
    dateISO: now,
    tone: gdprTone,
    href: "/dashboard/rapoarte",
    sourceType: "system",
  })

  // 3. Drift-uri (dacă există drift-uri active)
  const openDrifts = (state.driftRecords ?? []).filter((d) => d.open)
  if (openDrifts.length > 0) {
    const criticalDrifts = openDrifts.filter((d) => d.severity === "critical" || d.severity === "high")
    items.push({
      id: "sys-check-drift",
      eyebrow: "Ce am verificat",
      title:
        criticalDrifts.length > 0
          ? `Am detectat ${criticalDrifts.length} modificări critice față de baseline`
          : `Am verificat drift-urile — ${openDrifts.length} modificări de urmărit`,
      detail:
        criticalDrifts.length > 0
          ? "Modificările critice pot afecta conformitatea. Verifică și confirmă sau respinge fiecare drift."
          : "Modificările detectate nu sunt critice, dar necesită confirmare pentru a menține baseline-ul.",
      dateISO: now,
      tone: criticalDrifts.length > 0 ? "warning" : "default",
      href: "/dashboard/rapoarte",
      sourceType: "system",
    })
  } else if (tags.includes("nis2" as ApplicabilityTag)) {
    // NIS2 steady-state check when no drifts
    items.push({
      id: "sys-check-nis2-stable",
      eyebrow: "Ce am verificat",
      title: "Am verificat statutul NIS2 — niciun drift critic detectat",
      detail: "Configurația NIS2 nu s-a modificat față de ultimul snapshot. Continui monitorizarea săptămânală.",
      dateISO: now,
      tone: "success",
      href: "/dashboard/nis2",
      sourceType: "system",
    })
  }

  return items
}
