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
    <div className="animate-pulse rounded-eos-lg border border-eos-border bg-eos-surface px-4 py-3.5">
      <div className="mb-3 h-3 w-40 rounded-sm bg-white/[0.04]" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-3 w-32 rounded-sm bg-white/[0.04]" />
            <div className="h-3 w-8 rounded-sm bg-white/[0.04]" />
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
    <div className="relative overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-eos-primary/70" aria-hidden />
      <div className="px-4 py-3.5">
        <p className="mb-3 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Ce am construit pentru tine
        </p>
        <ul className="divide-y divide-eos-border-subtle">
          {metrics.map((m) => (
            <li key={m.label} className="flex items-center justify-between gap-2 py-2">
              <span className="flex items-center gap-2 text-[12.5px] text-eos-text-muted">
                {m.icon}
                {m.label}
              </span>
              <span className="font-mono text-[12px] font-semibold tabular-nums text-eos-text">
                {m.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
