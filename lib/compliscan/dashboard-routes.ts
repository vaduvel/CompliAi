export const dashboardRoutes = {
  home: "/dashboard",
  accountSettings: "/account/settings",
  scan: "/dashboard/scan",
  scanResultsBase: "/dashboard/scan/results",
  documents: "/dashboard/scan/history",
  documentsHub: "/dashboard/documente",
  resolve: "/dashboard/resolve",
  resolveSupport: "/dashboard/resolve/support",
  reviewCycles: "/dashboard/review",
  calendar: "/dashboard/calendar",
  aiSystems: "/dashboard/sisteme",
  aiConformity: "/dashboard/conformitate",
  drifts: "/dashboard/alerte",
  nis2: "/dashboard/nis2",
  nis2Maturity: "/dashboard/nis2/maturitate",
  nis2Dnsc: "/dashboard/nis2/inregistrare-dnsc",
  agents: "/dashboard/agents",
  dsar: "/dashboard/dsar",
  ropa: "/dashboard/ropa",
  breach: "/dashboard/breach",
  training: "/dashboard/training",
  fiscal: "/dashboard/fiscal",
  vendorReview: "/dashboard/vendor-review",
  payTransparency: "/dashboard/pay-transparency",
  // Dosar unificat — Wave 1 cleanup
  dosar: "/dashboard/dosar",
  // Păstrate pentru backward compat (accesibile din Dosar)
  reports: "/dashboard/reports",
  auditorVault: "/dashboard/reports/vault",
  auditLog: "/dashboard/reports/audit-log",
  policies: "/dashboard/reports/policies",
  trustCenter: "/dashboard/reports/trust-center",
  generator: "/dashboard/generator",
  approvals: "/dashboard/approvals",
  // S1.7 — Cabinet view pentru magic links trimise patroni (approve/reject/comment).
  magicLinks: "/dashboard/magic-links",
  // S1.1 — Cabinet templates upload (Markdown personalizat per documentType).
  cabinetTemplates: "/dashboard/cabinet/templates",
  settings: "/dashboard/settings",
  settingsScheduledReports: "/dashboard/settings/scheduled-reports",
  settingsBilling: "/dashboard/settings/abonament",
  whistleblowing: "/dashboard/whistleblowing",
  dora: "/dashboard/dora",
} as const

export function dashboardScanResultsRoute(scanId: string) {
  return `${dashboardRoutes.scanResultsBase}/${scanId}`
}

type DashboardRouteQueryValue = string | number | boolean | null | undefined
type DashboardRouteQuery = Record<string, DashboardRouteQueryValue>

function formatDashboardRouteQuery(query?: DashboardRouteQuery | URLSearchParams | string) {
  if (!query) return ""

  if (typeof query === "string") {
    const normalized = query.startsWith("?") ? query.slice(1) : query
    return normalized ? `?${normalized}` : ""
  }

  const params = query instanceof URLSearchParams ? new URLSearchParams(query) : new URLSearchParams()
  if (!(query instanceof URLSearchParams)) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined) continue
      params.set(key, String(value))
    }
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ""
}

export function dashboardFindingRoute(
  findingId: string,
  query?: DashboardRouteQuery | URLSearchParams | string
) {
  return `${dashboardRoutes.resolve}/${encodeURIComponent(findingId)}${formatDashboardRouteQuery(query)}`
}

export const dashboardRouteGroups = {
  home: [dashboardRoutes.home],
  scan: [dashboardRoutes.scan, dashboardRoutes.documents],
  resolve: [
    dashboardRoutes.resolve,
    dashboardRoutes.approvals,
    dashboardRoutes.reviewCycles,
    dashboardRoutes.calendar,
    dashboardRoutes.aiSystems,
    dashboardRoutes.drifts,
    dashboardRoutes.aiConformity,
    dashboardRoutes.nis2,
    dashboardRoutes.dsar,
    dashboardRoutes.breach,
    dashboardRoutes.training,
    dashboardRoutes.agents,
    dashboardRoutes.fiscal,
    dashboardRoutes.vendorReview,
    dashboardRoutes.payTransparency,
    dashboardRoutes.whistleblowing,
    dashboardRoutes.dora,
  ],
  // Dosar unificat — absoarbe toate output-urile
  dosar: [
    dashboardRoutes.dosar,
    dashboardRoutes.reports,
    dashboardRoutes.auditorVault,
    dashboardRoutes.auditLog,
    dashboardRoutes.policies,
    dashboardRoutes.trustCenter,
    dashboardRoutes.generator,
    dashboardRoutes.ropa,
    dashboardRoutes.vendorReview,
    dashboardRoutes.magicLinks,
    dashboardRoutes.cabinetTemplates,
  ],
  settings: [dashboardRoutes.settings, dashboardRoutes.settingsScheduledReports],
} as const

export function matchesDashboardRoute(pathname: string, matcher: string) {
  if (matcher === dashboardRoutes.home) return pathname === matcher
  return pathname === matcher || pathname.startsWith(`${matcher}/`)
}
