"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { cn } from "@/lib/utils"

// ── Density context ────────────────────────────────────────────────────────────

type TableDensity = "compact" | "default" | "comfortable"

interface TableContextValue {
  density: TableDensity
  stickyHeader: boolean
}

const TableContext = React.createContext<TableContextValue>({
  density: "default",
  stickyHeader: false,
})

const cellPadding: Record<TableDensity, string> = {
  compact:     "px-3 py-1",
  default:     "px-4 py-2",
  comfortable: "px-4 py-3",
}

// ── Table root ─────────────────────────────────────────────────────────────────

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  density?: TableDensity
  stickyHeader?: boolean
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, density = "default", stickyHeader = false, ...props }, ref) => (
    <TableContext.Provider value={{ density, stickyHeader }}>
      <div className={cn("w-full overflow-auto", stickyHeader && "max-h-[480px]")}>
        <table
          ref={ref}
          className={cn("w-full caption-bottom border-collapse text-sm", className)}
          {...props}
        />
      </div>
    </TableContext.Provider>
  )
)
Table.displayName = "Table"

// ── TableHeader ────────────────────────────────────────────────────────────────

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const { stickyHeader } = React.useContext(TableContext)
  return (
    <thead
      ref={ref}
      className={cn(
        "border-b border-eos-border bg-eos-surface",
        stickyHeader && "sticky top-0 z-10",
        className
      )}
      {...props}
    />
  )
})
TableHeader.displayName = "TableHeader"

// ── TableBody ──────────────────────────────────────────────────────────────────

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

// ── TableFooter ────────────────────────────────────────────────────────────────

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-eos-border bg-eos-surface-variant font-medium",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

// ── TableRow ───────────────────────────────────────────────────────────────────

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-eos-border-subtle transition-colors",
      "hover:bg-eos-surface-elevated",
      "data-[selected=true]:bg-eos-primary-soft",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

// ── TableHead (sortable column header) ────────────────────────────────────────

export type SortDirection = "asc" | "desc" | null

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean
  sortDirection?: SortDirection
  onSort?: () => void
  numeric?: boolean
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, sortable, sortDirection, onSort, numeric, children, ...props }, ref) => {
    const { density } = React.useContext(TableContext)
    const SortIcon =
      sortDirection === "asc"
        ? ArrowUp
        : sortDirection === "desc"
          ? ArrowDown
          : ArrowUpDown

    return (
      <th
        ref={ref}
        className={cn(
          "align-middle text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary",
          cellPadding[density],
          numeric ? "text-right tabular-nums" : "text-left",
          sortable &&
            "cursor-pointer select-none hover:text-eos-text-muted transition-colors",
          className
        )}
        onClick={sortable ? onSort : undefined}
        {...props}
      >
        {sortable ? (
          <span className="inline-flex items-center gap-1.5">
            {children}
            <SortIcon
              className={cn(
                "size-3 shrink-0",
                sortDirection ? "text-eos-primary" : "text-eos-text-tertiary/50"
              )}
              strokeWidth={2.5}
            />
          </span>
        ) : (
          children
        )}
      </th>
    )
  }
)
TableHead.displayName = "TableHead"

// ── TableCell ──────────────────────────────────────────────────────────────────

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, numeric, ...props }, ref) => {
    const { density } = React.useContext(TableContext)
    return (
      <td
        ref={ref}
        className={cn(
          "align-middle text-eos-text",
          cellPadding[density],
          numeric && "text-right tabular-nums",
          className
        )}
        {...props}
      />
    )
  }
)
TableCell.displayName = "TableCell"

// ── TableCaption ───────────────────────────────────────────────────────────────

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-eos-text-tertiary", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

// ── TableEmpty — empty state row ───────────────────────────────────────────────

function TableEmpty({
  colSpan,
  children,
}: {
  colSpan: number
  children?: React.ReactNode
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-eos-text-tertiary">
        {children ?? "Niciun rezultat găsit"}
      </td>
    </tr>
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  TableEmpty,
}
