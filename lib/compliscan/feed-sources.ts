// Faza 2 — TASK 4: External Feed Sources
// Converts external signals (legislation, ANSPDCP, SPV) into ActivityFeedItem format.
// Called from the dashboard to inject real-world events alongside internal activity.

import type { AppNotification } from "@/lib/server/notifications-store"
import type { ComplianceState, ScanFinding } from "@/lib/compliance/types"
import type { ApplicabilityTag } from "@/lib/compliance/applicability"
import { buildCockpitRecipe } from "@/lib/compliscan/finding-kernel"

// ── Types ────────────────────────────────────────────────────────────────────

export type ExternalFeedItem = {
  id: string
  eyebrow: string
  title: string
  detail: string
  dateISO: string
  tone: "default" | "success" | "warning"
  href?: string
  sourceType: "legislation" | "anspdcp" | "spv" | "anaf"
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
  state: ComplianceState
): ExternalFeedItem[] {
  const items: ExternalFeedItem[] = []
  const tags = state.applicability?.tags ?? []
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
        dateISO: new Date().toISOString(),
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
        dateISO: new Date().toISOString(),
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
        dateISO: new Date().toISOString(),
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
    ? ` Următorul control este programat pentru ${new Date(finding.nextMonitoringDateISO).toLocaleDateString("ro-RO")}.`
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
        href: `/dashboard/resolve/${finding.id}`,
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
        href: `/dashboard/resolve/${finding.id}`,
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
        href: `/dashboard/resolve/${finding.id}`,
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
        href: `/dashboard/resolve/${finding.id}`,
        sourceType: "anaf",
      }
    default:
      return null
  }
}
