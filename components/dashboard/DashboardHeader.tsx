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
    <header className="sticky top-0 z-40 border-b border-eos-border-subtle bg-eos-surface/80 backdrop-blur supports-[backdrop-filter]:bg-eos-surface/60">
      <div className="flex w-full items-center gap-3 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="md:hidden">{mobileNavTrigger}</div>
          <div className="block">
            <BrandMark size="sm" />
          </div>
          <div className="hidden md:grid">
            <Avatar className="size-9 border border-eos-border-subtle bg-eos-surface">
              <AvatarFallback className="bg-transparent text-eos-text">
                IP
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-eos-text">
              Ion Popescu - Magazin Online
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <Badge className="border border-eos-border bg-eos-primary-soft text-eos-primary">
                Dashboard
              </Badge>
              <span className="hidden text-xs text-eos-text-muted sm:inline">
                Recomandare AI · verifică uman
              </span>
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Separator
            orientation="vertical"
            className="hidden h-8 bg-eos-border-subtle sm:block"
          />
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-xs text-eos-text-muted">Scor de risc general</div>
              <div className="text-sm font-medium text-eos-text">Risc Mediu</div>
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
