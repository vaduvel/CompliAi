"use client"

import { Briefcase, Building2, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { WorkspaceMode } from "@/lib/server/auth"

type WorkspaceModeSwitcherProps = {
  currentOrgName: string
  disabled?: boolean
  loadingMode?: WorkspaceMode | null
  workspaceMode: WorkspaceMode
  onSwitch: (mode: WorkspaceMode) => void
}

/**
 * V3 Mode Switcher — pattern frozen `cs-mode-switch`:
 *  ▸ mono uppercase eyebrow ("Mod de lucru")
 *  ▸ items cu icon + label, active = bg cobalt-soft + text cobalt + font-semibold
 *  ▸ inactive = text-muted, hover spălat alb
 */
export function WorkspaceModeSwitcher({
  currentOrgName,
  disabled = false,
  loadingMode = null,
  workspaceMode,
  onSwitch,
}: WorkspaceModeSwitcherProps) {
  const switchingToPortfolio = loadingMode === "portfolio"
  const switchingToOrg = loadingMode === "org"

  return (
    <div>
      <p className="mb-1.5 px-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-eos-text-tertiary">
        Mod de lucru
      </p>
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          disabled={disabled || switchingToPortfolio}
          onClick={() => onSwitch("portfolio")}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-eos-sm px-2.5 py-1.5 text-[12.5px] transition-colors duration-100 disabled:opacity-50",
            workspaceMode === "portfolio"
              ? "bg-eos-primary/[0.08] font-semibold text-eos-primary"
              : "font-medium text-eos-text-tertiary hover:bg-white/[0.025] hover:text-eos-text-muted"
          )}
        >
          {switchingToPortfolio ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-eos-primary" strokeWidth={2} />
          ) : (
            <Briefcase
              className={cn(
                "size-4 shrink-0 transition-colors duration-150",
                workspaceMode === "portfolio" ? "text-eos-primary" : "text-eos-text-tertiary"
              )}
              strokeWidth={2}
            />
          )}
          <span className="flex-1 truncate text-left">Portofoliu · triaj</span>
        </button>

        <button
          type="button"
          disabled={disabled || switchingToOrg}
          onClick={() => onSwitch("org")}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-eos-sm px-2.5 py-1.5 text-[12.5px] transition-colors duration-100 disabled:opacity-50",
            workspaceMode === "org"
              ? "bg-eos-primary/[0.08] font-semibold text-eos-primary"
              : "font-medium text-eos-text-tertiary hover:bg-white/[0.025] hover:text-eos-text-muted"
          )}
        >
          {switchingToOrg ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-eos-primary" strokeWidth={2} />
          ) : (
            <Building2
              className={cn(
                "size-4 shrink-0 transition-colors duration-150",
                workspaceMode === "org" ? "text-eos-primary" : "text-eos-text-tertiary"
              )}
              strokeWidth={2}
            />
          )}
          <span className="flex-1 truncate text-left">
            {workspaceMode === "org" ? `Execuție · ${currentOrgName}` : "Execuție în firmă"}
          </span>
          {workspaceMode !== "org" && (
            <span className="font-mono text-[10px] text-eos-text-tertiary">—</span>
          )}
        </button>
      </div>
    </div>
  )
}
