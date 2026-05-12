"use client"

// PatternDSearchLookup — Pattern D pentru EF-SEQUENCE (factură lipsă în
// secvență), EF-CPV-MISSING (cod CPV/NC8 lipsă), EF-006 (CUI invalid lookup).
//
// Flow: search input → API lookup ANAF / ERP / dictionar → results list →
// click "Folosește acest rezultat" → tranzitează la mark resolved.
//
// Faza 3.4 din fiscal-module-final-sprint-2026-05-12.md.

import { useState } from "react"
import { CheckCircle2, FileText, Loader2, Search } from "lucide-react"
import { toast } from "sonner"

import type { ScanFinding } from "@/lib/compliance/types"

type PatternDProps = {
  finding: ScanFinding
  onResolved: () => void
}

type LookupResult = {
  id: string
  primary: string
  secondary?: string
  metadata?: Record<string, string | number>
}

export function PatternDSearchLookup({ finding, onResolved }: PatternDProps) {
  const config = resolveLookupConfig(finding)
  const [query, setQuery] = useState(config.initialQuery)
  const [results, setResults] = useState<LookupResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSearch() {
    if (!query.trim()) {
      setError("Introdu un termen de căutare.")
      return
    }
    setSearching(true)
    setError(null)
    try {
      // Try POST first (sequence-gap, cpv-suggest endpoints expect POST)
      const isPostEndpoint = config.searchMethod === "POST"
      const res = isPostEndpoint
        ? await fetch(config.searchEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: query.trim(), findingId: finding.id }),
          })
        : await fetch(`${config.searchEndpoint}?q=${encodeURIComponent(query.trim())}`, {
            cache: "no-store",
          })
      if (!res.ok) throw new Error("Căutarea a eșuat.")
      const raw = (await res.json()) as Record<string, unknown>
      // Adapter — endpoint-urile au shape diferit (results / suggestions / found / gaps)
      const items = normalizeResults(raw, finding.findingTypeId ?? "")
      setResults(items)
      if (items.length === 0) {
        toast.info("Niciun rezultat găsit. Încearcă alt termen.")
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Eroare căutare."
      setError(msg)
      toast.error(msg)
    } finally {
      setSearching(false)
    }
  }

  function normalizeResults(raw: Record<string, unknown>, typeId: string): LookupResult[] {
    // Heuristic — endpoint-urile fiscale au shape-uri diverse. Mapăm la
    // LookupResult comun.
    if (Array.isArray(raw.results)) return raw.results as LookupResult[]
    if (Array.isArray(raw.suggestions)) {
      return (raw.suggestions as Array<{ code?: string; label?: string; description?: string }>).map(
        (s, idx) => ({
          id: s.code ?? String(idx),
          primary: s.label ?? s.code ?? "—",
          secondary: s.description,
        }),
      )
    }
    if (typeId === "EF-SEQUENCE" && Array.isArray(raw.gaps)) {
      return (raw.gaps as Array<{ number?: string; series?: string }>).map((g, idx) => ({
        id: g.number ?? String(idx),
        primary: `Factură lipsă: ${g.series ?? ""}${g.number ?? ""}`,
        secondary: "Neidentificată în ERP. Generăm notă explicativă.",
      }))
    }
    if (raw.found && typeof raw.found === "object") {
      const found = raw.found as Record<string, unknown>
      return [
        {
          id: String(found.cui ?? found.id ?? "1"),
          primary: String(found.denumire ?? found.name ?? "Rezultat"),
          secondary: String(found.cuiNorm ?? found.tva ?? ""),
        },
      ]
    }
    return []
  }

  async function handleApply() {
    if (!selectedId) {
      setError("Selectează un rezultat din listă.")
      return
    }
    const selected = results.find((r) => r.id === selectedId)
    if (!selected) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/findings/${encodeURIComponent(finding.id)}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence: {
            type: "search-result",
            findingTypeId: finding.findingTypeId,
            selectedResult: selected,
          },
        }),
      })
      if (!res.ok) throw new Error("Nu am putut salva rezultatul.")
      toast.success("Rezultat aplicat + finding rezolvat.")
      onResolved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-eos-md border border-eos-primary/20 bg-eos-primary/[0.04] p-3">
        <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
          <Search className="size-3.5" strokeWidth={1.5} />
          {config.title}
        </p>
        <p className="mt-1 text-[12.5px] leading-[1.55] text-eos-text-muted">{config.hint}</p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={config.placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSearch()
          }}
          disabled={searching || submitting}
          className="flex-1 rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-1.5 text-[12.5px] text-eos-text outline-none focus:border-eos-primary disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => void handleSearch()}
          disabled={searching || submitting}
          className="inline-flex items-center gap-1.5 rounded-eos-sm bg-eos-primary px-3 py-1.5 text-[12px] font-semibold text-eos-primary-foreground transition hover:bg-eos-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {searching ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <Search className="size-3.5" strokeWidth={2} />
          )}
          Caută
        </button>
      </div>

      {results.length > 0 && (
        <section className="overflow-hidden rounded-eos-md border border-eos-border bg-eos-surface">
          <header className="border-b border-eos-border-subtle px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            {results.length} rezultate
          </header>
          <div className="max-h-72 divide-y divide-eos-border-subtle overflow-y-auto">
            {results.map((r) => (
              <label
                key={r.id}
                className={`flex cursor-pointer items-start gap-2 px-3 py-2 transition ${
                  selectedId === r.id ? "bg-eos-primary/[0.06]" : "hover:bg-eos-surface-variant/40"
                }`}
              >
                <input
                  type="radio"
                  name="searchResult"
                  value={r.id}
                  checked={selectedId === r.id}
                  onChange={() => setSelectedId(r.id)}
                  className="mt-0.5 size-3.5 shrink-0 accent-eos-primary"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-eos-text">{r.primary}</p>
                  {r.secondary && (
                    <p className="mt-0.5 truncate text-[11px] text-eos-text-tertiary">
                      {r.secondary}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </section>
      )}

      {selectedId && (
        <button
          type="button"
          onClick={() => void handleApply()}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-eos-md bg-eos-primary px-4 py-2 text-[13px] font-semibold text-eos-primary-foreground shadow-sm transition hover:bg-eos-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" strokeWidth={2} />
              Aplic…
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4" strokeWidth={2} />
              Folosește acest rezultat + marchez rezolvat
            </>
          )}
        </button>
      )}

      {error && (
        <div className="rounded-eos-md border border-eos-error/30 bg-eos-error-soft px-3 py-2 text-[12px] text-eos-error">
          {error}
        </div>
      )}

      {config.fallbackHint && results.length === 0 && !searching && (
        <div className="flex items-start gap-2 rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant/40 px-3 py-2 text-[11.5px] leading-[1.55] text-eos-text-tertiary">
          <FileText className="mt-0.5 size-3 shrink-0" strokeWidth={1.5} />
          <span>{config.fallbackHint}</span>
        </div>
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type LookupConfig = {
  title: string
  hint: string
  placeholder: string
  initialQuery: string
  searchEndpoint: string
  searchMethod?: "GET" | "POST"
  fallbackHint?: string
}

function resolveLookupConfig(finding: ScanFinding): LookupConfig {
  const typeId = finding.findingTypeId ?? ""
  if (typeId === "EF-SEQUENCE") {
    return {
      title: "Caută factură lipsă în ERP (SmartBill / Oblio)",
      hint: "Verificăm dacă factura ratată din serie există dar nu a fost transmisă, sau a fost anulată legal.",
      placeholder: "ex: F2026-0042",
      initialQuery: extractMissingInvoice(finding) ?? "",
      searchEndpoint: "/api/fiscal/sequence-gap",
      searchMethod: "POST",
      fallbackHint:
        "Dacă factura nu există în ERP, generăm o notă explicativă „serie ratată” pentru audit log.",
    }
  }
  if (typeId === "EF-CPV-MISSING") {
    return {
      title: "Caută cod CPV / NC8 pentru articol",
      hint: "AI sugerează top 3 coduri CPV pe baza descrierii articolului. Click „Folosește” să mark resolved.",
      placeholder: "ex: servicii consultanță IT",
      initialQuery: "",
      searchEndpoint: "/api/fiscal/cpv-suggest",
      searchMethod: "POST",
    }
  }
  if (typeId === "EF-006") {
    return {
      title: "Lookup CUI la ANAF API public",
      hint: "Verificăm CUI-ul clientului contra ANAF — denumire oficială, status TVA, sector CAEN.",
      placeholder: "ex: RO12345678",
      initialQuery: extractCui(finding) ?? "",
      searchEndpoint: "/api/anaf/lookup",
      searchMethod: "GET",
    }
  }
  return {
    title: "Căutare",
    hint: "Caută datele necesare pentru rezolvare.",
    placeholder: "Introdu termen",
    initialQuery: "",
    searchEndpoint: `/api/findings/${encodeURIComponent(finding.id)}/search`,
    searchMethod: "GET",
  }
}

function extractMissingInvoice(finding: ScanFinding): string | null {
  const re = /F[0-9A-Z\-]+/i
  const m = `${finding.title}\n${finding.detail}`.match(re)
  return m ? m[0] : null
}

function extractCui(finding: ScanFinding): string | null {
  const re = /\bRO?\d{4,12}\b/
  const m = `${finding.title}\n${finding.detail}`.match(re)
  return m ? m[0] : null
}
