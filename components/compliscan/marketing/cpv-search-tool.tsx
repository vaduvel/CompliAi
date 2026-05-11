"use client"

import { useState } from "react"
import { Loader2, Search } from "lucide-react"

type Suggestion = {
  code: string
  description: string
  score: number
  matchedKeywords: string[]
}

export function CpvSearchTool() {
  const [description, setDescription] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function search() {
    if (!description.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/fiscal/cpv-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim(), topN: 5 }),
      })
      const data = (await res.json()) as { suggestions?: Suggestion[]; error?: string }
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`)
        return
      }
      setSuggestions(data.suggestions ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare de rețea.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-4 rounded-eos-lg border border-eos-border bg-eos-surface p-6">
      <label className="block">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Descrierea produsului sau serviciului
        </span>
        <textarea
          className="mt-2 h-24 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2 text-[13px] text-eos-text outline-none focus:border-eos-border-strong"
          placeholder="Ex: Servicii de contabilitate și audit fiscal pentru primărie / Factura combustibil motorină pentru autoturisme serviciu / Licențe Microsoft Office..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
        />
        <p className="mt-1 text-[10.5px] text-eos-text-tertiary">{description.length}/500</p>
      </label>

      <button
        onClick={() => void search()}
        disabled={busy || description.trim().length < 3}
        className="inline-flex items-center gap-1.5 rounded-eos-sm bg-eos-primary px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-eos-primary/90 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
        ) : (
          <Search className="size-3.5" strokeWidth={2} />
        )}
        Caută cod CPV
      </button>

      {error && (
        <div className="rounded-eos-md border border-eos-error/30 bg-eos-error-soft p-3 text-[12px] text-eos-error">
          {error}
        </div>
      )}

      {suggestions && (
        <div className="space-y-2">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Top {suggestions.length} sugestii
          </p>
          {suggestions.length === 0 ? (
            <p className="rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft p-3 text-[12px] text-eos-warning">
              Nicio sugestie cu score suficient de mare. Reformulează descrierea cu mai multe
              detalii sau verifică manual catalogul EU CPV.
            </p>
          ) : (
            suggestions.map((s) => (
              <div
                key={s.code}
                className="flex items-start justify-between gap-3 rounded-eos-md border border-eos-border bg-eos-surface-elevated p-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[13px] font-semibold text-eos-text">{s.code}</span>
                    <span className="inline-flex items-center rounded-sm border border-eos-primary/30 bg-eos-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-primary">
                      score {(s.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-[12.5px] leading-[1.45] text-eos-text">{s.description}</p>
                  {s.matchedKeywords.length > 0 && (
                    <p className="text-[10.5px] text-eos-text-muted">
                      Cuvinte găsite: {s.matchedKeywords.slice(0, 4).join(", ")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(s.code)
                  }}
                  className="shrink-0 rounded-eos-sm border border-eos-border bg-eos-surface px-2 py-1 font-mono text-[11px] text-eos-text-muted hover:border-eos-border-strong hover:text-eos-text"
                >
                  Copiază
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  )
}
