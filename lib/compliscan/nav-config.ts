import {
  BarChart3,
  BookOpen,
  CalendarClock,
  FolderInput,
  FileSearch,
  FileText,
  GraduationCap,
  Landmark,
  Layers,
  MessageSquare,
  Send,
  ShieldAlert,
  ShieldCheck,
  ScanLine,
  Sparkles,
  Tag,
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
import type { IcpSegment } from "@/lib/server/white-label"

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
    id: "dpia",
    label: "DPIA Art. 35",
    href: dashboardRoutes.dpia,
    icon: ScanLine,
    matchers: [dashboardRoutes.dpia],
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
    id: "generator",
    label: "Generator documente",
    href: dashboardRoutes.generator,
    icon: Sparkles,
    matchers: [dashboardRoutes.generator],
  },
  {
    id: "reports",
    label: "Rapoarte client",
    href: dashboardRoutes.reports,
    icon: FileSearch,
    matchers: [dashboardRoutes.reports],
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

// HR sidebar — Pay Transparency primary pentru icpSegment imm-hr / cabinet-hr
const HR_NAV_ITEMS: DashboardNavItem[] = [
  {
    id: "pt-overview",
    label: "Pay Transparency",
    href: dashboardRoutes.payTransparency,
    icon: BarChart3,
    matchers: [dashboardRoutes.payTransparency],
    description: "calculator gap + raport ITM",
  },
  {
    id: "pt-job-architecture",
    label: "Job architecture",
    href: dashboardRoutes.payTransparencyJobArchitecture,
    icon: Layers,
    matchers: [dashboardRoutes.payTransparencyJobArchitecture],
    description: "level × role × salary band",
  },
  {
    id: "pt-ranges",
    label: "Salary ranges",
    href: dashboardRoutes.payTransparencyRanges,
    icon: Tag,
    matchers: [dashboardRoutes.payTransparencyRanges],
    description: "generator anunțuri job",
  },
  {
    id: "pt-requests",
    label: "Cereri angajați",
    href: dashboardRoutes.payTransparencyRequests,
    icon: MessageSquare,
    matchers: [dashboardRoutes.payTransparencyRequests],
    description: "portal token + countdown 30 zile",
  },
  {
    id: "pt-reports",
    label: "Rapoarte ITM",
    href: dashboardRoutes.payTransparencyReports,
    icon: FileText,
    matchers: [dashboardRoutes.payTransparencyReports],
    description: "PDF descărcabil ITM-shaped",
  },
]

const HR_SUPPORT_ITEMS: DashboardNavItem[] = [
  {
    id: "documente",
    label: "Documente",
    href: dashboardRoutes.documents,
    icon: FolderInput,
    matchers: [dashboardRoutes.documents],
    description: "istoric documente",
  },
  {
    id: "settings",
    label: "Setări",
    href: dashboardRoutes.settings,
    icon: ShieldCheck,
    matchers: [dashboardRoutes.settings],
    description: "white-label + brand cabinet",
  },
]

const HR_PORTFOLIO_ITEMS: DashboardNavItem[] = [
  ...portfolioNavItems.map((item) => ({ ...item, workspaceModeTarget: undefined as WorkspaceMode | undefined })),
  {
    id: "portfolio-pay-transparency",
    label: "Pay Transparency clienți",
    href: "/portfolio/pay-transparency",
    icon: BarChart3,
    matchers: ["/portfolio/pay-transparency"],
    description: "cross-client gap heatmap",
  },
]

export type AdaptiveNavSection = DashboardNavSection

export type AdaptiveNavContext = {
  userMode: UserMode | null
  workspaceMode: WorkspaceMode
  role: UserRole
  // S3.4 — Pay Transparency pillar HR sidebar variant
  icpSegment?: IcpSegment | null
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
  icpSegment,
}: AdaptiveNavContext): AdaptiveNavSection[] {
  // S3.4 — HR Pay Transparency sidebar variant (icpSegment imm-hr / cabinet-hr)
  if (icpSegment === "cabinet-hr" && workspaceMode === "portfolio") {
    return [
      {
        id: "portfolio-hr",
        label: "Portofoliu HR",
        items: HR_PORTFOLIO_ITEMS,
      },
    ]
  }

  if (icpSegment === "cabinet-hr") {
    return [
      {
        id: "portfolio-hr",
        label: "Portofoliu HR",
        items: HR_PORTFOLIO_ITEMS.map((item) => ({ ...item, workspaceModeTarget: "portfolio" as WorkspaceMode })),
      },
      {
        id: "pay-transparency",
        label: "Pay Transparency",
        items: HR_NAV_ITEMS,
      },
      {
        id: "support",
        label: "Suport",
        items: HR_SUPPORT_ITEMS,
      },
    ]
  }

  if (icpSegment === "imm-hr") {
    return [
      {
        id: "pay-transparency",
        label: "Pay Transparency",
        items: HR_NAV_ITEMS,
      },
      {
        id: "support",
        label: "Suport",
        items: HR_SUPPORT_ITEMS,
      },
    ]
  }

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
  icpSegment,
}: AdaptiveNavContext): DashboardNavItem[] {
  // S3.4 — HR mobile nav: Pay Transparency primary
  if (icpSegment === "imm-hr" || icpSegment === "cabinet-hr") {
    return HR_NAV_ITEMS
  }

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
