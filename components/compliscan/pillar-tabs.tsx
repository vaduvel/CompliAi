"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  dashboardSecondaryNavSections,
  isNavItemActive,
} from "@/components/compliscan/navigation"

type PillarTabsProps = {
  sectionId: "scanare" | "control" | "dovada"
  className?: string
}

export function PillarTabs({ sectionId, className }: PillarTabsProps) {
  const pathname = usePathname()
  const section = dashboardSecondaryNavSections.find((item) => item.id === sectionId)

  if (!section) return null

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-muted)]">
        {section.label}
      </p>
      <div className="flex flex-wrap gap-2">
        {section.items.map((item) => {
          const active = isNavItemActive(pathname, item)
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`ring-focus inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition ${
                active
                  ? "border-[var(--border-subtle)] bg-[var(--bg-active)] text-[var(--text-primary)]"
                  : "border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-on-surface-muted)] hover:bg-[var(--color-surface-hover)]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <item.icon
                className={`size-3.5 ${
                  active ? "text-[var(--text-primary)]" : "text-[var(--icon-secondary)]"
                }`}
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
