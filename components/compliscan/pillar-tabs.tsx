"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  dashboardSecondaryNavSections,
  isNavItemActive,
} from "@/components/compliscan/navigation"

type PillarTabsProps = {
  sectionId: "scanare" | "politici" | "partner" | string
  className?: string
}

export function PillarTabs({ sectionId, className }: PillarTabsProps) {
  const pathname = usePathname()
  const section = dashboardSecondaryNavSections.find((item) => item.id === sectionId)

  if (!section) return null

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <p className="text-[11px] font-medium font-mono uppercase tracking-[0.14em] text-eos-text-muted">
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
                  ? "border-eos-border-subtle bg-eos-surface-active text-eos-text"
                  : "border-eos-border-subtle bg-eos-surface text-eos-text-muted hover:bg-eos-secondary-hover"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <item.icon
                className={`size-3.5 ${
                  active ? "text-eos-text" : "text-eos-text-muted"
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
