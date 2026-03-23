"use client"

import { Briefcase, Building2, Loader2 } from "lucide-react"

import { Button } from "@/components/evidence-os/Button"
import type { WorkspaceMode } from "@/lib/server/auth"

type WorkspaceModeSwitcherProps = {
  currentOrgName: string
  disabled?: boolean
  loadingMode?: WorkspaceMode | null
  workspaceMode: WorkspaceMode
  onSwitch: (mode: WorkspaceMode) => void
}

function SwitchButton({
  active,
  children,
  disabled,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      disabled={disabled}
      className="h-auto flex-1 justify-start gap-2 px-3 py-2 text-left"
      onClick={onClick}
    >
      {children}
    </Button>
  )
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
    <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface px-3 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-muted">
        Mod de lucru
      </p>
      <div className="mt-3 flex gap-2">
        <SwitchButton
          active={workspaceMode === "portfolio"}
          disabled={disabled || switchingToPortfolio}
          onClick={() => onSwitch("portfolio")}
        >
          {switchingToPortfolio ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
          ) : (
            <Briefcase className="size-4" strokeWidth={2} />
          )}
          <span>Portofoliu</span>
        </SwitchButton>
        <SwitchButton
          active={workspaceMode === "org"}
          disabled={disabled || switchingToOrg}
          onClick={() => onSwitch("org")}
        >
          {switchingToOrg ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
          ) : (
            <Building2 className="size-4" strokeWidth={2} />
          )}
          <span className="truncate">{workspaceMode === "org" ? currentOrgName : "Firma activa"}</span>
        </SwitchButton>
      </div>
      <p className="mt-3 text-xs leading-5 text-eos-text-muted">
        Portofoliul ramane cross-client. Firma activa pastreaza ultimul org valid pentru drilldown.
      </p>
    </div>
  )
}
