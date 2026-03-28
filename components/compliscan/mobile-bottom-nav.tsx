"use client"

import Link from "next/link"
import type { DashboardNavItem } from "@/components/compliscan/navigation"
import { isNavItemActive } from "@/components/compliscan/navigation"

type MobileBottomNavProps = {
  items: readonly DashboardNavItem[]
  activeHref: string
  resolveBadgeCount?: number
  onSelectItem?: (item: DashboardNavItem) => boolean
}

export function MobileBottomNav({
  items,
  activeHref,
  resolveBadgeCount = 0,
  onSelectItem,
}: MobileBottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/[0.08] bg-[#0a0b0f]/90 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-between gap-2">
        {items.map((item) => {
          const active = isNavItemActive(activeHref, item)
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={(event) => {
                if (onSelectItem?.(item)) {
                  event.preventDefault()
                }
              }}
              className={`relative flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] transition-all duration-150 ${
                active
                  ? "bg-blue-500/[0.11] text-white shadow-[inset_0_2px_0_rgba(59,130,246,0.6)]"
                  : "text-white/40 hover:text-white/65"
              }`}
            >
              <item.icon
                className={`size-5 transition-colors duration-150 ${active ? "text-blue-400" : "text-white/35"}`}
                strokeWidth={2}
              />
              <span className={active ? "font-semibold" : "font-medium"}>{item.label}</span>
              {item.id === "resolve" && !active && resolveBadgeCount > 0 && (
                <span className="absolute -top-1 right-1 rounded-full bg-red-500/25 px-1.5 py-0.5 text-[9px] font-bold text-red-400">
                  {resolveBadgeCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
