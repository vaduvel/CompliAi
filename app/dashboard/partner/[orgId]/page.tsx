"use client"

// Sprint 12 — Partner Portal drill-down per client
// Scor detaliat, findings deschise, stare DNSC, descărcă dosar control.

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  GitPullRequestArrow,
  Shield,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card } from "@/components/evidence-os/Card"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { LoadingScreen, ErrorScreen } from "@/components/compliscan/route-sections"

type FindingSummary = {
  id: string
  title: string
  category: string
  severity: string
}

type VendorReviewItem = {
  id: string
  vendorName: string
  status: string
  urgency: string
  category: string
  reviewCase: string | null
  nextReviewDueISO: string | null
  reviewCount: number
}

type VendorReviewSummary = {
  total: number
  open: number
  closed: number
  overdue: number
  critical: number
  needsContext: number
  reviews: VendorReviewItem[]
}

type ClientDetail = {
  orgId: string
  orgName: string
  role: string
  compliance: {
    score: number
    riskLabel: string
    openAlerts: number
    redAlerts: number
    scannedDocuments: number
    gdprProgress: number
    highRisk: number
    efacturaConnected: boolean
    aiSystemsCount: number
  } | null
  openFindings: FindingSummary[]
  nis2: {
    dnscRegistrationStatus: string
    incidentsCount: number
    openIncidentsCount: number
    vendorsCount: number
    hasAssessment: boolean
    assessmentScore: number | null
  }
  vendorReviews?: VendorReviewSummary
}

const DNSC_STATUS_LABEL: Record<string, string> = {
  "not-started": "Neînceput",
  "in-progress": "În progres",
  "submitted":   "Trimis",
  "confirmed":   "Confirmat",
}

const DNSC_STATUS_VARIANT: Record<string, "secondary" | "warning" | "default" | "success"> = {
  "not-started": "secondary",
  "in-progress": "warning",
  "submitted":   "default",
  "confirmed":   "success",
}

function MetricBox({ label, value, alert }: { label: string; value: string | number; alert?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3">
      <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary">{label}</span>
      <span className={`text-xl font-semibold ${alert ? "text-eos-warning" : "text-eos-text"}`}>{value}</span>
    </div>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-400" : "bg-red-500"
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-eos-bg-inset">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
    </div>
  )
}

export default function PartnerClientDetailPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const router = useRouter()
  const [detail, setDetail] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingPack, setDownloadingPack] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/partner/clients/${orgId}`, { cache: "no-store" })
        if (!res.ok) {
          const data = (await res.json()) as { error?: string }
          throw new Error(data.error ?? "Nu am putut încărca detaliile clientului.")
        }
        setDetail(await res.json() as ClientDetail)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Eroare necunoscută.")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [orgId])

  async function handleDownloadAuditPack() {
    if (!detail) return
    setDownloadingPack(true)
    try {
      // Audit pack pentru org-ul partenerului curent (în contextul sesiunii active)
      // TODO Sprint 12+: audit pack cu orgId target, necesită endpoint dedicat
      const res = await fetch("/api/exports/audit-pack/bundle", { cache: "no-store" })
      if (!res.ok) throw new Error("Exportul a eșuat.")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `audit-pack-${detail.orgId}-${new Date().toISOString().split("T")[0]}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Eroare la descărcare.")
    } finally {
      setDownloadingPack(false)
    }
  }

  if (loading) return <LoadingScreen variant="section" />
  if (error) return <ErrorScreen message={error} variant="section" />
  if (!detail) return null

  const c = detail.compliance
  const nis2 = detail.nis2

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Partner Portal"
        title={detail.orgName}
        description={`Dosar de conformitate · ${detail.orgId}`}
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {detail.role}
            </Badge>
            {c && (
              <Badge
                variant={c.redAlerts > 0 ? "destructive" : "success"}
                dot
                className="normal-case tracking-normal"
              >
                {c.redAlerts > 0 ? `${c.redAlerts} alerte critice` : "Fără alerte critice"}
              </Badge>
            )}
          </>
        }
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="size-3.5" strokeWidth={2} />
              Înapoi
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => void handleDownloadAuditPack()}
              disabled={downloadingPack}
              className="gap-2"
            >
              <Download className="size-3.5" strokeWidth={2} />
              {downloadingPack ? "Se generează..." : "Dosar control"}
            </Button>
          </div>
        }
      />

      {/* ── Scor + metrici ─────────────────────────────────────────────────── */}
      {c ? (
        <Card className="border-eos-border bg-eos-surface">
          <div className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-eos-text">Scor Readiness</span>
              <span className="text-2xl font-semibold text-eos-text">{c.score}%</span>
            </div>
            <ScoreBar score={c.score} />
          </div>
          <div className="grid grid-cols-2 divide-x divide-eos-border-subtle border-t border-eos-border-subtle sm:grid-cols-5">
            <MetricBox label="Alerte" value={c.openAlerts} alert={c.redAlerts > 0} />
            <MetricBox label="GDPR" value={`${c.gdprProgress}%`} />
            <MetricBox label="Documente" value={c.scannedDocuments} />
            <MetricBox label="Sisteme AI" value={c.aiSystemsCount} />
            <MetricBox label="High-risk AI" value={c.highRisk} alert={c.highRisk > 0} />
          </div>
        </Card>
      ) : (
        <Card className="border-eos-border bg-eos-surface p-5">
          <div className="flex items-center gap-2 text-sm text-eos-text-muted">
            <FileText className="size-4" strokeWidth={2} />
            <span>Nicio stare de conformitate înregistrată pentru această organizație.</span>
          </div>
        </Card>
      )}

      {/* ── NIS2 ──────────────────────────────────────────────────────────── */}
      <Card className="border-eos-border bg-eos-surface">
        <div className="flex items-center justify-between border-b border-eos-border-subtle p-5">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-eos-text-muted" strokeWidth={2} />
            <h3 className="font-semibold text-eos-text">NIS2</h3>
          </div>
          <Badge
            variant={DNSC_STATUS_VARIANT[nis2.dnscRegistrationStatus] ?? "secondary"}
            className="normal-case tracking-normal text-[10px]"
          >
            DNSC: {DNSC_STATUS_LABEL[nis2.dnscRegistrationStatus] ?? nis2.dnscRegistrationStatus}
          </Badge>
        </div>
        <div className="grid grid-cols-2 divide-x divide-eos-border-subtle sm:grid-cols-4">
          <MetricBox label="Evaluare" value={nis2.hasAssessment ? `${nis2.assessmentScore ?? 0}%` : "Lipsă"} />
          <MetricBox label="Incidente" value={nis2.incidentsCount} alert={nis2.openIncidentsCount > 0} />
          <MetricBox label="Incidente deschise" value={nis2.openIncidentsCount} alert={nis2.openIncidentsCount > 0} />
          <MetricBox label="Furnizori" value={nis2.vendorsCount} />
        </div>
      </Card>

      {/* ── Vendor Reviews (V5.5) ────────────────────────────────────────── */}
      {detail.vendorReviews && detail.vendorReviews.total > 0 && (
        <Card className="divide-y divide-eos-border-subtle overflow-hidden border-eos-border bg-eos-surface">
          <div className="flex items-center justify-between bg-eos-bg-inset px-5 py-3">
            <div className="flex items-center gap-2">
              <GitPullRequestArrow className="size-4 text-eos-text-muted" strokeWidth={2} />
              <h3 className="text-sm font-semibold text-eos-text">
                Vendor Reviews ({detail.vendorReviews.total})
              </h3>
            </div>
            <div className="flex gap-2">
              {detail.vendorReviews.critical > 0 && (
                <Badge variant="destructive" className="text-[10px] normal-case tracking-normal">
                  {detail.vendorReviews.critical} critice
                </Badge>
              )}
              {detail.vendorReviews.overdue > 0 && (
                <Badge variant="destructive" className="text-[10px] normal-case tracking-normal">
                  {detail.vendorReviews.overdue} expirate
                </Badge>
              )}
              {detail.vendorReviews.needsContext > 0 && (
                <Badge variant="warning" className="text-[10px] normal-case tracking-normal">
                  {detail.vendorReviews.needsContext} necesită context
                </Badge>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-eos-border-subtle">
            <MetricBox label="Deschise" value={detail.vendorReviews.open} alert={detail.vendorReviews.critical > 0} />
            <MetricBox label="Închise" value={detail.vendorReviews.closed} />
            <MetricBox label="Expirate" value={detail.vendorReviews.overdue} alert={detail.vendorReviews.overdue > 0} />
          </div>
          {detail.vendorReviews.reviews.slice(0, 8).map((vr) => (
            <div key={vr.id} className="flex items-center justify-between gap-4 px-5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-eos-text">{vr.vendorName}</p>
                <p className="text-xs text-eos-text-muted capitalize">
                  {vr.category}
                  {vr.reviewCase && ` · Caz ${vr.reviewCase}`}
                  {vr.nextReviewDueISO && ` · Review: ${new Date(vr.nextReviewDueISO).toLocaleDateString("ro-RO")}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge
                  variant={
                    vr.urgency === "critical" ? "destructive" :
                    vr.urgency === "high" ? "warning" :
                    "secondary"
                  }
                  className="text-[10px] normal-case tracking-normal"
                >
                  {vr.urgency}
                </Badge>
                <Badge
                  variant={
                    vr.status === "closed" ? "success" :
                    vr.status === "overdue-review" ? "destructive" :
                    vr.status === "needs-context" ? "warning" :
                    "secondary"
                  }
                  className="text-[10px] normal-case tracking-normal"
                >
                  {vr.status === "closed" ? "Închis" :
                   vr.status === "overdue-review" ? "Expirat" :
                   vr.status === "needs-context" ? "Necesită context" :
                   vr.status === "awaiting-evidence" ? "Așteaptă dovadă" :
                   vr.status === "review-generated" ? "Review generat" :
                   vr.status}
                </Badge>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* ── Findings deschise ─────────────────────────────────────────────── */}
      {detail.openFindings.length > 0 && (
        <Card className="divide-y divide-eos-border-subtle overflow-hidden border-eos-border bg-eos-surface">
          <div className="flex items-center gap-2 bg-eos-bg-inset px-5 py-3">
            <ShieldAlert className="size-4 text-eos-warning" strokeWidth={2} />
            <h3 className="text-sm font-semibold text-eos-text">
              Findings deschise ({detail.openFindings.length})
            </h3>
          </div>
          {detail.openFindings.map((f) => (
            <div key={f.id} className="flex items-start justify-between gap-4 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-eos-text">{f.title}</p>
                <p className="text-xs text-eos-text-muted">{f.category}</p>
              </div>
              <Badge
                variant={f.severity === "high" || f.severity === "critical" ? "destructive" : "warning"}
                className="shrink-0 text-[10px] normal-case tracking-normal"
              >
                {f.severity}
              </Badge>
            </div>
          ))}
        </Card>
      )}

      {detail.openFindings.length === 0 && c && (
        <Card className="border-eos-border bg-eos-surface p-5">
          <div className="flex items-center gap-2 text-sm text-eos-text-muted">
            <CheckCircle2 className="size-4 text-emerald-500" strokeWidth={2} />
            <span>Niciun finding deschis activ.</span>
          </div>
        </Card>
      )}

      {/* ── Info footer ───────────────────────────────────────────────────── */}
      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <Users className="mb-1.5 size-4 text-eos-text-tertiary" strokeWidth={1.5} />
        <p className="font-medium text-eos-text">Date client</p>
        <p className="mt-0.5">
          Accesezi dosarul ca <strong>{detail.role}</strong>. Modificările se fac direct din contul organizației respective.
        </p>
      </div>
    </div>
  )
}
