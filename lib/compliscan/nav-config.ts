import { Landmark, ShieldCheck } from "lucide-react"

import {
  dashboardPrimaryNavItems,
  portfolioNavItems,
  soloNavItems,
  type DashboardNavItem,
  type DashboardNavSection,
  viewerNavItems,
} from "@/components/compliscan/navigation"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import type { UserMode, UserRole, WorkspaceMode } from "@/lib/server/auth"

const MODULE_NAV_ITEMS: DashboardNavItem[] = [
  {
    id: "fiscal",
    label: "Fiscal",
    href: dashboardRoutes.fiscal,
    icon: Landmark,
    matchers: [dashboardRoutes.fiscal],
  },
  {
    id: "nis2",
    label: "NIS2",
    href: dashboardRoutes.nis2,
    icon: ShieldCheck,
    matchers: [dashboardRoutes.nis2, dashboardRoutes.nis2Maturity, dashboardRoutes.nis2Dnsc],
  },
]

export type AdaptiveNavSection = DashboardNavSection

export type AdaptiveNavContext = {
  userMode: UserMode | null
  workspaceMode: WorkspaceMode
  role: UserRole
}

const ORG_NAV_FULL: DashboardNavItem[] = [...dashboardPrimaryNavItems]
const ORG_NAV_SOLO: DashboardNavItem[] = [...soloNavItems]
const ORG_NAV_VIEWER: DashboardNavItem[] = [...viewerNavItems]
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
        label: "Firmă",
        items: ORG_NAV_FULL,
      },
      {
        id: "module",
        label: "Module conformitate",
        items: MODULE_NAV_ITEMS,
      },
    ]
  }

  if (userMode === "solo") {
    return [
      {
        id: "org",
        label: "Flux principal",
        items: ORG_NAV_SOLO,
      },
      {
        id: "module",
        label: "Module conformitate",
        items: MODULE_NAV_ITEMS,
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
    {
      id: "module",
      label: "Module conformitate",
      items: MODULE_NAV_ITEMS,
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

  if (userMode === "solo") {
    return ORG_NAV_SOLO
  }

  if (role === "viewer") {
    return ORG_NAV_VIEWER
  }

  return ORG_NAV_FULL
}
