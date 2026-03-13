"use client"

import Link from "next/link"
import type { DashboardNavItem } from "@/components/compliscan/navigation"
import { isNavItemActive } from "@/components/compliscan/navigation"

type MobileBottomNavProps = {
  items: readonly DashboardNavItem[]
  activeHref: string
}

export function MobileBottomNav({ items, activeHref }: MobileBottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[70] border-t border-[var(--color-border)] bg-[var(--bg-subtle)] px-6 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-between gap-3">
        {items.map((item) => {
          const active = isNavItemActive(activeHref, item)
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl border px-2 py-2 text-[11px] ${
                active
                  ? "border-[var(--border-subtle)] bg-[var(--bg-active)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--color-muted)]"
              }`}
            >
              <item.icon
                className={`size-5 ${active ? "text-[var(--text-primary)]" : "text-[var(--icon-secondary)]"}`}
                strokeWidth={2.25}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
