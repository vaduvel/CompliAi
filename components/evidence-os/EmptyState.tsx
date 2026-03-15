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
      {title ? <p className="break-words text-sm font-medium text-eos-text [overflow-wrap:anywhere]">{title}</p> : null}
      <p
        className={cn(
          "break-words text-sm leading-6 text-eos-text-muted [overflow-wrap:anywhere]",
          title ? "mt-1 max-w-md" : "max-w-sm"
        )}
      >
        {label}
      </p>
      {actions ? <div className="mt-4 flex w-full flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  )
}
