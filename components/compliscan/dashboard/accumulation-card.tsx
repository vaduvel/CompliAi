"use client"

import { useEffect, useState } from "react"
import { Archive, FileText, Building2, Clock, Package } from "lucide-react"
import type { AccumulationData } from "@/app/api/dashboard/accumulation/route"

type MetricRow = {
  icon: React.ReactNode
  label: string
  value: string
}

function formatValue(n: number | null, suffix?: string): string {
  if (n === null || n === undefined) return "—"
  if (suffix) return `${n} ${suffix}`
  return String(n)
}

function AccumulationSkeleton() {
  return (
    <div className="rounded-eos-lg border border-eos-border bg-eos-surface-secondary p-5 animate-pulse">
      <div className="mb-4 h-4 w-40 rounded bg-eos-border" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-3 w-32 rounded bg-eos-border" />
            <div className="h-3 w-8 rounded bg-eos-border" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function AccumulationCard() {
  const [data, setData] = useState<AccumulationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/accumulation", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: AccumulationData | null) => {
        if (d && !("error" in d)) setData(d)
      })
      .catch(() => {/* silently degrade */})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <AccumulationSkeleton />
  if (!data) return null

  const metrics: MetricRow[] = [
    {
      icon: <Archive className="size-3.5 text-eos-text-muted" strokeWidth={1.5} />,
      label: "dovezi salvate",
      value: formatValue(data.dovediiSalvate),
    },
    {
      icon: <FileText className="size-3.5 text-eos-text-muted" strokeWidth={1.5} />,
      label: "rapoarte generate",
      value: formatValue(data.rapoarteGenerate),
    },
    {
      icon: <Building2 className="size-3.5 text-eos-text-muted" strokeWidth={1.5} />,
      label: "furnizori monitorizați",
      value: formatValue(data.furnizoriMonitorizati),
    },
    {
      icon: <Clock className="size-3.5 text-eos-text-muted" strokeWidth={1.5} />,
      label: "luni de monitorizare continuă",
      value: formatValue(data.luniMonitorizare > 0 ? data.luniMonitorizare : null),
    },
    {
      icon: <Package className="size-3.5 text-eos-text-muted" strokeWidth={1.5} />,
      label: "ultimul Audit Pack",
      value: data.ultimulAuditPackZile !== null
        ? data.ultimulAuditPackZile === 0
          ? "azi"
          : `acum ${data.ultimulAuditPackZile} zile`
        : "—",
    },
  ]

  const hasAnyActivity = data.rapoarteGenerate > 0 ||
    (data.dovediiSalvate !== null && data.dovediiSalvate > 0) ||
    data.furnizoriMonitorizati > 0 ||
    data.ultimulAuditPackZile !== null

  if (!hasAnyActivity) return null

  return (
    <div className="rounded-eos-lg border border-eos-border bg-eos-surface-secondary p-5">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-eos-text-muted">
        Ce am construit pentru tine
      </p>
      <ul className="space-y-2.5">
        {metrics.map((m) => (
          <li key={m.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-xs text-eos-text-secondary">
              {m.icon}
              {m.label}
            </span>
            <span className="text-xs font-semibold tabular-nums text-eos-text-primary">
              {m.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
