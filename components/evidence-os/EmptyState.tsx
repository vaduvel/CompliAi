import { FileText, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title?: string
  label: string
  icon?: LucideIcon
  actions?: React.ReactNode
  className?: string
}

export function EmptyState({ title, label, icon: Icon = FileText, actions, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-eos-md border border-dashed border-eos-border-subtle bg-eos-bg-inset px-4 py-10 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-eos-bg-panel">
        <Icon className="size-5 text-eos-text-tertiary" aria-hidden="true" />
      </div>
      {title ? <p className="text-sm font-medium text-eos-text">{title}</p> : null}
      <p className={cn("text-sm leading-6 text-eos-text-muted", title ? "mt-1 max-w-md" : "max-w-sm")}>{label}</p>
      {actions ? <div className="mt-4 flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  )
}
