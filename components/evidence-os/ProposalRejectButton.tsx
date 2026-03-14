import { XCircle } from "lucide-react"

import { Button } from "@/components/evidence-os/Button"
import { cn } from "@/lib/utils"

interface ProposalRejectButtonProps {
  onClick: () => void
  label?: string
  className?: string
}

export function ProposalRejectButton({
  onClick,
  label = "Respinge propunerea",
  className,
}: ProposalRejectButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("h-6 w-6 p-0 hover:bg-eos-error-soft hover:text-eos-error", className)}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <XCircle className="size-4" aria-hidden="true" />
    </Button>
  )
}
