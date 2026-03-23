import {
  dashboardPrimaryNavItems,
  portfolioNavItems,
  type DashboardNavItem,
  type DashboardNavSection,
} from "@/components/compliscan/navigation"
import type { UserMode, UserRole, WorkspaceMode } from "@/lib/server/auth"

export type AdaptiveNavSection = DashboardNavSection

export type AdaptiveNavContext = {
  userMode: UserMode | null
  workspaceMode: WorkspaceMode
  role: UserRole
}

const ORG_NAV_FULL: DashboardNavItem[] = [...dashboardPrimaryNavItems]
const ORG_NAV_VIEWER: DashboardNavItem[] = ORG_NAV_FULL.filter(
  (item) => item.id !== "scan" && item.id !== "settings"
)
const PORTFOLIO_NAV_ORG_TARGET: DashboardNavItem[] = portfolioNavItems.map((item) => ({
  ...item,
  workspaceModeTarget: "portfolio",
}))
const PORTFOLIO_NAV_ACTIVE: DashboardNavItem[] = portfolioNavItems.map((item) => ({
  ...item,
  workspaceModeTarget: undefined,
}))

export function canSwitchToPortfolio(userMode: UserMode | null) {
  return userMode === "partner"
}

export function getSidebarNavSections({
  userMode,
  workspaceMode,
  role,
}: AdaptiveNavContext): AdaptiveNavSection[] {
  if (userMode === "partner" && workspaceMode === "portfolio") {
    return [
      {
        id: "portfolio",
        label: "Portofoliu",
        items: PORTFOLIO_NAV_ACTIVE,
      },
    ]
  }

  if (userMode === "partner") {
    return [
      {
        id: "portfolio",
        label: "Portofoliu",
        items: PORTFOLIO_NAV_ORG_TARGET,
      },
      {
        id: "org",
        label: "Firma activa",
        items: ORG_NAV_FULL,
      },
    ]
  }

  if (role === "viewer") {
    return [
      {
        id: "org",
        label: "Flux principal",
        items: ORG_NAV_VIEWER,
      },
    ]
  }

  return [
    {
      id: "org",
      label: "Flux principal",
      items: ORG_NAV_FULL,
    },
  ]
}

export function getMobileNavItems({
  userMode,
  workspaceMode,
  role,
}: AdaptiveNavContext): DashboardNavItem[] {
  if (userMode === "partner" && workspaceMode === "portfolio") {
    return PORTFOLIO_NAV_ACTIVE
  }

  if (role === "viewer") {
    return ORG_NAV_VIEWER
  }

  return ORG_NAV_FULL
}
