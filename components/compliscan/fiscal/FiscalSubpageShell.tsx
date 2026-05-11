"use client"

// Shared layout pentru sub-paginile fiscal (Sprint 0 IA restructure 2026-05-11).
// Header consistent + breadcrumb + back-link la cockpit.

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { FiscalAssistantTrigger } from "@/components/compliscan/fiscal/FiscalAssistantPanel"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"

type FiscalSubpageShellProps = {
  title: string
  description: string
  breadcrumb: string
  children: React.ReactNode
}

export function FiscalSubpageShell({
  title,
  description,
  breadcrumb,
  children,
}: FiscalSubpageShellProps) {
  return (
    <div className="space-y-6 px-1">
      <header className="space-y-3">
        <nav className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-eos-text-tertiary">
          <Link
            href={dashboardRoutes.fiscal}
            className="inline-flex items-center gap-1 text-eos-text-tertiary hover:text-eos-text-muted"
          >
            <ArrowLeft className="size-3" strokeWidth={2} />
            Cockpit fiscal
          </Link>
          <span aria-hidden>/</span>
          <span className="text-eos-text-muted">{breadcrumb}</span>
        </nav>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h1
              data-display-text="true"
              className="font-display text-[24px] font-semibold tracking-[-0.025em] text-eos-text md:text-[28px]"
            >
              {title}
            </h1>
            <p className="max-w-2xl text-[13.5px] leading-[1.55] text-eos-text-muted">{description}</p>
          </div>
          <FiscalAssistantTrigger />
        </div>
      </header>

      <div className="space-y-4">{children}</div>
    </div>
  )
}
