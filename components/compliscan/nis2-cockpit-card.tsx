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
      <div className="flex items-center gap-2 rounded-eos-lg border border-eos-border bg-eos-surface px-4 py-2.5">
        <Loader2 className="size-3.5 animate-spin text-eos-text-muted" strokeWidth={2} />
        <span className="font-mono text-[11px] text-eos-text-muted">Se încarcă pachetul NIS2</span>
      </div>
    )
  }

  if (state.status === "error" || !state.payload.applicable) return null

  const { nis2Package, findings, exportReady } = state.payload
  const topGap = nis2Package.gaps[0] ?? null
  const hasFindings = findings.length > 0

  return (
    <section className="relative overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
      <span
        className={`absolute left-0 top-0 bottom-0 w-[3px] ${hasFindings ? "bg-eos-warning" : "bg-eos-success"}`}
        aria-hidden
      />
      <div className="px-4 py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              NIS2 rollout
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              {hasFindings ? (
                <AlertTriangle className="size-3.5 text-eos-warning" strokeWidth={2} />
              ) : (
                <ShieldCheck className="size-3.5 text-eos-success" strokeWidth={2} />
              )}
              <h2
                data-display-text="true"
                className="font-display text-[14.5px] font-semibold leading-tight tracking-[-0.015em] text-eos-text"
              >
                {hasFindings ? "Ai gap-uri NIS2 active" : "Pachetul NIS2 este stabil"}
              </h2>
            </div>
            <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-eos-text-muted">
              {nis2Package.handoffNote}
            </p>
          </div>
          {cta && (
            <Link
              href={cta.href}
              className="inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-eos-sm border border-eos-border bg-white/[0.02] px-3 text-[12px] font-medium text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
            >
              {cta.label}
              <ArrowRight className="size-3" strokeWidth={2} />
            </Link>
          )}
        </div>

        <div className="mt-3 grid gap-px overflow-hidden rounded-eos-sm bg-eos-border-subtle sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="DNSC" value={nis2Package.dnscStatus === "confirmed" ? "confirmat" : nis2Package.dnscStatus} tone={nis2Package.dnscStatus === "confirmed" ? "ok" : "warn"} />
          <Metric label="Assessment" value={nis2Package.assessmentScore === null ? "lipsă" : `${nis2Package.assessmentScore}%`} tone={nis2Package.assessmentScore !== null && nis2Package.assessmentScore >= 50 ? "ok" : "warn"} />
          <Metric label="Incidente deschise" value={String(nis2Package.openIncidents)} tone={nis2Package.openIncidents === 0 ? "ok" : "warn"} />
          <Metric label="Vendori critici" value={String(nis2Package.criticalVendors)} tone={nis2Package.criticalVendors === 0 ? "muted" : "warn"} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] ${
              exportReady
                ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
                : "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
            }`}
          >
            <ShieldEllipsis className="size-3" strokeWidth={2} />
            {exportReady ? "gata de handoff" : `${findings.length} gap${findings.length === 1 ? "" : "-uri"}`}
          </span>
          {topGap && (
            <span className="inline-flex rounded-sm border border-eos-border-subtle bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
              Top gap: {topGap.finding}
            </span>
          )}
        </div>
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
    <div className="bg-eos-surface px-3 py-2.5">
      <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">
        {label}
      </p>
      <p
        data-display-text="true"
        className={`mt-1 font-display text-[18px] font-medium leading-none tracking-[-0.02em] tabular-nums ${toneClass}`}
      >
        {value}
      </p>
    </div>
  )
}
