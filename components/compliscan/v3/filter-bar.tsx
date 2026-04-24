"use client"

import type { ReactNode } from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"

export type V3FilterTab<T extends string> = {
  id: T
  label: ReactNode
  count?: number
}

export function V3FilterBar<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Caută...",
  sortLabel,
  onSortClick,
  rightSlot,
  className,
}: {
  tabs: V3FilterTab<T>[]
  activeTab: T
  onTabChange: (id: T) => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  sortLabel?: ReactNode
  onSortClick?: () => void
  rightSlot?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-eos-border bg-eos-surface/80 px-3 py-2 md:flex-row md:items-center md:justify-between md:gap-4 md:px-4",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-1 rounded-eos-sm bg-white/[0.03] p-0.5">
        {tabs.map((tab) => {
          const active = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-eos-sm px-2.5 py-1 text-[12px] font-medium transition-all duration-100",
                active
                  ? "bg-white/[0.06] font-semibold text-eos-text"
                  : "text-eos-text-muted hover:text-eos-text"
              )}
            >
              {tab.label}
              {typeof tab.count === "number" && (
                <span
                  className={cn(
                    "font-mono text-[10px] font-medium tabular-nums",
                    active ? "text-eos-text-muted" : "text-eos-text-tertiary"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onSearchChange && (
          <label className="relative flex w-full min-w-[200px] max-w-[260px] items-center md:w-auto">
            <Search
              className="pointer-events-none absolute left-2.5 size-3.5 text-eos-text-tertiary"
              strokeWidth={2}
            />
            <input
              type="search"
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-[30px] w-full rounded-eos-sm border border-eos-border bg-eos-surface pl-8 pr-2.5 text-[12px] text-eos-text outline-none transition-colors placeholder:text-eos-text-tertiary focus:border-eos-border-strong"
            />
          </label>
        )}
        {sortLabel && (
          <button
            type="button"
            onClick={onSortClick}
            className="flex h-[30px] items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 font-mono text-[11px] text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
          >
            {sortLabel}
          </button>
        )}
        {rightSlot}
      </div>
    </div>
  )
}
