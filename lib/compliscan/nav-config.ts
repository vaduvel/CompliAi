import {
  BookOpen,
  CalendarClock,
  FolderInput,
  FileSearch,
  GraduationCap,
  Landmark,
  Send,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
} from "lucide-react"

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

const DPO_NAV_ITEMS: DashboardNavItem[] = [
  {
    id: "dsar",
    label: "DSAR",
    href: dashboardRoutes.dsar,
    icon: UsersRound,
    matchers: [dashboardRoutes.dsar],
  },
  {
    id: "ropa",
    label: "RoPA Art. 30",
    href: dashboardRoutes.ropa,
    icon: FileSearch,
    matchers: [dashboardRoutes.ropa],
  },
  {
    id: "vendor-review",
    label: "DPA furnizori",
    href: dashboardRoutes.vendorReview,
    icon: ShieldCheck,
    matchers: [dashboardRoutes.vendorReview],
  },
  {
    id: "breach",
    label: "Breach ANSPDCP",
    href: dashboardRoutes.breach,
    icon: ShieldAlert,
    matchers: [dashboardRoutes.breach, "/dashboard/incidente", dashboardRoutes.nis2],
  },
  {
    id: "calendar",
    label: "Calendar termene",
    href: dashboardRoutes.calendar,
    icon: CalendarClock,
    matchers: [dashboardRoutes.calendar],
  },
  {
    id: "magic-links",
    label: "Aprobări client",
    href: dashboardRoutes.magicLinks,
    icon: Send,
    matchers: [dashboardRoutes.magicLinks, dashboardRoutes.approvals],
  },
  {
    id: "cabinet-templates",
    label: "Template-uri",
    href: dashboardRoutes.cabinetTemplates,
    icon: BookOpen,
    matchers: [dashboardRoutes.cabinetTemplates],
  },
  {
    id: "dpo-migration",
    label: "Migrare istoric",
    href: dashboardRoutes.dpoMigration,
    icon: FolderInput,
    matchers: [dashboardRoutes.dpoMigration],
  },
  {
    id: "training",
    label: "Training GDPR",
    href: dashboardRoutes.training,
    icon: GraduationCap,
    matchers: [dashboardRoutes.training],
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
        label: "Firma activa",
        items: ORG_NAV_FULL,
      },
      {
        id: "dpo",
        label: "Instrumente DPO",
        items: DPO_NAV_ITEMS,
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
