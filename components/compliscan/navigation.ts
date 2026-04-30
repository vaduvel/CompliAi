"use client"

import {
  Bell,
  BookOpen,
  Bot,
  Building2,
  CalendarClock,
  CheckCircle,
  FileSearch,
  Flag,
  FolderOpen,
  Home,
  Scan,
  Send,
  Settings,
  Shield,
  Sparkles,
} from "lucide-react"

import { dashboardRouteGroups, dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import type { WorkspaceMode } from "@/lib/server/auth"

export type DashboardNavId =
  | "home"
  | "scan"
  | "resolve"
  | "dosar"
  | "settings"
  // păstrate pentru backward compat (portfolio, secondary sections)
  | "calendar"
  | "reports"
  | "trust"
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
  | "whistleblowing"
  | "dora"
  | "dsar"
  | "dpia"
  | "vendor-review"
  | "breach"
  | "training"
  | "ropa"
  | "pay-transparency"
  | "approvals"
  | "magic-links"
  | "cabinet-templates"
  | "dpo-migration"
  | "review-cycles"
  | "scheduled-reports"
  | "agenti"
  | "fiscal"
  | "nis2"

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

// Wave 1 cleanup — 5 intrări, fără zgomot
export const dashboardPrimaryNavItems: DashboardNavItem[] = [
  {
    id: "home",
    label: "Acasă",
    href: dashboardRoutes.home,
    icon: Home,
    matchers: [...dashboardRouteGroups.home],
    description: "ce ai, ce s-a găsit, ce faci acum",
  },
  {
    id: "scan",
    label: "Scanează",
    href: dashboardRoutes.scan,
    icon: Scan,
    matchers: [...dashboardRouteGroups.scan],
    description: "adaugă surse, analizează, trimite în rezolvare",
  },
  {
    id: "resolve",
    label: "De rezolvat",
    href: dashboardRoutes.resolve,
    icon: Flag,
    matchers: [...dashboardRouteGroups.resolve],
    description: "rezolvă cazuri, dovedește, închide",
  },
  {
    id: "dosar",
    label: "Dosar",
    href: dashboardRoutes.dosar,
    icon: FolderOpen,
    matchers: [...dashboardRouteGroups.dosar],
    description: "dovezi, documente, exporturi",
  },
  {
    id: "settings",
    label: "Setări",
    href: dashboardRoutes.settings,
    icon: Settings,
    matchers: [...dashboardRouteGroups.settings],
    description: "workspace și acces",
  },
] as const

export const soloNavItems: DashboardNavItem[] = [
  {
    id: "home",
    label: "Acasă",
    href: dashboardRoutes.home,
    icon: Home,
    matchers: [...dashboardRouteGroups.home],
    description: "ce ai, ce s-a găsit, ce faci acum",
  },
  {
    id: "scan",
    label: "Scanează",
    href: dashboardRoutes.scan,
    icon: Scan,
    matchers: [...dashboardRouteGroups.scan],
    description: "adaugă surse, analizează, trimite în rezolvare",
  },
  {
    id: "resolve",
    label: "De rezolvat",
    href: dashboardRoutes.resolve,
    icon: Flag,
    matchers: [...dashboardRouteGroups.resolve],
    description: "rezolvă cazuri, dovedește, închide",
  },
  {
    id: "dosar",
    label: "Dosar",
    href: dashboardRoutes.dosar,
    icon: FolderOpen,
    matchers: [...dashboardRouteGroups.dosar],
    description: "dovezi, documente, exporturi",
  },
  {
    id: "settings",
    label: "Setări",
    href: dashboardRoutes.settings,
    icon: Settings,
    matchers: [...dashboardRouteGroups.settings],
    description: "workspace și acces",
  },
] as const

export const viewerNavItems: DashboardNavItem[] = [
  {
    id: "home",
    label: "Acasă",
    href: dashboardRoutes.home,
    icon: Home,
    matchers: [...dashboardRouteGroups.home],
    description: "status read-only",
  },
  {
    id: "resolve",
    label: "Taskurile mele",
    href: dashboardRoutes.resolve,
    icon: Flag,
    matchers: [...dashboardRouteGroups.resolve],
    description: "ce ai de revizuit",
  },
  {
    id: "documente",
    label: "Dosar",
    href: dashboardRoutes.dosar,
    icon: FolderOpen,
    matchers: [...dashboardRouteGroups.dosar],
    description: "read-only",
  },
  {
    id: "settings",
    label: "Setări",
    href: dashboardRoutes.settings,
    icon: Settings,
    matchers: [...dashboardRouteGroups.settings],
    description: "profil și acces",
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
      { id: "ropa", label: "Registru RoPA", href: dashboardRoutes.ropa, icon: FileSearch, matchers: [dashboardRoutes.ropa] },
      { id: "pay-transparency", label: "Pay Transparency", href: dashboardRoutes.payTransparency, icon: FileSearch, matchers: [dashboardRoutes.payTransparency] },
    ],
  },
  {
    id: "partner",
    label: "Partner",
    items: [
      { id: "partner", label: "Portofoliu firme", href: "/portfolio", icon: Building2 },
    ],
  },
  {
    id: "automatizare",
    label: "Automatizare",
    items: [
      { id: "approvals", label: "Aprobări", href: dashboardRoutes.approvals, icon: CheckCircle, matchers: [dashboardRoutes.approvals] },
      { id: "magic-links", label: "Magic links", href: dashboardRoutes.magicLinks, icon: Send, matchers: [dashboardRoutes.magicLinks] },
      { id: "cabinet-templates", label: "Template-uri cabinet", href: dashboardRoutes.cabinetTemplates, icon: BookOpen, matchers: [dashboardRoutes.cabinetTemplates] },
      { id: "review-cycles", label: "Review-uri", href: dashboardRoutes.reviewCycles, icon: CalendarClock, matchers: [dashboardRoutes.reviewCycles] },
      { id: "scheduled-reports", label: "Rapoarte programate", href: dashboardRoutes.settingsScheduledReports, icon: CalendarClock, matchers: [dashboardRoutes.settingsScheduledReports] },
      { id: "agenti", label: "Agenți AI", href: dashboardRoutes.agents, icon: Bot, matchers: [dashboardRoutes.agents] },
    ],
  },
  {
    id: "canale",
    label: "Canale conformitate",
    items: [
      { id: "whistleblowing", label: "Canal sesizări", href: dashboardRoutes.whistleblowing, icon: Flag, matchers: [dashboardRoutes.whistleblowing] },
      { id: "dora", label: "DORA", href: dashboardRoutes.dora, icon: Shield, matchers: [dashboardRoutes.dora] },
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
    label: "Schimbări detectate",
    href: "/portfolio/alerts",
    icon: Bell,
    matchers: ["/portfolio/alerts"],
    description: "alerte și schimbări detectate",
  },
  {
    id: "portfolio-tasks",
    label: "Remediere clienți",
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
