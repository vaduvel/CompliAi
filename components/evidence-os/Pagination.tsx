"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/evidence-os/Button"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | "ellipsis")[] = [1]

  if (current > 3) pages.push("ellipsis")

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push("ellipsis")

  pages.push(total)
  return pages
}

// ── Component ────────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = buildPageNumbers(page, totalPages)

  return (
    <nav
      aria-label="Paginare"
      className={cn("flex items-center justify-center gap-1", className)}
    >
      <Button
        variant="ghost"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Pagina anterioară"
        className="gap-1"
      >
        <ChevronLeft className="size-4" strokeWidth={2} />
        <span className="hidden sm:inline">Înapoi</span>
      </Button>

      {pages.map((p, idx) =>
        p === "ellipsis" ? (
          <span
            key={`ellipsis-${idx}`}
            className="flex size-8 items-center justify-center text-eos-text-tertiary"
            aria-hidden
          >
            <MoreHorizontal className="size-4" strokeWidth={2} />
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "default" : "ghost"}
            size="sm"
            onClick={() => onPageChange(p)}
            aria-label={`Pagina ${p}`}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "min-w-8 px-2 tabular-nums",
              p === page && "pointer-events-none"
            )}
          >
            {p}
          </Button>
        )
      )}

      <Button
        variant="ghost"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Pagina următoare"
        className="gap-1"
      >
        <span className="hidden sm:inline">Următor</span>
        <ChevronRight className="size-4" strokeWidth={2} />
      </Button>
    </nav>
  )
}

export { Pagination, buildPageNumbers }
