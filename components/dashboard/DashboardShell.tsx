"use client"

import * as React from "react"
import { MenuIcon } from "lucide-react"

import { BrandMark } from "@/components/dashboard/BrandMark"
import { ActionBar } from "@/components/dashboard/ActionBar"
import { DashboardCards } from "@/components/dashboard/DashboardCards"
import { DashboardFooterDisclaimer } from "@/components/dashboard/DashboardFooterDisclaimer"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { SidebarNav } from "@/components/dashboard/SidebarNav"
import { Button } from "@/components/evidence-os/Button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/evidence-os/Sheet"

export function DashboardShell() {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,var(--eos-accent-primary-subtle),transparent_32%),linear-gradient(180deg,var(--eos-surface-secondary),var(--eos-surface-base))] text-eos-text">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="flex min-h-dvh w-full">
          <aside className="hidden w-72 shrink-0 flex-col border-r border-eos-border-subtle bg-[linear-gradient(180deg,var(--eos-surface-primary),var(--eos-surface-base))] backdrop-blur md:flex">
            <div className="p-4">
              <BrandMark />
            </div>
            <SidebarNav className="px-2" />
            <div className="mt-auto p-4">
              <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface p-3 text-xs text-eos-text-muted">
                Scor de risc · recomandare AI · verifică uman
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <DashboardHeader
              mobileNavTrigger={
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-eos-border bg-eos-surface hover:bg-eos-surface-elevated"
                  >
                    <MenuIcon className="size-4" />
                    <span className="sr-only">Deschide meniul</span>
                  </Button>
                </SheetTrigger>
              }
            />

            <SheetContent
              side="left"
              className="border-eos-border bg-eos-surface-base p-0 text-eos-text"
            >
              <SheetHeader className="border-b border-eos-border-subtle">
                <SheetTitle className="text-eos-text">
                  <BrandMark />
                </SheetTitle>
              </SheetHeader>
              <div className="px-2 py-2">
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>

            <main className="px-4 py-6 pb-40 md:px-6">
              <div className="mb-5">
                <h1 className="text-lg font-semibold tracking-tight text-eos-text">
                  Dashboard
                </h1>
                <p className="mt-1 text-sm text-eos-text-muted">
                  Asistent AI care îți arată un scor de risc și o recomandare AI.
                  Verifică uman înainte de orice raport oficial.
                </p>
              </div>

              <DashboardCards />
            </main>

            <ActionBar />
            <DashboardFooterDisclaimer />
          </div>
        </div>
      </Sheet>
    </div>
  )
}
