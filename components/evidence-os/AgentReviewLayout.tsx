"use client"

import { cn } from "@/lib/utils"

interface AgentReviewLayoutProps {
  context: React.ReactNode
  proposals: React.ReactNode
  review: React.ReactNode
  className?: string
}

export function AgentReviewLayout({
  context,
  proposals,
  review,
  className,
}: AgentReviewLayoutProps) {
  return (
    <div
      className={cn(
        "grid min-h-[calc(100vh-140px)] gap-6 xl:h-[calc(100vh-140px)] xl:grid-cols-[280px_minmax(0,1fr)_320px] xl:overflow-hidden",
        className
      )}
    >
      {context}
      {proposals}
      {review}
    </div>
  )
}
