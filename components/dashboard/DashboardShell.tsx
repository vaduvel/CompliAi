"use client"

import * as React from "react"
import { MenuIcon } from "lucide-react"

import { BrandMark } from "@/components/dashboard/BrandMark"
import { ActionBar } from "@/components/dashboard/ActionBar"
import { DashboardCards } from "@/components/dashboard/DashboardCards"
import { DashboardFooterDisclaimer } from "@/components/dashboard/DashboardFooterDisclaimer"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { SidebarNav } from "@/components/dashboard/SidebarNav"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function DashboardShell() {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-50">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="flex min-h-dvh w-full">
          <aside className="hidden w-72 shrink-0 flex-col border-r border-zinc-800/60 bg-zinc-950/60 backdrop-blur md:flex">
            <div className="p-4">
              <BrandMark />
            </div>
            <SidebarNav className="px-2" />
            <div className="mt-auto p-4">
              <div className="rounded-xl border border-zinc-800/70 bg-zinc-900/30 p-3 text-xs text-zinc-400">
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
                    className="border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900/60"
                  >
                    <MenuIcon className="size-4" />
                    <span className="sr-only">Deschide meniul</span>
                  </Button>
                </SheetTrigger>
              }
            />

            <SheetContent
              side="left"
              className="border-zinc-800 bg-zinc-950 p-0 text-zinc-50"
            >
              <SheetHeader className="border-b border-zinc-800/70">
                <SheetTitle className="text-zinc-50">
                  <BrandMark />
                </SheetTitle>
              </SheetHeader>
              <div className="px-2 py-2">
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>

            <main className="px-4 py-6 pb-40 md:px-6">
              <div className="mb-5">
                <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
                  Dashboard
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
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

