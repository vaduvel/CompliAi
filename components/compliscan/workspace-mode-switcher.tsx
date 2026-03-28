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
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-2">
      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/25">
        Mod de lucru
      </p>
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          disabled={disabled || switchingToPortfolio}
          onClick={() => onSwitch("portfolio")}
          className={[
            "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 disabled:opacity-50",
            workspaceMode === "portfolio"
              ? "bg-blue-500/[0.11] font-semibold text-white shadow-[inset_2px_0_0_rgba(59,130,246,0.7)]"
              : "font-medium text-white/45 hover:bg-white/[0.06] hover:text-white/80",
          ].join(" ")}
        >
          {switchingToPortfolio ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-400" strokeWidth={2} />
          ) : (
            <Briefcase
              className={[
                "h-4 w-4 shrink-0 transition-colors duration-150",
                workspaceMode === "portfolio" ? "text-blue-400" : "text-white/30",
              ].join(" ")}
              strokeWidth={2}
            />
          )}
          <span className="truncate">Portofoliu</span>
        </button>

        <button
          type="button"
          disabled={disabled || switchingToOrg}
          onClick={() => onSwitch("org")}
          className={[
            "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 disabled:opacity-50",
            workspaceMode === "org"
              ? "bg-blue-500/[0.11] font-semibold text-white shadow-[inset_2px_0_0_rgba(59,130,246,0.7)]"
              : "font-medium text-white/45 hover:bg-white/[0.06] hover:text-white/80",
          ].join(" ")}
        >
          {switchingToOrg ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-400" strokeWidth={2} />
          ) : (
            <Building2
              className={[
                "h-4 w-4 shrink-0 transition-colors duration-150",
                workspaceMode === "org" ? "text-blue-400" : "text-white/30",
              ].join(" ")}
              strokeWidth={2}
            />
          )}
          <span className="truncate">
            {workspaceMode === "org" ? currentOrgName : "Firma activă"}
          </span>
        </button>
      </div>
    </div>
  )
}
