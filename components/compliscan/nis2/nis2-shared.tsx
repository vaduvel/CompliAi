"use client"

import { Badge } from "@/components/evidence-os/Badge"
import type { Nis2Incident } from "@/lib/server/nis2-store"
import { buildDNSCReport } from "@/lib/compliance/dnsc-report"
import type { Nis2Answer, Nis2Result } from "@/lib/compliance/nis2-rules"

export type Nis2TabValue = "assessment" | "incidents" | "vendors"

export function normalizeNis2TabValue(value: string | null): Nis2TabValue {
  return value === "incidents" || value === "vendors" ? value : "assessment"
}


export function downloadDNSCReport(incident: Nis2Incident, orgName?: string) {
  const content = buildDNSCReport(incident, orgName)
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `raport-dnsc-${incident.id}-${new Date().toISOString().split("T")[0]}.md`
  a.click()
  URL.revokeObjectURL(url)
}


export const SEVERITY_BADGE: Record<string, "default" | "warning" | "destructive" | "success" | "outline"> = {
  low: "outline",
  medium: "warning",
  high: "destructive",
  critical: "destructive",
}

export const ANSWER_OPTIONS: { value: Nis2Answer; label: string }[] = [
  { value: "yes", label: "Da" },
  { value: "partial", label: "Parțial" },
  { value: "no", label: "Nu" },
  { value: "na", label: "N/A" },
]

export const INCIDENT_STATUS_LABELS: Record<string, string> = {
  open: "Deschis",
  "reported-24h": "Raportat 24h",
  "reported-72h": "Raportat 72h",
  closed: "Închis",
}

export function slaLabel(
  deadlineISO: string,
  totalMs: number
): { label: string; urgent: boolean; expired: boolean; progressPct: number } {
  const diff = new Date(deadlineISO).getTime() - Date.now()
  const progressPct = Math.min(100, Math.max(0, Math.round(((totalMs - diff) / totalMs) * 100)))
  if (diff < 0) return { label: "DEPĂȘIT", urgent: true, expired: true, progressPct: 100 }
  const totalSec = Math.floor(diff / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const urgent = diff < 4 * 3_600_000
  if (h < 1) return { label: `${m}min`, urgent: true, expired: false, progressPct }
  if (h < 24) return { label: `${h}h ${m}min`, urgent, expired: false, progressPct }
  const d = Math.floor(h / 24)
  const remH = h % 24
  return { label: `${d}z ${remH}h`, urgent: false, expired: false, progressPct }
}

export function buildAssessmentReturnEvidence(result: Nis2Result) {
  return `Assessment NIS2 salvat. Scor ${result.score}% (${result.maturityLabel}). Entitate ${result.entityType}.`
}


export function MaturityBadge({ label }: { label: Nis2Result["maturityLabel"] }) {
  const map: Record<string, { variant: "success" | "warning" | "destructive" | "outline"; text: string }> = {
    robust: { variant: "success", text: "Robust" },
    partial: { variant: "warning", text: "Parțial" },
    initial: { variant: "destructive", text: "Inițial" },
    "non-conform": { variant: "destructive", text: "Neconform" },
  }
  const { variant, text } = map[label]
  return <Badge variant={variant}>{text}</Badge>
}

