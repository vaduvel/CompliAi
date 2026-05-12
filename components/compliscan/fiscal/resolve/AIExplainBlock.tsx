"use client"

// AIExplainBlock — afișează AI Explain pentru un cod de eroare ANAF.
//
// Folosit de Fiscal Resolve Cockpit ca primul bloc în CENTRU (totdeauna apare,
// indiferent de pattern). Wraps /api/efactura/explain-errors care e powered
// de Gemini pentru limbaj uman + bază legală.
//
// Source: lib/compliance/efactura-error-ai-explain.ts + /api/efactura/explain-errors
//
// Faza 3.1 din fiscal-module-final-sprint-2026-05-12.md.

import { useEffect, useState } from "react"
import { Loader2, Sparkles } from "lucide-react"

type EnrichedExplanation = {
  code: string
  title: string
  staticDescription: string
  staticFix: string
  severity: "error" | "warning"
  legalReference: string
  autoFixSafe: boolean
  aiExplanation?: string
}

type AIExplainBlockProps = {
  /** Codurile de eroare ANAF (ex: ["V003", "BR-RO-080"]) */
  errorCodes: string[]
  /** XML factură ca context pentru AI prompt (opțional). */
  xmlContext?: string
}

export function AIExplainBlock({ errorCodes, xmlContext }: AIExplainBlockProps) {
  const [explanations, setExplanations] = useState<EnrichedExplanation[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (errorCodes.length === 0) return
    setLoading(true)
    fetch("/api/efactura/explain-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ errorCodes, xmlContext }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("AI Explain endpoint a returnat eroare.")
        return r.json() as Promise<{ explanations: EnrichedExplanation[] }>
      })
      .then((data) => setExplanations(data.explanations ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Eroare AI Explain."))
      .finally(() => setLoading(false))
  }, [errorCodes, xmlContext])

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant/40 px-4 py-3">
        <Loader2 className="size-3.5 animate-spin text-eos-primary" strokeWidth={2} />
        <span className="text-[12.5px] text-eos-text-muted">
          Generez explicație AI pentru {errorCodes.length} cod{errorCodes.length > 1 ? "uri" : ""} de eroare…
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-eos-md border border-eos-error/30 bg-eos-error-soft px-4 py-3 text-[12px] text-eos-error">
        {error}
      </div>
    )
  }

  if (!explanations || explanations.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {explanations.map((exp) => (
        <article
          key={exp.code}
          className="relative overflow-hidden rounded-eos-md border border-eos-border bg-eos-surface p-4"
        >
          <span
            className={`absolute left-0 top-0 bottom-0 w-[3px] ${
              exp.severity === "error" ? "bg-eos-error" : "bg-eos-warning"
            }`}
            aria-hidden
          />
          <header className="mb-2 flex items-center gap-2">
            <Sparkles className="size-3.5 text-eos-primary" strokeWidth={1.5} />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              {exp.code} · AI Explain
            </span>
            {exp.autoFixSafe && (
              <span className="ml-auto rounded-full bg-eos-success/20 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-eos-success">
                Auto-fix safe
              </span>
            )}
          </header>
          <h4
            data-display-text="true"
            className="mb-1.5 font-display text-[14px] font-semibold tracking-[-0.01em] text-eos-text"
          >
            {exp.title}
          </h4>
          <p className="text-[12.5px] leading-[1.6] text-eos-text-muted">
            {exp.aiExplanation || exp.staticDescription}
          </p>
          {exp.staticFix && (
            <p className="mt-2 text-[12px] leading-[1.5] text-eos-text">
              <strong className="text-eos-text">Cum se repară:</strong> {exp.staticFix}
            </p>
          )}
          {exp.legalReference && (
            <p className="mt-2 text-[11px] text-eos-text-tertiary">
              <strong className="text-eos-text-muted">Bază legală:</strong> {exp.legalReference}
            </p>
          )}
        </article>
      ))}
    </div>
  )
}
