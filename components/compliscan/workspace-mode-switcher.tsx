"use client"

import { Briefcase, Building2, Loader2 } from "lucide-react"

import type { WorkspaceMode } from "@/lib/server/auth"

type WorkspaceModeSwitcherProps = {
  currentOrgName: string
  disabled?: boolean
  loadingMode?: WorkspaceMode | null
  workspaceMode: WorkspaceMode
  onSwitch: (mode: WorkspaceMode) => void
}

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
    <div className="rounded-eos-lg border border-eos-border bg-eos-surface-variant p-2">
      <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
        Mod de lucru
      </p>
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          disabled={disabled || switchingToPortfolio}
          onClick={() => onSwitch("portfolio")}
          className={[
            "flex w-full items-center gap-2.5 rounded-eos-lg px-3 py-2.5 text-sm transition-all duration-150 disabled:opacity-50",
            workspaceMode === "portfolio"
              ? "bg-eos-primary-soft font-semibold text-eos-text shadow-[inset_2px_0_0_rgba(59,130,246,0.7)]"
              : "font-medium text-eos-text-muted hover:bg-eos-surface-active hover:text-eos-text",
          ].join(" ")}
        >
          {switchingToPortfolio ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-eos-primary" strokeWidth={2} />
          ) : (
            <Briefcase
              className={[
                "h-4 w-4 shrink-0 transition-colors duration-150",
                workspaceMode === "portfolio" ? "text-eos-primary" : "text-eos-text-tertiary",
              ].join(" ")}
              strokeWidth={2}
            />
          )}
          <span className="truncate">Portofoliu · triage</span>
        </button>

        <button
          type="button"
          disabled={disabled || switchingToOrg}
          onClick={() => onSwitch("org")}
          className={[
            "flex w-full items-center gap-2.5 rounded-eos-lg px-3 py-2.5 text-sm transition-all duration-150 disabled:opacity-50",
            workspaceMode === "org"
              ? "bg-eos-primary-soft font-semibold text-eos-text shadow-[inset_2px_0_0_rgba(59,130,246,0.7)]"
              : "font-medium text-eos-text-muted hover:bg-eos-surface-active hover:text-eos-text",
          ].join(" ")}
        >
          {switchingToOrg ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-eos-primary" strokeWidth={2} />
          ) : (
            <Building2
              className={[
                "h-4 w-4 shrink-0 transition-colors duration-150",
                workspaceMode === "org" ? "text-eos-primary" : "text-eos-text-tertiary",
              ].join(" ")}
              strokeWidth={2}
            />
          )}
          <span className="truncate">
            {workspaceMode === "org" ? `Execuție · ${currentOrgName}` : "Execuție în firmă"}
          </span>
        </button>
      </div>
    </div>
  )
}
