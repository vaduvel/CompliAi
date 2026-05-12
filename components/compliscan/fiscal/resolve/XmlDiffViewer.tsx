"use client"

// XmlDiffViewer — afișează diff color-coded între XML original și XML reparat.
// Folosit de Fiscal Resolve Cockpit pentru Pattern A (auto-approve) la
// EF-003 (factură respinsă ANAF) și EF-006 (date client invalide).
//
// Reutilizează `computeXmlDiff` din `lib/compliance/xml-diff.ts` (extras din
// EFacturaValidatorCard).
//
// Faza 3.1 din fiscal-module-final-sprint-2026-05-12.md.

import { computeXmlDiff } from "@/lib/compliance/xml-diff"

type XmlDiffViewerProps = {
  original: string
  repaired: string
  /** Maxim linii afișate. Default 100. */
  maxLines?: number
}

export function XmlDiffViewer({ original, repaired, maxLines = 100 }: XmlDiffViewerProps) {
  if (!original || !repaired) {
    return (
      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant/40 px-4 py-3 text-[12px] text-eos-text-tertiary">
        Niciun XML disponibil pentru comparație.
      </div>
    )
  }

  const lines = computeXmlDiff(original, repaired).slice(0, maxLines)
  const added = lines.filter((l) => l.type === "added").length
  const removed = lines.filter((l) => l.type === "removed").length

  return (
    <div className="overflow-hidden rounded-eos-md border border-eos-border bg-eos-surface">
      <header className="flex items-center justify-between gap-3 border-b border-eos-border-subtle px-3 py-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Diff XML
        </span>
        <span className="font-mono text-[10px] text-eos-text-muted">
          <span className="text-eos-error">−{removed}</span>
          {"  "}
          <span className="text-eos-success">+{added}</span>
        </span>
      </header>
      <pre className="max-h-72 overflow-auto font-mono text-[11px] leading-[1.55]">
        {lines.map((line, idx) => (
          <div
            key={idx}
            className={
              line.type === "removed"
                ? "bg-eos-error-soft px-3 py-0.5 text-eos-error"
                : line.type === "added"
                  ? "bg-eos-success-soft px-3 py-0.5 text-eos-success"
                  : "px-3 py-0.5 text-eos-text-muted"
            }
          >
            <span className="mr-3 inline-block w-8 select-none text-right text-eos-text-tertiary">
              {line.lineNo}
            </span>
            <span className="mr-1 select-none">
              {line.type === "removed" ? "−" : line.type === "added" ? "+" : " "}
            </span>
            {line.text}
          </div>
        ))}
        {computeXmlDiff(original, repaired).length > maxLines && (
          <div className="border-t border-eos-border-subtle px-3 py-1.5 font-mono text-[10px] text-eos-text-tertiary">
            … {computeXmlDiff(original, repaired).length - maxLines} linii suplimentare
            (truncate)
          </div>
        )}
      </pre>
    </div>
  )
}
