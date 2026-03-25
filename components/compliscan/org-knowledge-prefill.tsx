"use client"

// MULT B — Progressive Data Enrichment
// Panou compact "Confirmat anterior" pentru wizard-uri.
// Afișează datele confirmate din orgKnowledge relevante contextului
// și oferă buton de preluare în câmpul curent.

import { useEffect, useState } from "react"
import { BookOpen, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"

import type { OrgKnowledgeCategory, OrgKnowledgeItem } from "@/lib/compliance/org-knowledge"
import { KNOWLEDGE_CATEGORY_LABELS } from "@/lib/compliance/org-knowledge"

type Props = {
  /** Categorii relevante pentru contextul curent */
  categories: OrgKnowledgeCategory[]
  /** Callback când userul vrea să preia datele ca text prefill */
  onPrefill?: (text: string) => void
  /** Label pentru butonul de preluare */
  prefillLabel?: string
  className?: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function OrgKnowledgePrefill({
  categories,
  onPrefill,
  prefillLabel = "Preia în câmp",
  className = "",
}: Props) {
  const [items, setItems] = useState<OrgKnowledgeItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch("/api/org-knowledge", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { knowledge?: { items: OrgKnowledgeItem[] } } | null) => {
        const all = data?.knowledge?.items ?? []
        setItems(all.filter((i) => categories.includes(i.category)))
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [categories.join(",")]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded || items.length === 0) return null

  const grouped = categories.reduce<Record<string, OrgKnowledgeItem[]>>((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat)
    if (catItems.length > 0) acc[cat] = catItems
    return acc
  }, {})

  function buildPrefillText(): string {
    return Object.entries(grouped)
      .map(([cat, catItems]) => {
        const label = KNOWLEDGE_CATEGORY_LABELS[cat as OrgKnowledgeCategory]
        return `${label}: ${catItems.map((i) => i.value).join(", ")}`
      })
      .join("\n")
  }

  const staleCount = items.filter((i) => i.stale).length

  return (
    <div className={`rounded-eos-md border border-eos-primary/20 bg-eos-primary/5 ${className}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <BookOpen className="size-3.5 shrink-0 text-eos-primary" strokeWidth={2} />
        <span className="flex-1 text-xs font-semibold text-eos-primary">
          Confirmat anterior — {items.length} {items.length === 1 ? "element" : "elemente"}
        </span>
        {staleCount > 0 && (
          <span className="rounded-full bg-eos-warning/20 px-2 py-0.5 text-[10px] font-medium text-eos-warning">
            {staleCount} vechi
          </span>
        )}
        {expanded ? (
          <ChevronUp className="size-3.5 shrink-0 text-eos-text-muted" strokeWidth={2} />
        ) : (
          <ChevronDown className="size-3.5 shrink-0 text-eos-text-muted" strokeWidth={2} />
        )}
      </button>

      {expanded && (
        <div className="border-t border-eos-primary/10 px-3 pb-3 pt-2 space-y-3">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-eos-text-muted">
                {KNOWLEDGE_CATEGORY_LABELS[cat as OrgKnowledgeCategory]}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {catItems.map((item) => (
                  <span
                    key={item.id}
                    title={`${item.sourceLabel} · ${formatDate(item.confirmedAtISO)}`}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      item.stale
                        ? "bg-eos-warning/10 text-eos-warning ring-1 ring-eos-warning/20"
                        : "bg-eos-primary/10 text-eos-primary ring-1 ring-eos-primary/20"
                    }`}
                  >
                    {item.value}
                    {item.stale && <RefreshCw className="size-2.5" strokeWidth={2.5} />}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-eos-text-muted">
                {catItems[0].sourceLabel} · {formatDate(catItems[0].confirmedAtISO)}
              </p>
            </div>
          ))}

          {onPrefill && (
            <button
              type="button"
              onClick={() => onPrefill(buildPrefillText())}
              className="mt-1 inline-flex items-center gap-1.5 rounded-eos-md border border-eos-primary/30 bg-eos-surface px-3 py-1.5 text-xs font-medium text-eos-primary transition hover:bg-eos-primary/10"
            >
              {prefillLabel}
            </button>
          )}

          {staleCount > 0 && (
            <p className="text-[10px] text-eos-warning">
              {staleCount} {staleCount === 1 ? "element depășit" : "elemente depășite"} (mai vechi de 6 luni) — verifică înainte de a prelua.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
