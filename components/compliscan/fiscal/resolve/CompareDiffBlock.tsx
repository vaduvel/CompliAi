"use client"

// CompareDiffBlock — tabel side-by-side cu rows highlight unde diferă.
// Folosit de Pattern E (compare-decide) pentru ETVA-GAP, ERP-SPV-MISMATCH,
// BANK-SPV-MISMATCH, EF-DUPLICATE.
//
// Faza 3.3 din fiscal-module-final-sprint-2026-05-12.md.

type CompareRow = {
  label: string
  left: string | number | null
  right: string | number | null
  /** True dacă valoarea formatată diferă vizibil. */
  diff?: boolean
}

type CompareDiffBlockProps = {
  title?: string
  leftLabel: string
  rightLabel: string
  rows: CompareRow[]
}

export function CompareDiffBlock({
  title,
  leftLabel,
  rightLabel,
  rows,
}: CompareDiffBlockProps) {
  const diffCount = rows.filter((r) => r.diff).length

  return (
    <section className="overflow-hidden rounded-eos-md border border-eos-border bg-eos-surface">
      <header className="flex items-center justify-between gap-3 border-b border-eos-border-subtle px-3 py-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          {title ?? "Comparație"}
        </span>
        <span className="font-mono text-[10px] text-eos-text-muted">
          {diffCount > 0 ? (
            <span className="text-eos-warning">{diffCount} diferențe</span>
          ) : (
            <span className="text-eos-success">Identic</span>
          )}
        </span>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-eos-border-subtle bg-eos-surface-variant/40">
              <th className="px-3 py-1.5 text-left font-mono text-[9.5px] uppercase tracking-[0.12em] text-eos-text-tertiary">
                Câmp
              </th>
              <th className="px-3 py-1.5 text-right font-mono text-[9.5px] uppercase tracking-[0.12em] text-eos-text-muted">
                {leftLabel}
              </th>
              <th className="px-3 py-1.5 text-right font-mono text-[9.5px] uppercase tracking-[0.12em] text-eos-text-muted">
                {rightLabel}
              </th>
              <th className="px-3 py-1.5 text-right font-mono text-[9.5px] uppercase tracking-[0.12em] text-eos-text-muted">
                Δ
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const delta = computeDelta(row.left, row.right)
              return (
                <tr
                  key={idx}
                  className={`border-b border-eos-border-subtle last:border-0 ${row.diff ? "bg-eos-warning/[0.05]" : ""}`}
                >
                  <td className="px-3 py-1.5 font-medium text-eos-text">{row.label}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-eos-text-muted">
                    {formatValue(row.left)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-eos-text-muted">
                    {formatValue(row.right)}
                  </td>
                  <td
                    className={`px-3 py-1.5 text-right font-mono ${
                      row.diff ? "font-semibold text-eos-warning" : "text-eos-text-tertiary"
                    }`}
                  >
                    {delta}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function formatValue(v: string | number | null): string {
  if (v === null || v === undefined) return "—"
  if (typeof v === "number") {
    return v.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return String(v)
}

function computeDelta(left: string | number | null, right: string | number | null): string {
  if (typeof left === "number" && typeof right === "number") {
    const delta = right - left
    if (delta === 0) return "0"
    return `${delta > 0 ? "+" : ""}${delta.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  if (left === right) return "="
  return "≠"
}
