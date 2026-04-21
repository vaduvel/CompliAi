export const dashboardRoutes = {
  home: "/dashboard",
  accountSettings: "/account/settings",
  scan: "/dashboard/scan",
  scanResultsBase: "/dashboard/scan/results",
  documents: "/dashboard/scan/history",
  documentsHub: "/dashboard/documente",
  resolve: "/dashboard/actiuni/remediere",
  resolveSupport: "/dashboard/actiuni/remediere/support",
  reviewCycles: "/dashboard/review",
  calendar: "/dashboard/calendar",
  aiSystems: "/dashboard/monitorizare/sisteme-ai",
  aiConformity: "/dashboard/monitorizare/conformitate",
  drifts: "/dashboard/monitorizare/alerte",
  nis2: "/dashboard/monitorizare/nis2",
  nis2Maturity: "/dashboard/monitorizare/nis2/maturitate",
  nis2Dnsc: "/dashboard/monitorizare/nis2/inregistrare-dnsc",
  agents: "/dashboard/agents",
  dsar: "/dashboard/dsar",
  ropa: "/dashboard/ropa",
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
  settings: "/dashboard/setari",
  settingsScheduledReports: "/dashboard/setari/scheduled-reports",
  settingsBilling: "/dashboard/setari/abonament",
  whistleblowing: "/dashboard/whistleblowing",
  dora: "/dashboard/dora",
} as const

export function dashboardScanResultsRoute(scanId: string) {
  return `${dashboardRoutes.scanResultsBase}/${scanId}`
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
  ],
  settings: [dashboardRoutes.settings, dashboardRoutes.settingsScheduledReports],
} as const

export function matchesDashboardRoute(pathname: string, matcher: string) {
  if (matcher === dashboardRoutes.home) return pathname === matcher
  return pathname === matcher || pathname.startsWith(`${matcher}/`)
}
