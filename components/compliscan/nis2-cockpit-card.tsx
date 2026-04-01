"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowRight, Loader2, ShieldCheck, ShieldEllipsis } from "lucide-react"

import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import type { ScanFinding } from "@/lib/compliance/types"

type Nis2PackagePayload = {
  applicable: boolean
  nis2Package: {
    applicable: boolean
    dnscStatus: string
    assessmentScore: number | null
    openIncidents: number
    criticalVendors: number
    maturityScore: number | null
    gaps: Array<{
      area: string
      finding: string
      priority: "critical" | "high" | "medium"
    }>
    handoffNote: string
  }
  findings: ScanFinding[]
  exportReady: boolean
}

type LoadState =
  | { status: "loading" }
  | { status: "ready"; payload: Nis2PackagePayload }
  | { status: "error" }

export function Nis2CockpitCard() {
  const [state, setState] = useState<LoadState>({ status: "loading" })

  useEffect(() => {
    let active = true
    fetch("/api/nis2/package", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: Nis2PackagePayload | null) => {
        if (!active) return
        if (!payload) {
          setState({ status: "error" })
          return
        }
        setState({ status: "ready", payload })
      })
      .catch(() => {
        if (!active) return
        setState({ status: "error" })
      })
    return () => {
      active = false
    }
  }, [])

  const cta = useMemo(() => {
    if (state.status !== "ready") return null
    const pkg = state.payload.nis2Package
    if (pkg.dnscStatus !== "confirmed") {
      return { label: "Înregistrează DNSC", href: dashboardRoutes.nis2Dnsc }
    }
    if (pkg.assessmentScore === null || pkg.assessmentScore < 50) {
      return { label: "Finalizează assessment", href: `${dashboardRoutes.nis2}?focus=assessment` }
    }
    if (pkg.openIncidents > 0) {
      return { label: "Gestionează incidentele", href: `${dashboardRoutes.nis2}?tab=incidents` }
    }
    if (pkg.maturityScore !== null && pkg.maturityScore < 40) {
      return { label: "Ridică maturitatea", href: dashboardRoutes.nis2Maturity }
    }
    return { label: "Deschide NIS2", href: dashboardRoutes.nis2 }
  }, [state])

  if (state.status === "loading") {
    return (
      <div className="rounded-eos-xl border border-eos-border bg-eos-surface-variant p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-eos-text-muted">
          <Loader2 className="size-4 animate-spin" strokeWidth={2} />
          Se încarcă pachetul NIS2
        </div>
      </div>
    )
  }

  if (state.status === "error" || !state.payload.applicable) return null

  const { nis2Package, findings, exportReady } = state.payload
  const topGap = nis2Package.gaps[0] ?? null

  return (
    <section className="rounded-eos-xl border border-eos-border bg-eos-surface-variant p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">NIS2 rollout</p>
          <div className="mt-2 flex items-center gap-2">
            {findings.length > 0 ? (
              <AlertTriangle className="size-4 text-eos-warning" strokeWidth={2} />
            ) : (
              <ShieldCheck className="size-4 text-eos-success" strokeWidth={2} />
            )}
            <h2 className="text-base font-semibold text-eos-text">
              {findings.length > 0 ? "Ai gap-uri NIS2 active" : "Pachetul NIS2 este stabil"}
            </h2>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-eos-text-tertiary">{nis2Package.handoffNote}</p>
        </div>
        {cta && (
          <Link
            href={cta.href}
            className="inline-flex items-center gap-2 rounded-eos-lg border border-eos-border bg-eos-surface-active px-4 py-2 text-sm font-medium text-eos-text transition-colors hover:bg-eos-surface-elevated"
          >
            {cta.label}
            <ArrowRight className="size-4" strokeWidth={2} />
          </Link>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="DNSC" value={nis2Package.dnscStatus === "confirmed" ? "confirmat" : nis2Package.dnscStatus} tone={nis2Package.dnscStatus === "confirmed" ? "ok" : "warn"} />
        <Metric label="Assessment" value={nis2Package.assessmentScore === null ? "lipsă" : `${nis2Package.assessmentScore}%`} tone={nis2Package.assessmentScore !== null && nis2Package.assessmentScore >= 50 ? "ok" : "warn"} />
        <Metric label="Incidente deschise" value={String(nis2Package.openIncidents)} tone={nis2Package.openIncidents === 0 ? "ok" : "warn"} />
        <Metric label="Vendori critici" value={String(nis2Package.criticalVendors)} tone={nis2Package.criticalVendors === 0 ? "muted" : "warn"} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
          exportReady
            ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
            : "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
        }`}>
          <ShieldEllipsis className="size-3.5" strokeWidth={2} />
          {exportReady ? "gata de handoff" : `${findings.length} gap${findings.length === 1 ? "" : "-uri"} active`}
        </span>
        {topGap && (
          <span className="inline-flex rounded-full border border-eos-border bg-eos-surface-active px-2.5 py-1 text-xs font-medium text-eos-text-tertiary">
            Top gap: {topGap.finding}
          </span>
        )}
      </div>
    </section>
  )
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "ok" | "warn" | "muted"
}) {
  const toneClass =
    tone === "ok"
      ? "text-eos-success"
      : tone === "warn"
        ? "text-eos-warning"
        : "text-eos-text"

  return (
    <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  )
}
