"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Clock, RefreshCw, Trash2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { Badge } from "@/components/evidence-os/Badge"
import type { OrgKnowledge, OrgKnowledgeCategory, OrgKnowledgeItem } from "@/lib/compliance/org-knowledge"
import { KNOWLEDGE_CATEGORY_LABELS } from "@/lib/compliance/org-knowledge"

type OrgKnowledgePanelProps = {
  /** Dacă true, afișăm doar categoriile cu date (compact mode pentru wizard-uri) */
  compact?: boolean
  /** Categorii de afișat (toate dacă lipsește) */
  categories?: OrgKnowledgeCategory[]
}

export function OrgKnowledgePanel({ compact = false, categories }: OrgKnowledgePanelProps) {
  const [knowledge, setKnowledge] = useState<OrgKnowledge | null>(null)
  const [hasStale, setHasStale] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch("/api/org-knowledge")
      .then((r) => r.ok ? r.json() : null)
      .then((data: { knowledge: OrgKnowledge; hasStale: boolean } | null) => {
        if (data) {
          setKnowledge(data.knowledge)
          setHasStale(data.hasStale)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function removeItem(id: string) {
    const res = await fetch(`/api/org-knowledge?id=${id}`, { method: "DELETE" })
    if (res.ok && knowledge) {
      setKnowledge({ ...knowledge, items: knowledge.items.filter((i) => i.id !== id) })
    }
  }

  async function markReviewed(item: OrgKnowledgeItem) {
    const res = await fetch("/api/org-knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{
          category: item.category,
          value: item.value,
          source: "manual",
          sourceLabel: `Reconfirmat la ${new Date().toLocaleDateString("ro-RO")}`,
          confidence: item.confidence,
        }],
      }),
    })
    if (res.ok) {
      const data = await res.json() as { knowledge: OrgKnowledge }
      setKnowledge(data.knowledge)
      setHasStale(data.knowledge.items.some((i) => i.stale))
    }
  }

  if (loading) return null
  if (!knowledge || knowledge.items.length === 0) {
    if (compact) return null
    return (
      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="py-8 text-center text-sm text-eos-text-muted">
          Niciun dato confirmat încă. Scaneaza site-ul sau adaugă un vendor pentru a începe.
        </CardContent>
      </Card>
    )
  }

  const activeCategories = (categories ?? Object.keys(KNOWLEDGE_CATEGORY_LABELS) as OrgKnowledgeCategory[])
    .filter((cat) => knowledge.items.some((i) => i.category === cat))

  if (compact && activeCategories.length === 0) return null

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-eos-text">Profil operațional confirmat</CardTitle>
          {hasStale && (
            <Badge variant="warning" className="gap-1 text-[10px] normal-case tracking-normal">
              <Clock className="size-3" strokeWidth={2} />
              Date vechi de reconfirmat
            </Badge>
          )}
        </div>
        <p className="text-sm text-eos-text-muted">
          Date confirmate anterior — reutilizate automat în documente și evaluări.
        </p>
      </CardHeader>

      <CardContent className="space-y-2">
        {activeCategories.map((cat) => {
          const items = knowledge.items.filter((i) => i.category === cat)
          const isOpen = expanded[cat] ?? !compact
          const staleCount = items.filter((i) => i.stale).length

          return (
            <div key={cat} className="rounded-eos-sm border border-eos-border">
              <button
                type="button"
                onClick={() => setExpanded((prev) => ({ ...prev, [cat]: !isOpen }))}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-eos-text hover:bg-eos-bg-inset"
              >
                <span className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown className="size-3.5 text-eos-text-muted" strokeWidth={2} />
                  ) : (
                    <ChevronRight className="size-3.5 text-eos-text-muted" strokeWidth={2} />
                  )}
                  {KNOWLEDGE_CATEGORY_LABELS[cat]}
                  <span className="rounded-full bg-eos-bg-inset px-1.5 py-0.5 text-[10px] text-eos-text-muted">
                    {items.length}
                  </span>
                </span>
                {staleCount > 0 && (
                  <span className="text-[10px] text-eos-warning">{staleCount} vechi</span>
                )}
              </button>

              {isOpen && (
                <div className="divide-y divide-eos-border border-t border-eos-border">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start justify-between gap-2 px-3 py-2 ${
                        item.stale ? "bg-eos-warning-soft" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-eos-text">{item.value}</p>
                        <p className="mt-0.5 text-[11px] text-eos-text-muted">
                          {item.stale ? (
                            <span className="flex items-center gap-1 text-eos-warning">
                              <AlertTriangle className="size-3 shrink-0" strokeWidth={2} />
                              {item.sourceLabel} · Nerevizuit &gt;6 luni
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="size-3 shrink-0 text-eos-success" strokeWidth={2} />
                              {item.sourceLabel}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {item.stale && (
                          <button
                            type="button"
                            onClick={() => markReviewed(item)}
                            title="Marchează ca revizuit"
                            className="rounded p-1 text-eos-warning hover:bg-eos-warning-soft"
                          >
                            <RefreshCw className="size-3.5" strokeWidth={2} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          title="Șterge"
                          className="rounded p-1 text-eos-text-muted hover:bg-eos-error-soft hover:text-eos-error"
                        >
                          <Trash2 className="size-3.5" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ── Compact inline version for wizards ──────────────────────────────────────

type ConfirmedPreviouslyProps = {
  category: OrgKnowledgeCategory
  knowledge: OrgKnowledge | undefined
  onUse?: (value: string) => void
}

export function ConfirmedPreviously({ category, knowledge, onUse }: ConfirmedPreviouslyProps) {
  const items = (knowledge?.items ?? []).filter((i) => i.category === category)
  if (items.length === 0) return null

  return (
    <div className="rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-eos-text-muted">
        Confirmat anterior
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.slice(0, 8).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onUse?.(item.value)}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors hover:border-eos-primary hover:text-eos-primary ${
              item.stale
                ? "border-eos-warning/20 bg-eos-warning-soft text-eos-warning"
                : "border-eos-border bg-eos-surface text-eos-text"
            }`}
            title={item.sourceLabel}
          >
            {item.value}
            {item.stale && <Clock className="size-2.5 text-eos-warning" strokeWidth={2} />}
          </button>
        ))}
      </div>
    </div>
  )
}
