"use client"

import {
  BarChart3,
  CheckCircle2,
  FileSearch,
  FolderKanban,
  FolderOpen,
  MessageSquareMore,
  Scan,
  Settings,
  ShieldPlus,
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
    id: "scanare",
    label: "Scanare",
    href: "/dashboard/scanari",
    icon: Scan,
    matchers: ["/dashboard/scanari", "/dashboard/documente"],
  },
  {
    id: "control",
    label: "Control",
    href: "/dashboard",
    icon: ShieldPlus,
    matchers: ["/dashboard", "/dashboard/sisteme", "/dashboard/alerte", "/dashboard/setari", "/dashboard/asistent"],
  },
  {
    id: "dovada",
    label: "Dovada",
    href: "/dashboard/checklists",
    icon: FileSearch,
    matchers: ["/dashboard/checklists", "/dashboard/rapoarte"],
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
    id: "control",
    label: "Control",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: BarChart3 },
      { id: "sisteme", label: "Sisteme AI", href: "/dashboard/sisteme", icon: ShieldPlus },
      { id: "alerte", label: "Alerte", href: "/dashboard/alerte", icon: TriangleAlert },
      { id: "setari", label: "Setari", href: "/dashboard/setari", icon: Settings },
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
      { id: "asistent", label: "Asistent", href: "/dashboard/asistent", icon: MessageSquareMore },
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
