"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// ── Base Skeleton ─────────────────────────────────────────────────────────────

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-eos-md bg-eos-surface-elevated",
        className
      )}
      {...props}
    />
  )
}

// ── SkeletonText — N linii de text placeholder ────────────────────────────────

interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number
  /** Last line is shorter (natural paragraph feel) */
  lastLineShorter?: boolean
}

function SkeletonText({
  lines = 3,
  lastLineShorter = true,
  className,
  ...props
}: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            lastLineShorter && i === lines - 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

// ── SkeletonCard — card complet placeholder ───────────────────────────────────

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-eos-xl border border-eos-border-subtle bg-eos-surface p-5",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 shrink-0 rounded-eos-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    </div>
  )
}

// ── SkeletonMetric — metric tile placeholder ──────────────────────────────────

function SkeletonMetric({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-eos-xl border border-eos-border-subtle bg-eos-surface p-5",
        className
      )}
      {...props}
    >
      <Skeleton className="mb-3 h-3 w-24" />
      <Skeleton className="mb-2 h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonMetric }
