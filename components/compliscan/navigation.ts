"use client"

import {
  BookOpen,
  Bot,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileSearch,
  Flag,
  FolderKanban,
  FolderOpen,
  GitPullRequestArrow,
  Home,
  Scan,
  Settings,
  ShieldAlert,
  ShieldPlus,
  Sparkles,
  TriangleAlert,
} from "lucide-react"

import { dashboardRouteGroups, dashboardRoutes } from "@/lib/compliscan/dashboard-routes"

export type DashboardNavId =
  | "home"
  | "scan"
  | "resolve"
  | "reports"
  | "settings"
  | "control"
  | "scanare"
  | "dovada"
  | "dashboard"
  | "scanari"
  | "documente"
  | "sisteme"
  | "checklists"
  | "alerte"
  | "auditorVault"
  | "rapoarte"
  | "setari"
  | "asistent"
  | "politici"
  | "auditLog"
  | "generator"
  | "conformitate"
  | "partner"
  | "nis2"
  | "agents"
  | "vendor-review"

export type DashboardNavItem = {
  id: DashboardNavId
  label: string
  href: string
  icon: typeof Scan
  description?: string
  matchers?: string[]
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
    id: "control",
    label: "Control",
    items: [
      { id: "sisteme", label: "Sisteme", href: "/dashboard/sisteme", icon: ShieldPlus },
      { id: "conformitate", label: "Conformitate AI", href: "/dashboard/conformitate", icon: CheckCircle2 },
      { id: "alerte", label: "Drift", href: "/dashboard/alerte", icon: TriangleAlert },
      { id: "nis2", label: "NIS2", href: "/dashboard/nis2", icon: ShieldAlert },
      { id: "agents", label: "Agenți", href: "/dashboard/agents", icon: Bot },
      { id: "vendor-review", label: "Vendor Review", href: "/dashboard/vendor-review", icon: GitPullRequestArrow },
    ],
  },
  {
    id: "partner",
    label: "Partner",
    items: [
      { id: "partner", label: "Dashboard multi-client", href: "/dashboard/partner", icon: Building2 },
    ],
  },
  {
    id: "dovada",
    label: "Dovada",
    items: [
      { id: "checklists", label: "Remediere", href: dashboardRoutes.resolve, icon: CheckCircle2 },
      {
        id: "auditorVault",
        label: "Auditor Vault",
        href: dashboardRoutes.auditorVault,
        icon: FolderKanban,
      },
      { id: "rapoarte", label: "Audit si export", href: dashboardRoutes.reports, icon: FileSearch },
      { id: "auditLog", label: "Log audit", href: dashboardRoutes.auditLog, icon: ClipboardList },
    ],
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
