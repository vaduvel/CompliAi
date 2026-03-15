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
        "grid min-h-[32rem] gap-4 xl:h-[calc(100vh-140px)] xl:grid-cols-[minmax(17rem,0.88fr)_minmax(0,1.35fr)_minmax(18rem,0.98fr)] xl:items-start xl:gap-5 xl:overflow-hidden",
        className
      )}
    >
      <div className="min-w-0 xl:h-full">{context}</div>
      <div className="min-w-0 xl:h-full">{proposals}</div>
      <div className="min-w-0 xl:h-full">{review}</div>
    </div>
  )
}
