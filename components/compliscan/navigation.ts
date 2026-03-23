"use client"

import {
  Bell,
  BookOpen,
  Building2,
  FileSearch,
  Flag,
  FolderOpen,
  Home,
  Scan,
  Settings,
  Sparkles,
} from "lucide-react"

import { dashboardRouteGroups, dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import type { WorkspaceMode } from "@/lib/server/auth"

export type DashboardNavId =
  | "home"
  | "scan"
  | "resolve"
  | "reports"
  | "settings"
  | "portfolio-overview"
  | "portfolio-alerts"
  | "portfolio-tasks"
  | "portfolio-vendors"
  | "portfolio-reports"
  | "scanare"
  | "scanari"
  | "documente"
  | "politici"
  | "generator"
  | "partner"

export type DashboardNavItem = {
  id: DashboardNavId
  label: string
  href: string
  icon: typeof Scan
  description?: string
  matchers?: string[]
  workspaceModeTarget?: WorkspaceMode
}

export type DashboardNavSection = {
  id: string
  label: string
  items: DashboardNavItem[]
}

export const dashboardPrimaryNavItems: DashboardNavItem[] = [
  {
    id: "home",
    label: "Acasă",
    href: dashboardRoutes.home,
    icon: Home,
    matchers: [...dashboardRouteGroups.home],
    description: "stare, urgențe și pasul curent",
  },
  {
    id: "scan",
    label: "Scanează",
    href: dashboardRoutes.scan,
    icon: Scan,
    matchers: [...dashboardRouteGroups.scan],
    description: "surse, rezultate și istoric",
  },
  {
    id: "resolve",
    label: "De rezolvat",
    href: dashboardRoutes.resolve,
    icon: Flag,
    matchers: [...dashboardRouteGroups.resolve],
    description: "findings, drift și acțiuni",
  },
  {
    id: "reports",
    label: "Rapoarte",
    href: dashboardRoutes.reports,
    icon: FileSearch,
    matchers: [...dashboardRouteGroups.reports],
    description: "dovezi, politici și export",
  },
  {
    id: "settings",
    label: "Setări",
    href: dashboardRoutes.settings,
    icon: Settings,
    matchers: [...dashboardRouteGroups.settings],
    description: "workspace, acces și operațional",
  },
] as const

export const dashboardSecondaryNavSections: DashboardNavSection[] = [
  {
    id: "scanare",
    label: "Scanare",
    items: [
      { id: "scanari", label: "Flux scanare", href: dashboardRoutes.scan, icon: Scan },
      {
        id: "documente",
        label: "Istoric",
        href: dashboardRoutes.documents,
        icon: FolderOpen,
        matchers: [dashboardRoutes.documents],
      },
    ],
  },
  {
    id: "politici",
    label: "Documente asistate",
    items: [
      { id: "politici", label: "Politici interne", href: dashboardRoutes.policies, icon: BookOpen },
      { id: "generator", label: "Drafturi asistate", href: dashboardRoutes.generator, icon: Sparkles },
    ],
  },
  {
    id: "partner",
    label: "Partner",
    items: [
      { id: "partner", label: "Dashboard multi-client", href: "/dashboard/partner", icon: Building2 },
    ],
  },
] as const

export const portfolioNavItems: DashboardNavItem[] = [
  {
    id: "portfolio-overview",
    label: "Portofoliu",
    href: "/portfolio",
    icon: Building2,
    matchers: ["/portfolio"],
    description: "stare agregată pe toate firmele",
  },
  {
    id: "portfolio-alerts",
    label: "Alerte",
    href: "/portfolio/alerts",
    icon: Bell,
    matchers: ["/portfolio/alerts"],
    description: "toate alertele active",
  },
  {
    id: "portfolio-tasks",
    label: "Remediere",
    href: "/portfolio/tasks",
    icon: Flag,
    matchers: ["/portfolio/tasks"],
    description: "taskuri deschise cross-client",
  },
  {
    id: "portfolio-vendors",
    label: "Furnizori",
    href: "/portfolio/vendors",
    icon: FolderOpen,
    matchers: ["/portfolio/vendors"],
    description: "vendori și review-uri comune",
  },
  {
    id: "portfolio-reports",
    label: "Rapoarte",
    href: "/portfolio/reports",
    icon: FileSearch,
    matchers: ["/portfolio/reports"],
    description: "metadata și livrabile pe portofoliu",
  },
] as const

export const mobileNavItems = [...dashboardPrimaryNavItems] as const

export function isRouteActive(pathname: string, href: string) {
  if (href === dashboardRoutes.home) return pathname === dashboardRoutes.home
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function isNavItemActive(pathname: string, item: DashboardNavItem) {
  if (item.matchers?.length) {
    return item.matchers.some((matcher) => isRouteActive(pathname, matcher))
  }

  return isRouteActive(pathname, item.href)
}
