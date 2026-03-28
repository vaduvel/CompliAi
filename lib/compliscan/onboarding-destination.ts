export type OnboardingUserMode = "solo" | "partner" | "compliance" | "viewer"

export type OnboardingDestination = {
  clientHref: string
  serverHref: string
  submitLabel: string
  summaryLabel: string
  requiresPortfolioWorkspace: boolean
}

export function resolveOnboardingDestination(
  userMode: OnboardingUserMode | null | undefined
): OnboardingDestination {
  switch (userMode) {
    case "partner":
      return {
        clientHref: "/portfolio",
        serverHref: "/dashboard/partner",
        submitLabel: "Salvează și vezi portofoliul",
        summaryLabel: "portofoliul de clienți",
        requiresPortfolioWorkspace: true,
      }
    case "compliance":
      return {
        clientHref: "/dashboard",
        serverHref: "/dashboard",
        submitLabel: "Salvează și vezi dashboard-ul",
        summaryLabel: "dashboard-ul operațional",
        requiresPortfolioWorkspace: false,
      }
    case "viewer":
      return {
        clientHref: "/dashboard",
        serverHref: "/dashboard",
        submitLabel: "Salvează și vezi dashboard-ul",
        summaryLabel: "dashboard-ul",
        requiresPortfolioWorkspace: false,
      }
    case "solo":
    default:
      return {
        clientHref: "/dashboard/resolve",
        serverHref: "/dashboard/resolve",
        submitLabel: "Salvează și vezi snapshot-ul",
        summaryLabel: "snapshot-ul de riscuri",
        requiresPortfolioWorkspace: false,
      }
  }
}
