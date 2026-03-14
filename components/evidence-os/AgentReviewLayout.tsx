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
        "grid h-[calc(100vh-140px)] grid-cols-[300px_1fr_300px] gap-6 overflow-hidden",
        className
      )}
    >
      {context}
      {proposals}
      {review}
    </div>
  )
}
