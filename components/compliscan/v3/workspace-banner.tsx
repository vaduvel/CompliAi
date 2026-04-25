import type { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * V3 Workspace Banner — apare deasupra paginii când partener-ul a intrat în execuție pe o firmă.
 * Pattern frozen: cobalt-soft gradient strip + dot pulse + "Lucrezi pentru X · în numele cabinetului Y" + exit CTA.
 */
export function V3WorkspaceBanner({
  client,
  cabinet,
  exitLabel = "Ieși din execuție",
  exitHref,
  onExit,
  exitDisabled = false,
  className,
}: {
  client: ReactNode
  cabinet?: ReactNode
  exitLabel?: ReactNode
  exitHref?: string
  onExit?: () => void
  exitDisabled?: boolean
  className?: string
}) {
  const exitButton = (
    <button
      type="button"
      onClick={onExit}
      disabled={exitDisabled}
      className={cn(
        "ml-auto flex shrink-0 items-center gap-1.5 rounded-eos-sm border border-eos-border bg-transparent px-2.5 py-1 font-mono text-[11px] text-eos-text-muted transition-colors",
        "hover:border-eos-border-strong hover:text-eos-text",
        "disabled:cursor-not-allowed disabled:opacity-60"
      )}
    >
      <ArrowLeft className="size-3" strokeWidth={2.5} />
      {exitLabel}
    </button>
  )

  return (
    <div
      className={cn(
        "-mx-4 flex items-center gap-3 border-b border-eos-primary/15 px-4 py-2 font-mono text-[11.5px] tracking-[0.02em] text-eos-text-muted md:-mx-6 md:px-6 lg:-mx-8 lg:px-8",
        "bg-gradient-to-b from-eos-primary/[0.06] to-eos-primary/[0.02]",
        className
      )}
    >
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full bg-eos-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]"
      />
      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span>Lucrezi pentru</span>
        <span className="font-semibold text-eos-text">{client}</span>
        {cabinet && (
          <>
            <span className="text-eos-border-strong">·</span>
            <span>în numele cabinetului</span>
            <span className="font-semibold text-eos-text">{cabinet}</span>
          </>
        )}
      </span>
      {(onExit || exitHref) && exitButton}
    </div>
  )
}
