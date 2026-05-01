import type { IcpSegment } from "@/lib/server/white-label"

export type OnboardingUserMode = "solo" | "partner" | "compliance" | "viewer"

export type OnboardingDestination = {
  clientHref: string
  serverHref: string
  submitLabel: string
  summaryLabel: string
  requiresPortfolioWorkspace: boolean
}

/**
 * Pay Transparency HR ICP-uri (imm-hr, cabinet-hr) au destination
 * dedicat /dashboard/pay-transparency, nu /dashboard/resolve.
 * Fallback la userMode pentru rest of ICPs (backward compatible).
 */
export function resolveOnboardingDestination(
  userMode: OnboardingUserMode | null | undefined,
  icpSegment?: IcpSegment | null,
): OnboardingDestination {
  // HR ICP override — Pay Transparency primary surface
  if (icpSegment === "imm-hr" || icpSegment === "cabinet-hr") {
    return {
      clientHref: "/dashboard/pay-transparency",
      serverHref: "/dashboard/pay-transparency",
      submitLabel: "Salvează și vezi Pay Transparency",
      summaryLabel: "modul Pay Transparency",
      requiresPortfolioWorkspace: icpSegment === "cabinet-hr",
    }
  }

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
        clientHref: "/dashboard/resolve",
        serverHref: "/dashboard/resolve",
        submitLabel: "Salvează și vezi cazurile deschise",
        summaryLabel: "cazurile de rezolvat",
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
