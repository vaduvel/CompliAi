import { FileText, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  label: string
  icon?: LucideIcon
  className?: string
}

export function EmptyState({ label, icon: Icon = FileText, className }: EmptyStateProps) {
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
      <p className="max-w-sm text-sm text-eos-text-muted">{label}</p>
    </div>
  )
}
