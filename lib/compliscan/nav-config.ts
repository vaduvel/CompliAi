import {
  BookOpen,
  CalendarClock,
  FolderInput,
  FileSearch,
  GraduationCap,
  Landmark,
  PlugZap,
  Send,
  ShieldAlert,
  ShieldCheck,
  ScanLine,
  Sparkles,
  UsersRound,
} from "lucide-react"

import {
  dashboardPrimaryNavItems,
  filterNavItemsByIcp,
  filterNavSectionsByIcp,
  portfolioNavItems,
  soloNavItems,
  type DashboardNavItem,
  type DashboardNavSection,
  viewerNavItems,
} from "@/components/compliscan/navigation"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import type { AccessMode, SubFlag } from "@/lib/compliscan/icp-modules"
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

// Cabinet-fiscal — instrumente specifice CECCAR.
// Sprint 0 (2026-05-11) — restructurare IA: 6 sub-secțiuni grupate pe workflow
// real al contabilului (validare → transmitere → monitorizare → corecție).
//
// Înainte: 10 tab-uri orizontale plate în /dashboard/fiscal (cognitive overload,
// regulă 7±2 violation, fără ierarhie).
// Acum: 6 sub-rute drill-down + Cockpit overview.
const FISCAL_TOOLS_NAV_ITEMS: DashboardNavItem[] = [
  {
    id: "fiscal",
    label: "Cockpit fiscal",
    href: dashboardRoutes.fiscalCockpit,
    icon: Landmark,
    matchers: [dashboardRoutes.fiscalCockpit],
  },
  {
    id: "fiscal-validation",
    label: "Validare & emitere",
    href: dashboardRoutes.fiscalValidation,
    icon: FileSearch,
    matchers: [dashboardRoutes.fiscalValidation],
  },
  {
    id: "fiscal-transmission",
    label: "Transmitere & SPV",
    href: dashboardRoutes.fiscalTransmission,
    icon: Send,
    matchers: [dashboardRoutes.fiscalTransmission],
  },
  {
    id: "fiscal-tva",
    label: "TVA & declarații",
    href: dashboardRoutes.fiscalTva,
    icon: ShieldCheck,
    matchers: [dashboardRoutes.fiscalTva],
  },
  {
    id: "fiscal-integrations",
    label: "Integrări ERP",
    href: dashboardRoutes.fiscalIntegrations,
    icon: PlugZap,
    matchers: [dashboardRoutes.fiscalIntegrations],
  },
  {
    id: "fiscal-deadlines",
    label: "Deadline urgent",
    href: dashboardRoutes.fiscalDeadlines,
    icon: CalendarClock,
    matchers: [dashboardRoutes.fiscalDeadlines],
  },
  {
    id: "agenti",
    label: "Agent fiscal AI",
    href: dashboardRoutes.agents,
    icon: Sparkles,
    matchers: [dashboardRoutes.agents],
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

export type AdaptiveNavSection = DashboardNavSection

export type AdaptiveNavContext = {
  userMode: UserMode | null
  workspaceMode: WorkspaceMode
  role: UserRole
  // Layer 3 ICP filtering — optional pentru backward compat
  icpSegment?: IcpSegment | null
  subFlag?: SubFlag | null
  accessMode?: AccessMode
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

// Cabinet-fiscal: rename portfolio items pentru context fiscal (Schimbări detectate
// → Semnale ANAF; Remediere clienți → Remedieri fiscal). Păstrăm href + id.
// Sprint cleanup fiscal-first (2026-05-11).
const FISCAL_PORTFOLIO_LABEL_OVERRIDES: Record<string, string> = {
  "portfolio-alerts": "Semnale ANAF & e-Factura",
  "portfolio-tasks": "Remedieri fiscal",
  "portfolio-reports": "Rapoarte fiscal",
}
function applyFiscalPortfolioLabels(items: DashboardNavItem[]): DashboardNavItem[] {
  return items.map((item) => {
    const override = FISCAL_PORTFOLIO_LABEL_OVERRIDES[item.id]
    return override ? { ...item, label: override } : item
  })
}

export function canSwitchToPortfolio(userMode: UserMode | null) {
  return userMode === "partner"
}

export function getSidebarNavSections({
  userMode,
  workspaceMode,
  role,
  icpSegment = null,
  subFlag = null,
  accessMode = "owner",
}: AdaptiveNavContext): AdaptiveNavSection[] {
  // Build base sections per userMode + workspaceMode + role (logic existing)
  const baseSections: AdaptiveNavSection[] = (() => {
    if (userMode === "partner" && workspaceMode === "portfolio") {
      const portfolioItems =
        icpSegment === "cabinet-fiscal"
          ? applyFiscalPortfolioLabels(PORTFOLIO_NAV_ACTIVE)
          : PORTFOLIO_NAV_ACTIVE
      return [
        {
          id: "portfolio",
          label: icpSegment === "cabinet-fiscal" ? "Portofoliu fiscal" : "Portofoliu",
          items: portfolioItems,
        },
      ]
    }

    if (userMode === "partner") {
      const portfolioOrgTargetItems =
        icpSegment === "cabinet-fiscal"
          ? applyFiscalPortfolioLabels(PORTFOLIO_NAV_ORG_TARGET)
          : PORTFOLIO_NAV_ORG_TARGET
      const base: AdaptiveNavSection[] = [
        {
          id: "portfolio",
          label: icpSegment === "cabinet-fiscal" ? "Portofoliu fiscal" : "Portofoliu",
          items: portfolioOrgTargetItems,
        },
        {
          id: "org",
          label: "Firma activa",
          items: ORG_NAV_FULL,
        },
      ]
      // Secțiunea de "Instrumente" se schimbă în funcție de ICP segment.
      // Înainte era hardcodat "Instrumente DPO" — incorect pentru cabinet-fiscal.
      if (icpSegment === "cabinet-fiscal") {
        base.push({
          id: "fiscal-tools",
          label: "Instrumente Fiscal",
          items: FISCAL_TOOLS_NAV_ITEMS,
        })
      } else if (icpSegment === "cabinet-dpo" || icpSegment === null) {
        // cabinet-dpo SAU onboarding incomplet (null) → fallback DPO existent
        base.push({
          id: "dpo",
          label: "Instrumente DPO",
          items: DPO_NAV_ITEMS,
        })
      }
      // Pentru alți segmenți partner (cabinet-hr etc.) — filterNavSectionsByIcp
      // se ocupă mai jos de eliminarea items neaplicabile.
      return base
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
  })()

  // Layer 3: Apply ICP filter if icpSegment is set.
  // null icpSegment = fallback safe (no filter — sidebar shows all base items).
  // Once user completes onboarding and icpSegment is populated, filter applies.
  if (icpSegment !== null || accessMode !== "owner") {
    return filterNavSectionsByIcp(baseSections, icpSegment, subFlag, accessMode)
  }

  return baseSections
}

export function getMobileNavItems({
  userMode,
  workspaceMode,
  role,
  icpSegment = null,
  subFlag = null,
  accessMode = "owner",
}: AdaptiveNavContext): DashboardNavItem[] {
  const baseItems: DashboardNavItem[] = (() => {
    if (userMode === "partner" && workspaceMode === "portfolio") {
      return icpSegment === "cabinet-fiscal"
        ? applyFiscalPortfolioLabels(PORTFOLIO_NAV_ACTIVE)
        : PORTFOLIO_NAV_ACTIVE
    }

    if (userMode === "solo") {
      return ORG_NAV_SOLO
    }

    if (role === "viewer") {
      return ORG_NAV_VIEWER
    }

    return ORG_NAV_FULL
  })()

  // Layer 3: Apply ICP filter if icpSegment is set.
  if (icpSegment !== null || accessMode !== "owner") {
    return filterNavItemsByIcp(baseItems, icpSegment, subFlag, accessMode)
  }

  return baseItems
}
