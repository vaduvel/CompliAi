"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, ClipboardList, FileSearch, ShieldCheck } from "lucide-react"

import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"

const REPORTS_TABS = [
  {
    id: "reports",
    label: "Rapoarte",
    href: dashboardRoutes.reports,
    matchers: [dashboardRoutes.reports],
    icon: FileSearch,
  },
  {
    id: "policies",
    label: "Politici interne",
    href: dashboardRoutes.policies,
    matchers: [dashboardRoutes.policies],
    icon: BookOpen,
  },
  {
    id: "audit-log",
    label: "Log Audit",
    href: dashboardRoutes.auditLog,
    matchers: [dashboardRoutes.auditLog],
    icon: ClipboardList,
  },
  {
    id: "trust-center",
    label: "Trust Center",
    href: dashboardRoutes.trustCenter,
    matchers: [dashboardRoutes.trustCenter],
    icon: ShieldCheck,
  },
] as const

export function ReportsTabs() {
  const pathname = usePathname()

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-muted">
        Rapoarte
      </p>
      <div className="flex flex-wrap gap-2">
        {REPORTS_TABS.map((item) => {
          const active = item.matchers.some(
            (matcher) => pathname === matcher || pathname.startsWith(`${matcher}/`)
          )

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`ring-focus inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition ${
                active
                  ? "border-eos-border-subtle bg-eos-surface-active text-eos-text"
                  : "border-eos-border-subtle bg-eos-surface text-eos-text-muted hover:bg-eos-secondary-hover"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <item.icon
                className={`size-3.5 ${active ? "text-eos-text" : "text-eos-text-muted"}`}
                strokeWidth={2.2}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
