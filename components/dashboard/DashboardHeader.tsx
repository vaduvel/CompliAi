"use client"

import * as React from "react"

import { ModeToggle } from "@/components/mode-toggle"
import { Avatar, AvatarFallback } from "@/components/evidence-os/Avatar"
import { Badge } from "@/components/evidence-os/Badge"
import { Separator } from "@/components/evidence-os/Separator"
import { BrandMark } from "@/components/dashboard/BrandMark"
import { RiskScoreCircle } from "@/components/dashboard/RiskScoreCircle"

export function DashboardHeader({
  mobileNavTrigger,
}: {
  mobileNavTrigger?: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-zinc-950/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/55">
      <div className="flex w-full items-center gap-3 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="md:hidden">{mobileNavTrigger}</div>
          <div className="block">
            <BrandMark size="sm" />
          </div>
          <div className="hidden md:grid">
            <Avatar className="size-9 border border-zinc-800/70 bg-zinc-950">
              <AvatarFallback className="bg-zinc-900 text-zinc-200">
                IP
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-zinc-100">
              Ion Popescu - Magazin Online
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <Badge className="border border-emerald-500/25 bg-emerald-500/10 text-emerald-200">
                Dashboard
              </Badge>
              <span className="hidden text-xs text-zinc-400 sm:inline">
                Recomandare AI · verifică uman
              </span>
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Separator
            orientation="vertical"
            className="hidden h-8 bg-zinc-800/70 sm:block"
          />
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-xs text-zinc-400">Scor de risc general</div>
              <div className="text-sm font-medium text-zinc-100">Risc Mediu</div>
            </div>
            <RiskScoreCircle
              score={87}
              label="Risc Mediu"
              className="size-20 sm:size-24"
            />
          </div>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

