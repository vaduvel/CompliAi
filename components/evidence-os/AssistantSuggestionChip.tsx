"use client"

import { Button } from "@/components/evidence-os/Button"
import { cn } from "@/lib/utils"

interface AssistantSuggestionChipProps {
  suggestion: string
  onSelect: (suggestion: string) => void
  disabled?: boolean
  className?: string
}

export function AssistantSuggestionChip({
  suggestion,
  onSelect,
  disabled,
  className,
}: AssistantSuggestionChipProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => onSelect(suggestion)}
      disabled={disabled}
      className={cn(
        "h-auto min-h-11 justify-start whitespace-normal rounded-eos-md px-4 py-3 text-left text-sm leading-5",
        className
      )}
    >
      {suggestion}
    </Button>
  )
}
