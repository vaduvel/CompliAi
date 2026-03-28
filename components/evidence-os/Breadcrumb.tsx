"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

// ── Component ────────────────────────────────────────────────────────────────

function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length < 2) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-xs text-eos-text-muted", className)}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1

        return (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <ChevronRight
                className="size-3 shrink-0 text-eos-text-tertiary"
                strokeWidth={2}
                aria-hidden
              />
            )}
            {isLast || !item.href ? (
              <span
                className={cn(
                  "truncate",
                  isLast
                    ? "font-medium text-eos-text"
                    : "text-eos-text-muted"
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="truncate transition-colors hover:text-eos-text"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

export { Breadcrumb }
