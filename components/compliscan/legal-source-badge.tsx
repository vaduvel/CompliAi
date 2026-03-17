"use client"

// Sprint 11 — Explainability Layer
// Tooltip badge care afișează sursa legală oficială și raționamentul
// în dreptul oricărui card de conformitate.

import { useState } from "react"
import { Info } from "lucide-react"

import type { SuggestionExplanation } from "@/lib/compliance/legal-sources"

// ── LegalSourceBadge ──────────────────────────────────────────────────────────

interface LegalSourceBadgeProps {
  explanation: SuggestionExplanation
  className?: string
}

const CERTAINTY_STYLES: Record<"green" | "yellow" | "gray", string> = {
  green:  "bg-eos-success-soft text-eos-success-fg border-eos-success-border",
  yellow: "bg-eos-warning-soft text-eos-warning-fg border-eos-warning-border",
  gray:   "bg-eos-surface-variant text-eos-text-muted border-eos-border",
}

/**
 * Buton mic cu icon Info care deschide un tooltip cu:
 * - Sursa legală oficială (citație)
 * - Nivel de certitudine
 * - Raționament (DE CE se aplică)
 */
export function LegalSourceBadge({ explanation, className = "" }: LegalSourceBadgeProps) {
  const [open, setOpen] = useState(false)
  const { legalSource, reasoning, certaintyLabel, certaintyColor } = explanation

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label={`Sursă legală: ${legalSource.citation}`}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="flex items-center gap-1 rounded-full border border-eos-border px-2 py-0.5 text-[10px] font-medium text-eos-text-muted transition-colors hover:border-eos-primary hover:text-eos-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eos-primary"
      >
        <Info className="size-3" strokeWidth={2.5} />
        {legalSource.shortName}
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-eos-md border border-eos-border bg-eos-surface p-3 shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Citație oficială */}
          <p className="text-[11px] font-semibold text-eos-text">{legalSource.citation}</p>
          {legalSource.articleHint && (
            <p className="mt-0.5 text-[10px] text-eos-text-muted">{legalSource.articleHint}</p>
          )}

          {/* Nivel certitudine */}
          <span
            className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${CERTAINTY_STYLES[certaintyColor]}`}
          >
            {certaintyLabel}
          </span>

          {/* Raționament */}
          <p className="mt-2 text-[11px] leading-relaxed text-eos-text-muted">{reasoning}</p>

          {/* Notă aplicabilitate */}
          {legalSource.applicabilityNote && (
            <p className="mt-2 border-t border-eos-border-subtle pt-2 text-[10px] text-eos-text-tertiary">
              {legalSource.applicabilityNote}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── LegalSourceInline ─────────────────────────────────────────────────────────

/**
 * Variantă inline (fără tooltip) — afișează citația direct în text.
 * Folosit în finding cards / scan results.
 */
export function LegalSourceInline({
  citation,
  articleHint,
}: {
  citation: string
  articleHint?: string
}) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-eos-text-muted">
      <Info className="size-3 shrink-0" strokeWidth={2} />
      <span>
        {citation}
        {articleHint && <span className="ml-1 opacity-70">· {articleHint}</span>}
      </span>
    </span>
  )
}
