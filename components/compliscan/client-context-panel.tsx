"use client"

// P2 — Client context panel.
// Shown at /portfolio/client/[orgId] — lets partner view a client's
// compliance status without switching workspace permanently.

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Shield,
  Users,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { BATCH_ACTION_LABELS, type BatchActionType } from "@/lib/compliance/batch-actions"
import { dashboardFindingRoute, dashboardRoutes } from "@/lib/compliscan/dashboard-routes"

// ── Types (mirrors /api/partner/clients/[orgId] response) ─────────────────────

type ComplianceSummary = {
  score: number
  riskLabel: string
  openAlerts: number
  redAlerts: number
  scannedDocuments: number
  gdprProgress: number
  highRisk: number
  efacturaConnected: boolean
  aiSystemsCount: number
}

type OpenFinding = {
  id: string
  title: string
  category: string
  severity: string
}

type Nis2Summary = {
  dnscRegistrationStatus: string
  incidentsCount: number
  openIncidentsCount: number
  vendorsCount: number
  hasAssessment: boolean
  assessmentScore: number | null
}

type VendorReviewSummary = {
  total: number
  open: number
  closed: number
  overdue: number
  critical: number
  needsContext: number
}

type ClientContextData = {
  orgId: string
  orgName: string
  role: string
  compliance: ComplianceSummary | null
  openFindings: OpenFinding[]
  nis2: Nis2Summary
  vendorReviews: VendorReviewSummary
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  return score >= 70 ? "text-eos-success" : score >= 40 ? "text-eos-warning" : "text-eos-error"
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444"
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <svg viewBox="0 0 72 72" className="size-20 -rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-eos-surface-elevated" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
      />
    </svg>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls =
    severity === "critical"
      ? "bg-eos-error-soft text-eos-error"
      : severity === "high"
        ? "bg-eos-warning/10 text-eos-warning"
        : "bg-eos-surface-elevated text-eos-text-tertiary"
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {severity}
    </span>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function ClientContextPanel({
  orgId,
  focusedFindingId,
}: {
  orgId: string
  focusedFindingId?: string
}) {
  const [data, setData] = useState<ClientContextData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enteringWorkspace, setEnteringWorkspace] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)

  const loadContext = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/partner/clients/${orgId}`, { cache: "no-store" })
      if (!res.ok) {
        const payload = (await res.json()) as { error?: string }
        throw new Error(payload.error ?? "Nu am putut încărca contextul firmei.")
      }
      setData((await res.json()) as ClientContextData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută.")
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    void loadContext()
  }, [loadContext])

  async function openOrgDestination(destination: string) {
    setEnteringWorkspace(true)
    try {
      const res = await fetch("/api/auth/select-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceMode: "org", orgId }),
      })
      if (!res.ok) {
        const payload = (await res.json()) as { error?: string }
        toast.error(payload.error ?? "Nu am putut intra în firmă.")
        return
      }
      window.location.assign(destination)
    } finally {
      setEnteringWorkspace(false)
    }
  }

  async function handleEnterWorkspace() {
    await openOrgDestination(dashboardRoutes.home)
  }

  async function handleOpenFinding(findingId: string) {
    await openOrgDestination(dashboardFindingRoute(findingId))
  }

  async function handleQuickAction(actionType: BatchActionType) {
    setBatchLoading(true)
    try {
      const res = await fetch("/api/portfolio/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType, orgIds: [orgId], config: { orgNames: { [orgId]: data?.orgName ?? orgId } } }),
      })
      const payload = (await res.json()) as { ok?: boolean; message?: string; error?: string }
      if (!res.ok || !payload.ok) {
        toast.error(payload.error ?? "Acțiunea a eșuat.")
        return
      }
      toast.success(payload.message ?? "Acțiune lansată.")
    } catch {
      toast.error("Eroare la lansarea acțiunii.")
    } finally {
      setBatchLoading(false)
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-eos-text-tertiary" />
      </div>
    )
  }

  // ── Error ──
  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Link
          href="/portfolio"
          className="flex items-center gap-1.5 text-sm text-eos-text-tertiary hover:text-eos-text-muted"
        >
          <ArrowLeft className="size-4" />
          Înapoi la portofoliu
        </Link>
        <div className="rounded-eos-lg border border-eos-error/20 bg-eos-error-soft p-6 text-sm text-eos-error">
          {error ?? "Firma nu a fost găsită."}
        </div>
      </div>
    )
  }

  const c = data.compliance
  const focusedFinding = focusedFindingId
    ? data.openFindings.find((finding) => finding.id === focusedFindingId) ?? null
    : null
  const priorityFinding = focusedFinding ?? data.openFindings[0] ?? null

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {focusedFindingId ? (
        <div className="rounded-eos-lg border border-eos-primary/30 bg-eos-primary/[0.08] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
                Ai venit din Alerte
              </p>
              <h2 className="mt-1 text-base font-semibold text-eos-text">
                {focusedFinding?.title ?? "Finding selectat"}
              </h2>
              <p className="mt-1 text-xs text-eos-text-tertiary">
                {focusedFinding
                  ? "Deschide cockpit-ul cazului sau intră în firmă doar dacă ai nevoie de context complet."
                  : "Finding-ul este selectat din alertă. Îl deschidem direct în cockpit după schimbarea contextului."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleOpenFinding(focusedFindingId)}
              disabled={enteringWorkspace}
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-eos-sm bg-eos-primary px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
            >
              {enteringWorkspace ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
              Deschide finding-ul în cockpit
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Breadcrumb + actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/portfolio" className="text-eos-text-tertiary hover:text-eos-text-muted">
            Portofoliu
          </Link>
          <ChevronRight className="size-3.5 text-eos-text-tertiary" />
          <span className="font-medium text-eos-text">{data.orgName}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadContext()}
            className="flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface-active px-3 py-1.5 text-xs font-medium text-eos-text-muted transition-all hover:border-eos-border-strong hover:text-eos-text"
          >
            <RefreshCw className="size-3.5" />
            Reîncarcă
          </button>

          {!focusedFindingId && priorityFinding ? (
            <button
              type="button"
              onClick={() => void handleOpenFinding(priorityFinding.id)}
              disabled={enteringWorkspace}
              className="flex items-center gap-1.5 rounded-eos-sm bg-eos-primary px-4 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
            >
              {enteringWorkspace ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
              Deschide cazul prioritar
            </button>
          ) : null}

          <a
            href={`/trust/${orgId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface-active px-3 py-1.5 text-xs font-medium text-eos-text-muted transition-all hover:border-eos-border-strong hover:text-eos-text"
          >
            <ExternalLink className="size-3.5" />
            Trust Profile
          </a>

          <button
            type="button"
            onClick={() =>
              focusedFindingId
                ? void handleOpenFinding(focusedFindingId)
                : void handleEnterWorkspace()
            }
            disabled={enteringWorkspace}
            className={`flex items-center gap-1.5 rounded-eos-sm px-4 py-1.5 text-xs font-semibold transition-all disabled:opacity-60 ${
              focusedFindingId
                ? "border border-eos-primary/30 bg-eos-primary text-white hover:opacity-90"
                : "border border-eos-border bg-eos-surface-active text-eos-text-muted hover:border-eos-border-strong hover:text-eos-text"
            }`}
          >
            {enteringWorkspace ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
            {focusedFindingId ? "Deschide finding-ul" : "Intră în firmă"}
          </button>
        </div>
      </div>

      {/* ── Header card ── */}
      <div className="flex flex-wrap items-center gap-6 rounded-eos-lg border border-eos-border bg-eos-surface p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-eos-lg border border-eos-border bg-eos-surface-elevated">
            <Building2 className="size-6 text-eos-text-muted" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-eos-text">{data.orgName}</h1>
            <p className="text-xs text-eos-text-tertiary capitalize">{data.role}</p>
          </div>
        </div>

        {c ? (
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center">
              <ScoreRing score={c.score} />
              <div className="absolute flex flex-col items-center">
                <span className={`text-lg font-bold leading-none ${scoreColor(c.score)}`}>{c.score}</span>
                <span className="text-[9px] text-eos-text-tertiary">scor</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className={`text-sm font-semibold ${scoreColor(c.score)}`}>{c.riskLabel}</p>
              <p className="text-xs text-eos-text-tertiary">
                {c.openAlerts} alerte · {c.scannedDocuments} documente
              </p>
              <p className="text-xs text-eos-text-tertiary">
                GDPR {c.gdprProgress}% · {c.aiSystemsCount} sisteme AI
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-eos-text-tertiary">Nicio scanare efectuată încă.</p>
        )}
      </div>

      {/* ── 3-col grid: findings + NIS2 + vendors ── */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* Findings */}
        <div className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-eos-warning" strokeWidth={2} />
              <p className="text-sm font-semibold text-eos-text">Findings deschise</p>
            </div>
            <span className="rounded-full bg-eos-surface-elevated px-2 py-0.5 text-[11px] font-medium text-eos-text-muted">
              {data.openFindings.length}
            </span>
          </div>

          {data.openFindings.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle2 className="size-8 text-eos-success" strokeWidth={1.5} />
              <p className="text-xs text-eos-text-tertiary">Fără findings deschise</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.openFindings.slice(0, 6).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => void handleOpenFinding(f.id)}
                  disabled={enteringWorkspace}
                  className="block w-full space-y-1 rounded-eos-sm border border-eos-border-subtle bg-eos-surface-variant px-3 py-2 text-left transition-all hover:border-eos-primary/30 hover:bg-eos-primary/[0.04] disabled:opacity-60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium leading-snug text-eos-text">{f.title}</p>
                    <SeverityBadge severity={f.severity} />
                  </div>
                  <p className="text-[10px] uppercase tracking-wide text-eos-text-tertiary">{f.category}</p>
                </button>
              ))}
              {data.openFindings.length > 6 && (
                <p className="text-center text-[11px] text-eos-text-tertiary">
                  +{data.openFindings.length - 6} altele
                </p>
              )}
            </div>
          )}
        </div>

        {/* NIS2 */}
        <div className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="size-4 text-eos-primary" strokeWidth={2} />
            <p className="text-sm font-semibold text-eos-text">NIS2</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-eos-text-muted">Înregistrare DNSC</span>
              <span
                className={
                  data.nis2.dnscRegistrationStatus === "registered"
                    ? "font-medium text-eos-success"
                    : data.nis2.dnscRegistrationStatus === "in-progress"
                      ? "font-medium text-eos-warning"
                      : "text-eos-text-tertiary"
                }
              >
                {data.nis2.dnscRegistrationStatus === "registered"
                  ? "✓ Înregistrat"
                  : data.nis2.dnscRegistrationStatus === "in-progress"
                    ? "În curs"
                    : "Neînceput"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-eos-text-muted">Incidente</span>
              <span className={data.nis2.openIncidentsCount > 0 ? "font-medium text-eos-error" : "text-eos-text-tertiary"}>
                {data.nis2.openIncidentsCount > 0 ? `${data.nis2.openIncidentsCount} deschise` : data.nis2.incidentsCount > 0 ? `${data.nis2.incidentsCount} total` : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-eos-text-muted">Furnizori critici</span>
              <span className="text-eos-text-tertiary">{data.nis2.vendorsCount}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-eos-text-muted">Assessment</span>
              {data.nis2.hasAssessment ? (
                <span className="font-medium text-eos-success">
                  {data.nis2.assessmentScore !== null ? `${data.nis2.assessmentScore}%` : "Complet"}
                </span>
              ) : (
                <span className="text-eos-text-tertiary">Lipsă</span>
              )}
            </div>
          </div>
        </div>

        {/* Vendor reviews */}
        <div className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Users className="size-4 text-eos-text-muted" strokeWidth={2} />
            <p className="text-sm font-semibold text-eos-text">Furnizori</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-eos-text-muted">Total reviews</span>
              <span className="text-eos-text-tertiary">{data.vendorReviews.total}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-eos-text-muted">Deschise</span>
              <span className={data.vendorReviews.open > 0 ? "font-medium text-eos-warning" : "text-eos-text-tertiary"}>
                {data.vendorReviews.open}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-eos-text-muted">Întârziate</span>
              <span className={data.vendorReviews.overdue > 0 ? "font-medium text-eos-error" : "text-eos-text-tertiary"}>
                {data.vendorReviews.overdue}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-eos-text-muted">Critice</span>
              <span className={data.vendorReviews.critical > 0 ? "font-medium text-eos-error" : "text-eos-text-tertiary"}>
                {data.vendorReviews.critical}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-eos-text-muted">Necesită context</span>
              <span className={data.vendorReviews.needsContext > 0 ? "font-medium text-eos-warning" : "text-eos-text-tertiary"}>
                {data.vendorReviews.needsContext}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <Zap className="size-4 text-eos-primary" strokeWidth={2} />
          <p className="text-sm font-semibold text-eos-text">Acțiuni rapide</p>
          <span className="text-xs text-eos-text-tertiary">— fără a intra în firma clientului</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.entries(BATCH_ACTION_LABELS) as [BatchActionType, string][]).map(([type, label]) => (
            <button
              key={type}
              type="button"
              disabled={batchLoading}
              onClick={() => void handleQuickAction(type)}
              className="flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface-active px-3 py-2 text-xs font-medium text-eos-text-muted transition-all hover:border-eos-primary/30 hover:bg-eos-primary/5 hover:text-eos-text disabled:opacity-50"
            >
              {batchLoading ? <Loader2 className="size-3 animate-spin" /> : <FileText className="size-3" />}
              {label}
            </button>
          ))}

          <Link
            href="/dashboard/approvals"
            className="flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface-variant px-3 py-2 text-xs font-medium text-eos-text-muted transition-all hover:border-eos-border-strong hover:text-eos-text"
          >
            <CheckCircle2 className="size-3" />
            Coada de aprobare
          </Link>
        </div>
      </div>
    </div>
  )
}
