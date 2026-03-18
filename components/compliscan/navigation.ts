"use client"

import {
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileSearch,
  FolderKanban,
  FolderOpen,
  GitPullRequestArrow,
  Scan,
  Settings,
  ShieldAlert,
  ShieldPlus,
  Sparkles,
  TriangleAlert,
} from "lucide-react"

export type DashboardNavId =
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
  matchers?: string[]
}

export type DashboardNavSection = {
  id: string
  label: string
  items: DashboardNavItem[]
}

export const dashboardPrimaryNavItems: DashboardNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    matchers: ["/dashboard"],
  },
  {
    id: "scanare",
    label: "Scanare",
    href: "/dashboard/scanari",
    icon: Scan,
    matchers: ["/dashboard/scanari", "/dashboard/documente"],
  },
  {
    id: "control",
    label: "Control",
    href: "/dashboard/sisteme",
    icon: ShieldPlus,
    matchers: ["/dashboard/sisteme", "/dashboard/alerte", "/dashboard/conformitate", "/dashboard/nis2", "/dashboard/agents", "/dashboard/vendor-review"],
  },
  {
    id: "dovada",
    label: "Dovada",
    href: "/dashboard/checklists",
    icon: FileSearch,
    matchers: ["/dashboard/checklists", "/dashboard/rapoarte"],
  },
  {
    id: "politici",
    label: "Politici",
    href: "/dashboard/politici",
    icon: BookOpen,
    matchers: ["/dashboard/politici", "/dashboard/generator"],
  },
  {
    id: "setari",
    label: "Setari",
    href: "/dashboard/setari",
    icon: Settings,
    matchers: ["/dashboard/setari"],
  },
] as const

export const dashboardSecondaryNavSections: DashboardNavSection[] = [
  {
    id: "scanare",
    label: "Scanare",
    items: [
      { id: "scanari", label: "Flux scanare", href: "/dashboard/scanari", icon: Scan },
      { id: "documente", label: "Documente", href: "/dashboard/documente", icon: FolderOpen },
    ],
  },
  {
    id: "politici",
    label: "Politici & Documente",
    items: [
      { id: "politici", label: "Politici interne", href: "/dashboard/politici", icon: BookOpen },
      { id: "generator", label: "Generator documente", href: "/dashboard/generator", icon: Sparkles },
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
      { id: "checklists", label: "Remediere", href: "/dashboard/checklists", icon: CheckCircle2 },
      {
        id: "auditorVault",
        label: "Auditor Vault",
        href: "/dashboard/rapoarte/auditor-vault",
        icon: FolderKanban,
      },
      { id: "rapoarte", label: "Audit si export", href: "/dashboard/rapoarte", icon: FileSearch },
      { id: "auditLog", label: "Log audit", href: "/dashboard/audit-log", icon: ClipboardList },
    ],
  },
] as const

export const mobileNavItems = [...dashboardPrimaryNavItems] as const

export function isRouteActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function isNavItemActive(pathname: string, item: DashboardNavItem) {
  if (item.matchers?.length) {
    return item.matchers.some((matcher) => isRouteActive(pathname, matcher))
  }

  return isRouteActive(pathname, item.href)
}
