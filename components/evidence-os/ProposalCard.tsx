"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { cn } from "@/lib/utils"

interface ProposalCardProps {
  title: React.ReactNode
  children: React.ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
  titleClassName?: string
  titleMeta?: React.ReactNode
  badges?: React.ReactNode
  actions?: React.ReactNode
}

export function ProposalCard({
  title,
  children,
  className,
  headerClassName,
  contentClassName,
  titleClassName,
  titleMeta,
  badges,
  actions,
}: ProposalCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader
        className={cn(
          "flex flex-col gap-3 space-y-0 bg-eos-bg-inset p-4 sm:flex-row sm:items-start sm:justify-between",
          headerClassName
        )}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <CardTitle className={cn("break-words text-sm font-medium leading-5", titleClassName)}>{title}</CardTitle>
          {titleMeta}
        </div>
        {(badges || actions) && (
          <div className="flex w-full flex-wrap items-start gap-2 sm:ml-3 sm:w-auto sm:shrink-0 sm:justify-end">
            {badges}
            {actions}
          </div>
        )}
      </CardHeader>
      <CardContent className={cn("p-4", contentClassName)}>{children}</CardContent>
    </Card>
  )
}
