import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

interface ProposalColumnShellProps {
  children: React.ReactNode
  loading?: boolean
  loadingLabel?: string
  className?: string
}

export function ProposalColumnShell({
  children,
  loading = false,
  loadingLabel = "Agentii analizeaza sursa...",
  className,
}: ProposalColumnShellProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-eos-xl border border-eos-border-subtle bg-eos-bg shadow-sm",
        className
      )}
      aria-busy={loading}
    >
      {loading ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-10 text-center" role="status" aria-live="polite">
          <Loader2 className="size-8 animate-spin text-eos-primary" aria-hidden="true" />
          <p className="animate-pulse text-sm text-eos-text-muted">{loadingLabel}</p>
        </div>
      ) : (
        children
      )}
    </div>
  )
}
