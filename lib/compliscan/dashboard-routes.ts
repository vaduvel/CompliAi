export const dashboardRoutes = {
  home: "/dashboard",
  scan: "/dashboard/scan",
  scanLegacy: "/dashboard/scanari",
  scanResultsBase: "/dashboard/scan/results",
  documents: "/dashboard/documente",
  resolve: "/dashboard/resolve",
  resolveLegacy: "/dashboard/checklists",
  aiSystems: "/dashboard/sisteme",
  aiConformity: "/dashboard/conformitate",
  drifts: "/dashboard/alerte",
  nis2: "/dashboard/nis2",
  nis2Maturity: "/dashboard/nis2/maturitate",
  nis2Dnsc: "/dashboard/nis2/inregistrare-dnsc",
  agents: "/dashboard/agents",
  vendorReview: "/dashboard/vendor-review",
  reports: "/dashboard/reports",
  reportsLegacy: "/dashboard/rapoarte",
  auditorVault: "/dashboard/rapoarte/auditor-vault",
  auditLog: "/dashboard/audit-log",
  policies: "/dashboard/politici",
  generator: "/dashboard/generator",
  settings: "/dashboard/settings",
  settingsBilling: "/dashboard/settings/abonament",
  settingsLegacy: "/dashboard/setari",
  settingsBillingLegacy: "/dashboard/setari/abonament",
} as const

export function dashboardScanResultsRoute(scanId: string) {
  return `${dashboardRoutes.scanResultsBase}/${scanId}`
}

export const dashboardRouteGroups = {
  home: [dashboardRoutes.home],
  scan: [dashboardRoutes.scan, dashboardRoutes.scanLegacy, dashboardRoutes.documents],
  resolve: [
    dashboardRoutes.resolve,
    dashboardRoutes.resolveLegacy,
    dashboardRoutes.aiSystems,
    dashboardRoutes.drifts,
    dashboardRoutes.aiConformity,
    dashboardRoutes.nis2,
    dashboardRoutes.agents,
    dashboardRoutes.vendorReview,
  ],
  reports: [
    dashboardRoutes.reports,
    dashboardRoutes.reportsLegacy,
    dashboardRoutes.auditorVault,
    dashboardRoutes.auditLog,
    dashboardRoutes.policies,
    dashboardRoutes.generator,
  ],
  settings: [dashboardRoutes.settings, dashboardRoutes.settingsLegacy],
} as const

export function matchesDashboardRoute(pathname: string, matcher: string) {
  if (matcher === dashboardRoutes.home) return pathname === matcher
  return pathname === matcher || pathname.startsWith(`${matcher}/`)
}
