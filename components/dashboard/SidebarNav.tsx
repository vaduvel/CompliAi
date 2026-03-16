"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileTextIcon,
  LayoutDashboardIcon,
  PlugIcon,
  ScanIcon,
  SettingsIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/evidence-os/Button"

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
    comingSoon: false,
  },
  { label: "Scanare", href: "/dashboard/scanari", icon: ScanIcon, comingSoon: true },
  { label: "Audit si export", href: "/dashboard/rapoarte", icon: FileTextIcon, comingSoon: true },
  { label: "Integrări", href: "/dashboard", icon: PlugIcon, comingSoon: true },
  { label: "Setări", href: "/dashboard", icon: SettingsIcon, comingSoon: true },
] as const

export function SidebarNav({
  className,
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex flex-col gap-1 p-2", className)}>
      {navItems.map((item) => {
        const active = item.label === "Dashboard" && pathname === "/dashboard"

        const base =
          "w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
        const activeCls =
          "bg-eos-primary-soft text-eos-primary hover:bg-eos-primary-soft"
        const idleCls =
          "text-eos-text-muted hover:bg-eos-surface hover:text-eos-text"

        if (item.comingSoon) {
          return (
            <Button
              key={item.label}
              type="button"
              variant="ghost"
              className={cn(base, idleCls)}
              onClick={() => {
                onNavigate?.()
                toast.message("În curând", {
                  description: `${item.label} va fi disponibil(ă) în curând.`,
                })
              }}
            >
              <item.icon className="size-4 opacity-80" />
              <span className="flex-1 text-left">{item.label}</span>
              <span className="rounded-full border border-eos-border bg-eos-surface-variant px-2 py-0.5 text-[10px] text-eos-text-tertiary">
                În curând
              </span>
            </Button>
          )
        }

        return (
          <Button
            key={item.label}
            asChild
            variant="ghost"
            className={cn(base, active ? activeCls : idleCls)}
            onClick={onNavigate}
          >
            <Link href={item.href} aria-current={active ? "page" : undefined}>
              <item.icon className={cn("size-4", active ? "opacity-100" : "opacity-80")} />
              <span className="flex-1 text-left">{item.label}</span>
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}
